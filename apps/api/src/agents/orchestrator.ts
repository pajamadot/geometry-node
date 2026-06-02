import { Think } from '@cloudflare/think';
import type { TurnContext as ThinkTurnContext, TurnConfig } from '@cloudflare/think';
import type { Connection, ConnectionContext } from 'agents';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { LanguageModel, ModelMessage, ToolSet } from 'ai';
import { drizzle } from 'drizzle-orm/d1';
import { sql } from 'drizzle-orm';
import type { Env } from '../index';
import { verifyRoomToken } from '../lib/room-token';
import { chatSessions as chatSessionsTable } from '../db/schema';
import { createOrchestratorTools, type TurnContext } from './orchestrator-tools';

const SYSTEM_PROMPT = `You are a geometry-node scene assistant for a Three.js node-graph editor.
You edit the user's live scene by calling tools. Your edits are pushed to the editor in real time.

Workflow:
- Call read_scene before editing whenever you need to know what nodes/edges already exist
  (e.g. to update or connect existing nodes, or to avoid duplicates).
- Use add_node / update_node / remove_node to manage nodes, connect_nodes / disconnect for edges,
  and replace_graph for full-scene generation.
- Use ONLY node types from the provided catalog. Never invent a node type. If you need a node
  type that does not exist, author it with register_node_def first, then add it.
- Default edge handles are geometry-out -> geometry-in; use material-out -> material-in for
  materials and time-out -> <param>-in for animation.
- Keep edits minimal and explain briefly what you changed.`;

export class Orchestrator extends Think<Env> {
  maxSteps = 8;

  /**
   * Authorized projectId bound from the validated room token in `onConnect`.
   * Populated once per connection; `undefined` until authentication succeeds.
   *
   * SECURITY: this value comes from the validated JWT, never from client body.
   * Instance name is now `${projectId}:${sessionId}` — the projectId is the
   * portion BEFORE the first colon.
   */
  authorizedProjectId: string | undefined;

  /**
   * Authorized sessionId parsed from the DO instance name (`${projectId}:${sessionId}`).
   * Used as the D1 `chat_sessions` row key. Not security-sensitive — a user can
   * only mint a room token for a project they own, and tools only touch that project.
   */
  authorizedSessionId: string | undefined;

  /**
   * Authorized userId from the validated room token.
   */
  authorizedUserId: string | undefined;

  /**
   * Per-turn context captured from the chat request body in `beforeTurn`.
   * Turns are serialized by Think, so a single in-memory field per turn is safe.
   */
  private turnContext: TurnContext = {};

  /**
   * Called by the agents SDK when a WebSocket client connects.
   *
   * Instance name is now `${projectId}:${sessionId}`. The dock connects with
   * `name: \`${projectId}:${sessionId}\``. We parse the projectId from the name
   * and validate it against the token payload.
   *
   * On failure the connection is closed with code 4001 (mirroring EditorRoom).
   */
  async onConnect(connection: Connection, ctx: ConnectionContext): Promise<void> {
    const url = new URL(ctx.request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      connection.close(4001, 'Missing room token');
      return;
    }

    let payload;
    try {
      payload = await verifyRoomToken(token, this.env.ROOM_TOKEN_SECRET);
    } catch {
      connection.close(4001, 'Invalid or expired room token');
      return;
    }

    // Parse projectId and sessionId from the instance name.
    // Format: "${projectId}:${sessionId}" (sessionId may be absent for legacy
    // bare-projectId names — we still accept those for backward compat).
    const colonIdx = this.name.indexOf(':');
    const projectId = colonIdx >= 0 ? this.name.slice(0, colonIdx) : this.name;
    const sessionId = colonIdx >= 0 ? this.name.slice(colonIdx + 1) : undefined;

    if (payload.projectId !== projectId) {
      connection.close(4001, 'Token project mismatch');
      return;
    }

    // Token is valid — stash the authorized identity. Tools use
    // this.authorizedProjectId (never ctx.body.projectId) to resolve the Room.
    this.authorizedProjectId = projectId;
    this.authorizedSessionId = sessionId;
    this.authorizedUserId = payload.userId;
  }

  getModel(): LanguageModel {
    const provider = createOpenAICompatible({
      name: 'openrouter',
      apiKey: this.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    });
    return provider('anthropic/claude-sonnet-4.6');
  }

