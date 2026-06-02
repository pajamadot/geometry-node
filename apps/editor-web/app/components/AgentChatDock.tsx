'use client';

/**
 * AgentChatDock — connects to the Orchestrator agent via WebSocket and
 * provides a chat interface for live scene editing.
 *
 * PROTOCOL (agents@0.14, cf_agent_chat_* wire format):
 *
 *   Send:  { type: "cf_agent_use_chat_request", id, init: { method:"POST",
 *             body: JSON.stringify({ messages, projectId, catalog }) } }
 *           Think destructures: `const { messages, clientTools, trigger, ...customBody } = body`
 *           Everything in customBody → ctx.body in beforeTurn (projectId, catalog).
 *
 *   Recv:  { type: "cf_agent_use_chat_response", streamId, done?, chunkData? }
 *           Incremental chunk. chunkData.type is one of:
 *             "text-start" | "text-delta" | "text-end"
 *             "tool-input-start" | "tool-input-available" | "tool-output-available" | "tool-output-error"
 *           Tool parts use type: `tool-${toolName}` (e.g. "tool-add_node").
 *          { type: "cf_agent_chat_messages", messages }
 *           Authoritative history after each turn. Parts follow the same
 *           `tool-<toolName>` shape (agents v6 format, NOT AI SDK v4 "tool-invocation").
 *
 * Host/protocol derivation and room-token mint mirror roomClient.ts exactly.
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useAgent } from 'agents/react';
import { Loader2, Send, X, Sparkles, Bot, User, Wrench } from 'lucide-react';
import { apiBase } from '../lib/aiApi';
import { buildCatalog } from '../lib/buildCatalog';

// ---------------------------------------------------------------------------
// Part shape types (agents v6 / @cloudflare/think wire format)
// Tool parts use type: `tool-${toolName}` — NOT "tool-invocation".
// ---------------------------------------------------------------------------

interface TextPart {
  type: 'text';
  text: string;
}

interface ToolPart {
  type: string; // `tool-${toolName}`, e.g. "tool-add_node"
  toolCallId: string;
  toolName: string;
  state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error' | 'output-denied';
  input?: unknown;
  output?: unknown;
  errorText?: string;
}

type MessagePart = TextPart | ToolPart | { type: string; [k: string]: unknown };

interface WireMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  parts?: MessagePart[];
}

interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  /** Flattened text from parts, for display fallback. */
  content: string;
  parts: MessagePart[];
  /** True while chunks are still arriving for this message. */
  streaming?: boolean;
}

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
// Helpers
// ---------------------------------------------------------------------------

function isToolPart(p: MessagePart): p is ToolPart {
  // Tool parts have type starting with "tool-" and a toolName field.
  return p.type.startsWith('tool-') && 'toolName' in p;
}

function flattenParts(parts: MessagePart[]): string {
  return parts
    .filter((p): p is TextPart => p.type === 'text')
    .map((p) => p.text)
    .join('');
}

function flattenWireMessage(m: WireMessage): string {
  if (m.parts?.length) return flattenParts(m.parts);
  return typeof m.content === 'string' ? m.content : '';
}

// ---------------------------------------------------------------------------
// ChatMessage sub-component
// ---------------------------------------------------------------------------

