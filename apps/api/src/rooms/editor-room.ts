import { Agent } from 'agents';
import type { Env } from '../index';

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

export interface EditorState {
  nodes: RoomNode[];
  edges: RoomEdge[];
  version: number;
}

export class EditorRoom extends Agent<Env, EditorState> {
  initialState: EditorState = { nodes: [], edges: [], version: 0 };
}
