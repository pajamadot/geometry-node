# Spec A — Editor Migration to All-Cloudflare

**Date:** 2026-06-02
**Status:** Approved (design)
**Phase:** 1 of N (foundation for the asset system, agent, and project space)

## Context

`geometry-node` is a web-based procedural geometry node editor:
Next.js 15 (App Router) + React 19 + React Flow 11 + Three.js 0.178 +
`@react-three/fiber`, with an existing OpenRouter-backed AI agent (Vercel AI
SDK v4) that generates and modifies geometry nodes and scenes. Persistence today
is **localStorage only** — there is no backend, database, or asset store.

The broader goal (across multiple phases) is to graft ipio's
(`/Users/clay/Documents/real-link-tech/real-link-ai`) Cloudflare architecture
onto this editor:

- An **asset system** (R2 binaries + D1 metadata + signed URLs, per-user
  workspace scoping) storing node-definitions/presets, scenes/graphs, 3D models,
  and images/textures/HDRIs.
- A **Cloudflare agent** (Worker + Durable Object) that operates a persisted
  project space via approval-gated, idempotent operations, using OpenRouter,
  specialized for generating geometry node graphs.
- A **Three.js-based editor** (the existing one, enhanced).

### Decisions locked during brainstorming

| Decision | Choice |
| --- | --- |
| MVP feature priority | **Asset system first** |
| Deployment target | **All-Cloudflare** |
| Database | **Cloudflare D1 (SQLite) + Drizzle** |
| Realtime collaboration | **Single-user now, design for later** |
| Phase-1 host | **Migrate frontend to Cloudflare in phase 1** |
| Asset types | node-definitions/presets, scenes/graphs, 3D models (GLTF/GLB/OBJ/STL), images/textures/HDRIs |
| Tenancy | **Per-user (Clerk) workspaces** |
| Frontend migration approach | **Convert editor to Vite SPA + Hono Worker (exact ipio editor-web pattern)** |

### Phase-1 decomposition

Phase 1 contains both a platform migration and the asset feature. These are split
into two sequential, independently reviewable specs:

- **Spec A (this document)** — migrate the editor to all-Cloudflare. The
  foundation. No new product features.
- **Spec B (next)** — the asset system, built on the seam Spec A creates.

The future agent + Durable Object project space (a later phase) also lands on the
`api` worker created here.

## Goals

- The **exact same editor that exists today**, running entirely on Cloudflare.
- A clean backend seam (`api` Hono Worker) that the asset system, then the agent,
  build on.
- AI generation/modification working through the `api` worker, preserving
  streaming.
- **No new product features** in this spec — behavior parity is the bar.

## Non-Goals

- Asset system (Spec B).
- Agent / Durable Object project space (later phase).
- Realtime multi-user collaboration.
- Replacing localStorage scene persistence (stays as-is until the project space
  phase).

## Target Architecture

```
apps/
├─ editor-web/   Vite SPA (React 19 + React Flow + Three.js + Clerk React)
│                served via Cloudflare Workers Static Assets (SPA fallback)
└─ api/          Hono Worker — OpenRouter AI endpoints (ported) + Clerk auth
                 (R2 + D1 bindings added in Spec B)

packages/
└─ agent-core/   Shared: GeometryAIAgent, aiClient, contextBuilders,
                 validators, agent types (used by api worker + SPA client)
```

- `apps/web` is **renamed** to `apps/editor-web`.
- The existing placeholder `apps/api` (README only) is filled in.
- The SPA calls the `api` worker at `VITE_API_BASE_URL` (e.g.
  `https://api-dev.<domain>`), with CORS + Clerk Bearer auth on the API.
- npm workspaces + Turbo are already configured.

## Component Design

### 1. `apps/editor-web` — Vite SPA (Next.js → Vite, behavior-preserving)

- **Routing:** `react-router-dom` with routes `/` (landing), `/editor`,
  `/investors`, `/whitepaper`. `next/link` → router `Link`. A root layout route
  renders the existing `Header` + global providers.
- **Entry:** `index.html` + `src/main.tsx` mounting `<ClerkProvider>`
  (publishableKey from `import.meta.env.VITE_CLERK_PUBLISHABLE_KEY`) →
  `<RouterProvider>`.
- **Clerk:** swap `@clerk/nextjs` → `@clerk/clerk-react`. All used components map
  1:1: `SignedIn`, `SignedOut`, `UserButton`, `SignInButton`, `SignUpButton`,
  `RedirectToSignIn`, `SignOutButton`. The `clerkMiddleware` (`middleware.ts`) is
  dropped — route protection is already client-side (`/editor` uses
  `<SignedOut><RedirectToSignIn/></SignedOut>`).
- **Fonts:** `next/font/google` (Geist, Geist Mono) → `@fontsource-variable/geist`
  + `@fontsource/geist-mono`, imported in `main.tsx`, exposing the same
  `--font-geist-sans` / `--font-geist-mono` CSS variables used by `globals.css`.
- **Tailwind v4:** keep `globals.css`; replace the PostCSS pipeline with the
  `@tailwindcss/vite` plugin.
