import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, desc, and } from 'drizzle-orm';
import type { Env } from '../index';
import { chatSessions as chatSessionsTable, projects as projectsTable } from '../db/schema';

export const chatSessions = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

/** Verify the caller owns the given project. Returns the project row or null. */
async function getOwnedProject(db: ReturnType<typeof drizzle>, projectId: string, userId: string) {
  const rows = await db
    .select()
    .from(projectsTable)
    .where(and(eq(projectsTable.id, projectId), eq(projectsTable.workspaceId, userId)));
  return rows[0] ?? null;
}

// GET /:projectId/sessions — list sessions for this project owned by the caller
chatSessions.get('/:projectId/sessions', async (c) => {
  const userId = c.get('userId');
  const projectId = c.req.param('projectId');
  const db = drizzle(c.env.DB);

  const rows = await db
    .select()
    .from(chatSessionsTable)
    .where(
      and(
        eq(chatSessionsTable.projectId, projectId),
        eq(chatSessionsTable.workspaceId, userId),
      ),
    )
    .orderBy(desc(chatSessionsTable.updatedAt));

  return c.json({ success: true, data: rows });
});

// POST /:projectId/sessions — create a new session under a project
chatSessions.post('/:projectId/sessions', async (c) => {
  const userId = c.get('userId');
  const projectId = c.req.param('projectId');
  const db = drizzle(c.env.DB);

  // Verify caller owns the project
  const project = await getOwnedProject(db, projectId, userId);
  if (!project) {
    return c.json({ success: false, error: { message: 'Not found' } }, 404);
  }

  const body: { title?: string } = await c.req.json<{ title?: string }>().catch(() => ({}));
  const now = Date.now();
  const row = {
    id: crypto.randomUUID(),
    projectId,
    workspaceId: userId,
    title: body.title || 'New chat',
    messageCount: 0,
    createdAt: now,
    updatedAt: now,
    lastMessageAt: null as number | null,
  };

  await db.insert(chatSessionsTable).values(row);
  return c.json({ success: true, data: row }, 201);
});

// PATCH /:projectId/sessions/:sessionId — rename a session
chatSessions.patch('/:projectId/sessions/:sessionId', async (c) => {
  const userId = c.get('userId');
  const projectId = c.req.param('projectId');
  const sessionId = c.req.param('sessionId');
  const db = drizzle(c.env.DB);

  const body: { title?: string } = await c.req.json<{ title?: string }>().catch(() => ({}));
  if (!body.title) {
    return c.json({ success: false, error: { message: 'title is required' } }, 400);
  }

  const now = Date.now();
  const updated = await db
    .update(chatSessionsTable)
    .set({ title: body.title, updatedAt: now })
    .where(
      and(
        eq(chatSessionsTable.id, sessionId),
        eq(chatSessionsTable.projectId, projectId),
        eq(chatSessionsTable.workspaceId, userId),
      ),
    )
    .returning();

  const row = updated[0];
  if (!row) {
    return c.json({ success: false, error: { message: 'Not found' } }, 404);
  }

  return c.json({ success: true, data: row });
});

// DELETE /:projectId/sessions/:sessionId — remove the D1 session index row.
// NOTE: this only deletes the D1 index entry; the Orchestrator DO's message
// history is stored separately and is NOT deleted here (acceptable for now —
// DO cleanup can be added later when the session-storage contract is finalised).
chatSessions.delete('/:projectId/sessions/:sessionId', async (c) => {
  const userId = c.get('userId');
  const projectId = c.req.param('projectId');
  const sessionId = c.req.param('sessionId');
  const db = drizzle(c.env.DB);

  const deleted = await db
    .delete(chatSessionsTable)
    .where(
      and(
        eq(chatSessionsTable.id, sessionId),
        eq(chatSessionsTable.projectId, projectId),
        eq(chatSessionsTable.workspaceId, userId),
      ),
    )
    .returning();

  if (deleted.length === 0) {
    return c.json({ success: false, error: { message: 'Not found' } }, 404);
  }

  return c.json({ success: true });
});