  getSystemPrompt(): string {
    return SYSTEM_PROMPT;
  }

  /**
   * Capture the per-turn context before inference runs, and kick off a D1
   * session-index upsert in the background.
   *
   * SECURITY: `projectId` is sourced exclusively from `this.authorizedProjectId`
   * (bound to the validated room token in `onConnect`), NOT from the client body.
   *
   * `ctx.messages` (from ThinkTurnContext, per the @cloudflare/think TurnContext
   * interface) contains the assembled ModelMessage[] including the latest user
   * message — we extract its text for auto-titling.
   */
  beforeTurn(ctx: ThinkTurnContext): TurnConfig | void {
    const body = (ctx.body ?? {}) as Record<string, unknown>;

    // projectId: always from token, never from body.
    const projectId = this.authorizedProjectId;

    const catalog =
      typeof body.catalog === 'string'
        ? body.catalog
        : body.catalog != null
          ? JSON.stringify(body.catalog)
          : undefined;
    this.turnContext = { projectId, catalog };

    // Extract the first user message text for auto-titling.
    // ctx.messages is the assembled ModelMessage[] (from ThinkTurnContext.messages).
    const firstUserText = extractFirstUserText(ctx.messages);

    // Fire-and-forget the D1 upsert — must not block the model response.
    this.ctx.waitUntil(this.touchSession(firstUserText));
  }

  getTools(): ToolSet {
    return createOrchestratorTools({
      env: this.env,
      getContext: () => this.turnContext,
    });
  }

  /**
   * Upsert the D1 `chat_sessions` row for the current session so the session
   * list shows accurate metadata (messageCount, lastMessageAt, title).
   *
   * - If the row exists: increment messageCount, bump updatedAt / lastMessageAt,
   *   and update title only when it is still the default 'New chat'.
   * - If the row does not exist (session created lazily): INSERT with all fields.
   * - Wrapped in try/catch — a D1 hiccup must NOT break the chat turn.
   */
  private async touchSession(firstUserText?: string): Promise<void> {
    if (!this.authorizedSessionId || !this.authorizedProjectId || !this.authorizedUserId) {
      return;
    }

    const sessionId = this.authorizedSessionId;
    const projectId = this.authorizedProjectId;
    const userId = this.authorizedUserId;
    const now = Date.now();
    const derivedTitle = firstUserText
      ? firstUserText.slice(0, 60).trim()
      : 'New chat';

    try {
      const db = drizzle(this.env.DB);

      await db
        .insert(chatSessionsTable)
        .values({
          id: sessionId,
          projectId,
          workspaceId: userId,
          title: derivedTitle !== 'New chat' ? derivedTitle : 'New chat',
          messageCount: 1,
          createdAt: now,
          updatedAt: now,
          lastMessageAt: now,
        })
        .onConflictDoUpdate({
          target: chatSessionsTable.id,
          set: {
            messageCount: sql`${chatSessionsTable.messageCount} + 1`,
            updatedAt: now,
            lastMessageAt: now,
            // Only overwrite the title when it is still the default placeholder.
            title: sql`CASE WHEN ${chatSessionsTable.title} = 'New chat' AND ${derivedTitle !== 'New chat' ? 1 : 0} THEN ${derivedTitle} ELSE ${chatSessionsTable.title} END`,
          },
        });
    } catch (err) {
      console.error('[orchestrator] touchSession D1 upsert failed', {
        sessionId,
        error: String(err),
      });
    }
  }
}

/**
 * Extract the text of the last user message from the assembled ModelMessage[].
 * Returns undefined when no user text is present.
 *
 * ModelMessage is the AI SDK's internal format: role + content.
 * content may be a string or an array of parts with type 'text' | 'image' | etc.
 */
function extractFirstUserText(messages: ModelMessage[]): string | undefined {
  // Walk from the end to find the most-recent user message.
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role !== 'user') continue;
    if (typeof msg.content === 'string') return msg.content || undefined;
    if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (
          part != null &&
          typeof part === 'object' &&
          'type' in part &&
          (part as { type: string }).type === 'text' &&
          'text' in part &&
          typeof (part as { text: string }).text === 'string'
        ) {
          const text = (part as { text: string }).text;
          if (text) return text;
        }
      }
    }
  }
  return undefined;
}
