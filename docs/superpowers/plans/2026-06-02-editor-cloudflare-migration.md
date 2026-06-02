# Editor Migration to All-Cloudflare — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run the existing geometry-node editor entirely on Cloudflare — a Vite SPA served by Workers Static Assets plus a Hono `api` Worker that hosts the ported OpenRouter AI endpoints — with no change to product behavior.

**Architecture:** The Next.js App-Router app becomes a Vite SPA (`apps/editor-web`) using `react-router-dom` and `@clerk/clerk-react`. The four streaming AI route handlers move into a Hono Worker (`apps/api`). The agent logic (OpenRouter client, prompt builders, validators, diff applicator) is hoisted into a Workers-safe shared package (`packages/agent-core`) consumed by both. The SPA builds the node catalog from its live registry and sends it to the worker, so the worker never imports Three.js or the registry.

**Tech Stack:** Vite 6, React 19, react-router-dom 6, `@clerk/clerk-react`, `@clerk/backend`, Hono 4, Wrangler 4 (Workers Static Assets), `@openrouter/ai-sdk-provider`, `ai` v4, Vitest, Playwright, npm workspaces + Turborepo.

**Reference (read-only):** ipio at `/Users/clay/Documents/real-link-tech/real-link-ai` — `apps/editor-web` (Vite SPA + Worker pattern) and `coordination/api` (Hono on Workers). Spec: `docs/superpowers/specs/2026-06-02-editor-cloudflare-migration-design.md`.

**Conventions for this plan:**
- Package manager is **npm** (repo already uses npm workspaces; `package-lock.json` present). Do NOT introduce pnpm.
- Run all commands from the repo root unless stated otherwise.
- The work happens on branch `feat/cloudflare-migration` (already created).
- "Workers-safe" = no `process.env` at module top level, no `window`/`document`, no Three.js, no registry import.

---

## File Structure (created/modified)

```
package.json                      MODIFY  workspaces += "packages/*"; scripts
turbo.json                        MODIFY  build outputs .next → dist
packages/agent-core/              CREATE  Workers-safe shared agent package
  package.json                    CREATE
  tsconfig.json                   CREATE
  src/index.ts                    CREATE  barrel exports
  src/types.ts                    MOVE    from apps/web/app/agent/types.ts
  src/jsonNodes.ts                MOVE    from apps/web/app/types/jsonNodes.ts
  src/errorHandler.ts             MOVE    from apps/web/app/agent/errorHandler.ts (unchanged)
  src/validators.ts               MOVE    from apps/web/app/agent/validators.ts (unchanged)
  src/robustDiffStrategy.ts       MOVE    from apps/web/app/utils/robustDiffStrategy.ts (unchanged)
  src/diffApplicator.ts           MOVE    from apps/web/app/utils/diffApplicator.ts (import path fix)
  src/contextBuilders.ts          MOVE+EDIT  drop registry; buildPromptForTask(task, catalog)
  src/aiClient.ts                 MOVE+EDIT  inject apiKey
  src/GeometryAIAgent.ts          MOVE+EDIT  inject {apiKey, catalog}; local diff import
  test/*.test.ts                  CREATE  Vitest unit tests (pure logic)
apps/api/                         CREATE  Hono Worker (fills existing placeholder)
  package.json                    CREATE
  wrangler.toml                   CREATE
  tsconfig.json                   CREATE
  src/index.ts                    CREATE  Hono app + CORS + Clerk + routes
  src/auth.ts                     CREATE  Clerk token verification middleware
  src/routes/ai.ts                CREATE  ported AI endpoints (SSE)
  src/routes/nodes.ts             CREATE  GET /nodes (server node defs)
apps/editor-web/                  RENAME from apps/web, convert to Vite
  package.json                    REWRITE Vite + clerk-react deps/scripts
  vite.config.ts                  CREATE
  wrangler.toml                   CREATE  Workers Static Assets, SPA fallback
  index.html                      CREATE
  tsconfig.json                   REWRITE Vite/bundler config
  src/main.tsx                    CREATE  Clerk + Router bootstrap
  src/router.tsx                  CREATE  routes
  src/RootLayout.tsx              CREATE  from app/layout.tsx (Header + Outlet)
  src/lib/buildCatalog.ts         CREATE  moved buildCatalog + helpers (reads registry)
  src/lib/aiApi.ts                CREATE  central fetch client (base URL + token + catalog)
  src/app/**                      MOVE    from apps/web/app/** (pages → route components)
  (deletes: middleware.ts, next.config.ts, postcss.config.mjs, next-env.d.ts)
vitest.config.ts (root or per-pkg) CREATE
playwright.config.ts              CREATE  editor-web smoke
```

---

## Task 1: Monorepo prep

**Files:**
- Modify: `package.json`
- Modify: `turbo.json`

- [ ] **Step 1: Add `packages/*` to workspaces and update scripts**

Edit `package.json` — replace the `workspaces` and `scripts` blocks:

```json
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev --parallel",
    "lint": "turbo run lint",
    "check-types": "turbo run check-types",
    "test": "turbo run test"
  },
```

- [ ] **Step 2: Update turbo build outputs (no more `.next`)**

Edit `turbo.json` — replace the `build` task and add `test`:

```json
{
  "$schema": "https://turborepo.com/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".vite/**"]
    },
    "check-types": { "dependsOn": ["^check-types"] },
    "dev": { "persistent": true, "cache": false },
    "lint": { "dependsOn": ["^lint"] },
    "test": { "dependsOn": ["^build"] }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add package.json turbo.json
git commit -m "chore: add packages/* workspace and update turbo outputs"
```

---

## Task 2: Create `packages/agent-core` skeleton

**Files:**
- Create: `packages/agent-core/package.json`
- Create: `packages/agent-core/tsconfig.json`

- [ ] **Step 1: Create the package manifest**

Create `packages/agent-core/package.json`:

```json
{
  "name": "@geometry-script/agent-core",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./jsonNodes": "./src/jsonNodes.ts"
  },
  "scripts": {
    "check-types": "tsc --noEmit",
    "test": "vitest run",
    "build": "tsc --noEmit"
  },
  "dependencies": {
    "@openrouter/ai-sdk-provider": "^0.7.3",
    "ai": "^4.3.19",
    "fastest-levenshtein": "^1.0.16"
  },
  "devDependencies": {
    "typescript": "^5",
    "vitest": "^2.1.8"
  }
}
```

Note: consumers (Vite, Wrangler/esbuild) bundle TypeScript source directly, so `main` points at `src/index.ts`. No build emit needed.

- [ ] **Step 2: Create the tsconfig**

Create `packages/agent-core/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "types": []
  },
  "include": ["src/**/*.ts", "test/**/*.ts"]
}
```

- [ ] **Step 3: Install workspaces (creates symlinks)**

Run: `npm install`
Expected: completes; `node_modules/@geometry-script/agent-core` symlink exists.

