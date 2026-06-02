import { Hono } from 'hono';
import type { Env } from '../index';
import { SERVER_NODE_DEFINITIONS } from '../data/serverNodes';

export const nodes = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

nodes.get('/', (c) => c.json({ success: true, data: SERVER_NODE_DEFINITIONS }));
