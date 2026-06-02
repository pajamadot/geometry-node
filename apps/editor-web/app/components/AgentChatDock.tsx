'use client';

/**
 * AgentChatDock — connects to the Orchestrator agent via WebSocket and
 * provides a chat interface for live scene editing.
 *
 * Uses the OFFICIAL chat hook (`useAgentChat` from `@cloudflare/ai-chat/react`)
 * on top of the raw `useAgent` connection. This replaces the previous
 * hand-rolled `cf_agent_*` wire protocol (which never produced a reply and
 * caused a reconnect loop in production).
 *
 * How the per-turn context reaches the server:
 *   `useAgentChat({ body })` sends the returned record fields as extra keys in
 *   the chat request body. @cloudflare/think destructures
 *   `const { messages, clientTools, trigger, ...customBody } = body` and exposes
 *   `customBody` as `ctx.body` in `beforeTurn`. So `{ projectId, catalog }`
 *   below land at `ctx.body.projectId` / `ctx.body.catalog` exactly where
 *   `Orchestrator.beforeTurn` reads them. (projectId is also re-derived from the
 *   room token server-side for security; catalog is taken from the body.)
 *
 * Connection auth: `useAgent({ query })` mints a short-lived room token and
 * attaches it as `?token=` on the WS upgrade, which `Orchestrator.onConnect`
 * validates. `query` (mintToken) is memoized so the socket does NOT reconnect
 * on every render.
 *
 * The editor reflects scene edits via C1 Room sync (separate connection); this
 * dock only handles the conversation.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { Loader2, Send, X, Sparkles, Bot, User, Wrench } from 'lucide-react';
import { apiBase } from '../lib/aiApi';
import { buildCatalog } from '../lib/buildCatalog';

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

/** Extract tool-call parts (static `tool-<name>` and `dynamic-tool`) as chips. */
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
// AgentChatDock
// ---------------------------------------------------------------------------

export function AgentChatDock({ projectId, open, onClose }: AgentChatDockProps) {
  const { getToken } = useAuth();
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { host, protocol } = deriveAgentEndpoint();

  /**
   * Mint a room-token for the orchestrator connection. Mirrors roomClient.ts
   * exactly (same endpoint, same format). Memoized on [projectId, getToken] so
   * the WebSocket does NOT reconnect on every render — this stable identity
   * (plus `queryDeps: [projectId]`) is what stops the reconnect loop.
   */
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
        console.error('[agent-chat] room-token request failed', res.status);
        return { token: null };
      }
      const json = (await res.json()) as { data?: { token?: string } };
      return { token: json?.data?.token ?? null };
    } catch (err) {
      console.error('[agent-chat] failed to mint token', err);
      return { token: null };
    }
  }, [projectId, getToken]);

  /**
   * Per-turn body fields the server reads via `ctx.body`. Stable callback so the
   * chat hook does not churn. `buildCatalog()` is evaluated lazily on each send.
   */
  const buildBody = useCallback(
    () => ({ projectId, catalog: buildCatalog() }),
    [projectId],
  );

  /**
   * useAgent opens a persistent WebSocket to
   *   {protocol}://{host}/agents/orchestrator/{projectId}
   * One orchestrator instance per project (name = projectId).
   */
  const agent = useAgent({
    agent: 'orchestrator',
    name: projectId || 'disabled',
    host,
    protocol,
    enabled: open && Boolean(projectId),
    query: mintToken,
    queryDeps: [projectId],
    // Refresh well before the server's 120s token TTL.
    cacheTtl: 90_000,
    onOpen: () => setConnected(true),
    onClose: () => setConnected(false),
    onError: () => setConnected(false),
  });

  /**
   * Official chat hook. Drives the standard agents chat wire protocol over the
   * `agent` socket: sends user turns, parses streamed chunks into v6 UIMessages
   * with `parts`, and exposes `status`/`isStreaming` + `sendMessage`.
   */
  const chat = useAgentChat<unknown, UIMessage>({
    agent,
    id: projectId || 'disabled',
    // Don't fetch persisted history over HTTP; this dock is conversation-only.
    getInitialMessages: null,
    body: buildBody,
  });

  const { messages, sendMessage, status } = chat;
  // True from the moment a turn is submitted until the stream ends.
  const busy = status === 'submitted' || status === 'streaming' || chat.isStreaming;

  // Auto-scroll to bottom when messages change.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  // NOTE: no reset-on-close effect here. The parent only mounts this component
  // while open, so closing unmounts it and clears all state automatically.
  // (A `useEffect(... setMessages([]) ..., [open, setMessages])` here caused
  // React error #185 — an infinite setState loop — when `setMessages` was not
  // referentially stable.)

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

  // No active project → render nothing meaningful (parent already guards on
  // projectId, but keep the dock a no-op if it's ever mounted without one).
  if (!projectId) return null;

  const lastIsAssistant =
    messages.length > 0 && messages[messages.length - 1].role === 'assistant';
  const waitingForReply = busy && !lastIsAssistant;

  return (
    <div className="fixed right-4 bottom-20 w-96 h-[580px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-[70] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-white font-semibold text-sm">Agent</span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-600'}`}
            title={connected ? 'Connected' : 'Connecting…'}
          />
          {busy && <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-1 rounded"
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
