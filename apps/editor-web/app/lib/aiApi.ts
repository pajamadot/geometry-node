import { buildCatalog } from './buildCatalog';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '/api';

export type AiEndpoint = 'generate-node' | 'generate-scene' | 'modify-node' | 'modify-scene';

/**
 * POSTs to an AI endpoint on the worker with the Clerk token + live catalog,
 * returning the raw streaming Response for the caller to read as SSE.
 */
export async function postAi(
  endpoint: AiEndpoint,
  body: Record<string, unknown>,
  getToken: () => Promise<string | null>,
): Promise<Response> {
  const token = await getToken();
  return fetch(`${API_BASE}/ai/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ ...body, catalog: buildCatalog() }),
  });
}

/** Base URL for non-AI API calls (e.g. the public node catalog). */
export const apiBase = API_BASE;