- [ ] **Step 4: Commit**

```bash
git add packages/agent-core/package.json packages/agent-core/tsconfig.json package-lock.json
git commit -m "feat(agent-core): scaffold workers-safe shared package"
```

---

## Task 3: Move the pure agent modules into `agent-core`

These files have no registry/THREE/DOM dependency and move verbatim (one import-path fix in diffApplicator).

**Files:**
- Move: `apps/web/app/agent/types.ts` → `packages/agent-core/src/types.ts`
- Move: `apps/web/app/types/jsonNodes.ts` → `packages/agent-core/src/jsonNodes.ts`
- Move: `apps/web/app/agent/errorHandler.ts` → `packages/agent-core/src/errorHandler.ts`
- Move: `apps/web/app/agent/validators.ts` → `packages/agent-core/src/validators.ts`
- Move: `apps/web/app/utils/robustDiffStrategy.ts` → `packages/agent-core/src/robustDiffStrategy.ts`
- Move: `apps/web/app/utils/diffApplicator.ts` → `packages/agent-core/src/diffApplicator.ts`

- [ ] **Step 1: Move the files with git (preserves history)**

```bash
git mv apps/web/app/agent/types.ts packages/agent-core/src/types.ts
git mv apps/web/app/types/jsonNodes.ts packages/agent-core/src/jsonNodes.ts
git mv apps/web/app/agent/errorHandler.ts packages/agent-core/src/errorHandler.ts
git mv apps/web/app/agent/validators.ts packages/agent-core/src/validators.ts
git mv apps/web/app/utils/robustDiffStrategy.ts packages/agent-core/src/robustDiffStrategy.ts
git mv apps/web/app/utils/diffApplicator.ts packages/agent-core/src/diffApplicator.ts
```

- [ ] **Step 2: Fix diffApplicator's import of jsonNodes**

In `packages/agent-core/src/diffApplicator.ts`, the line:

```ts
import { JsonNodeDefinition } from '../types/jsonNodes';
```

becomes:

```ts
import { JsonNodeDefinition } from './jsonNodes';
```

(`robustDiffStrategy` is now a sibling — its existing import `./robustDiffStrategy` is already correct.)

- [ ] **Step 3: Check jsonNodes.ts for sibling type imports**

Run: `grep -n "^import" packages/agent-core/src/jsonNodes.ts`
If it imports from `./connections`, `./nodeSystem`, or similar sibling type files, `git mv` those referenced files from `apps/web/app/types/` into `packages/agent-core/src/` too and fix their relative paths. If it has no imports, do nothing. (Expected from exploration: self-contained.)

- [ ] **Step 4: Typecheck the moved files**

Run: `npm run check-types -w @geometry-script/agent-core`
Expected: PASS (no missing imports). Fix any unresolved sibling-type import per Step 3.

- [ ] **Step 5: Commit**

```bash
git add -A packages/agent-core apps/web
git commit -m "refactor(agent-core): move pure agent + diff modules out of web app"
```

---

## Task 4: Refactor `aiClient` to inject the API key

**Files:**
- Move+Edit: `apps/web/app/agent/aiClient.ts` → `packages/agent-core/src/aiClient.ts`
- Test: `packages/agent-core/test/aiClient.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/agent-core/test/aiClient.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getAvailableModels, createStreamingSession, BASE_SYSTEM_PROMPT } from '../src/aiClient';

describe('aiClient', () => {
  it('exposes the OpenRouter model list', () => {
    const models = getAvailableModels();
    expect(models).toContain('anthropic/claude-3.5-sonnet');
    expect(models.length).toBeGreaterThan(3);
  });

  it('createStreamingSession requires an apiKey argument (no module-level env read)', () => {
    // The function must accept (prompt, apiKey, model) — type-level guarantee that
    // the key is injected per call rather than read from process.env at import.
    expect(createStreamingSession.length).toBeGreaterThanOrEqual(2);
    expect(BASE_SYSTEM_PROMPT).toContain('Geometry-Node');
  });
});
```

- [ ] **Step 2: Move the file**

```bash
git mv apps/web/app/agent/aiClient.ts packages/agent-core/src/aiClient.ts
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -w @geometry-script/agent-core -- aiClient`
Expected: FAIL — `createStreamingSession.length` is 1 (current signature `(prompt, modelName)`), and the module still reads `process.env` at import.

- [ ] **Step 4: Rewrite aiClient with injected apiKey**

Replace the entire contents of `packages/agent-core/src/aiClient.ts`:

```ts
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';

// Base system prompt for Geometry-Node AI
export const BASE_SYSTEM_PROMPT = `You are an expert Geometry-Node engineer working in the repository 'geometry-node' (branch 'product').
Your job is to **create new nodes, build scenes, or modify scenes**.
Follow these rules at all times:

1. Obey the TypeScript (NodeDefinition) and Scene-JSON schemas supplied in the examples.
2. Use **Chinese comments only if the user explicitly asks**.
3. Never invent a node type that is not listed in the supplied **CATALOG** unless the user's task is *"create new node"*.
4. If a validator report is present, fix every error before doing anything else.
5. Output **pure code / JSON only**—no markdown framing, no extra prose.`;

/**
 * Creates a streaming text generation session.
 * The OpenRouter API key is injected per call (Workers have no module-level env).
 */
export async function createStreamingSession(
  prompt: string,
  apiKey: string,
  modelName: string = 'anthropic/claude-3.5-sonnet'
) {
  const openrouter = createOpenRouter({ apiKey });
  return await streamText({
    model: openrouter(modelName),
    prompt,
    system: BASE_SYSTEM_PROMPT,
  });
}

/** Gets list of available models */
export function getAvailableModels(): string[] {
  return [
    'anthropic/claude-3.5-sonnet',
    'openai/gpt-4o',
    'openai/gpt-4o-mini',
    'google/gemini-pro-1.5',
    'meta-llama/llama-3.1-70b-instruct',
    'mistralai/mixtral-8x7b-instruct',
  ];
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -w @geometry-script/agent-core -- aiClient`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A packages/agent-core apps/web
git commit -m "refactor(agent-core): inject OpenRouter apiKey per call"
```

---

## Task 5: Refactor `contextBuilders` — drop the registry, take catalog as a parameter

`buildCatalog` (and its two private helpers `getNodeUsagePatterns`, `getCommonParameterValues`) are the only registry-dependent code. They move to the SPA (Task 12). Everything else stays in agent-core, and `buildPromptForTask` gains a `catalog` parameter.

**Files:**
- Move+Edit: `apps/web/app/agent/contextBuilders.ts` → `packages/agent-core/src/contextBuilders.ts`
- Test: `packages/agent-core/test/contextBuilders.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/agent-core/test/contextBuilders.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildPromptForTask } from '../src/contextBuilders';

