import { Agent, callable } from 'agents';
import type { Env } from '../index';
import { applyOps as coreApplyOps } from '@geometry-script/agent-core';
import type { EditorSnapshot, EditorOp } from '@geometry-script/agent-core';

export type { RoomNode, RoomEdge } from '@geometry-script/agent-core';
export type { EditorSnapshot as EditorState };

export class EditorRoom extends Agent<Env, EditorSnapshot> {
  initialState: EditorSnapshot = { nodes: [], edges: [], version: 0 };

  @callable()
  applyOps(ops: EditorOp[]) {
    const next = coreApplyOps(this.state, ops);
    this.setState(next);
    return { version: next.version };
  }

  @callable()
  getSnapshot() {
    return this.state;
  }
}