- **Path alias `@/*`:** configured in Vite `resolve.alias` + `tsconfig`.
- **Ported untouched** (already framework-agnostic React/TS): the entire
  `registry/`, `utils/` (graphCompiler, nodeCompiler, geometryOperations,
  storage), `types/`, the `components/` editor tree, `data/`, the Three.js
  viewport. The only change to these is the base URL used for AI fetches.
- **Static assets:** `public/` → Vite `public/` dir; `assets/` (demo.gif etc.)
  → moved into the SPA's static assets.

### 2. `apps/api` — Hono Worker (AI port)

- **Routes** (mirror today's Next handlers):
  - `POST /ai/generate-node`
  - `POST /ai/generate-scene`
  - `POST /ai/modify-node`
  - `POST /ai/modify-scene`
  - `GET /nodes` (the existing `SERVER_NODE_DEFINITIONS`)
  - `GET /health`
- **Streaming:** the SSE bodies move nearly verbatim — they already use
  `ReadableStream` + `TextEncoder` and are runtime-agnostic.
- **LLM:** `geometryAI` + `aiClient` (OpenRouter via `@openrouter/ai-sdk-provider`
  + `ai` v4 `streamText`) run on the Workers runtime (fetch-based).
  `OPENROUTER_API_KEY` is a Worker secret.
- **Auth:** Clerk session verification via `@clerk/backend`
  (`verifyToken` / `authenticateRequest`, `CLERK_SECRET_KEY` secret). The SPA
  attaches `getToken()` as `Authorization: Bearer`. AI routes require a
  signed-in user.
- **CORS:** Hono `cors` middleware allowing the `editor-web` origin(s).

### 3. `packages/agent-core` — shared agent logic

The `app/agent/` directory (GeometryAIAgent, aiClient, contextBuilders,
validators, errorHandler, types, index) is hoisted into a shared workspace
package so the `api` worker and the SPA's client use **one source of truth**.
Context builders depend on the node registry/catalog; the catalog construction is
kept importable from both sides (registry stays in `editor-web`, with the
catalog-building inputs passed into `agent-core`, or the registry snapshot is
shared as data — resolved during planning).

## Data Flow

```
Browser (SPA)
  → Clerk getToken() → Authorization: Bearer
  → fetch VITE_API_BASE_URL/ai/generate-scene (SSE)
        │
        ▼
  api Worker (Hono)
    → verify Clerk token (@clerk/backend)
    → geometryAI.streamGenerateScene() → OpenRouter (streamText)
    → SSE stream back to SPA
        │
        ▼
  SPA: parse SSE → validate → register node / load scene into React Flow graph
```

No persistence is added in this spec; generated scenes/nodes continue to live in
React Flow state + localStorage exactly as today.

## Dev & Deploy

- **Dev:** `vite dev` (SPA) + `wrangler dev` (api worker). A Vite dev proxy
  forwards `/api/*` → the local worker so there is no CORS friction locally.
- **Deploy:** `wrangler deploy` per worker.
  - `editor-web`: Workers Static Assets with
    `not_found_handling: single-page-application`.
  - `api`: standard Worker.
  - Mirrors ipio's `pnpm --filter <worker> deploy:dev` convention; secrets via
    `wrangler secret put`.

## Error Handling

- Preserve the existing AI error model (`errorHandler` in `agent-core`:
  typed errors, streaming error responses, retry-up-to-3 in scene generation).
- API worker returns structured JSON errors for non-streaming failures and SSE
  `{ type: 'error', content }` frames for streaming failures (unchanged shape).
- Auth failures → `401` with a clear message the SPA surfaces in the AI panel.

## Testing

- **Vitest** for the already-pure units as a regression net: `graphCompiler`
  topological sort / execution order, individual node `execute` functions,
  `validators`.
- **Playwright** smoke test:
  1. App loads; `/` landing renders.
  2. `/editor` renders (signed-in test user).
  3. Add a cube node → viewport shows geometry.
  4. AI "generate scene" round-trips against the api worker.

## Exit Criteria

- Feature-identical editor running entirely on Cloudflare.
- AI generate/modify (node + scene) working through the `api` worker with
  streaming intact.
- Clerk auth working in the SPA and enforced on the api worker.
- Vitest + Playwright smoke green.
- No new product features introduced.

## Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| `ai` v4 + OpenRouter provider on the Workers runtime | Verify with an early smoke call; both are fetch-based and expected to work. Fallback: call OpenRouter's HTTP API directly. |
| Three.js / R3F bundle size under Vite | Acceptable for an editor app; add `manualChunks` for three / reactflow if needed. |
| Geist font visual parity after `next/font` → `@fontsource` swap | `@fontsource` exposes the same families/weights and CSS variables. |
| `contextBuilders` coupling to the in-app node registry | Keep registry in `editor-web`; pass catalog inputs into `agent-core`, or share a serialized catalog snapshot. Resolve in planning. |
| Clerk SPA token → worker verification drift | Use `@clerk/backend` networkless verification with the same instance keys; test signed and unsigned requests. |

## Follow-on (not this spec)

- **Spec B — Asset system:** D1 schema (Drizzle) + R2 + HMAC signed URLs,
  per-user workspace scoping, Hono asset routes, asset-browser/upload UI, wiring
  into the registry & graph.
- **Later — Agent + project space:** Durable Object per project, snapshot +
  command-batch versioning, approval-gated operation contract, OpenRouter agent
  loop (ipio Think pattern) on the `api` worker.