describe('buildPromptForTask', () => {
  it('injects the provided catalog into a generate_scene prompt', () => {
    const catalog = 'CATALOG_SENTINEL_12345';
    const prompt = buildPromptForTask(
      { task: 'generate_scene', scene_description: 'a red cube' },
      catalog,
    );
    expect(prompt).toContain('CATALOG_SENTINEL_12345');
    expect(prompt).toContain('a red cube');
  });

  it('does not require a catalog for create_node (uses static examples)', () => {
    const prompt = buildPromptForTask(
      { task: 'create_node', behavior: 'doubles a number' },
      '',
    );
    expect(prompt).toContain('create_node');
    expect(prompt).toContain('doubles a number');
  });
});
```

- [ ] **Step 2: Move the file**

```bash
git mv apps/web/app/agent/contextBuilders.ts packages/agent-core/src/contextBuilders.ts
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -w @geometry-script/agent-core -- contextBuilders`
Expected: FAIL — `buildPromptForTask` takes one arg and imports `nodeRegistry` (module resolution error for `../registry/NodeRegistry`).

- [ ] **Step 4: Remove the registry import and the registry-dependent functions**

In `packages/agent-core/src/contextBuilders.ts`:

1. Delete the top import line:
   ```ts
   import { nodeRegistry } from '../registry/NodeRegistry';
   ```
2. Delete the three registry-dependent functions in their entirety (they relocate to the SPA in Task 12):
   - `export function buildCatalog(): string { ... }` (≈ lines 6–105)
   - `function getNodeUsagePatterns(nodeType: string): string[] { ... }` (≈ lines 106–175)
   - `function getCommonParameterValues(nodeType: string): Record<string, any> { ... }` (≈ lines 176–211)

- [ ] **Step 5: Change `buildPromptForTask` to accept `catalog`**

Replace the signature line:

```ts
export function buildPromptForTask(task: any): string {
```

with:

```ts
export function buildPromptForTask(task: any, catalog: string): string {
```

Then, inside that function, replace every `${buildCatalog()}` occurrence with `${catalog}` (there are two: the `plan_scene` case and the `generate_scene` case). Leave `buildNodeExamples()`, `buildSceneExamples()`, `buildScenePresets()`, `buildSceneGenerationGuidelines()`, `buildModifyNodePrompt()`, `buildModifyScenePrompt()` untouched — they are static.

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm test -w @geometry-script/agent-core -- contextBuilders`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A packages/agent-core apps/web
git commit -m "refactor(agent-core): parameterize buildPromptForTask with catalog, drop registry"
```

---

## Task 6: Refactor `GeometryAIAgent` — inject apiKey + catalog, local diff import

**Files:**
- Move+Edit: `apps/web/app/agent/GeometryAIAgent.ts` → `packages/agent-core/src/GeometryAIAgent.ts`
- Create: `packages/agent-core/src/index.ts`

- [ ] **Step 1: Move the file**

```bash
git mv apps/web/app/agent/GeometryAIAgent.ts packages/agent-core/src/GeometryAIAgent.ts
```

- [ ] **Step 2: Update imports (drop buildCatalog, fix diff path)**

In `packages/agent-core/src/GeometryAIAgent.ts`, change the imports:

- The line importing from `./types` keeps `JsonNodeDefinition` — change `import { JsonNodeDefinition } from '../types/jsonNodes';` to `import { JsonNodeDefinition } from './jsonNodes';`
- In the contextBuilders import, remove `buildCatalog` (no longer exported):
  ```ts
  import {
    buildNodeExamples,
    buildScenePresets,
    buildPromptForTask
  } from './contextBuilders';
  ```
- The dynamic import inside `modifyNodeWithErrorHandling`:
  ```ts
  const { DiffApplicator } = await import('../utils/diffApplicator');
  ```
  becomes:
  ```ts
  const { DiffApplicator } = await import('./diffApplicator');
  ```

- [ ] **Step 3: Inject apiKey + catalog via the constructor**

Replace the field + constructor:

```ts
export class GeometryAIAgent {
  private model: string;

  constructor(model: string = 'anthropic/claude-3.5-sonnet') {
    this.model = model;
  }
```

with:

```ts
export class GeometryAIAgent {
  private model: string;
  private apiKey: string;
  private catalog: string;

  constructor(opts: { apiKey: string; model?: string; catalog?: string } = { apiKey: '' }) {
    this.apiKey = opts.apiKey;
    this.model = opts.model ?? 'anthropic/claude-3.5-sonnet';
    this.catalog = opts.catalog ?? '';
  }
```

- [ ] **Step 4: Thread apiKey into every `createStreamingSession` call**

Throughout the file, replace every:

```ts
const result = await createStreamingSession(prompt, modelName || this.model);
```

with:

```ts
const result = await createStreamingSession(prompt, this.apiKey, modelName || this.model);
```

(There are multiple call sites: `streamTask`, `createNodeWithErrorHandling`, `planSceneWithErrorHandling`, `composeSceneWithErrorHandling`, `diffSceneWithErrorHandling`, `generateSceneWithErrorHandling`, `streamGenerateScene`, `modifyNodeWithErrorHandling`, `modifySceneWithErrorHandling`.)

- [ ] **Step 5: Thread catalog into prompt building**

Replace every `buildPromptForTask(request)` with `buildPromptForTask(request, this.catalog)` (call sites: `streamTask`, `generateSceneWithErrorHandling`, `streamGenerateScene`, `modifyNodeWithErrorHandling`, `modifySceneWithErrorHandling`).

In `planSceneWithErrorHandling`, replace the inline:

```ts
      const catalog = buildCatalog();
```

with:

```ts
      const catalog = this.catalog;
```

(`composeSceneWithErrorHandling` uses `buildScenePresets()` and `createNodeWithErrorHandling` uses `buildNodeExamples()` — both static, leave as-is.)

- [ ] **Step 6: Create the barrel export**

Create `packages/agent-core/src/index.ts`:

```ts
// Agent orchestrator
export { GeometryAIAgent } from './GeometryAIAgent';

// Types
export type {
  AITask, CreateNodeRequest, PlanSceneRequest, ComposeSceneRequest,
  DiffSceneRequest, GenerateSceneRequest, ModifyNodeRequest, ModifySceneRequest,
  AIRequest, ValidationResult, AIGenerationResult,
} from './types';
export type { JsonNodeDefinition } from './jsonNodes';

// Prompt builders (static parts)
export {
  buildNodeExamples, buildScenePresets, buildSceneExamples,
  buildSceneGenerationGuidelines, buildPromptForTask,
} from './contextBuilders';

// Validators
export {
  validateNodeCode, validateSceneJSON, validateAIRequest, validateAPIRequest,
} from './validators';

// AI client
export { createStreamingSession, getAvailableModels, BASE_SYSTEM_PROMPT } from './aiClient';

// Error handling
export {
  ErrorType, createError, createSuccessResponse, createErrorResponse,
  withErrorHandling, withErrorHandlingGenerator, handleError,
  validationToResponse, logError, createHTTPResponse, createStreamingErrorResponse,
} from './errorHandler';
export type { StandardError, StandardResponse } from './errorHandler';

// Diff
export { DiffApplicator } from './diffApplicator';
```

Note: only export names that actually exist. If `buildSceneExamples`/`buildSceneGenerationGuidelines` are not exported from `contextBuilders`, add `export` to their declarations there, or drop them from this barrel. Verify with the typecheck in the next step.

- [ ] **Step 7: Typecheck the whole package**

Run: `npm run check-types -w @geometry-script/agent-core`
Expected: PASS. Resolve any export-name mismatch surfaced here.

- [ ] **Step 8: Commit**

```bash
git add -A packages/agent-core
git commit -m "refactor(agent-core): inject apiKey+catalog into GeometryAIAgent; finalize barrel"
```

---

## Task 7: Scaffold the `apps/api` Hono Worker

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/wrangler.toml`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/index.ts`

- [ ] **Step 1: Remove the placeholder, create the manifest**

```bash
git rm apps/api/README.md
```

Create `apps/api/package.json`:

```json
{
  "name": "@geometry-script/api",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wrangler dev --port 8787",
    "deploy:dev": "wrangler deploy --env dev",
    "deploy": "wrangler deploy",
    "check-types": "tsc --noEmit",
    "build": "tsc --noEmit"
  },
  "dependencies": {
    "@clerk/backend": "^1.21.0",
    "@geometry-script/agent-core": "*",
    "hono": "^4.6.14"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20241127.0",
    "typescript": "^5",
    "wrangler": "^4.0.0"
  }
}
```

- [ ] **Step 2: Create the wrangler config**

Create `apps/api/wrangler.toml`:

```toml
name = "geometry-api"
main = "src/index.ts"
compatibility_date = "2024-11-27"
compatibility_flags = ["nodejs_compat"]

# Secrets (set via `wrangler secret put`): OPENROUTER_API_KEY, CLERK_SECRET_KEY
# Public var: the editor-web origin allowed by CORS
[vars]
ALLOWED_ORIGIN = "http://localhost:5173"

[env.dev]
name = "geometry-api-dev"
[env.dev.vars]
ALLOWED_ORIGIN = "http://localhost:5173"
```

- [ ] **Step 3: Create the tsconfig**

Create `apps/api/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "types": ["@cloudflare/workers-types"]
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 4: Create a minimal health worker**

Create `apps/api/src/index.ts`:

```ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';

export interface Env {
  OPENROUTER_API_KEY: string;
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;
  ALLOWED_ORIGIN: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', (c, next) =>
  cors({ origin: c.env.ALLOWED_ORIGIN, allowHeaders: ['Authorization', 'Content-Type'] })(c, next),
);

app.get('/health', (c) => c.json({ ok: true, service: 'geometry-api' }));

export default app;
```

- [ ] **Step 5: Install and smoke-test locally**

Run: `npm install`
Run: `npm run dev -w @geometry-script/api` (starts `wrangler dev` on :8787; leave running in a second shell)
Run: `curl -s http://localhost:8787/health`
Expected: `{"ok":true,"service":"geometry-api"}`

- [ ] **Step 6: Commit**

```bash
git add -A apps/api package-lock.json
git commit -m "feat(api): scaffold Hono worker with health route"
```

---

## Task 8: Port the AI endpoints into the worker

The four Next route handlers move into `apps/api/src/routes/ai.ts`. The bodies are runtime-agnostic (`ReadableStream` + `TextEncoder`). Each request now carries `catalog` (sent by the SPA) and the agent is constructed per request with the key from `env`.

**Files:**
- Create: `apps/api/src/routes/ai.ts`
- Create: `apps/api/src/routes/nodes.ts`
- Modify: `apps/api/src/index.ts`

- [ ] **Step 1: Create the AI routes**

Create `apps/api/src/routes/ai.ts`. Each handler mirrors the corresponding existing Next handler in `apps/web/app/api/ai/*/route.ts`, with two differences: (a) read `catalog` from the JSON body and pass it to `new GeometryAIAgent({ apiKey, catalog })`; (b) get the key from `c.env.OPENROUTER_API_KEY`. Port the SSE logic verbatim from the existing files.

```ts
import { Hono } from 'hono';
import {
  GeometryAIAgent, validateAPIRequest, validationToResponse,
  createHTTPResponse, createStreamingErrorResponse, createError, ErrorType, logError,
  type CreateNodeRequest, type GenerateSceneRequest,
  type ModifyNodeRequest, type ModifySceneRequest,
} from '@geometry-script/agent-core';
import type { Env } from '../index';

export const ai = new Hono<{ Bindings: Env }>();

const sseHeaders = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
};

function agentFor(c: { env: Env }, catalog: string) {
  return new GeometryAIAgent({ apiKey: c.env.OPENROUTER_API_KEY, catalog });
}

/** Extract a JSON scene object from a model response that may include markdown/prose. */
function tryParseScene(text: string): any | null {
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

// POST /ai/generate-node
ai.post('/generate-node', async (c) => {
  const body = await c.req.json();
  const validation = validateAPIRequest(body);
  if (!validation.success) {
    return createHTTPResponse(validationToResponse(validation, null, 'generate-node API'), 400);
  }
  const { prompt, model, mode = 'generate', catalog = '' } = body;
  const geometryAI = agentFor(c, catalog);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      try {
        const taskRequest: CreateNodeRequest = { task: 'create_node', behavior: prompt };
        if (mode === 'generate') {
          let fullResponse = '';
          for await (const chunk of geometryAI.streamTask(taskRequest, model)) {
            fullResponse += chunk;
            send({ type: 'progress', content: chunk });
          }
          send({ type: 'progress', content: 'Processing generated JSON...' });
          const nodeDefinition = geometryAI.parseJsonNodeDefinition(fullResponse);
          if (nodeDefinition) {
            send({ type: 'success', content: 'Node generated successfully!', node: nodeDefinition });
          } else {
            send({ type: 'error', content: 'Failed to parse generated JSON to valid node format', errorType: ErrorType.PARSING_ERROR });
          }
        } else if (mode === 'explain') {
          for await (const chunk of geometryAI.streamTask(taskRequest, model)) {
            send({ type: 'stream', content: chunk });
          }
          send({ type: 'done', content: '' });
        } else {
          send({ type: 'error', content: `Invalid mode: ${mode}`, errorType: ErrorType.VALIDATION_ERROR });
        }
      } catch (error) {
        const e = createError(ErrorType.AI_SERVICE_ERROR, 'Failed to generate node', error, 'generate-node');
        logError(e);
        send({ type: 'error', content: e.message, errorType: e.type });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: sseHeaders });
});

// POST /ai/generate-scene
ai.post('/generate-scene', async (c) => {
  const body = await c.req.json();
  const validation = validateAPIRequest(body);
  if (!validation.success) {
    return createHTTPResponse(validationToResponse(validation, null, 'generate-scene API'), 400);
  }
  const { prompt, model, catalog = '' } = body;
  const geometryAI = agentFor(c, catalog);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      try {
        send({ type: 'progress', content: 'Generating scene...' });
        const req: GenerateSceneRequest = { task: 'generate_scene', scene_description: prompt };
        // Stream once and accumulate — do NOT also call executeTask (that would invoke the LLM twice).
        let sceneResult = '';
        for await (const chunk of geometryAI.streamGenerateScene(req, model)) {
          sceneResult += chunk;
          send({ type: 'stream', content: chunk });
        }
        // Parse + validate the accumulated text (tolerates markdown/extra prose).
        const scene = tryParseScene(sceneResult);
        const validation = scene ? validateSceneJSON(scene) : { success: false, errors: ['Not valid JSON'] };
        if (scene && validation.success) {
          send({ type: 'success', content: 'Scene generated successfully!', scene });
        } else {
          send({ type: 'error', content: `Scene validation failed: ${validation.errors.join(', ')}`, errorType: ErrorType.VALIDATION_ERROR });
        }
      } catch (error) {
        const e = createError(ErrorType.AI_SERVICE_ERROR, 'Failed to generate scene', error, 'generate-scene');
        logError(e);
        send({ type: 'error', content: e.message, errorType: e.type });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: sseHeaders });
});

// POST /ai/modify-node
ai.post('/modify-node', async (c) => {
  const body = await c.req.json();
  const { nodeData, modification_description, model, catalog = '' } = body;
  const geometryAI = agentFor(c, catalog);
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      try {
        const req: ModifyNodeRequest = { task: 'modify_node', nodeData, modification_description };
        const result = await geometryAI.executeTask(req, model);
        if (result.success && result.data) {
          send({ type: 'success', content: 'Node modified successfully!', node: JSON.parse(result.data) });
        } else {
          send({ type: 'error', content: result.error?.message ?? 'Modify node failed', errorType: result.error?.type });
        }
      } catch (error) {
        const e = createError(ErrorType.AI_SERVICE_ERROR, 'Failed to modify node', error, 'modify-node');
        logError(e);
        send({ type: 'error', content: e.message, errorType: e.type });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: sseHeaders });
});

// POST /ai/modify-scene
ai.post('/modify-scene', async (c) => {
  const body = await c.req.json();
  const { sceneData, modification_description, model, catalog = '' } = body;
  const geometryAI = agentFor(c, catalog);
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      try {
        const req: ModifySceneRequest = { task: 'modify_scene', sceneData, modification_description };
        const result = await geometryAI.executeTask(req, model);
        if (result.success && result.data) {
          send({ type: 'success', content: 'Scene modified successfully!', scene: JSON.parse(result.data) });
        } else {
          send({ type: 'error', content: result.error?.message ?? 'Modify scene failed', errorType: result.error?.type });
        }
      } catch (error) {
        const e = createError(ErrorType.AI_SERVICE_ERROR, 'Failed to modify scene', error, 'modify-scene');
        logError(e);
        send({ type: 'error', content: e.message, errorType: e.type });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: sseHeaders });
});
```

Cross-check each handler's emitted SSE frame shapes against the originals in `apps/web/app/api/ai/*/route.ts` and adjust field names if the existing client depends on a specific shape (verified again in Task 12). Confirm `ModifyNodeRequest`/`ModifySceneRequest` field names (`nodeData`, `sceneData`, `modification_description`) against `packages/agent-core/src/types.ts`.

- [ ] **Step 2: Create the nodes route**

Port `apps/web/app/api/nodes/route.ts`'s `GET` into `apps/api/src/routes/nodes.ts`. If it returns a static `SERVER_NODE_DEFINITIONS` array, move that data file alongside (e.g. `apps/api/src/data/serverNodes.ts`) and serve it:

```ts
import { Hono } from 'hono';
import type { Env } from '../index';
import { SERVER_NODE_DEFINITIONS } from '../data/serverNodes';

export const nodes = new Hono<{ Bindings: Env }>();
nodes.get('/', (c) => c.json({ success: true, data: SERVER_NODE_DEFINITIONS }));
```

(Copy `apps/web/app/data/serverNodes.ts` → `apps/api/src/data/serverNodes.ts` if it has no THREE/registry imports; otherwise inline the metadata. Verify with `grep -n "^import" apps/web/app/data/serverNodes.ts` first.)

- [ ] **Step 3: Mount the routes + a models endpoint**

Edit `apps/api/src/index.ts` — add imports and mounts after the health route:

```ts
import { ai } from './routes/ai';
import { nodes } from './routes/nodes';
import { getAvailableModels } from '@geometry-script/agent-core';

app.route('/ai', ai);
app.route('/nodes', nodes);
app.get('/ai/models', (c) => c.json({ success: true, data: { models: getAvailableModels() } }));
```

- [ ] **Step 4: Typecheck**

Run: `npm run check-types -w @geometry-script/api`
Expected: PASS.

- [ ] **Step 5: Manual smoke against OpenRouter (requires a key)**

```bash
cd apps/api && npx wrangler secret put OPENROUTER_API_KEY --env dev   # paste key; or use a .dev.vars file
```
Create `apps/api/.dev.vars` (gitignored) with `OPENROUTER_API_KEY=sk-or-...` for local `wrangler dev`.
Run: `npm run dev -w @geometry-script/api`
Run:
```bash
curl -N -X POST http://localhost:8787/ai/generate-node \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"a node that doubles a number","mode":"generate","catalog":""}'
```
Expected: SSE frames streaming, ending with a `data: {"type":"success",...,"node":{...}}` frame. This validates `ai` v4 + OpenRouter on the Workers runtime (the key Spec A risk).

- [ ] **Step 6: Commit**

```bash
git add -A apps/api .gitignore
git commit -m "feat(api): port OpenRouter AI + nodes endpoints to the worker"
```

---

## Task 9: Add Clerk auth to the worker

**Files:**
- Create: `apps/api/src/auth.ts`
- Modify: `apps/api/src/index.ts`

- [ ] **Step 1: Create the auth middleware**

Create `apps/api/src/auth.ts`:

```ts
import type { MiddlewareHandler } from 'hono';
import { createClerkClient } from '@clerk/backend';
import type { Env } from './index';

/** Verifies the Clerk session token from the Authorization: Bearer header. */
export const requireAuth: MiddlewareHandler<{ Bindings: Env; Variables: { userId: string } }> =
  async (c, next) => {
    const clerk = createClerkClient({
      secretKey: c.env.CLERK_SECRET_KEY,
      publishableKey: c.env.CLERK_PUBLISHABLE_KEY,
    });
    const requestState = await clerk.authenticateRequest(c.req.raw, {
      authorizedParties: [c.env.ALLOWED_ORIGIN],
    });
    if (!requestState.isSignedIn) {
      return c.json({ success: false, error: { message: 'Unauthorized' } }, 401);
    }
    c.set('userId', requestState.toAuth().userId);
    await next();
  };
```

- [ ] **Step 2: Protect the AI + nodes routes**

Edit `apps/api/src/index.ts` — apply `requireAuth` to `/ai/*` and `/nodes` (keep `/health` open):

```ts
import { requireAuth } from './auth';
// ...
app.use('/ai/*', requireAuth);
app.use('/nodes', requireAuth);
```

Also add the `CLERK_PUBLISHABLE_KEY` to `[vars]` in `wrangler.toml` (publishable key is not secret) and set `CLERK_SECRET_KEY` via `wrangler secret put` + `.dev.vars`.

- [ ] **Step 3: Verify unauthorized is rejected**

Run (worker running): `curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8787/ai/generate-node -H 'Content-Type: application/json' -d '{}'`
Expected: `401`.

- [ ] **Step 4: Typecheck + commit**

Run: `npm run check-types -w @geometry-script/api`
```bash
git add -A apps/api
git commit -m "feat(api): require Clerk auth on AI and nodes routes"
```

---

## Task 10: Convert `apps/web` → `apps/editor-web` (Vite scaffold)

**Files:**
- Rename: `apps/web` → `apps/editor-web`
- Rewrite: `apps/editor-web/package.json`, `tsconfig.json`
- Create: `vite.config.ts`, `index.html`, `src/main.tsx`
- Delete: `middleware.ts`, `next.config.ts`, `postcss.config.mjs`

- [ ] **Step 1: Rename the app directory**

```bash
git mv apps/web apps/editor-web
git rm apps/editor-web/middleware.ts apps/editor-web/next.config.ts apps/editor-web/postcss.config.mjs
rm -f apps/editor-web/next-env.d.ts
```

- [ ] **Step 2: Rewrite package.json**

Replace `apps/editor-web/package.json`:

```json
{
  "name": "@geometry-script/editor-web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "check-types": "tsc --noEmit",
    "deploy:dev": "npm run build && wrangler deploy --env dev",
    "deploy": "npm run build && wrangler deploy"
  },
  "dependencies": {
    "@clerk/clerk-react": "^5.20.0",
    "@fontsource-variable/geist": "^5.1.0",
    "@fontsource/geist-mono": "^5.1.0",
    "@geometry-script/agent-core": "*",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-slider": "^1.3.5",
    "@react-three/drei": "^10.5.1",
    "@react-three/fiber": "^9.2.0",
    "fastest-levenshtein": "^1.0.16",
    "html-to-image": "^1.11.11",
    "lucide-react": "^0.525.0",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-router-dom": "^6.28.0",
    "reactflow": "^11.11.4",
    "three": "^0.178.0",
    "zod": "^3.25.76"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20241127.0",
    "@tailwindcss/vite": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@types/three": "^0.178.1",
    "@vitejs/plugin-react": "^4.3.4",
    "tailwindcss": "^4",
    "typescript": "^5",
    "vite": "^6.0.0",
    "wrangler": "^4.0.0"
  }
}
```

- [ ] **Step 3: Create vite.config.ts**

Create `apps/editor-web/vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './app') },
  },
  server: {
    port: 5173,
    proxy: {
      // Forward API calls to the local Hono worker, no CORS friction in dev.
      '/api': { target: 'http://localhost:8787', changeOrigin: true, rewrite: (p) => p.replace(/^\/api/, '') },
    },
  },
  build: { outDir: 'dist', sourcemap: true },
});
```

- [ ] **Step 4: Rewrite tsconfig.json**

Replace `apps/editor-web/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "allowJs": true,
    "types": ["vite/client"],
    "paths": { "@/*": ["./app/*"] }
  },
  "include": ["app", "src", "vite.config.ts"]
}
```

- [ ] **Step 5: Create index.html**

Create `apps/editor-web/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Geometry Nodes On The Web!</title>
    <meta name="description" content="Create interactive 3D geometry with visual node-based programming" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create src/main.tsx**

Create `apps/editor-web/src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { RouterProvider } from 'react-router-dom';
import '@fontsource-variable/geist';
import '@fontsource/geist-mono';
import { router } from './router';
import '../app/globals.css';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={{ variables: { colorPrimary: '#8b5cf6' } }}
    >
      <RouterProvider router={router} />
    </ClerkProvider>
  </React.StrictMode>,
);
```

Note: Geist font CSS variables. `globals.css` references `--font-geist-sans`/`--font-geist-mono`. Add these to the top of `app/globals.css` so the fontsource families are bound:

```css
:root {
  --font-geist-sans: 'Geist Variable', system-ui, sans-serif;
  --font-geist-mono: 'Geist Mono', ui-monospace, monospace;
}
```

- [ ] **Step 7: Install**

Run: `npm install`
Expected: completes; React/Vite/Clerk-react resolved.

- [ ] **Step 8: Commit**

```bash
git add -A apps/editor-web package-lock.json
git commit -m "feat(editor-web): scaffold Vite SPA (rename from apps/web)"
```

---

## Task 11: Migrate routing, Clerk, and `Link` (Next → Vite)

**Files:**
- Create: `apps/editor-web/src/router.tsx`
- Create: `apps/editor-web/src/RootLayout.tsx`
- Modify: `apps/editor-web/app/components/Header.tsx`
- Modify: `apps/editor-web/app/page.tsx`, `app/editor/page.tsx`, `app/investors/page.tsx`, `app/whitepaper/page.tsx`
- Delete: `apps/editor-web/app/layout.tsx`

- [ ] **Step 1: Create the root layout from the old `layout.tsx`**

Create `apps/editor-web/src/RootLayout.tsx` (Header + Outlet; the `<html>/<body>` and ClerkProvider move to `main.tsx`):

```tsx
import { Outlet } from 'react-router-dom';
import Header from '../app/components/Header';

export default function RootLayout() {
  return (
    <>
      <Header />
      <Outlet />
    </>
  );
}
```

Then delete the Next layout:

```bash
git rm apps/editor-web/app/layout.tsx
```

- [ ] **Step 2: Create the router**

Create `apps/editor-web/src/router.tsx`:

```tsx
import { createBrowserRouter } from 'react-router-dom';
import RootLayout from './RootLayout';
import LandingPage from '../app/page';
import EditorPage from '../app/editor/page';
import InvestorsPage from '../app/investors/page';
import WhitepaperPage from '../app/whitepaper/page';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/editor', element: <EditorPage /> },
      { path: '/investors', element: <InvestorsPage /> },
      { path: '/whitepaper', element: <WhitepaperPage /> },
    ],
  },
]);
```

- [ ] **Step 3: Swap Clerk + Link in `Header.tsx`**

In `apps/editor-web/app/components/Header.tsx`:
- `import { SignedIn, SignedOut, UserButton, SignInButton, SignUpButton } from "@clerk/nextjs";` → `from "@clerk/clerk-react";`
- `import Link from "next/link";` → `import { Link } from "react-router-dom";`
- Replace every `href=` on `<Link>` with `to=` (react-router uses `to`). Leave plain `<a>` tags as-is.

- [ ] **Step 4: Swap Clerk + Link in the page components**

For each of `app/page.tsx`, `app/editor/page.tsx`, `app/investors/page.tsx`, `app/whitepaper/page.tsx`:
- Replace `from '@clerk/nextjs'` → `from '@clerk/clerk-react'` (where present).
- Replace `import Link from 'next/link'` → `import { Link } from 'react-router-dom'` and change `<Link href=...>` to `<Link to=...>`.
- Remove the `'use client';` directive at the top of each (no-op in Vite, but clean it up).

`app/editor/page.tsx` already uses `<SignedOut><RedirectToSignIn/></SignedOut>` — `RedirectToSignIn` exists in `@clerk/clerk-react`, so route protection is preserved with no extra guard.

- [ ] **Step 5: Typecheck**

Run: `npm run check-types -w @geometry-script/editor-web`
Expected: PASS. Fix any remaining `next/*` import that the grep in the next step surfaces.

- [ ] **Step 6: Verify no Next imports remain**

Run: `grep -rn "from 'next\|from \"next\|@clerk/nextjs\|next/link\|next/font\|next/image\|NextRequest" apps/editor-web/app apps/editor-web/src`
Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add -A apps/editor-web
git commit -m "feat(editor-web): react-router routing + clerk-react migration"
```

---

## Task 12: Move `buildCatalog` to the SPA and route AI calls through the worker

**Files:**
- Create: `apps/editor-web/app/lib/buildCatalog.ts`
- Create: `apps/editor-web/app/lib/aiApi.ts`
- Modify: `apps/editor-web/app/components/AIPanel.tsx`, `CommandSystem.tsx`, `ModificationPanel.tsx`

- [ ] **Step 1: Recreate `buildCatalog` in the SPA (reads the live registry)**

Create `apps/editor-web/app/lib/buildCatalog.ts` containing the three functions removed from `contextBuilders` in Task 5 — `buildCatalog`, `getNodeUsagePatterns`, `getCommonParameterValues` — copied verbatim from git history:

```bash
git show HEAD~6:apps/web/app/agent/contextBuilders.ts | sed -n '1,211p'
```

Paste lines 1–211 (the import of `nodeRegistry` plus the three functions) into the new file, keeping only `buildCatalog` exported. Fix the registry import path to the SPA registry:

```ts
import { nodeRegistry } from '../registry/NodeRegistry';
export function buildCatalog(): string { /* ...verbatim... */ }
function getNodeUsagePatterns(nodeType: string): string[] { /* ...verbatim... */ }
function getCommonParameterValues(nodeType: string): Record<string, any> { /* ...verbatim... */ }
```

(Adjust `HEAD~6` to the commit where contextBuilders still had these functions if the count differs.)

- [ ] **Step 2: Create the central AI client**

Create `apps/editor-web/app/lib/aiApi.ts`:

```ts
import { buildCatalog } from './buildCatalog';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '/api';

