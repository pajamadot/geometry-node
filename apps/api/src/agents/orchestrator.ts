import { Think } from '@cloudflare/think';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { LanguageModel, ToolSet } from 'ai';
import type { Env } from '../index';

const SYSTEM_PROMPT = `You are a geometry-node scene assistant for a Three.js node-graph editor.
You edit the user's live scene by calling tools (add/connect/update/remove nodes, register custom nodes).
Always read the current scene before editing when relevant. Use only node types from the provided catalog
unless explicitly asked to author a new node. Keep edits minimal and explain briefly what you did.`;

export class Orchestrator extends Think<Env> {
  maxSteps = 8;

  getModel(): LanguageModel {
    const provider = createOpenAICompatible({
      name: 'openrouter',
      apiKey: this.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    });
    return provider('anthropic/claude-3.5-sonnet');
  }

  getSystemPrompt(): string {
    return SYSTEM_PROMPT;
  }

  getTools(): ToolSet {
    return {};
  }
}
