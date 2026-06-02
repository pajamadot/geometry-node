'use client';

/**
 * AgentChatDock — connects to the Orchestrator agent via WebSocket and
 * provides a chat interface for live scene editing, with per-session history.
 *
 * Session management:
 *   Each chat session maps to a distinct DO instance named
 *   `${projectId}:${sessionId}`.  Switching sessions changes `name` passed to
 *   `useAgent`, which causes `usePartySocket` (inside `useAgent`) to reconnect
 *   to the new instance.  `useAgentChat` is re-keyed via `id` so the SDK
 *   treats it as a fresh chat and re-fetches messages from the new DO.
 *
 *   History loading: `getInitialMessages` is left **undefined** (the default),
 *   which makes `useAgentChat` call the agent's `/get-messages` HTTP endpoint
 *   on connect to load persisted history.  Passing `null` disables this; we now
 *   omit the option entirely so the default loader runs.
 *
 * Render-loop safety (React #185):
 *   - Session loading runs in a single `useEffect` keyed on
 *     [projectId, getToken] — both stable references.
 *   - `mintToken` / `buildBody` are memoized with `useCallback`.
 *   - No `setMessages` or other unstable hook return in any effect dep array.
 *   - Switcher callbacks are all `useCallback`-memoized.
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useAgent } from 'agents/react';
import { useAgentChat } from '@cloudflare/ai-chat/react';
import {
  isTextUIPart,
  isToolUIPart,
  getToolName,
  type UIMessage,
  type UIMessagePart,
} from 'ai';
import {
  Loader2,
  Send,
  X,
  Sparkles,
  Bot,
  User,
  Wrench,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  Check,
} from 'lucide-react';
import { apiBase } from '../lib/aiApi';
import { buildCatalog } from '../lib/buildCatalog';
import {
  type ChatSession,
  listSessions,
  createSession,
  renameSession,
  deleteSession,
} from '../lib/sessionsApi';

interface AgentChatDockProps {
  projectId: string;
  open: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Host derivation (identical to roomClient.ts)
// ---------------------------------------------------------------------------

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
  // Dev: SPA on :5173 proxies /api → :8787 but WS must hit the worker directly.
  return { host: 'localhost:8787', protocol: 'ws' };
}

// ---------------------------------------------------------------------------
// Relative time helper
// ---------------------------------------------------------------------------

function relativeTime(iso?: string): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ---------------------------------------------------------------------------
// Part helpers (AI SDK v6 UIMessage parts)
// ---------------------------------------------------------------------------

type AnyPart = UIMessagePart<Record<string, unknown>, Record<string, never>>;

/** Concatenate the visible text from a message's text parts. */
function flattenText(parts: readonly AnyPart[]): string {
  return parts
    .filter(isTextUIPart)
    .map((p) => p.text)
    .join('');
}

interface ToolChip {
  key: string;
  name: string;
  running: boolean;
  errored: boolean;
}

/** Extract tool-call parts as chips. */
function toolChips(parts: readonly AnyPart[]): ToolChip[] {
  const chips: ToolChip[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!isToolUIPart(part)) continue;
    const state = (part as { state?: string }).state ?? '';
    const callId =
      (part as { toolCallId?: string }).toolCallId ?? `${part.type}-${i}`;
    chips.push({
      key: callId,
      name: getToolName(part),
      running: state === 'input-streaming' || state === 'input-available',
      errored: state === 'output-error' || state === 'output-denied',
    });
  }
  return chips;
}

// ---------------------------------------------------------------------------
// ChatMessage sub-component
// ---------------------------------------------------------------------------

