import { Hono } from 'hono';
import {
  GeometryAIAgent, validateAPIRequest, validationToResponse,
  createHTTPResponse, createError, ErrorType, logError, validateSceneJSON,
  type CreateNodeRequest, type GenerateSceneRequest,
  type ModifyNodeRequest, type ModifySceneRequest,
} from '@geometry-script/agent-core';
import type { Env } from '../index';

export const ai = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

const sseHeaders = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
};

function agentFor(c: { env: Env }, catalog: string) {
  return new GeometryAIAgent({ apiKey: c.env.OPENROUTER_API_KEY, catalog });
}

/** Extract a JSON scene object from a model response that may include markdown/prose. */
function tryParseScene(text: string): any | null {
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

// POST /ai/generate-node
ai.post('/generate-node', async (c) => {
  const body = await c.req.json();
  const validation = validateAPIRequest(body);
  if (!validation.success) {
    return createHTTPResponse(validationToResponse(validation, null, 'generate-node API'), 400);
  }
  const { prompt, model, mode = 'generate', catalog = '' } = body;
  const geometryAI = agentFor(c, catalog);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      try {
        const taskRequest: CreateNodeRequest = { task: 'create_node', behavior: prompt };
        if (mode === 'generate') {
          let fullResponse = '';
          for await (const chunk of geometryAI.streamTask(taskRequest, model)) {
            fullResponse += chunk;
            send({ type: 'progress', content: chunk });
          }
          send({ type: 'progress', content: 'Processing generated JSON...' });
          const nodeDefinition = geometryAI.parseJsonNodeDefinition(fullResponse);
          if (nodeDefinition) {
            send({ type: 'success', content: 'Node generated successfully!', node: nodeDefinition });
          } else {
            send({ type: 'error', content: 'Failed to parse generated JSON to valid node format', errorType: ErrorType.PARSING_ERROR });
          }
        } else if (mode === 'explain') {
          for await (const chunk of geometryAI.streamTask(taskRequest, model)) {
            send({ type: 'stream', content: chunk });
          }
          send({ type: 'done', content: '' });
        } else {
          send({ type: 'error', content: `Invalid mode: ${mode}`, errorType: ErrorType.VALIDATION_ERROR });
        }
      } catch (error) {
        const e = createError(ErrorType.AI_SERVICE_ERROR, 'Failed to generate node', error, 'generate-node');
        logError(e);
        send({ type: 'error', content: e.message, errorType: e.type });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: sseHeaders });
});

// POST /ai/generate-scene
ai.post('/generate-scene', async (c) => {
  const body = await c.req.json();
  const validation = validateAPIRequest(body);
  if (!validation.success) {
    return createHTTPResponse(validationToResponse(validation, null, 'generate-scene API'), 400);
  }
  const { prompt, model, mode = 'generate', catalog = '' } = body;
  const geometryAI = agentFor(c, catalog);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      try {
        const req: GenerateSceneRequest = { task: 'generate_scene', scene_description: prompt };
        if (mode === 'generate') {
          send({ type: 'progress', content: 'Generating scene...' });
          // Stream once and accumulate — do NOT also call executeTask (that would invoke the LLM twice).
          let sceneResult = '';
          for await (const chunk of geometryAI.streamGenerateScene(req, model)) {
            sceneResult += chunk;
            send({ type: 'stream', content: chunk }); // live feedback, parity with original
          }
          const scene = tryParseScene(sceneResult);
          const validationResult = scene ? validateSceneJSON(scene) : { success: false, errors: ['Not valid JSON'] };
          if (scene && validationResult.success) {
            send({ type: 'success', content: 'Scene generated successfully!', scene });
          } else {
            send({ type: 'error', content: `Scene validation failed: ${validationResult.errors.join(', ')}`, errorType: ErrorType.VALIDATION_ERROR });
          }
        } else if (mode === 'explain') {
          for await (const chunk of geometryAI.streamGenerateScene(req, model)) {
            send({ type: 'stream', content: chunk });
          }
          send({ type: 'done', content: '' });
        } else {
          send({ type: 'error', content: `Invalid mode: ${mode}`, errorType: ErrorType.VALIDATION_ERROR });
        }
      } catch (error) {
        const e = createError(ErrorType.AI_SERVICE_ERROR, 'Failed to generate scene', error, 'generate-scene');
        logError(e);
        send({ type: 'error', content: e.message, errorType: e.type });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: sseHeaders });
});

// POST /ai/modify-node
ai.post('/modify-node', async (c) => {
  const body = await c.req.json();
  const { nodeData, modification_description, model, catalog = '' } = body;
  const geometryAI = agentFor(c, catalog);
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      try {
        const req: ModifyNodeRequest = { task: 'modify_node', nodeData, modification_description };
        const result = await geometryAI.executeTask(req, model);
        if (result.success && result.data) {
          send({ type: 'success', content: 'Node modified successfully!', node: JSON.parse(result.data) });
        } else {
          send({ type: 'error', content: result.error?.message ?? 'Modify node failed', errorType: result.error?.type });
        }
      } catch (error) {
        const e = createError(ErrorType.AI_SERVICE_ERROR, 'Failed to modify node', error, 'modify-node');
        logError(e);
        send({ type: 'error', content: e.message, errorType: e.type });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: sseHeaders });
});

// POST /ai/modify-scene
ai.post('/modify-scene', async (c) => {
  const body = await c.req.json();
  const { sceneData, modification_description, model, catalog = '' } = body;
  const geometryAI = agentFor(c, catalog);
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      try {
        const req: ModifySceneRequest = { task: 'modify_scene', sceneData, modification_description };
        const result = await geometryAI.executeTask(req, model);
        if (result.success && result.data) {
          send({ type: 'success', content: 'Scene modified successfully!', scene: JSON.parse(result.data) });
        } else {
          send({ type: 'error', content: result.error?.message ?? 'Modify scene failed', errorType: result.error?.type });
        }
      } catch (error) {
        const e = createError(ErrorType.AI_SERVICE_ERROR, 'Failed to modify scene', error, 'modify-scene');
        logError(e);
        send({ type: 'error', content: e.message, errorType: e.type });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: sseHeaders });
});
