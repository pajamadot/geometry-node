import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull(),
  name: text('name').notNull(),
  version: integer('version').notNull().default(0),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (t) => ({ ws: index('idx_projects_ws').on(t.workspaceId) }));

export type ProjectRow = typeof projects.$inferSelect;

export const chatSessions = sqliteTable('chat_sessions', {
  id: text('id').primaryKey(),                    // sessionId (nanoid/uuid)
  projectId: text('project_id').notNull(),
  workspaceId: text('workspace_id').notNull(),    // Clerk userId (owner)
  title: text('title').notNull().default('New chat'),
  messageCount: integer('message_count').notNull().default(0),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  lastMessageAt: integer('last_message_at'),
}, (t) => ({ proj: index('idx_chat_sessions_project').on(t.projectId, t.updatedAt) }));

export type ChatSessionRow = typeof chatSessions.$inferSelect;
