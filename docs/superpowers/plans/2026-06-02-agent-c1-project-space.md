# Agent System C1 — Project Space Foundation (Implementation Plan)

> **For agentic workers:** Use superpowers:subagent-driven-development. Steps use `- [ ]`.
> **Cloudflare APIs change — RETRIEVE before coding.** For every Agents-SDK / DO / Workflows / D1 / R2 detail, fetch the official docs (links in each task) rather than relying on memory. Verify `agents` package API with `npm ls agents` and the docs at https://developers.cloudflare.com/agents/.

**Goal:** A project is a D1 row + a Durable-Object **Editor Room** (`Agent` from the `agents` SDK) holding the live `{nodes, edges, version}` snapshot, synced in real time to the editor and backed up to R2. No AI yet — this is the substrate the orchestrator (C2) and specialists (C3) operate on.

**Builds on:** Spec A (live `apps/api` Hono worker + `apps/editor-web` Vite SPA). Branch `feat/agent-system`. Shared D1 `geometry-db` (id `91d8a591-8d0d-49d6-9ded-3d1624b704e9`), R2 `geometry-assets`. Cloudflare creds in gitignored `.cloudflare.env`.

**Stack:** `agents@^0.12.4` (Cloudflare Agents SDK; `Agent`, `routeAgentRequest`, `@callable`, `setState`; client `agents/react` `useAgent`), Drizzle + D1, R2, Clerk auth. Reference ipio (`real-link-ai` editor-web room client + studio-agent) for patterns.

**Key design (from the Agents SDK skill):**
- Editor Room = `class EditorRoom extends Agent<Env, EditorState>` with `initialState = { nodes:[], edges:[], version:0 }`. Routed at `/agents/editor-room/{projectId}`.
- Operations applied via a `@callable() applyOps(ops)` method that runs a **pure reducer** and `setState(next)` → auto-broadcasts to all clients (their `useAgent onStateUpdate` fires). Idempotent via `opId`; rejects ops whose `baseVersion` is stale (client re-syncs).
- Snapshot persists automatically (SDK state is SQLite-backed). R2 backup written on a debounced schedule (`scheduleEvery`) and/or every N ops.
- Clerk auth + per-user ownership enforced before the WS connects (token → projects table ownership check).

**tsconfig gotcha:** do NOT enable `experimentalDecorators` (breaks `@callable`). The api worker tsconfig currently has no decorators flag — keep it that way.

---

## Task 1: Editor Room agent skeleton + routing + wrangler

**Files:** `apps/api/package.json` (+`agents`), `apps/api/src/rooms/editor-room.ts`, `apps/api/src/index.ts` (route), `apps/api/wrangler.toml` (DO binding + migration), export the DO class from the worker entry.

