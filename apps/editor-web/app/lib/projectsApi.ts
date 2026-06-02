import { apiBase } from './aiApi';

export interface Project {
  id: string;
  workspaceId?: string;
  name: string;
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

type GetToken = () => Promise<string | null>;

function authHeaders(token: string | null): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function listProjects(getToken: GetToken): Promise<Project[]> {
  const token = await getToken();
  const res = await fetch(`${apiBase}/projects`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error(`list projects failed (${res.status})`);
  const json = (await res.json()) as { data?: Project[] };
  return json?.data ?? [];
}

export async function createProject(name: string, getToken: GetToken): Promise<Project> {
  const token = await getToken();
  const res = await fetch(`${apiBase}/projects`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(`create project failed (${res.status})`);
  const json = (await res.json()) as { data?: Project };
  if (!json?.data?.id) throw new Error('create project returned no id');
  return json.data;
}

export async function getProject(id: string, getToken: GetToken): Promise<Project> {
  const token = await getToken();
  const res = await fetch(`${apiBase}/projects/${id}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error(`get project failed (${res.status})`);
  const json = (await res.json()) as { data?: Project };
  if (!json?.data) throw new Error('get project returned no data');
  return json.data;
}
