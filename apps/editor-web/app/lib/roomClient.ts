'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useAgent } from 'agents/react';
import type { EditorOp, EditorSnapshot } from '@geometry-script/agent-core';
import { apiBase } from './aiApi';

/**
 * Derive the WebSocket host + protocol for the Agents (Cloudflare) Room.
 *
 * The agents/react `useAgent` hook opens a WebSocket to
 *   {protocol}://{host}/agents/editor-room/{name}
 * (prefix "agents", party = agent kebab "editor-room", room = name).
 *
 * In dev, VITE_API_BASE_URL is unset and `apiBase` is the Vite-proxied "/api".
 * A raw WebSocket cannot ride the same http proxy, so we connect directly to
 * the local api worker on localhost:8787 over `ws`.
 *
 * In prod, VITE_API_BASE_URL is e.g. https://api.geometry.pajamadot.com — we
 * use its host over `wss`.
 */
function deriveAgentEndpoint(): { host: string; protocol: 'ws' | 'wss' } {
  const apiUrl = (import.meta.env.VITE_API_BASE_URL as string) || '';
  if (apiUrl) {
    try {
      const u = new URL(apiUrl);
      return {
        host: u.host,
        protocol: u.protocol === 'https:' ? 'wss' : 'ws',
      };
    } catch {
      // fall through to dev default
    }
  }
  // Dev: SPA on :5173 proxies /api → :8787, but WS must hit the worker directly.
  return { host: 'localhost:8787', protocol: 'ws' };
}

export interface UseEditorRoomOptions {
  /** Project id = Durable Object instance name = Room `name`. */
  projectId: string | null | undefined;
  /** When false (or projectId missing) the Room is NOT connected. */
  enabled?: boolean;
}

export interface InboundSnapshot {
  snapshot: EditorSnapshot;
  /** "server" = authoritative/remote; "client" = local optimistic echo. */
  source: 'server' | 'client';
}

export interface UseEditorRoomResult {
  /** Latest snapshot delivered by the Room (state sync). */
  snapshot: EditorSnapshot | null;
  /** Last inbound update with its source, for echo-aware reconciliation. */
  inbound: InboundSnapshot | null;
  /** WebSocket connection state. */
  connected: boolean;
  /** Whether Room sync is active (projectId present + enabled). */
  active: boolean;
  /**
   * Apply ops to the Room. Records the resulting version locally so the
   * consumer can dedupe the echoed onStateUpdate. Returns the new version,
   * or null if not connected / call failed.
   */
  applyOps: (ops: EditorOp[]) => Promise<number | null>;
  /**
   * Highest version this client itself produced (via applyOps). Used by the
   * consumer to ignore inbound updates it already has applied locally.
   */
  lastLocalVersion: number;
}

/**
 * Connects the editor to its server-side Room (Cloudflare Agents SDK).
 *
 * - Mints a short-lived room token (POST /projects/:id/room-token, Bearer Clerk)
 *   and passes it as the `?token=` query param. The token function is re-run by
 *   the SDK on (re)connect; `cacheTtl` keeps it fresh below the 120s server TTL.
 * - Subscribes to state sync via `onStateUpdate(state, source)`.
 * - Exposes `applyOps` which invokes the Room's `@callable applyOps` via
 *   `agent.call('applyOps', [ops])`.
 *
 * ECHO PREVENTION: `onStateUpdate` reports `source` ("server" | "client"). We
 * also track `lastLocalVersion` (the version returned by our own applyOps) so
 * the consumer can ignore the round-tripped echo even if source is ambiguous.
 */
export function useEditorRoom({ projectId, enabled = true }: UseEditorRoomOptions): UseEditorRoomResult {
  const { getToken } = useAuth();
  const active = Boolean(projectId) && enabled;

  const [snapshot, setSnapshot] = useState<EditorSnapshot | null>(null);
  const [inbound, setInbound] = useState<InboundSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const lastLocalVersionRef = useRef(0);
  const [lastLocalVersion, setLastLocalVersion] = useState(0);

  const { host, protocol } = deriveAgentEndpoint();

  // Mint a room token on demand. Returns a QueryObject for useAgent's `query`.
  const mintToken = useCallback(async (): Promise<Record<string, string | null>> => {
    if (!projectId) return { token: null };
    try {
      const clerkToken = await getToken();
      const res = await fetch(`${apiBase}/projects/${projectId}/room-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(clerkToken ? { Authorization: `Bearer ${clerkToken}` } : {}),
        },
      });
      if (!res.ok) {
        console.error('[room] room-token request failed', res.status);
        return { token: null };
      }
      const json = (await res.json()) as { data?: { token?: string } };
      return { token: json?.data?.token ?? null };
    } catch (err) {
      console.error('[room] failed to mint room token', err);
      return { token: null };
    }
  }, [projectId, getToken]);

  const agent = useAgent<EditorSnapshot>({
    agent: 'editor-room',
    name: projectId || 'disabled',
    host,
    protocol,
    enabled: active,
    // Async query: the SDK runs this on (re)connect to attach ?token=...
    query: mintToken,
    queryDeps: [projectId],
    // Refresh well before the server's 120s token TTL.
    cacheTtl: 90_000,
    onStateUpdate: (state, source) => {
      setSnapshot(state);
      setInbound({ snapshot: state, source });
    },
    onStateUpdateError: (error) => {
      console.error('[room] state update error', error);
    },
    onOpen: () => setConnected(true),
    onClose: () => setConnected(false),
    onError: () => setConnected(false),
  });

  // Reset connection flag when sync is disabled.
  useEffect(() => {
    if (!active) {
      setConnected(false);
      setSnapshot(null);
      setInbound(null);
    }
  }, [active]);

  const applyOps = useCallback(
    async (ops: EditorOp[]): Promise<number | null> => {
      if (!active || ops.length === 0) return null;
      try {
        // Invoke the Room's @callable applyOps. Per agents client-sdk docs the
        // callable receives positional args, so wrap ops in an args array.
        const result = (await agent.call('applyOps', [ops])) as { version: number } | undefined;
        const version = result?.version ?? null;
        if (typeof version === 'number') {
          lastLocalVersionRef.current = version;
          setLastLocalVersion(version);
        }
        return version;
      } catch (err) {
        console.error('[room] applyOps failed', err);
        return null;
      }
    },
    [active, agent],
  );

  return {
    snapshot,
    inbound,
    connected,
    active,
    applyOps,
    lastLocalVersion,
  };
}
