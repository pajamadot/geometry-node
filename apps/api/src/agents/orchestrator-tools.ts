import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { getAgentByName } from 'agents';
import type { EditorOp, EditorSnapshot, RoomNode, RoomEdge } from '@geometry-script/agent-core';
import type { Env } from '../index';

/**
 * Per-turn context the orchestrator captures from the chat request body
 * (see Orchestrator.beforeTurn). The chat client (Task 3) sends
 * `{ projectId, catalog }` in the request body; Think surfaces it as
 * `TurnContext.body` to the `beforeTurn` hook
 * (https://developers.cloudflare.com/agents/api-reference/think/ — "Custom
 * body fields from the client request").
 *
 * - `projectId`  : EditorRoom Durable Object instance name (room = projectId).
 * - `catalog`    : a JSON string describing the node types available in the
 *                  editor. Used to validate `add_node` so the model can't
 *                  invent unknown node types.
 */
export interface TurnContext {
  projectId?: string;
  catalog?: string;
}

export interface OrchestratorToolsCtx {
  env: Env;
  /** Returns the current per-turn context (projectId + catalog). */
  getContext: () => TurnContext | undefined;
}

/** Default position used when the model omits one. */
const DEFAULT_POSITION = { x: 250, y: 150 };
/** Default ReactFlow handle names — geometry is the dominant flow in the editor. */
const DEFAULT_SOURCE_HANDLE = 'geometry-out';
const DEFAULT_TARGET_HANDLE = 'geometry-in';

/**
 * Resolve the EditorRoom stub for the current turn's project and assert the
 * turn carries a projectId.
 *
 * SECURITY SEAM (Task 4): projectId currently comes straight from the chat
 * request body. Task 4 will bind projectId to the authenticated user's token
 * and must verify the caller OWNS this project before any room mutation. The
 * single choke point for that check is here — every tool routes through
 * `resolveRoom`, so adding the ownership assertion in one place covers them all.
 */
async function resolveRoom(ctx: OrchestratorToolsCtx) {
  const turn = ctx.getContext();
  const projectId = turn?.projectId;
  if (!projectId) {
    return {
      ok: false as const,
      error:
        'No projectId in turn context — the chat client must send { projectId } in the request body.',
    };
  }
  // TODO(Task 4): assert the authenticated user owns `projectId` before returning a stub.
  const stub = await getAgentByName(ctx.env.EditorRoom, projectId);
  return { ok: true as const, projectId, stub };
}

/**
 * Best-effort extraction of the set of known node-type strings from the catalog
 * JSON string. The catalog shape is owned by the chat client (Task 3); accept a
 * few plausible shapes and fail open (empty set) so validation never blocks
 * legitimate edits just because the catalog wasn't provided/parseable.
 */
function parseCatalogTypes(catalog: string | undefined): Set<string> {
  const types = new Set<string>();
  if (!catalog) return types;
  let parsed: unknown;
  try {
    parsed = JSON.parse(catalog);
  } catch {
    return types;
  }
  const collect = (entry: unknown) => {
    if (typeof entry === 'string') {
      types.add(entry);
    } else if (entry && typeof entry === 'object') {
      const rec = entry as Record<string, unknown>;
      const t = rec.type ?? rec.id ?? rec.name;
      if (typeof t === 'string') types.add(t);
    }
  };
  if (Array.isArray(parsed)) {
    parsed.forEach(collect);
  } else if (parsed && typeof parsed === 'object') {
    const rec = parsed as Record<string, unknown>;
    const arr = (rec.nodes ?? rec.types ?? rec.definitions) as unknown;
    if (Array.isArray(arr)) {
      arr.forEach(collect);
    } else {
      // Map keyed by type, e.g. { cube: {...}, sphere: {...} }
      Object.keys(rec).forEach((k) => types.add(k));
    }
  }
  return types;
}

