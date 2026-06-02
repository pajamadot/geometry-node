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
