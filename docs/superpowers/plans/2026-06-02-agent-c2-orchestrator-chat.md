# Agent System C2 — Orchestrator Chat Agent (Implementation Plan)

> Use superpowers:subagent-driven-development. Steps `- [ ]`.
> **RETRIEVE Cloudflare/Think APIs before coding** — `@cloudflare/think` is experimental and changes. Docs: https://developers.cloudflare.com/agents/api-reference/think/ , https://developers.cloudflare.com/agents/api-reference/chat-agents/ , https://developers.cloudflare.com/agents/api-reference/client-sdk/ . Inspect `apps/api/node_modules/@cloudflare/think` types when ambiguous. Reference ipio `apps/studio-agent/src/runtime/studio-agent.ts` + `studio-agent-tools.ts` and `apps/editor-web/.../studio-agent` dock for proven patterns.

**Goal:** A chat dock in the editor where the user types ("add a red cube and connect it to the output", "make a spiral staircase", "give it a wave modifier") and a `@cloudflare/think` **orchestrator agent** edits the **live project Room** via the C1 operation contract — so nodes appear/connect/update in real time. LLM = OpenRouter.

**Builds on (C1, live on main):** `EditorRoom` Agents-SDK DO (state `{nodes,edges,version}`, `@callable applyOps(ops: EditorOp[])`, `getSnapshot()`), operation reducer + `EditorOp` types in `@geometry-script/agent-core`, D1 `projects`, room-token auth, SPA realtime sync (`useEditorRoom`) so **anything that mutates the Room is reflected in the editor automatically**. api worker forwards `/agents/*` via `routeAgentRequest`.

**Key architecture:** the Orchestrator agent does NOT talk to the editor directly. Its tools mutate the **EditorRoom** (DO→DO RPC: `env.EditorRoom.idFromName(projectId).get(...).applyOps(...)`). The editor, already subscribed to that Room (C1), updates live. The chat dock only carries the conversation.

**Stack:** `@cloudflare/think` (orchestrator brain on a DO), `agents`/`agents/react` (`useAgentChat`), `ai` (`tool()`, `streamText`-equiv handled by Think) + `zod`, OpenRouter via `@ai-sdk/openai-compatible` (baseURL `https://openrouter.ai/api/v1`, `env.OPENROUTER_API_KEY`) OR the existing `@openrouter/ai-sdk-provider` — pick whichever Think's `getModel()` expects (a `LanguageModel`). Branch `feat/agent-c2`.

---

## Task 1: Orchestrator agent skeleton (Think) + model + binding

**Files:** `apps/api/package.json` (+`@cloudflare/think`, `@ai-sdk/openai-compatible`), `apps/api/src/agents/orchestrator.ts`, `apps/api/src/index.ts` (export + Env), `apps/api/wrangler.toml` (DO binding + migration).

- [ ] **Step 1:** `npm i -w @geometry-script/api @cloudflare/think @ai-sdk/openai-compatible`. Note versions. RETRIEVE the Think doc + read `node_modules/@cloudflare/think` exported types (the `Think` class, required overrides like `getModel()`/`getTools()`, lifecycle hooks, and how chat messages arrive).
- [ ] **Step 2:** Create `apps/api/src/agents/orchestrator.ts`:
```ts
import { Think } from '@cloudflare/think';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { LanguageModel, ToolSet } from 'ai';
import type { Env } from '../index';

export class Orchestrator extends Think<Env> {
  maxSteps = 8;
  getModel(): LanguageModel {
    const provider = createOpenAICompatible({
      name: 'openrouter',
      apiKey: this.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    });
    return provider('anthropic/claude-3.5-sonnet'); // keep existing model slug
  }
  getTools(): ToolSet { return {}; } // tools added in Task 2
}
```
Adjust class/override signatures to the ACTUAL Think API from the docs/types (e.g. system prompt hook, `beforeTurn`). Add a system prompt describing the geometry-node domain + that it edits the scene via tools (retrieve where Think wants the system prompt — a `getSystemPrompt()`/`instructions` override or similar).
- [ ] **Step 3:** Export `Orchestrator` from `apps/api/src/index.ts`; add `Orchestrator: DurableObjectNamespace` to `Env`. (`routeAgentRequest` already routes `/agents/*`; the orchestrator will be at `/agents/orchestrator/{instance}` — confirm naming via routing doc.)
- [ ] **Step 4:** `apps/api/wrangler.toml` — add DO binding (top-level + dev + production) + a NEW migration tag:
```toml
[[durable_objects.bindings]]
name = "Orchestrator"
class_name = "Orchestrator"

[[migrations]]
tag = "v3-orchestrator"
new_sqlite_classes = ["Orchestrator"]
```
(Do not edit existing migration tags; add the binding under each env. Keep EditorRoom/D1/R2 intact.)
- [ ] **Step 5:** `npm run check-types -w @geometry-script/api` PASS; `wrangler dev` boots (creds sourced); `/agents/orchestrator/test` reachable (not Hono 404). Commit `feat(api): Think orchestrator agent skeleton + OpenRouter model + DO binding`.

## Task 2: Room-operation tools (agent edits the live Room)

**Files:** `apps/api/src/agents/orchestrator-tools.ts`, `orchestrator.ts` (wire getTools), maybe a small `apps/api/src/lib/room-rpc.ts`.