/** Cheap fuzzy match: substring + shared-prefix scoring for "did you mean" hints. */
function closeMatches(needle: string, haystack: Set<string>, limit = 5): string[] {
  const n = needle.toLowerCase();
  return [...haystack]
    .map((t) => {
      const lt = t.toLowerCase();
      let score = 0;
      if (lt === n) score = 100;
      else if (lt.includes(n) || n.includes(lt)) score = 50;
      else {
        let i = 0;
        while (i < lt.length && i < n.length && lt[i] === n[i]) i++;
        score = i;
      }
      return { t, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.t);
}

/** Build the canonical editor node `data` bag for a freshly-added node. */
function buildNodeData(
  id: string,
  type: string,
  params: Record<string, unknown> | undefined,
  label?: string,
): Record<string, unknown> {
  // Matches the editor's node data convention used throughout agent-core
  // (see packages/agent-core/src/contextBuilders.ts example scenes):
  //   { id, type, label, parameters, inputConnections, liveParameterValues }
  return {
    id,
    type,
    label: label ?? type,
    parameters: params ?? {},
    inputConnections: {},
    liveParameterValues: {},
  };
}

/** Concise summary of the snapshot so the model sees state without huge blobs. */
function summarizeSnapshot(snap: EditorSnapshot) {
  return {
    version: snap.version,
    nodeCount: snap.nodes.length,
    edgeCount: snap.edges.length,
    nodes: snap.nodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: n.position,
      params: (n.data as Record<string, unknown>)?.parameters ?? {},
    })),
    edges: snap.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
    })),
  };
}

/**
 * Create the tool set the Orchestrator hands to the model. Every mutating tool
 * builds `EditorOp[]` (each op gets a fresh `opId`), applies them to the
 * project's EditorRoom via DO RPC (`stub.rpcApplyOps`), and returns a concise
 * JSON result so the model can chain edits.
 */
