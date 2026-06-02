// Agent orchestrator
export { GeometryAIAgent } from './GeometryAIAgent';

// Types
export type {
  AITask, CreateNodeRequest, PlanSceneRequest, ComposeSceneRequest,
  DiffSceneRequest, GenerateSceneRequest, ModifyNodeRequest, ModifySceneRequest,
  AIRequest, ValidationResult, AIGenerationResult,
} from './types';
export type { JsonNodeDefinition } from './jsonNodes';

// Prompt builders (static parts)
export {
  buildNodeExamples, buildScenePresets, buildSceneExamples,
  buildSceneGenerationGuidelines, buildPromptForTask,
} from './contextBuilders';

// Validators
export {
  validateNodeCode, validateSceneJSON, validateAIRequest, validateAPIRequest,
} from './validators';

// AI client
export { createStreamingSession, getAvailableModels, BASE_SYSTEM_PROMPT } from './aiClient';

// Error handling
export {
  ErrorType, createError, createSuccessResponse, createErrorResponse,
  withErrorHandling, withErrorHandlingGenerator, handleError,
  validationToResponse, logError, createHTTPResponse, createStreamingErrorResponse,
} from './errorHandler';
export type { StandardError, StandardResponse } from './errorHandler';

// Diff
export { DiffApplicator } from './diffApplicator';

// Editor operations
export { applyOp, applyOps } from './operations';
export type { EditorSnapshot, EditorOp, RoomNode, RoomEdge } from './operations';
