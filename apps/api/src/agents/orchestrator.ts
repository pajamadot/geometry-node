import { Think } from '@cloudflare/think';
import type { TurnContext as ThinkTurnContext } from '@cloudflare/think';
import type { Connection, ConnectionContext } from 'agents';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { LanguageModel, ToolSet } from 'ai';
import type { Env } from '../index';
import { verifyRoomToken } from '../lib/room-token';
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
   * Because turns are serialized by Think and each Durable Object instance
   * handles one project (instance name = projectId), a single in-memory field
   * is safe for the lifetime of the DO instance.
   */
  authorizedProjectId: string | undefined;

  /**
   * Authorized userId from the validated room token. Stored alongside
   * authorizedProjectId for future per-user auditing / rate-limiting.
   */
  authorizedUserId: string | undefined;

  /**
   * Per-turn context captured from the chat request body in `beforeTurn`.
   * The chat client (Task 3) sends `{ projectId, catalog }`; Think surfaces
   * it as `TurnContext.body`. Tools read this lazily via `getContext`.
   *
   * Turns are serialized by Think, so a single in-memory field per turn is safe.
   */
  private turnContext: TurnContext = {};

  /**
   * Called by the agents SDK when a WebSocket client connects.
   * Mirrors EditorRoom.onConnect: validates the room token from ?token=...
   * in the WS upgrade URL before allowing the connection.
   *
   * Token payload must satisfy:
   *   - valid HMAC-SHA256 signature (verifyRoomToken throws otherwise)
   *   - not expired (verifyRoomToken throws otherwise)
   *   - payload.projectId === this.name (the DO instance name = projectId,
   *     set by the router in Task 3 via `name: projectId`)
   *
   * On failure the connection is closed with code 4001 (mirroring EditorRoom).
   * On success the authorized identity is stashed in instance fields so that
   * `beforeTurn` / `resolveRoom` can use it instead of the client-supplied body.
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

    if (payload.projectId !== this.name) {
      connection.close(4001, 'Token project mismatch');
      return;
    }

    // Token is valid — stash the authorized identity. Tools use
    // this.authorizedProjectId (never ctx.body.projectId) to resolve the Room.
    this.authorizedProjectId = payload.projectId;
    this.authorizedUserId = payload.userId;
  }

  getModel(): LanguageModel {
    const provider = createOpenAICompatible({
      name: 'openrouter',
      apiKey: this.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    });
    return provider('anthropic/claude-3.5-sonnet');
  }

  getSystemPrompt(): string {
    return SYSTEM_PROMPT;
  }

  /**
   * Capture the per-turn context before inference runs.
   *
   * SECURITY: `projectId` is sourced exclusively from `this.authorizedProjectId`
   * (bound to the validated room token in `onConnect`), NOT from the client-
   * supplied request body. If the body sends a different projectId, it is silently
   * ignored — the token is the authoritative source.
   *
   * `catalog` is NOT security-sensitive (it's a UI hint about node types), so it
   * is still accepted from `ctx.body` as before.
   *
   * `ctx.body` carries the custom fields the chat client put in the request body
   * (see @cloudflare/think TurnContext: "Custom body fields from the client
   * request").
   */
  beforeTurn(ctx: ThinkTurnContext): void {
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
  }

  getTools(): ToolSet {
    return createOrchestratorTools({
      env: this.env,
      getContext: () => this.turnContext,
    });
  }
}
