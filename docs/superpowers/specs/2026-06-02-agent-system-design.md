# Spec C — Agent System: Project DO Room + Cloudflare Think Agents + Workflows

**Date:** 2026-06-02
**Status:** Architecture approved; building in phases (C1 → C2 → C3)
**Builds on:** Spec A (live: editor SPA + api worker on Cloudflare). Reference: ipio (`real-link-ai`).

## Vision (approved with the user)

Rebuild ipio's editor + agent + project backend, adapted to the geometry node graph. A **project** is represented by a D1 row, lives in a **Durable Object "Editor Room"** (real-time, agent-collaborative), and is backed up to **R2**. A **Cloudflare Think orchestrator agent** (on a DO) drives scene edits through an **operation contract** via a chat dock, and delegates long-running work to **specialist subagents wrapped in Cloudflare Workflows** with progress tracking. LLM = **OpenRouter**.

### Confirmed stack (same as ipio)
- `@cloudflare/think@0.6.1` — chat-agent base class (`Think<Env>`) on a Durable Object (the orchestrator + specialists' brains).
- `agents@0.12.4` — Cloudflare Agents SDK; client hooks `agents/react` (`useAgent`, `useAgentChat`) for the chat dock; also the DO/WS plumbing.
- Cloudflare **Workflows** (`WorkflowEntrypoint`, `step.do`) for durable, retryable, progress-tracked long generations.
- **D1 + Drizzle** (projects, ops/runs), **Durable Objects** (Editor Room + agents), **R2** (snapshot backups), **OpenRouter** via `@ai-sdk/openai-compatible` (or the existing `@openrouter/ai-sdk-provider`), tools via `ai` `tool()` + Zod.

## Target architecture

```
Project  ── D1 row (metadata + version)  ──persist/backup──▶  R2 (snapshot JSON, versioned)
                         │
                 DO "EditorRoom" (one per projectId)
                   • live scene graph snapshot {nodes, edges} in DO storage
                   • WebSocket: clients + agents connect, receive deltas
                   • applies the OPERATION CONTRACT, bumps version, persists D1+R2, broadcasts
        ┌────────────────┼───────────────────────────────────────────┐
   Editor SPA                                   Orchestrator Agent (Think<Env> on DO)
   (React Flow, agents/react chat dock,         • tools = operation contract → mutate the Room
    realtime sync to the Room, project picker)  • streams chat to dock; reads scene context
                                                • delegates long jobs to ▼
                              Specialist subagents (Think or plain), each run via a
                              Cloudflare WORKFLOW (step.do + retries + progress):
                                SceneComposer · NodeAuthor · Modifier/Geometry · Material/Shader
                              progress → D1 `runs` → surfaced in the dock
                         │
                 Operation/Infra API ── the low-level contract the editor + every agent call
```

### Operation contract (the shared "infra API")
A small, versioned set of operations any actor (user or agent) applies to a Room:
`add-node`, `update-node` (data/params/position), `remove-node`, `add-edge`, `remove-edge`,
`register-node-def` (custom JsonNodeDefinition), `replace-graph` (bulk), `set-selection`.
Each op: `{ op, payload, actor: {id, type:'user'|'agent'}, opId, baseVersion }`. The Room applies,
increments `version`, persists, and broadcasts `{ version, op }` deltas. Idempotent by `opId`.

## Phasing

### C1 — Project space foundation (THIS phase; no agent yet)
- **D1 `projects`** (Drizzle): id, workspaceId (Clerk user), name, version, createdAt, updatedAt.
- **DO `EditorRoom`** (one per projectId): holds `{nodes, edges, version}` in DO SQLite storage; WebSocket endpoint; applies the operation contract; persists to DO storage + periodic R2 snapshot backup (`projects/{ws}/{projectId}/snapshots/{version}.json`); broadcasts deltas. Hibernatable WS.
- **api worker** routes: `POST /projects` (create), `GET /projects` (list mine), `GET /projects/:id` (snapshot), `GET /projects/:id/room` (WS upgrade → EditorRoom). All Clerk-auth'd + per-user ownership; the WS uses a short-lived socket token (mint endpoint) like ipio.
- **SPA**: a project picker (list/create/open); the editor connects to the Room over WS, hydrates React Flow from the snapshot, sends ops on local edits (debounced), applies inbound deltas. Replaces localStorage as the source of truth (localStorage kept as offline fallback only).
- **Exit:** a signed-in user creates/opens a project; edits persist server-side (reload restores from the Room); two tabs on the same project sync live; snapshots backed up to R2.

### C2 — Orchestrator chat agent (next)
- `@cloudflare/think` `Orchestrator` agent on a DO; `agents/react` chat dock in the editor; tools = the operation contract (so chat adds/edits/connects nodes live in the Room) + read-scene-context + asset/catalog access; OpenRouter; streaming; optional approval (preview vs apply) like ipio.
- **Exit:** "make a spiral staircase", "connect the cube to the output", "add a wave modifier" — chat edits the live scene in real time.

### C3 — Specialists + Workflows + progress (after C2)
- Specialist subagents: **SceneComposer, NodeAuthor, Modifier/Geometry, Material/Shader**. Long runs wrapped in Cloudflare Workflows (`step.do`, retries); a D1 `runs` table tracks status/progress; orchestrator delegates and reports progress + approvals in the dock.

## Non-goals (whole spec)
- Multi-user permissions/roles beyond per-user ownership (single owner per project for now; the Room is collab-shaped for the agent + the user's own tabs).
- Migrating the asset system (Spec B) or porting PR #14 — parked, resume after.

## Risks
- **DO + Think + Workflows are new surface** — verify `@cloudflare/think@0.6.1` API against ipio's usage + Cloudflare docs before C2; pin the exact versions ipio uses.
- **Realtime graph sync loops** — guard against echo (don't re-send applied deltas); version/opId dedupe.
- **Snapshot size** — large graphs as one JSON; fine initially, consider op-log/deltas later.
- Each phase is independently shippable to limit blast radius.

## Testing (per phase)
- C1: Vitest for the operation-apply reducer (pure: apply(op, snapshot)→snapshot'); Room integration via `wrangler dev` (create→edit→reload→persisted; two WS clients sync); R2 backup written.
- C2/C3: agent tool-dispatch unit tests; live chat-edits-scene smoke; Workflow step/progress tests.

## Spec/plan docs
- This design. C1 plan: `docs/superpowers/plans/2026-06-02-agent-c1-project-space.md`. C2/C3 get their own specs+plans when reached.
