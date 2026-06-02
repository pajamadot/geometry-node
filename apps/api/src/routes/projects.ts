import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, desc } from 'drizzle-orm';
import type { Env } from '../index';
import { projects as projectsTable } from '../db/schema';

export const projects = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

// POST /projects — create a new project
projects.post('/', async (c) => {
  const body: { name?: string } = await c.req.json<{ name?: string }>().catch(() => ({}));
  const userId = c.get('userId');
  const db = drizzle(c.env.DB);

  const now = Date.now();
  const row = {
    id: crypto.randomUUID(),
    workspaceId: userId,
    name: body.name || 'Untitled',
    version: 0,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(projectsTable).values(row);
  return c.json({ success: true, data: row });
});

// GET /projects — list all projects for current user
projects.get('/', async (c) => {
  const userId = c.get('userId');
  const db = drizzle(c.env.DB);

  const rows = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.workspaceId, userId))
    .orderBy(desc(projectsTable.updatedAt));

  return c.json({ success: true, data: rows });
});

// GET /projects/:id — get single project by id
projects.get('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const db = drizzle(c.env.DB);

  const rows = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, id));

  const row = rows[0];
  if (!row || row.workspaceId !== userId) {
    return c.json({ success: false, error: { message: 'Not found' } }, 404);
  }

  return c.json({ success: true, data: row });
});