- [ ] **Step 1:** RETRIEVE how Think passes per-request context to tools (ipio sends an `editor` context in the chat `body`; the agent reads it). The chat client (Task 3) will send `{ projectId, catalog }` in the message body/context. The agent must resolve the **target EditorRoom** for `projectId` and call its `@callable` methods via DO RPC: `const stub = this.env.EditorRoom.get(this.env.EditorRoom.idFromName(projectId)); await stub.applyOps(ops);` and `await stub.getSnapshot()`. Confirm calling a `@callable`/RPC method on a DO stub from another Worker/DO (agents SDK exposes callables as stub methods, or use `stub.fetch`/named RPC — RETRIEVE callable-methods doc for cross-DO invocation; fallback: the EditorRoom can expose a plain `fetch` route that applies ops).
- [ ] **Step 2:** Implement tools in `orchestrator-tools.ts` with `ai` `tool()` + `zod`, each taking the resolved `projectId` from context and applying ops via the Room stub. Tools (each builds `EditorOp[]` from `@geometry-script/agent-core` and calls `applyOps`):
  - `read_scene` → `getSnapshot()` (so the model can see current nodes/edges before editing).
  - `add_node` ({ type, position?, params? }) → `add-node` op (generate id).
  - `update_node` ({ id, params?, position? }) → `update-node`.
  - `remove_node` ({ id }) → `remove-node`.
  - `connect_nodes` ({ source, sourceHandle, target, targetHandle }) → `add-edge`.
  - `disconnect` ({ edgeId }) → `remove-edge`.
  - `register_node_def` ({ def }) → `register-node-def` (custom JsonNodeDefinition; client registers on receipt).
  - `replace_graph` ({ nodes, edges }) → `replace-graph` (for full scene generation).
  Each returns a concise result (e.g. `{ ok, version, addedId }`) so the model can chain steps. Validate node `type` against the provided `catalog` where possible; return a helpful error if unknown (the model self-corrects).
- [ ] **Step 3:** Wire `getTools()` in `orchestrator.ts` to build this toolset (passing env + a way to read the current request's `projectId`/`catalog` context — per the Think context mechanism). Typecheck. `wrangler dev` smoke if feasible (a tool call requires the model + a Room; defer full exercise to Task 5). Commit.

## Task 3: Chat dock UI (agents/react) wired to the editor

**Files:** `apps/editor-web/app/components/AgentChatDock.tsx`, `apps/editor-web/app/lib/buildCatalog.ts` (reuse), integrate a toggle into the editor.

- [ ] **Step 1:** RETRIEVE https://developers.cloudflare.com/agents/api-reference/client-sdk/ (`useAgentChat`) + ipio's `use-editor-studio-agent-chat.ts` for the body-context pattern. `npm ls agents` (already installed in editor-web from C1).
- [ ] **Step 2:** `AgentChatDock.tsx`: a chat panel (match dark Tailwind aesthetic). Uses `useAgentChat` (or `useAgent`+chat) connected to `agent: 'orchestrator'`, `name: <projectId or session>`, host derived like `roomClient.ts` (api host, wss/ws), auth via a token (reuse the room-token mint or a dedicated agent socket-token — simplest: mint via an authed route and pass as query, mirroring C1). In the chat `body`/context, send `{ projectId, catalog: buildCatalog() , selection? }` so the agent's tools operate the right Room with catalog awareness. Render the message stream: user/assistant text + tool-call activity chips ("add_node cube…"). Input box + send.
- [ ] **Step 3:** Integrate: a "✨ Agent" toggle button in the editor opens the dock (reuse the existing panel/AIPanel pattern; this can live alongside or replace the old AIPanel). The dock needs the active `projectId` (from `useActiveProject`). **No manual graph application needed** — the agent mutates the Room, and the existing `useEditorRoom` sync updates the React Flow graph live. For `register-node-def` ops, ensure the client registers the def into `nodeRegistry` when it arrives in Room state (the reducer carries it in state.metadata or a side channel — confirm how register-node-def surfaces; if it's not in the graph, handle it via a tool-result message the dock processes).
- [ ] **Step 4:** Typecheck + build editor-web. Commit.

## Task 4: Auth + project binding for the chat agent

**Files:** orchestrator (connection auth), a token-mint route (reuse `room-token` or add `agent-token`).

- [ ] **Step 1:** Ensure only the owning Clerk user can drive the orchestrator for a given project. Reuse the C1 room-token approach: the dock mints a token (authed route, ownership-checked) bound to `{ projectId, userId }`; the Orchestrator validates it on connect (onConnect, like EditorRoom) and stamps the actor. Tools must only operate the `projectId` the token authorizes (don't trust a client-supplied projectId beyond the token). RETRIEVE the cross-domain-auth doc.
- [ ] **Step 2:** Typecheck; reject unauth connections. Commit.

## Task 5: Deploy + online verification

- [ ] **Step 1:** Prod bindings: Orchestrator DO + migration in `[env.production]`. Deploy api (`wrangler deploy --env production`) — applies the new DO migration. Build + deploy editor-web.
- [ ] **Step 2:** Full `npm run check-types`, `npm run test`, `npm run build` green.
- [ ] **Step 3:** Online (signed in, geometry.pajamadot.com): open the Agent dock in a project, send "add a cube and connect it to the output". Confirm the nodes appear in the editor live (via Room sync), persist on reload, and the chat shows the tool activity. Try a multi-step ("make a spiral staircase") and a `register_node_def` ("create a node that scales geometry by a noise field"). Report results + any model/tool-contract issues. (Browser-driven authed verification may need the owner; report what was verified vs deferred.)

---

## Self-review checklist
- Agent edits the **Room** (DO RPC), not the editor directly; editor updates via C1 sync. ✔
- Tools validated against the catalog; helpful errors so the model self-corrects. ✔
- Auth: token-bound projectId; agent only mutates the authorized project. ✔
- New DO migration tag; bindings per env; existing C1 bindings untouched. ✔
- OpenRouter model slug preserved; key from env (no module-scope read). ✔
- Cloudflare/Think APIs retrieved from docs, not memory. ✔