- [ ] **Step 1:** `npm i -w @geometry-script/api agents`. Confirm `npm ls agents` shows it.
- [ ] **Step 2:** RETRIEVE https://developers.cloudflare.com/agents/api-reference/agents-api/ and https://developers.cloudflare.com/agents/api-reference/store-and-sync-state/ and https://developers.cloudflare.com/agents/api-reference/routing/ . Then create `apps/api/src/rooms/editor-room.ts`:
```ts
import { Agent } from 'agents';
import type { Env } from '../index';

export interface RoomNode { id: string; type: string; position: { x: number; y: number }; data: Record<string, unknown>; }
export interface RoomEdge { id: string; source: string; target: string; sourceHandle?: string; targetHandle?: string; }
export interface EditorState { nodes: RoomNode[]; edges: RoomEdge[]; version: number; }

export class EditorRoom extends Agent<Env, EditorState> {
  initialState: EditorState = { nodes: [], edges: [], version: 0 };
  // applyOps added in Task 2; auth in Task 5; R2 backup in Task 4.
}
```
- [ ] **Step 3:** Export `EditorRoom` from the worker entry and integrate routing. In `apps/api/src/index.ts`: `import { routeAgentRequest } from 'agents'; import { EditorRoom } from './rooms/editor-room';` then `export { EditorRoom };` and in the default export's `fetch`, before the Hono app handles it, try the agent router: wrap so `const agentResp = await routeAgentRequest(req, env); if (agentResp) return agentResp;` else `return app.fetch(...)`. (Hono `app` is the default export today — change the default export to an object `{ async fetch(req,env,ctx){ return (await routeAgentRequest(req,env)) ?? app.fetch(req,env,ctx); } }`. Keep CORS working for `/agents/*` — routeAgentRequest handles WS; for the SPA origin, configure CORS via the SDK options if needed; RETRIEVE the cross-domain-auth doc.)
- [ ] **Step 4:** `apps/api/wrangler.toml` — add the DO binding + migration at top level AND `[env.dev]` AND `[env.production]`:
```toml
[[durable_objects.bindings]]
name = "EditorRoom"
class_name = "EditorRoom"

[[migrations]]
tag = "v2-editorroom"
new_sqlite_classes = ["EditorRoom"]
```
(Add the same `[[durable_objects.bindings]]` under `[env.production]` / `[env.dev]`; migrations are top-level only. If a `[[migrations]]` already exists, ADD a new tag, never edit the old one.) Add `EditorRoom: DurableObjectNamespace` to `Env` in `index.ts`.
- [ ] **Step 5:** Typecheck (`npm run check-types -w @geometry-script/api`). Smoke: `wrangler dev`, then a tiny WS/HTTP probe to `/agents/editor-room/test` returns the agent (not 404). RETRIEVE the routing doc for the exact probe. Commit `feat(api): EditorRoom agent skeleton + routing + DO binding`.

## Task 2: Operation contract + pure reducer + applyOps (TDD)

**Files:** `packages/agent-core/src/operations.ts` (shared reducer + op types — so SPA + worker agree), `packages/agent-core/test/operations.test.ts`, `apps/api/src/rooms/editor-room.ts` (applyOps).

- [ ] **Step 1 (test first):** Create `packages/agent-core/test/operations.test.ts` asserting `applyOp`:
```ts
import { describe, it, expect } from 'vitest';
import { applyOp, type EditorSnapshot } from '../src/operations';
const base: EditorSnapshot = { nodes: [], edges: [], version: 0 };
describe('applyOp', () => {
  it('adds a node and bumps version', () => {
    const s = applyOp(base, { op: 'add-node', opId: 'o1', payload: { node: { id: 'n1', type: 'cube', position: {x:0,y:0}, data: {} } } });
    expect(s.nodes).toHaveLength(1); expect(s.version).toBe(1);
  });
  it('removes a node and its edges', () => {
    let s = applyOp(base, { op: 'add-node', opId: 'a', payload: { node: { id: 'n1', type:'cube', position:{x:0,y:0}, data:{} } } });
    s = applyOp(s, { op: 'add-edge', opId: 'b', payload: { edge: { id:'e1', source:'n1', target:'n2' } } });
    s = applyOp(s, { op: 'remove-node', opId: 'c', payload: { id: 'n1' } });
    expect(s.nodes).toHaveLength(0); expect(s.edges).toHaveLength(0);
  });
  it('replace-graph sets nodes/edges', () => {
    const s = applyOp(base, { op: 'replace-graph', opId: 'r', payload: { nodes: [{id:'x',type:'cube',position:{x:0,y:0},data:{}}], edges: [] } });
    expect(s.nodes).toHaveLength(1);
  });
});
```
- [ ] **Step 2:** Implement `packages/agent-core/src/operations.ts`: export `EditorSnapshot` type and `EditorOp` discriminated union (`add-node` | `update-node` | `remove-node` | `add-edge` | `remove-edge` | `register-node-def` | `replace-graph`), and a pure `applyOp(snapshot, op): EditorSnapshot` that returns a NEW snapshot with `version+1`. `update-node` merges `payload.data`/`payload.position` into the matching node; `remove-node` also drops incident edges; `register-node-def` is a no-op on the graph (handled client-side) but still version-bumps + is recorded. Add `applyOps(snapshot, ops[])` folding `applyOp`. Export from `packages/agent-core/src/index.ts`.
- [ ] **Step 3:** Run `npm test -w @geometry-script/agent-core` → pass.
- [ ] **Step 4:** In `EditorRoom`, add:
```ts
import { callable } from 'agents';
import { applyOps, type EditorOp } from '@geometry-script/agent-core';
// inside class:
@callable()
applyOps(ops: EditorOp[]) {
  const next = applyOps(this.state, ops as any);
  this.setState(next);
  return { version: next.version };
}
@callable()
getSnapshot() { return this.state; }
```
(RETRIEVE callable-methods doc for exact decorator import/signature.) Add `agents` + `@geometry-script/agent-core` already deps. Typecheck. Commit.

