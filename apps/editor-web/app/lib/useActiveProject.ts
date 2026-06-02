'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { listProjects, createProject, getProject } from './projectsApi';

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
 * When `explicitProjectId` is provided the hook verifies/opens that specific
 * project instead of auto-resolving the default. When absent it falls back to
 * the T6 auto-default flow (GET /projects → create "Default" if empty).
 */
export function useActiveProject(explicitProjectId?: string): ActiveProjectState {
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
        let projectId: string;

        if (explicitProjectId) {
          // Explicit id supplied (from /editor/:projectId route): verify it exists.
          const project = await getProject(explicitProjectId, getToken);
          projectId = project.id;
        } else {
          // Auto-default: use newest project, or create one.
          const rows = await listProjects(getToken);
          if (rows.length > 0) {
            projectId = rows[0].id;
          } else {
            const created = await createProject('Default', getToken);
            projectId = created.id;
          }
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
  }, [isSignedIn, getToken, explicitProjectId]);

  return state;
}