function ChatMessage({ message }: { message: AgentMessage }) {
  const isUser = message.role === 'user';

  const textContent = message.parts.length
    ? flattenParts(message.parts)
    : message.content;

  const toolParts = message.parts.filter(isToolPart);

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
        {!isUser && toolParts.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {toolParts.map((tp) => {
              const running =
                tp.state === 'input-streaming' || tp.state === 'input-available';
              return (
                <span
                  key={tp.toolCallId}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono border ${
                    running
                      ? 'bg-amber-900/40 border-amber-500/50 text-amber-300'
                      : tp.state === 'output-error' || tp.state === 'output-denied'
                        ? 'bg-red-900/40 border-red-500/50 text-red-300'
                        : 'bg-green-900/40 border-green-500/50 text-green-300'
                  }`}
                  title={tp.toolName}
                >
                  <Wrench className="w-2.5 h-2.5" />
                  {tp.toolName}
                  {running ? '…' : ''}
                </span>
              );
            })}
          </div>
        )}

        {/* Text bubble */}
        {(textContent || message.streaming) && (
          <div
            className={`px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
              isUser
                ? 'bg-blue-600 text-white rounded-tr-sm'
                : 'bg-gray-800 text-gray-100 rounded-tl-sm border border-gray-700'
            }`}
          >
            {textContent}
            {message.streaming && !textContent && (
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
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [connected, setConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Mint a room-token for the orchestrator connection.
   * Mirrors roomClient.ts mintToken exactly (same endpoint, same format).
   */
  const mintToken = useCallback(async (): Promise<Record<string, string | null>> => {
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

  const { host, protocol } = deriveAgentEndpoint();

  // Track which streaming placeholder message we're accumulating into.
  const streamingMsgIdRef = useRef<string | null>(null);

  /**
   * Process one inbound WebSocket frame from the orchestrator.
   *
   * Two frame types we handle:
   *   cf_agent_chat_messages   — authoritative history, replaces our messages.
   *   cf_agent_use_chat_response — streaming chunk, accumulates into placeholder.
   */
  const handleInboundMessage = useCallback((raw: string) => {
    let frame: Record<string, unknown>;
    try {
      frame = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return; // ignore non-JSON frames (pings, etc.)
    }

    const type = frame.type as string | undefined;
    if (!type) return;

    // ------------------------------------------------------------------
    // Full authoritative history — sent on connect + after each turn.
    // ------------------------------------------------------------------
    if (type === 'cf_agent_chat_messages') {
      const rawMsgs = (frame.messages ?? []) as WireMessage[];
      const converted: AgentMessage[] = rawMsgs
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: flattenWireMessage(m),
          parts: (m.parts ?? []) as MessagePart[],
        }));
      setMessages(converted);
      setIsStreaming(false);
      streamingMsgIdRef.current = null;
      return;
    }

    // ------------------------------------------------------------------
    // Streaming chunk — accumulate text/tool deltas into placeholder.
    // ------------------------------------------------------------------
    if (type === 'cf_agent_use_chat_response') {
      const done = frame.done as boolean | undefined;
      const chunkData = frame.chunkData as Record<string, unknown> | undefined;
      const streamId = (frame.streamId ?? frame.requestId) as string | undefined;

      // First chunk for this stream — create a streaming placeholder.
      if (!streamingMsgIdRef.current && streamId) {
        const placeholderId = `stream-${streamId}`;
        streamingMsgIdRef.current = placeholderId;
        setIsStreaming(true);
        setMessages((prev) => {
          if (prev.some((m) => m.id === placeholderId)) return prev;
          return [
            ...prev,
            {
              id: placeholderId,
              role: 'assistant' as const,
              content: '',
              parts: [],
              streaming: true,
            },
          ];
        });
      }

      const msgId = streamingMsgIdRef.current;
      if (!msgId) return;

      if (chunkData) {
        applyChunk(msgId, chunkData, setMessages);
      }

      if (done) {
        // Mark the placeholder as no-longer-streaming.
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, streaming: false } : m)),
        );
        setIsStreaming(false);
        // The server sends cf_agent_chat_messages next; that will overwrite
        // the placeholder with the authoritative message.
        streamingMsgIdRef.current = null;
      }
      return;
    }
  }, []);

  /**
   * useAgent opens a persistent WebSocket to
   *   {protocol}://{host}/agents/orchestrator/{projectId}
   * One orchestrator instance per project (name = projectId).
   */
  const agentSocket = useAgent({
    agent: 'orchestrator',
    name: projectId,
    host,
    protocol,
    enabled: open,
    query: mintToken,
    queryDeps: [projectId],
    cacheTtl: 90_000,
    onOpen: () => setConnected(true),
    onClose: () => {
      setConnected(false);
      setIsStreaming(false);
    },
    onError: () => {
      setConnected(false);
      setIsStreaming(false);
    },
    onMessage: (evt) => {
      handleInboundMessage(evt.data as string);
    },
  });

  // Auto-scroll to bottom when messages change.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  // Reset state when dock is closed.
  useEffect(() => {
    if (!open) {
      setMessages([]);
      setIsStreaming(false);
      setInput('');
      streamingMsgIdRef.current = null;
    }
  }, [open]);

  // -------------------------------------------------------------------------
  // Send a message turn
  // -------------------------------------------------------------------------

  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text || isStreaming || !connected) return;

    // Build UIMessage for the user turn.
    const userMsg: WireMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      parts: [{ type: 'text', text }],
    };

    // Optimistically add to UI.
    setMessages((prev) => [
      ...prev,
      {
        id: userMsg.id,
        role: 'user',
        content: text,
        parts: userMsg.parts as MessagePart[],
      },
    ]);
    setInput('');

    // Build full history to send (non-streaming messages only).
    const history: WireMessage[] = [
      ...messages
        .filter((m) => !m.streaming)
        .map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          parts: m.parts,
        })),
      userMsg,
    ];

    /**
     * Wire protocol: cf_agent_use_chat_request
     *
     * Think._handleChatRequest does:
     *   const { messages, clientTools, trigger, ...customBody } = JSON.parse(init.body);
     *   // customBody → ctx.body in beforeTurn
     *
     * So projectId and catalog end up at ctx.body.projectId / ctx.body.catalog
     * which is exactly what Orchestrator.beforeTurn reads.
     */
    const requestId = crypto.randomUUID();
    const wireFrame = JSON.stringify({
      type: 'cf_agent_use_chat_request',
      id: requestId,
      init: {
        method: 'POST',
        body: JSON.stringify({
          messages: history,
          projectId,
          catalog: buildCatalog(),
        }),
      },
    });

    try {
      agentSocket.send(wireFrame);
      setIsStreaming(true);
    } catch (err) {
      console.error('[agent-chat] failed to send message', err);
      setIsStreaming(false);
    }
  }, [input, isStreaming, connected, messages, projectId, agentSocket]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (!open) return null;

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
          {isStreaming && <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />}
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
        {messages.length === 0 && !isStreaming && (
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
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {/* Spinner while waiting for first chunk */}
        {isStreaming && !messages.some((m) => m.streaming) && (
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
            disabled={!connected || isStreaming}
            rows={2}
            className="flex-1 bg-gray-800 text-white text-sm rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none px-3 py-2 resize-none placeholder-gray-500 disabled:opacity-50 transition-colors"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || !connected || isStreaming}
            className="flex-shrink-0 w-9 h-9 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            aria-label="Send message"
          >
            {isStreaming ? (
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

// ---------------------------------------------------------------------------
// applyChunk — update a streaming message's parts in response to one chunk.
//
// agents@0.14 chunk types (from agent-tools-BAdX1vdI.js):
//   text-start, text-delta, text-end
//   tool-input-start, tool-input-delta, tool-input-available, tool-input-error
//   tool-output-available, tool-output-error
//   step-start | start-step
// ---------------------------------------------------------------------------

function applyChunk(
  msgId: string,
  chunk: Record<string, unknown>,
  setMessages: React.Dispatch<React.SetStateAction<AgentMessage[]>>,
): void {
  const chunkType = chunk.type as string | undefined;
  if (!chunkType) return;

  setMessages((prev) =>
    prev.map((m) => {
      if (m.id !== msgId) return m;

      // Clone parts array shallowly for immutability.
      const parts: MessagePart[] = m.parts.map((p) => ({ ...p }));

      switch (chunkType) {
        case 'text-start':
          parts.push({ type: 'text', text: '' } as TextPart);
          break;

        case 'text-delta': {
          const delta = chunk.delta as string | undefined;
          if (!delta) break;
          const lastIdx = parts.length - 1;
          if (lastIdx >= 0 && parts[lastIdx].type === 'text') {
            parts[lastIdx] = {
              ...parts[lastIdx],
              text: (parts[lastIdx] as TextPart).text + delta,
            } as TextPart;
          } else {
            parts.push({ type: 'text', text: delta } as TextPart);
          }
          break;
        }

        case 'text-end':
          // Nothing to do; text is already accumulated.
          break;

        case 'tool-input-start': {
          const toolName = chunk.toolName as string;
          const toolCallId = chunk.toolCallId as string;
          if (!toolName || !toolCallId) break;
          const existing = parts.find(
            (p) => isToolPart(p) && p.toolCallId === toolCallId,
          );
          if (!existing) {
            parts.push({
              type: `tool-${toolName}`,
              toolCallId,
              toolName,
              state: 'input-streaming',
              input: undefined,
            } as ToolPart);
          }
          break;
        }

        case 'tool-input-delta': {
          const toolCallId = chunk.toolCallId as string;
          const idx = parts.findIndex(
            (p) => isToolPart(p) && p.toolCallId === toolCallId,
          );
          if (idx >= 0 && (parts[idx] as ToolPart).state === 'input-streaming') {
            parts[idx] = {
              ...parts[idx],
              input: chunk.input,
            } as ToolPart;
          }
          break;
        }

        case 'tool-input-available': {
          const toolName = chunk.toolName as string;
          const toolCallId = chunk.toolCallId as string;
          const idx = parts.findIndex(
            (p) => isToolPart(p) && p.toolCallId === toolCallId,
          );
          if (idx >= 0) {
            parts[idx] = {
              ...parts[idx],
              state: 'input-available',
              input: chunk.input,
            } as ToolPart;
          } else if (toolName && toolCallId) {
            parts.push({
              type: `tool-${toolName}`,
              toolCallId,
              toolName,
              state: 'input-available',
              input: chunk.input,
            } as ToolPart);
          }
          break;
        }

        case 'tool-output-available': {
          const toolCallId = chunk.toolCallId as string;
          const idx = parts.findIndex(
            (p) => isToolPart(p) && p.toolCallId === toolCallId,
          );
          if (idx >= 0) {
            parts[idx] = {
              ...parts[idx],
              state: 'output-available',
              output: chunk.output,
            } as ToolPart;
          }
          break;
        }

        case 'tool-output-error': {
          const toolCallId = chunk.toolCallId as string;
          const idx = parts.findIndex(
            (p) => isToolPart(p) && p.toolCallId === toolCallId,
          );
          if (idx >= 0) {
            parts[idx] = {
              ...parts[idx],
              state: 'output-error',
              errorText: chunk.errorText as string | undefined,
            } as ToolPart;
          }
          break;
        }

        case 'step-start':
        case 'start-step':
          parts.push({ type: 'step-start' });
          break;

        default:
          break;
      }

      return {
        ...m,
        content: flattenParts(parts),
        parts,
        streaming: true,
      };
    }),
  );
}
