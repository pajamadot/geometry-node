import { apiBase } from './aiApi';

export interface ChatSession {
  id: string;
  projectId: string;
  workspaceId?: string;
  title?: string;
  messageCount?: number;
  createdAt?: string;
  updatedAt?: string;
  lastMessageAt?: string;
}

type GetToken = () => Promise<string | null>;

function authHeaders(token: string | null): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function listSessions(
  projectId: string,
  getToken: GetToken,
): Promise<ChatSession[]> {
  const token = await getToken();
  const res = await fetch(`${apiBase}/projects/${projectId}/sessions`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`list sessions failed (${res.status})`);
  const json = (await res.json()) as { data?: ChatSession[] };
  return json?.data ?? [];
}

export async function createSession(
  projectId: string,
  title: string | undefined,
  getToken: GetToken,
): Promise<ChatSession> {
  const token = await getToken();
  const res = await fetch(`${apiBase}/projects/${projectId}/sessions`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(title ? { title } : {}),
  });
  if (!res.ok) throw new Error(`create session failed (${res.status})`);
  const json = (await res.json()) as { data?: ChatSession };
  if (!json?.data?.id) throw new Error('create session returned no id');
  return json.data;
}

export async function renameSession(
  projectId: string,
  sessionId: string,
  title: string,
  getToken: GetToken,
): Promise<ChatSession> {
  const token = await getToken();
  const res = await fetch(
    `${apiBase}/projects/${projectId}/sessions/${sessionId}`,
    {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify({ title }),
    },
  );
  if (!res.ok) throw new Error(`rename session failed (${res.status})`);
  const json = (await res.json()) as { data?: ChatSession };
  if (!json?.data) throw new Error('rename session returned no data');
  return json.data;
}

export async function deleteSession(
  projectId: string,
  sessionId: string,
  getToken: GetToken,
): Promise<void> {
  const token = await getToken();
  const res = await fetch(
    `${apiBase}/projects/${projectId}/sessions/${sessionId}`,
    {
      method: 'DELETE',
      headers: authHeaders(token),
    },
  );
  if (!res.ok) throw new Error(`delete session failed (${res.status})`);
}