type AiEndpoint =
  | 'generate-node' | 'generate-scene' | 'modify-node' | 'modify-scene';

/**
 * POSTs to an AI endpoint on the worker with the Clerk token + live catalog,
 * returning the raw streaming Response for the caller to read as SSE.
 */
export async function postAi(
  endpoint: AiEndpoint,
  body: Record<string, unknown>,
  getToken: () => Promise<string | null>,
): Promise<Response> {
  const token = await getToken();
  return fetch(`${API_BASE}/ai/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ ...body, catalog: buildCatalog() }),
  });
}
```

`VITE_API_BASE_URL` is unset in dev (the Vite proxy forwards `/api` → `:8787`) and set to the deployed worker origin in prod.

- [ ] **Step 3: Update the three callers**

In `AIPanel.tsx`, `CommandSystem.tsx`, `ModificationPanel.tsx`:
- Import the helper + Clerk's `useAuth`:
  ```ts
  import { postAi } from '../lib/aiApi';
  import { useAuth } from '@clerk/clerk-react';
  ```
- Add `const { getToken } = useAuth();` inside each component.
- Replace each `const response = await fetch(endpoint, { method:'POST', headers:..., body: JSON.stringify({ prompt, model, mode }) })` block with the endpoint name and `postAi(...)`. Example (AIPanel):
  ```ts
  const endpoint = activeTab === 'nodes' ? 'generate-node' : 'generate-scene';
  const response = await postAi(endpoint, { prompt, model, mode }, getToken);
  ```
  For `ModificationPanel`: `postAi(activeTab === 'nodes' ? 'modify-node' : 'modify-scene', { nodeData|sceneData, modification_description, model }, getToken)` — match the body field names each component already sends.
- Keep the existing SSE-reading logic (the `response.body` reader / EventSource parsing) unchanged — only the request construction changes. Confirm the SSE frame shapes consumed here match those emitted by the worker in Task 8; adjust the worker frames if a mismatch exists.

- [ ] **Step 4: Typecheck**

Run: `npm run check-types -w @geometry-script/editor-web`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A apps/editor-web
git commit -m "feat(editor-web): build catalog client-side, route AI through worker with Clerk token"
```

---

## Task 13: Build the SPA and configure Workers Static Assets

**Files:**
- Create: `apps/editor-web/wrangler.toml`
- Modify: `apps/editor-web/.gitignore` (ensure `dist/`)

- [ ] **Step 1: Produce a production build**

Create `apps/editor-web/.env` (gitignored) with a real publishable key for local build/test, or export it:
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```
Run: `npm run build -w @geometry-script/editor-web`
Expected: `apps/editor-web/dist/` produced with `index.html` + hashed assets. Resolve any bundling error (e.g. a stray `process.env` in client code — replace with `import.meta.env`).

- [ ] **Step 2: Create the static-assets wrangler config**

Create `apps/editor-web/wrangler.toml`:

```toml
name = "geometry-editor-web"
compatibility_date = "2024-11-27"

[assets]
directory = "./dist"
not_found_handling = "single-page-application"

[env.dev]
name = "geometry-editor-web-dev"
[env.dev.assets]
directory = "./dist"
not_found_handling = "single-page-application"
```

- [ ] **Step 3: Verify the built SPA serves with SPA fallback**

Run: `cd apps/editor-web && npx wrangler dev` (serves `dist/`)
Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:8787/editor` (deep link)
Expected: `200` (SPA fallback returns index.html for client routes).

- [ ] **Step 4: Commit**

```bash
git add -A apps/editor-web
git commit -m "feat(editor-web): Workers Static Assets config with SPA fallback"
```

---

## Task 14: Regression tests for the graph engine (Vitest)

The graph compiler and node execution are pure and unchanged by the migration — lock them with tests so the move didn't break them.

**Files:**
- Create: `apps/editor-web/vitest.config.ts`
- Create: `apps/editor-web/test/graphCompiler.test.ts`
- Modify: `apps/editor-web/package.json` (add `"test": "vitest run"`, add `vitest` devDep)

- [ ] **Step 1: Add Vitest config + dep**

Add to `apps/editor-web/package.json` scripts: `"test": "vitest run"`, and devDependency `"vitest": "^2.1.8"`. Run `npm install`.

Create `apps/editor-web/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';
export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, './app') } },
  test: { environment: 'node', include: ['test/**/*.test.ts'] },
});
```

- [ ] **Step 2: Write a topological-order regression test**

Inspect `apps/editor-web/app/utils/graphCompiler.ts` for the exported `graphCompiler` / `GraphCompiler` API, then create `apps/editor-web/test/graphCompiler.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { graphCompiler } from '@/utils/graphCompiler';

