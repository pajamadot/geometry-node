import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';

// Base system prompt for Geometry-Node AI
export const BASE_SYSTEM_PROMPT = `You are an expert Geometry-Node engineer working in the repository 'geometry-node' (branch 'product').
Your job is to **create new nodes, build scenes, or modify scenes**.
Follow these rules at all times:

1. Obey the TypeScript (NodeDefinition) and Scene-JSON schemas supplied in the examples.
2. Use **Chinese comments only if the user explicitly asks**.
3. Never invent a node type that is not listed in the supplied **CATALOG** unless the user's task is *"create new node"*.
4. If a validator report is present, fix every error before doing anything else.
5. Output **pure code / JSON only**—no markdown framing, no extra prose.`;

/**
 * Creates a streaming text generation session.
 * The OpenRouter API key is injected per call (Workers have no module-level env).
 */
export async function createStreamingSession(
  prompt: string,
  apiKey: string,
  modelName: string = 'anthropic/claude-sonnet-4.6'
) {
  const openrouter = createOpenRouter({ apiKey });
  return await streamText({
    model: openrouter(modelName),
    prompt,
    system: BASE_SYSTEM_PROMPT,
  });
}

/** Gets list of available models */
export function getAvailableModels(): string[] {
  // Current OpenRouter slugs (verified against https://openrouter.ai/api/v1/models).
  return [
    'anthropic/claude-sonnet-4.6',
    'anthropic/claude-opus-4.8',
    'anthropic/claude-haiku-4.5',
    'openai/gpt-5.4',
    'openai/gpt-4o',
    'google/gemini-2.5-pro',
  ];
}
