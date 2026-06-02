export interface RoomNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface RoomEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface EditorSnapshot {
  nodes: RoomNode[];
  edges: RoomEdge[];
  version: number;
}

export type EditorOp =
  | {
      op: 'add-node';
      opId: string;
      payload: { node: RoomNode };
    }
  | {
      op: 'update-node';
      opId: string;
      payload: {
        id: string;
        data?: Record<string, unknown>;
        position?: { x: number; y: number };
        type?: string;
      };
    }
  | {
      op: 'remove-node';
      opId: string;
      payload: { id: string };
    }
  | {
      op: 'add-edge';
      opId: string;
      payload: { edge: RoomEdge };
    }
  | {
      op: 'remove-edge';
      opId: string;
      payload: { id: string };
    }
  | {
      op: 'register-node-def';
      opId: string;
      payload: { def: unknown };
    }
  | {
      op: 'replace-graph';
      opId: string;
      payload: { nodes: RoomNode[]; edges: RoomEdge[] };
    };

export function applyOp(snapshot: EditorSnapshot, op: EditorOp): EditorSnapshot {
  const version = snapshot.version + 1;

  switch (op.op) {
    case 'add-node': {
      const { node } = op.payload;
      const exists = snapshot.nodes.some(n => n.id === node.id);
      const nodes = exists
        ? snapshot.nodes.map(n => (n.id === node.id ? { ...node } : n))
        : [...snapshot.nodes, { ...node }];
      return { ...snapshot, nodes, version };
    }

    case 'update-node': {
      const { id, data, position, type } = op.payload;
      const nodes = snapshot.nodes.map(n => {
        if (n.id !== id) return n;
        return {
          ...n,
          ...(type !== undefined ? { type } : {}),
          ...(position !== undefined ? { position } : {}),
          ...(data !== undefined ? { data: { ...n.data, ...data } } : {}),
        };
      });
      return { ...snapshot, nodes, version };
    }

    case 'remove-node': {
      const { id } = op.payload;
      const nodes = snapshot.nodes.filter(n => n.id !== id);
      const edges = snapshot.edges.filter(e => e.source !== id && e.target !== id);
      return { ...snapshot, nodes, edges, version };
    }

    case 'add-edge': {
      const { edge } = op.payload;
      const exists = snapshot.edges.some(e => e.id === edge.id);
      const edges = exists
        ? snapshot.edges.map(e => (e.id === edge.id ? { ...edge } : e))
        : [...snapshot.edges, { ...edge }];
      return { ...snapshot, edges, version };
    }

    case 'remove-edge': {
      const { id } = op.payload;
      const edges = snapshot.edges.filter(e => e.id !== id);
      return { ...snapshot, edges, version };
    }

    case 'register-node-def': {
      // No graph change; clients handle registration
      return { ...snapshot, version };
    }

    case 'replace-graph': {
      const { nodes, edges } = op.payload;
      return { nodes: [...nodes], edges: [...edges], version };
    }
  }
}

export function applyOps(snapshot: EditorSnapshot, ops: EditorOp[]): EditorSnapshot {
  return ops.reduce((s, op) => applyOp(s, op), snapshot);
}