function ChatMessage({
  message,
  streaming,
}: {
  message: UIMessage;
  streaming: boolean;
}) {
  const isUser = message.role === 'user';
  const parts = message.parts as readonly AnyPart[];
  const textContent = flattenText(parts);
  const chips = isUser ? [] : toolChips(parts);

  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 ${
          isUser ? 'bg-blue-600' : 'bg-purple-700'
        }`}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5 text-white" />
        ) : (
          <Bot className="w-3.5 h-3.5 text-white" />
        )}
      </div>

      <div
        className={`flex flex-col gap-1 max-w-[82%] ${isUser ? 'items-end' : 'items-start'}`}
      >
        {/* Tool-activity chips (assistant messages only) */}
        {!isUser && chips.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {chips.map((chip) => (
              <span
                key={chip.key}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono border ${
                  chip.running
                    ? 'bg-amber-900/40 border-amber-500/50 text-amber-300'
                    : chip.errored
                      ? 'bg-red-900/40 border-red-500/50 text-red-300'
                      : 'bg-green-900/40 border-green-500/50 text-green-300'
                }`}
                title={chip.name}
              >
                <Wrench className="w-2.5 h-2.5" />
                {chip.name}
                {chip.running ? '…' : ''}
              </span>
            ))}
          </div>
        )}

        {/* Text bubble */}
        {(textContent || streaming) && (
          <div
            className={`px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
              isUser
                ? 'bg-blue-600 text-white rounded-tr-sm'
                : 'bg-gray-800 text-gray-100 rounded-tl-sm border border-gray-700'
            }`}
          >
            {textContent}
            {streaming && !textContent && (
              <span className="inline-flex gap-1 items-center text-gray-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-xs">thinking…</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SessionSwitcher sub-component
// ---------------------------------------------------------------------------

interface SessionSwitcherProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelect: (sessionId: string) => void;
  onNew: () => void;
  onRename: (sessionId: string, newTitle: string) => void;
  onDelete: (sessionId: string) => void;
  loading: boolean;
}

function SessionSwitcher({
  sessions,
  activeSessionId,
  onSelect,
  onNew,
  onRename,
  onDelete,
  loading,
}: SessionSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
        setRenamingId(null);
        setConfirmDeleteId(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Focus rename input when it appears
  useEffect(() => {
    if (renamingId) renameInputRef.current?.focus();
  }, [renamingId]);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const displayTitle = activeSession?.title || 'New chat';

  function startRename(session: ChatSession) {
    setRenamingId(session.id);
    setRenameValue(session.title || '');
    setConfirmDeleteId(null);
  }

  function commitRename(sessionId: string) {
    const trimmed = renameValue.trim();
    if (trimmed) onRename(sessionId, trimmed);
    setRenamingId(null);
  }

  function handleRenameKey(
    e: React.KeyboardEvent<HTMLInputElement>,
    sessionId: string,
  ) {
    if (e.key === 'Enter') commitRename(sessionId);
    if (e.key === 'Escape') setRenamingId(null);
  }

  function handleDelete(sessionId: string) {
    if (confirmDeleteId === sessionId) {
      onDelete(sessionId);
      setConfirmDeleteId(null);
      setOpen(false);
    } else {
      setConfirmDeleteId(sessionId);
    }
  }

  return (
    <div className="relative" ref={popoverRef}>
      {/* Trigger button: shows active session title */}
      <button
        onClick={() => {
          setOpen((v) => !v);
          setRenamingId(null);
          setConfirmDeleteId(null);
        }}
        className="flex items-center gap-1 max-w-[140px] px-2 py-1 rounded text-xs text-gray-300 hover:text-white hover:bg-gray-700/60 transition-colors truncate"
        title={displayTitle}
      >
        <span className="truncate">{loading ? '…' : displayTitle}</span>
        <ChevronDown className="w-3 h-3 flex-shrink-0 text-gray-500" />
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute left-0 top-full mt-1 w-64 bg-gray-850 border border-gray-700 rounded-lg shadow-xl z-[80] overflow-hidden"
          style={{ backgroundColor: '#131620' }}>
          {/* New chat */}
          <button
            onClick={() => { onNew(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-purple-300 hover:bg-gray-700/60 transition-colors border-b border-gray-700/60"
          >
            <Plus className="w-3.5 h-3.5" />
            New chat
          </button>

          {/* Session list */}
          <div className="max-h-60 overflow-y-auto">
            {sessions.length === 0 && (
              <p className="px-3 py-3 text-xs text-gray-500 text-center">No sessions yet</p>
            )}
            {sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isRenaming = renamingId === session.id;
              const isConfirmingDelete = confirmDeleteId === session.id;

              return (
                <div
                  key={session.id}
                  className={`flex items-center gap-1 px-2 py-1.5 group hover:bg-gray-700/40 transition-colors ${
                    isActive ? 'bg-gray-700/30' : ''
                  }`}
                >
                  {isRenaming ? (
                    <div className="flex-1 flex items-center gap-1">
                      <input
                        ref={renameInputRef}
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => handleRenameKey(e, session.id)}
                        onBlur={() => commitRename(session.id)}
                        className="flex-1 bg-gray-700 text-white text-xs rounded px-2 py-0.5 border border-purple-500/60 focus:outline-none"
                        maxLength={80}
                      />
                      <button
                        onMouseDown={() => commitRename(session.id)}
                        className="text-green-400 hover:text-green-300 p-0.5"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => { onSelect(session.id); setOpen(false); }}
                        className="flex-1 text-left min-w-0"
                      >
                        <p className={`text-xs truncate ${isActive ? 'text-white font-medium' : 'text-gray-300'}`}>
                          {session.title || 'Untitled chat'}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {relativeTime(session.lastMessageAt || session.updatedAt)}
                          {session.messageCount ? ` · ${session.messageCount} msg` : ''}
                        </p>
                      </button>

                      {/* Actions (visible on hover or active) */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); startRename(session); }}
                          className="p-1 text-gray-400 hover:text-white rounded transition-colors"
                          title="Rename"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(session.id); }}
                          className={`p-1 rounded transition-colors ${
                            isConfirmingDelete
                              ? 'text-red-400 hover:text-red-300'
                              : 'text-gray-400 hover:text-red-400'
                          }`}
                          title={isConfirmingDelete ? 'Click again to confirm delete' : 'Delete'}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AgentChatDock
// ---------------------------------------------------------------------------

export function AgentChatDock({ projectId, open, onClose }: AgentChatDockProps) {
  const { getToken } = useAuth();
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // --- Session state ---
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const { host, protocol } = deriveAgentEndpoint();

  /**
   * Load sessions on open. If none exist, auto-create one.
   * Deps: [projectId, getToken] — both stable refs, no loop risk.
   */
  useEffect(() => {
    if (!open || !projectId) return;

    let cancelled = false;
    setSessionsLoading(true);

    async function load() {
      try {
        let list = await listSessions(projectId, getToken);
        if (cancelled) return;

        if (list.length === 0) {
          const fresh = await createSession(projectId, undefined, getToken);
          if (cancelled) return;
          list = [fresh];
        }

        setSessions(list);
        // Default to the most recent session (list is newest-first from API)
        setActiveSessionId((prev) => prev ?? list[0].id);
      } catch (err) {
        console.error('[agent-chat] failed to load sessions', err);
      } finally {
        if (!cancelled) setSessionsLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, projectId]); // getToken is stable from Clerk; intentionally omitted to avoid churn

  // The DO instance name is scoped per session.
  // Changing activeSessionId changes `name`, which causes useAgent/usePartySocket
  // to close the old WS and open a new one to the correct DO instance.
  const agentName = activeSessionId
    ? `${projectId}:${activeSessionId}`
    : (projectId || 'disabled');

  /**
   * Mint a room-token for the orchestrator connection.
   * The room-token is project-scoped (sessionId is not in the token);
   * the orchestrator validates the projectId segment of the DO name.
   * Memoized on [projectId, getToken] — stable, no reconnect churn.
   */
  const mintToken = useCallback(
    async (): Promise<Record<string, string | null>> => {
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
          console.error('[agent-chat] room-token request failed', res.status);
          return { token: null };
        }
        const json = (await res.json()) as { data?: { token?: string } };
        return { token: json?.data?.token ?? null };
      } catch (err) {
        console.error('[agent-chat] failed to mint token', err);
        return { token: null };
      }
    },
    [projectId, getToken],
  );

  /**
   * Per-turn body fields the server reads via `ctx.body`.
   */
  const buildBody = useCallback(
    () => ({ projectId, catalog: buildCatalog() }),
    [projectId],
  );

  /**
   * useAgent opens a persistent WebSocket to:
   *   {protocol}://{host}/agents/orchestrator/{projectId}:{sessionId}
   *
   * When `name` (agentName) changes — i.e. session switches — usePartySocket
   * inside useAgent tears down the old socket and opens a new one.
   *
   * queryDeps includes agentName so a fresh token is minted for each new
   * session connection (same project token is valid, but we re-mint to be safe
   * with TTL — the token is project-scoped so the server accepts it for any
   * session under that project).
   */
  const agent = useAgent({
    agent: 'orchestrator',
    name: agentName,
    host,
    protocol,
    enabled: open && Boolean(projectId) && Boolean(activeSessionId),
    query: mintToken,
    queryDeps: [agentName],
    cacheTtl: 90_000,
    onOpen: () => setConnected(true),
    onClose: () => setConnected(false),
    onError: () => setConnected(false),
  });

  /**
   * Official chat hook. `id` is session-scoped so the hook re-initialises its
   * internal message state when the session changes.
   *
   * `getInitialMessages` is **not passed** (undefined = default), which causes
   * the hook to call the agent's /get-messages HTTP endpoint on connect to load
   * persisted history from the DO's Think storage.  Passing `null` would
   * disable history loading — we must NOT do that here.
   */
  const chat = useAgentChat<unknown, UIMessage>({
    agent,
    id: agentName,
    // getInitialMessages intentionally omitted → default loader fetches history
    body: buildBody,
  });

  const { messages, sendMessage, status } = chat;
  const busy = status === 'submitted' || status === 'streaming' || chat.isStreaming;

  // Auto-scroll to bottom when messages change.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  // Reset connection state when the session changes so the dot doesn't stay
  // green momentarily after reconnect begins.
  useEffect(() => {
    setConnected(false);
  }, [agentName]);

  // -------------------------------------------------------------------------
  // Session management callbacks
  // -------------------------------------------------------------------------

  const handleNewSession = useCallback(async () => {
    try {
      const session = await createSession(projectId, undefined, getToken);
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.id);
    } catch (err) {
      console.error('[agent-chat] failed to create session', err);
    }
  }, [projectId, getToken]);

  const handleSelectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
  }, []);

  const handleRenameSession = useCallback(
    async (sessionId: string, title: string) => {
      try {
        const updated = await renameSession(projectId, sessionId, title, getToken);
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, title: updated.title } : s)),
        );
      } catch (err) {
        console.error('[agent-chat] failed to rename session', err);
      }
    },
    [projectId, getToken],
  );

  const handleDeleteSession = useCallback(
    async (sessionId: string) => {
      try {
        await deleteSession(projectId, sessionId, getToken);
        setSessions((prev) => {
          const remaining = prev.filter((s) => s.id !== sessionId);
          // If we deleted the active session, switch to another or create one
          if (activeSessionId === sessionId) {
            if (remaining.length > 0) {
              setActiveSessionId(remaining[0].id);
            } else {
              // Create a fresh session asynchronously
              void createSession(projectId, undefined, getToken).then((fresh) => {
                setSessions([fresh]);
                setActiveSessionId(fresh.id);
              });
            }
          }
          return remaining;
        });
      } catch (err) {
        console.error('[agent-chat] failed to delete session', err);
      }
    },
    [projectId, getToken, activeSessionId],
  );

  // -------------------------------------------------------------------------
  // Send a message turn
  // -------------------------------------------------------------------------

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || busy || !connected) return;
    setInput('');
    void sendMessage({ text });
  }, [input, busy, connected, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (!open) return null;
  if (!projectId) return null;

  const lastIsAssistant =
    messages.length > 0 && messages[messages.length - 1].role === 'assistant';
  const waitingForReply = busy && !lastIsAssistant;

  return (
    <div className="fixed right-4 bottom-20 w-96 h-[580px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-[70] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
          <span className="text-white font-semibold text-sm flex-shrink-0">Agent</span>
          <span
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${connected ? 'bg-green-400' : 'bg-gray-600'}`}
            title={connected ? 'Connected' : 'Connecting…'}
          />
          {/* Session switcher */}
          <SessionSwitcher
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelect={handleSelectSession}
            onNew={() => void handleNewSession()}
            onRename={(id, title) => void handleRenameSession(id, title)}
            onDelete={(id) => void handleDeleteSession(id)}
            loading={sessionsLoading}
          />
          {busy && <Loader2 className="w-3 h-3 text-purple-400 animate-spin flex-shrink-0" />}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-1 rounded flex-shrink-0"
          aria-label="Close agent chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Message list */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0"
      >
        {messages.length === 0 && !busy && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-10">
            <div className="w-12 h-12 rounded-full bg-purple-900/40 border border-purple-700/50 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300 font-medium">Geometry Agent</p>
              <p className="text-xs text-gray-500 mt-1 max-w-56">
                Describe what you want to build and I&apos;ll edit your scene in real time.
              </p>
            </div>
          </div>
        )}
        {messages.map((msg, idx) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            streaming={
              busy &&
              msg.role === 'assistant' &&
              idx === messages.length - 1
            }
          />
        ))}
        {/* Spinner while waiting for the first assistant chunk */}
        {waitingForReply && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-purple-700 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="px-3 py-2 rounded-xl bg-gray-800 border border-gray-700">
              <Loader2 className="w-3 h-3 text-gray-400 animate-spin" />
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="px-3 py-3 border-t border-gray-700 flex-shrink-0">
        {!connected && (
          <p className="text-xs text-amber-400 mb-2 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Connecting to agent…
          </p>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              connected
                ? 'Ask the agent to edit your scene…'
                : 'Waiting for connection…'
            }
            disabled={!connected || busy}
            rows={2}
            className="flex-1 bg-gray-800 text-white text-sm rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none px-3 py-2 resize-none placeholder-gray-500 disabled:opacity-50 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !connected || busy}
            className="flex-shrink-0 w-9 h-9 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            aria-label="Send message"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
