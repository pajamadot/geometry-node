import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText, generateObject, StreamTextResult } from 'ai';

// Initialize OpenRouter client
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || '',
});

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
 * Creates a streaming text generation session
 */
export async function createStreamingSession(prompt: string, modelName: string = 'openai/gpt-5') {
  return await streamText({
    model: openrouter(modelName),
    prompt,
    system: BASE_SYSTEM_PROMPT,
  });
}

/**
 * Gets list of available models
 */
export function getAvailableModels(): string[] {
  return [
    'openai/gpt-5'
  ];
} 