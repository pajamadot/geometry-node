'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { apiBase } from './aiApi';

interface ProjectRow {
  id: string;
  name: string;
  version: number;
}

interface ActiveProjectState {
  /** The active project id, or null while resolving / on failure. */
  projectId: string | null;
  /** True until the first resolve attempt completes. */
  loading: boolean;
  error: string | null;
}

/**
 * Ensures the signed-in user has at least one project and returns its id as the
 * active project for the editor.
 *
 *   GET /projects → if empty, POST /projects { name: "Default" }.
 *
 * This is the minimal "auto-default project" needed to make /editor Room-backed
 * end-to-end. The full multi-project picker is a later task.
 */
export function useActiveProject(): ActiveProjectState {
  const { getToken, isSignedIn } = useAuth();
  const [state, setState] = useState<ActiveProjectState>({
    projectId: null,
    loading: true,
    error: null,
  });
  // Guard against double-resolve (e.g. React StrictMode double-mount in dev),
  // which could otherwise create two "Default" projects.
  const resolvingRef = useRef(false);

  useEffect(() => {
    if (!isSignedIn) return;
    if (resolvingRef.current) return;
    resolvingRef.current = true;

    let cancelled = false;

    (async () => {
      try {
        const token = await getToken();
        const headers = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const listRes = await fetch(`${apiBase}/projects`, { headers });
        if (!listRes.ok) throw new Error(`list projects failed (${listRes.status})`);
        const listJson = (await listRes.json()) as { data?: ProjectRow[] };
        const rows = listJson?.data ?? [];

        let projectId: string;
        if (rows.length > 0) {
          projectId = rows[0].id;
        } else {
          const createRes = await fetch(`${apiBase}/projects`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ name: 'Default' }),
          });
          if (!createRes.ok) throw new Error(`create project failed (${createRes.status})`);
          const createJson = (await createRes.json()) as { data?: ProjectRow };
          if (!createJson?.data?.id) throw new Error('create project returned no id');
          projectId = createJson.data.id;
        }

        if (!cancelled) setState({ projectId, loading: false, error: null });
      } catch (err) {
        console.error('[useActiveProject] failed to resolve project', err);
        if (!cancelled) {
          setState({ projectId: null, loading: false, error: String(err) });
        }
        // Allow a retry on a later mount if it failed.
        resolvingRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, getToken]);

  return state;
}