// Two nodes: a cube feeding an output. Execution order must place cube before output.
const nodes = [
  { id: 'cube-1', type: 'cube', position: { x: 0, y: 0 },
    data: { id: 'cube-1', type: 'cube', label: 'Cube', parameters: {}, inputConnections: {}, liveParameterValues: {} } },
  { id: 'out-1', type: 'output', position: { x: 300, y: 0 },
    data: { id: 'out-1', type: 'output', label: 'Output', parameters: {}, inputConnections: {}, liveParameterValues: {} } },
] as any;
const edges = [
  { id: 'e1', source: 'cube-1', target: 'out-1', sourceHandle: 'geometry-out', targetHandle: 'geometry-in' },
] as any;

describe('graphCompiler', () => {
  it('orders dependencies before dependents', () => {
    const compiled = graphCompiler.compileGraph(nodes, edges);
    const order = compiled.executionOrder.map((n: any) => n.id);
    expect(order.indexOf('cube-1')).toBeLessThan(order.indexOf('out-1'));
  });
});
```

Adjust method/property names (`compileGraph`, `executionOrder`) to the actual exports if they differ.

- [ ] **Step 3: Run the test**

Run: `npm test -w @geometry-script/editor-web`
Expected: PASS. (If the registry must be initialized first, import and call the registry bootstrap at the top of the test.)

- [ ] **Step 4: Commit**

```bash
git add -A apps/editor-web package-lock.json
git commit -m "test(editor-web): graph compiler topological-order regression"
```

---

## Task 15: End-to-end smoke test (Playwright)

**Files:**
- Create: `apps/editor-web/playwright.config.ts`
- Create: `apps/editor-web/tests/smoke.spec.ts`
- Modify: `apps/editor-web/package.json` (add `@playwright/test` devDep + `e2e` script)

- [ ] **Step 1: Add Playwright**

Add devDependency `"@playwright/test": "^1.49.0"` and script `"e2e": "playwright test"` to `apps/editor-web/package.json`. Run `npm install` then `npx playwright install chromium`.

Create `apps/editor-web/playwright.config.ts`:

```ts
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  use: { baseURL: 'http://localhost:5173' },
  webServer: { command: 'npm run dev', url: 'http://localhost:5173', reuseExistingServer: true },
});
```

- [ ] **Step 2: Write the smoke test**

Create `apps/editor-web/tests/smoke.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('landing page renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toContainText(/Geometry|Node/i);
});