## Task 3: D1 `projects` table + project routes

**Files:** `apps/api/src/db/schema.ts` (add `projects`), new migration, `apps/api/src/routes/projects.ts`, mount in `index.ts`.

- [ ] **Step 1:** Add to `apps/api/src/db/schema.ts` a `projects` table: `id` (text pk), `workspaceId` (text), `name` (text), `version` (integer default 0), `createdAt`/`updatedAt` (integer). Index on `workspaceId`. (Drizzle + drizzle-kit already set up in repo from Spec B? NO — Spec B is a separate branch. This branch was cut from main, which does NOT have Drizzle. So ADD drizzle-orm dep + drizzle.config.ts + schema.ts here, mirroring the Spec B plan Task 1 setup. If `apps/api/src/db/schema.ts` doesn't exist, create it with the projects table.)
- [ ] **Step 2:** `npx drizzle-kit generate`; apply local + remote: `wrangler d1 migrations apply geometry-db --local` and `--remote` (source `.cloudflare.env`). Confirm `projects` table exists remotely. Add D1 binding `DB` to wrangler.toml (top-level + dev + production) if not already present from Task 1.
- [ ] **Step 3:** `apps/api/src/routes/projects.ts` (Hono, `requireAuth`, `workspaceId = userId`): `POST /projects` (create row, return it; the Room is created lazily on first connect), `GET /projects` (list mine, newest first), `GET /projects/:id` (row if owned, else 404). Mount under `app.use('/projects/*', requireAuth); app.route('/projects', projects)`.
- [ ] **Step 4:** Typecheck + wrangler-dev smoke (create→list→get). Commit.

## Task 4: R2 snapshot backup from the Room

**Files:** `apps/api/src/rooms/editor-room.ts`.

- [ ] **Step 1:** RETRIEVE the scheduling doc (https://developers.cloudflare.com/agents/api-reference/schedule-tasks/) and R2 usage from a DO. Add an `ASSETS`/dedicated R2 binding (reuse `geometry-assets` bucket, key prefix `projects/`). In `EditorRoom`, after `setState` in `applyOps`, schedule a debounced backup (e.g., `this.schedule(5, 'backupSnapshot')` if not already pending) that writes `projects/{workspaceId}/{projectId}/snapshots/{version}.json` to R2 with the current state. Store `workspaceId`/`projectId` in the Room (passed on connect / first op). Add the R2 binding to wrangler.toml (all envs) as `ASSETS` (bucket `geometry-assets`).
- [ ] **Step 2:** Typecheck; wrangler-dev smoke: apply an op, confirm (after the delay) an object exists at the expected R2 key (`wrangler r2 object get` or list). Commit.

## Task 5: WebSocket auth + project ownership on the Room

**Files:** `apps/api/src/rooms/editor-room.ts`, possibly a socket-token mint route.

- [ ] **Step 1:** RETRIEVE https://developers.cloudflare.com/agents/api-reference/cross-domain-authentication/ . Implement auth so only the owning Clerk user can connect to a project's Room. Approach (mirror ipio): a `POST /projects/:id/room-token` route (Clerk-auth'd, ownership-checked) mints a short-lived signed token; the client passes it to `useAgent` (query); the Room validates it in `onConnect`/`onBeforeConnect` (RETRIEVE the websockets doc for the exact hook) and rejects otherwise. Bind the Room instance name to `projectId` and stash `workspaceId` from the validated token.
- [ ] **Step 2:** wrangler-dev: a connection without a valid token is rejected; with a valid token for an owned project, it connects and receives state. Commit.

## Task 6: SPA — connect editor to the Room (realtime sync)

**Files:** `apps/editor-web/app/lib/roomClient.ts` (or hook), wire into `GeometryNodeEditor`/`GeometryContext`.

- [ ] **Step 1:** `npm i -w @geometry-script/editor-web agents` (for `agents/react`). RETRIEVE https://developers.cloudflare.com/agents/api-reference/client-sdk/ .
- [ ] **Step 2:** Create a `useEditorRoom(projectId)` hook: mint a room token (`POST ${apiBase}/projects/:id/room-token` with Clerk token), then `useAgent({ agent: 'editor-room', name: projectId, host: <api host>, query: { token }, onStateUpdate })`. On `onStateUpdate`, hydrate React Flow `nodes`/`edges` (guard against echoing back ops just applied locally — track last applied version/opIds). Provide `applyOps(ops)` that calls the agent's `@callable applyOps` and optimistically updates local state.
- [ ] **Step 3:** Wire into the editor: when a project is open, the React Flow graph is driven by the Room — local node/edge changes (add/move/connect/param-edit) emit ops (debounced for position/param drags) via `applyOps`; inbound state updates reconcile. Keep localStorage as an offline fallback only (not the source of truth when a project is open). Read `GeometryContext`/`GeometryNodeEditor` to integrate without breaking the compile pipeline.
- [ ] **Step 4:** Typecheck. Commit. (Full live sync verified in Task 8.)

## Task 7: SPA — project picker (list/create/open)

**Files:** `apps/editor-web/app/components/ProjectPicker.tsx` (or a route), routing.

- [ ] **Step 1:** A simple projects screen: list the user's projects (`GET /projects`), "New project" (`POST /projects` → open it), and open → navigate to the editor bound to that `projectId` (e.g. route `/editor/:projectId` or `?project=`). Add the route to `src/router.tsx`. The existing `/editor` (no project) can either auto-create/open a default project or prompt to pick.
- [ ] **Step 2:** Typecheck. Commit.

## Task 8: Deploy + online verification

- [ ] **Step 1:** Ensure DO binding + migration + D1 + R2 bindings are in `[env.production]`. Deploy api: `wrangler deploy --env production` (source creds). Apply D1 migration `--remote` if not already. Build + deploy editor-web (`VITE_API_BASE_URL` already set to api.geometry.pajamadot.com).
- [ ] **Step 2:** Full `npm run check-types`, `npm run test`, `npm run build` green.
- [ ] **Step 3:** Online: on geometry.pajamadot.com (signed in) create a project, add/move/connect nodes, **reload → state restored from the Room**; open the same project in a second tab → edits sync live; confirm an R2 snapshot object exists. Report results.

---

## Self-review checklist
- Reducer is pure + shared (one source of truth for SPA + Room). ✔ Task 2.
- WS auth: only the owning user connects to a project Room. ✔ Task 5.
- No echo loops in sync (version/opId dedupe). ✔ Task 6.
- DO migration uses a NEW tag; bindings in all envs. ✔ Task 1.
- localStorage demoted to fallback when a project is open. ✔ Task 6.
- Cloudflare APIs retrieved from docs, not memory. ✔ each task.
