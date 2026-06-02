import { Agent, callable } from 'agents';
import type { Connection, ConnectionContext } from 'agents';
import type { Env } from '../index';
import { applyOps as coreApplyOps } from '@geometry-script/agent-core';
import type { EditorSnapshot, EditorOp } from '@geometry-script/agent-core';
import { verifyRoomToken } from '../lib/room-token';

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

  /** In-memory meta (ownerId populated on first authenticated connect). */
  private meta: RoomMeta = {};

  /**
   * Called by the agents SDK when a WebSocket client connects.
   * We validate the room token here before allowing the connection.
   *
   * Token is passed as ?token=<value> in the WS upgrade URL.
   * `this.name` is the Durable Object instance name (= projectId).
   *
   * Per docs/partyserver types: close(code, reason) to reject;
   * returning normally allows the connection.
   */
  async onConnect(connection: Connection, ctx: ConnectionContext): Promise<void> {
    const url = new URL(ctx.request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      connection.close(4001, 'Missing room token');
      return;
    }

    let payload;
    try {
      payload = await verifyRoomToken(token, this.env.ROOM_TOKEN_SECRET);
    } catch {
      connection.close(4001, 'Invalid or expired room token');
      return;
    }

    if (payload.projectId !== this.name) {
      connection.close(4001, 'Token project mismatch');
      return;
    }

    // Token is valid — store the owner so R2 backups use the real workspace.
    // This resolves the Task 4 TODO: ownerId is now populated from auth.
    this.meta.ownerId = payload.userId;
  }

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
   * Cross-DO RPC entry points (Task 2).
   *
   * `@callable` above is for WebSocket clients only. When ANOTHER Durable
   * Object (the Orchestrator agent) needs to mutate this room, it holds a
   * DurableObjectStub and invokes plain public async methods directly —
   * standard Durable Object RPC. Per the Cloudflare docs, the `@callable`
   * decorator is "only required for methods called from external runtimes
   * (browsers, other services). When calling from within the same Worker
   * [Agent-to-Agent], you can use standard Durable Object RPC directly on
   * the stub without the decorator."
   *   - https://developers.cloudflare.com/agents/api-reference/callable-methods/  (#agent-to-agent-calls)
   *   - https://developers.cloudflare.com/durable-objects/best-practices/create-durable-object-stubs-and-send-requests/  (#invoke-rpc-methods)
   *
   * These intentionally mirror the @callable methods but are kept separate
   * so the WS-facing surface and the internal RPC surface can diverge (e.g.
   * Task 4 will add ownership enforcement to the RPC path).
   *
   * NOTE on broadcast: `setState()` persists AND broadcasts the new state to
   * every connected WebSocket client (source = "server" when called from
   * server code — see Agent.onStateChanged in the agents types). So an edit
   * applied here via RPC is pushed live to the editor SPA, which is the whole
   * point: the orchestrator only has to mutate the room.
   */
  async rpcApplyOps(ops: EditorOp[]): Promise<{ version: number }> {
    const next = coreApplyOps(this.state, ops);
    this.setState(next);

    // Same debounced R2 backup as the @callable path.
    if (!this.backupScheduled) {
      this.backupScheduled = true;
      void this.schedule(5, 'backupSnapshot');
    }

    return { version: next.version };
  }

  async rpcGetSnapshot(): Promise<EditorSnapshot> {
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
