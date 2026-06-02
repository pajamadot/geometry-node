import { Think } from '@cloudflare/think';
import type { TurnContext as ThinkTurnContext } from '@cloudflare/think';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { LanguageModel, ToolSet } from 'ai';
import type { Env } from '../index';
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
   * Per-turn context captured from the chat request body in `beforeTurn`.
   * The chat client (Task 3) sends `{ projectId, catalog }`; Think surfaces
   * it as `TurnContext.body`. Tools read this lazily via `getContext`.
   *
   * Turns are serialized by Think, so a single in-memory field per turn is safe.
   */
  private turnContext: TurnContext = {};

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
   * Capture the client-provided per-turn context before inference runs.
   * `ctx.body` carries the custom fields the chat client put in the request
   * body (see @cloudflare/think TurnContext: "Custom body fields from the
   * client request"). We stash projectId + catalog for the tools.
   */
  beforeTurn(ctx: ThinkTurnContext): void {
    const body = (ctx.body ?? {}) as Record<string, unknown>;
    const projectId = typeof body.projectId === 'string' ? body.projectId : undefined;
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