test('editor deep-link loads (redirects to sign-in when signed out)', async ({ page }) => {
  await page.goto('/editor');
  // Signed out → Clerk redirect; the app must not 404 / white-screen.
  await expect(page).not.toHaveURL(/404/);
  await expect(page.locator('#root')).toBeAttached();
});
```

(Authenticated editor interactions — add a cube, run AI — require a Clerk test session; document them as a follow-up if a test token isn't wired. The signed-out smoke proves routing + bundle health, which is the migration's exit bar.)

- [ ] **Step 3: Run it**

Run: `npm run e2e -w @geometry-script/editor-web`
Expected: both tests PASS.

- [ ] **Step 4: Commit**

```bash
git add -A apps/editor-web package-lock.json
git commit -m "test(editor-web): Playwright smoke (landing + editor deep-link)"
```

---

## Task 16: Cleanup, docs, and final verification

**Files:**
- Modify: `README.md` (install/dev/deploy instructions)
- Modify: `apps/api/.gitignore`, `apps/editor-web/.gitignore` (`.dev.vars`, `.env`, `dist/`)
- Verify: full monorepo build + typecheck

- [ ] **Step 1: Ensure secrets/builds are gitignored**

Add to the relevant `.gitignore` files: `.dev.vars`, `.env`, `dist/`, `.wrangler/`.

- [ ] **Step 2: Update README dev/deploy section**

Replace the "Installation/Setup" section of `README.md` with the all-Cloudflare workflow:

```md
## Development