export function createOrchestratorTools(ctx: OrchestratorToolsCtx): ToolSet {
  return {
    read_scene: tool({
      description:
        'Read the current scene graph for the active project. Returns nodes (id, type, position, params) and edges. Call this before editing when you need to know what already exists.',
      inputSchema: z.object({}),
      execute: async () => {
        const room = await resolveRoom(ctx);
        if (!room.ok) return room;
        const snap = await room.stub.rpcGetSnapshot();
        return { ok: true, scene: summarizeSnapshot(snap) };
      },
    }),

    add_node: tool({
      description:
        'Add a geometry-node to the scene. `type` MUST be a node type from the provided catalog. Returns the generated nodeId so you can connect it.',
      inputSchema: z.object({
        type: z.string().describe('Node type, e.g. "cube", "standard-material", "output".'),
        position: z
          .object({ x: z.number(), y: z.number() })
          .optional()
          .describe('Canvas position; defaults to a sensible spot if omitted.'),
        params: z
          .record(z.string(), z.unknown())
          .optional()
          .describe('Initial node parameter values (the node\'s "parameters").'),
        label: z.string().optional().describe('Human-friendly label; defaults to the type.'),
      }),
      execute: async ({ type, position, params, label }) => {
        const room = await resolveRoom(ctx);
        if (!room.ok) return room;

        const known = parseCatalogTypes(ctx.getContext()?.catalog);
        if (known.size > 0 && !known.has(type)) {
          return {
            ok: false,
            error: `Unknown node type "${type}". Use only node types from the catalog.`,
            hint: closeMatches(type, known),
          };
        }

        const nodeId = crypto.randomUUID();
        const node: RoomNode = {
          id: nodeId,
          type,
          position: position ?? DEFAULT_POSITION,
          data: buildNodeData(nodeId, type, params, label),
        };
        const ops: EditorOp[] = [
          { op: 'add-node', opId: crypto.randomUUID(), payload: { node } },
        ];
        const { version } = await room.stub.rpcApplyOps(ops);
        return { ok: true, version, nodeId };
      },
    }),

    update_node: tool({
      description:
        'Update an existing node\'s parameters and/or position. Params are merged into the node\'s existing parameters.',
      inputSchema: z.object({
        id: z.string().describe('The node id to update.'),
        params: z
          .record(z.string(), z.unknown())
          .optional()
          .describe('Parameter values to merge into the node\'s "parameters".'),
        position: z.object({ x: z.number(), y: z.number() }).optional(),
      }),
      execute: async ({ id, params, position }) => {
        const room = await resolveRoom(ctx);
        if (!room.ok) return room;
        if (!params && !position) {
          return { ok: false, error: 'Provide at least one of params or position.' };
        }
        const ops: EditorOp[] = [
          {
            op: 'update-node',
            opId: crypto.randomUUID(),
            payload: {
              id,
              // The reducer merges `data` shallowly; we nest under `parameters`
              // to match the editor node data convention.
              ...(params ? { data: { parameters: params } } : {}),
              ...(position ? { position } : {}),
            },
          },
        ];
        const { version } = await room.stub.rpcApplyOps(ops);
        return { ok: true, version, nodeId: id };
      },
    }),

    remove_node: tool({
      description:
        'Remove a node from the scene. Edges touching the node are removed automatically.',
      inputSchema: z.object({ id: z.string().describe('The node id to remove.') }),
      execute: async ({ id }) => {
        const room = await resolveRoom(ctx);
        if (!room.ok) return room;
        const ops: EditorOp[] = [
          { op: 'remove-node', opId: crypto.randomUUID(), payload: { id } },
        ];
        const { version } = await room.stub.rpcApplyOps(ops);
        return { ok: true, version, nodeId: id };
      },
    }),

    connect_nodes: tool({
      description:
        'Connect two nodes with an edge. Handles default to geometry-out -> geometry-in; pass sourceHandle/targetHandle for other flows (e.g. material-out -> material-in, time-out -> rotation-in).',
      inputSchema: z.object({
        source: z.string().describe('Source node id.'),
        target: z.string().describe('Target node id.'),
        sourceHandle: z.string().optional().describe('Defaults to "geometry-out".'),
        targetHandle: z.string().optional().describe('Defaults to "geometry-in".'),
      }),
      execute: async ({ source, target, sourceHandle, targetHandle }) => {
        const room = await resolveRoom(ctx);
        if (!room.ok) return room;
        const edgeId = crypto.randomUUID();
        const edge: RoomEdge = {
          id: edgeId,
          source,
          target,
          sourceHandle: sourceHandle ?? DEFAULT_SOURCE_HANDLE,
          targetHandle: targetHandle ?? DEFAULT_TARGET_HANDLE,
        };
        const ops: EditorOp[] = [
          { op: 'add-edge', opId: crypto.randomUUID(), payload: { edge } },
        ];
        const { version } = await room.stub.rpcApplyOps(ops);
        return { ok: true, version, edgeId };
      },
    }),

    disconnect: tool({
      description: 'Remove an edge by its id.',
      inputSchema: z.object({ edgeId: z.string().describe('The edge id to remove.') }),
      execute: async ({ edgeId }) => {
        const room = await resolveRoom(ctx);
        if (!room.ok) return room;
        const ops: EditorOp[] = [
          { op: 'remove-edge', opId: crypto.randomUUID(), payload: { id: edgeId } },
        ];
        const { version } = await room.stub.rpcApplyOps(ops);
        return { ok: true, version, edgeId };
      },
    }),

    register_node_def: tool({
      description:
        'Register a new custom node definition (a JsonNodeDefinition) so the editor can use it. Use this only when authoring a brand-new node type that is not in the catalog.',
      inputSchema: z.object({
        def: z
          .record(z.string(), z.unknown())
          .describe('A JsonNodeDefinition object describing the custom node.'),
      }),
      execute: async ({ def }) => {
        const room = await resolveRoom(ctx);
        if (!room.ok) return room;
        const ops: EditorOp[] = [
          { op: 'register-node-def', opId: crypto.randomUUID(), payload: { def } },
        ];
        const { version } = await room.stub.rpcApplyOps(ops);
        return { ok: true, version };
      },
    }),

    replace_graph: tool({
      description:
        'Replace the ENTIRE scene graph with the provided nodes and edges. Use for full-scene generation. Each node needs { id, type, position, data } and each edge { id, source, target, sourceHandle, targetHandle }.',
      inputSchema: z.object({
        nodes: z.array(
          z.object({
            id: z.string(),
            type: z.string(),
            position: z.object({ x: z.number(), y: z.number() }),
            data: z.record(z.string(), z.unknown()),
          }),
        ),
        edges: z.array(
          z.object({
            id: z.string(),
            source: z.string(),
            target: z.string(),
            sourceHandle: z.string().optional(),
            targetHandle: z.string().optional(),
          }),
        ),
      }),
      execute: async ({ nodes, edges }) => {
        const room = await resolveRoom(ctx);
        if (!room.ok) return room;
        const ops: EditorOp[] = [
          {
            op: 'replace-graph',
            opId: crypto.randomUUID(),
            payload: {
              nodes: nodes as RoomNode[],
              edges: edges as RoomEdge[],
            },
          },
        ];
        const { version } = await room.stub.rpcApplyOps(ops);
        return { ok: true, version, nodeCount: nodes.length, edgeCount: edges.length };
      },
    }),
  };
}
