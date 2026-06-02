import { Agent, callable } from 'agents';
import type { Env } from '../index';
import { applyOps as coreApplyOps } from '@geometry-script/agent-core';
import type { EditorSnapshot, EditorOp } from '@geometry-script/agent-core';

export type { RoomNode, RoomEdge } from '@geometry-script/agent-core';
export type { EditorSnapshot as EditorState };

/**
 * Small metadata bag stored alongside state to track ownership.
 * ownerId is populated by Task 5 (auth); until then it's undefined
 * and the R2 key uses '_' as the workspace placeholder.
 */
interface RoomMeta {
  ownerId?: string;
}

export class EditorRoom extends Agent<Env, EditorSnapshot> {
  initialState: EditorSnapshot = { nodes: [], edges: [], version: 0 };

  /** In-memory flag to avoid stacking debounce schedules. */
  private backupScheduled = false;

  /** In-memory meta (ownerId from Task 5 auth; not yet wired). */
  private meta: RoomMeta = {};

  @callable()
  applyOps(ops: EditorOp[]) {
    const next = coreApplyOps(this.state, ops);
    this.setState(next);

    // Debounced R2 backup: only schedule if one isn't already pending.
    if (!this.backupScheduled) {
      this.backupScheduled = true;
      // schedule(delaySeconds, methodName) — from agents@0.14.0 API.
      // The SDK invokes the named method on this class instance after the delay.
      void this.schedule(5, 'backupSnapshot');
    }

    return { version: next.version };
  }

  @callable()
  getSnapshot() {
    return this.state;
  }

  /**
   * Write the current snapshot to R2 under two keys:
   *   projects/{ownerId|_}/{projectId}/snapshots/{version}.json  (versioned)
   *   projects/{ownerId|_}/{projectId}/snapshots/latest.json     (latest)
   *
   * `this.name` is the Durable Object instance name, which equals projectId
   * because the room is routed at /agents/editor-room/{projectId}.
   *
   * ownerId is a TODO — wired in Task 5 (auth/identity).
   */
  async backupSnapshot(): Promise<void> {
    // Reset the debounce flag so subsequent edits can schedule again.
    this.backupScheduled = false;

    const ownerId = this.meta.ownerId ?? '_'; // TODO(Task 5): populate from auth
    const projectId = this.name; // Durable Object instance name = projectId
    const snapshot = this.state;
    const body = JSON.stringify(snapshot);
    const opts = { httpMetadata: { contentType: 'application/json' } };

    const versionedKey = `projects/${ownerId}/${projectId}/snapshots/${snapshot.version}.json`;
    const latestKey = `projects/${ownerId}/${projectId}/snapshots/latest.json`;

    await Promise.all([
      this.env.ASSETS.put(versionedKey, body, opts),
      this.env.ASSETS.put(latestKey, body, opts),
    ]);
  }
}