```bash
npm install
# terminal 1 — API worker (needs apps/api/.dev.vars with OPENROUTER_API_KEY + CLERK_SECRET_KEY)
npm run dev -w @geometry-script/api
# terminal 2 — editor SPA (needs apps/editor-web/.env with VITE_CLERK_PUBLISHABLE_KEY)
npm run dev -w @geometry-script/editor-web   # http://localhost:5173
```

## Deploy (Cloudflare)

```bash
npm run deploy:dev -w @geometry-script/api
npm run deploy:dev -w @geometry-script/editor-web
```
Set worker secrets once: `cd apps/api && npx wrangler secret put OPENROUTER_API_KEY && npx wrangler secret put CLERK_SECRET_KEY`.
```

- [ ] **Step 3: Confirm no orphaned Next artifacts remain**

Run: `grep -rn "next\b" apps/editor-web/package.json; ls apps/editor-web/.next 2>/dev/null; find apps -name "route.ts" -path "*api/ai*"`
Expected: no `next` dependency, no `.next` dir, no leftover Next AI route files (they now live in `apps/api`).

- [ ] **Step 4: Full monorepo typecheck + build + test**

Run: `npm run check-types`
Run: `npm run build`
Run: `npm run test`
Expected: all PASS across `agent-core`, `api`, `editor-web`.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "docs+chore: all-Cloudflare dev/deploy workflow; cleanup Next artifacts"
```

---

## Done — Exit Criteria Checklist

- [ ] Editor runs on Cloudflare (Workers Static Assets) with feature parity.
- [ ] AI generate/modify (node + scene) work through the `api` worker with streaming intact.
- [ ] Clerk auth enforced on the worker; SPA sends the session token.
- [ ] `agent-core` is Workers-safe (no THREE/registry/`process.env`).
- [ ] Vitest (agent-core + graph compiler) and Playwright smoke green.
- [ ] No new product features introduced.
- [ ] Foundation ready for **Spec B (asset system)**: the `api` worker is where R2 + D1 + asset routes land next.
