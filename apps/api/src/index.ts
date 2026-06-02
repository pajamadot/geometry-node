import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { routeAgentRequest } from 'agents';
import { getAvailableModels } from '@geometry-script/agent-core';
import { ai } from './routes/ai';
import { nodes } from './routes/nodes';
import { projects } from './routes/projects';
import { requireAuth } from './auth';
import { EditorRoom } from './rooms/editor-room';
import { Orchestrator } from './agents/orchestrator';

export { EditorRoom, Orchestrator };

export interface Env {
  OPENROUTER_API_KEY: string;
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;
  ALLOWED_ORIGIN: string;
  ROOM_TOKEN_SECRET: string;
  EditorRoom: DurableObjectNamespace;
  Orchestrator: DurableObjectNamespace;
  DB: D1Database;
  ASSETS: R2Bucket;
}

const app = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

app.use('*', (c, next) =>
  cors({ origin: c.env.ALLOWED_ORIGIN, allowHeaders: ['Authorization', 'Content-Type'] })(c, next),
);

app.get('/health', (c) => c.json({ ok: true, service: 'geometry-api' }));

// Public, non-sensitive endpoints (registered BEFORE auth so they stay open):
// the static model list and the node catalog, both potentially fetched pre-sign-in.
app.get('/ai/models', (c) => c.json({ success: true, data: { models: getAvailableModels() } }));

// Only AI generation requires auth (it costs money / uses user context).
app.use('/ai/*', requireAuth);

app.route('/ai', ai);
app.route('/nodes', nodes);

app.use('/projects/*', requireAuth);
app.route('/projects', projects);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const agentResponse = await routeAgentRequest(request, env);
    if (agentResponse) return agentResponse;
    return app.fetch(request, env, ctx);
  },
};
