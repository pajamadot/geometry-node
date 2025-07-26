// Main exports for the AI Agent system
import { GeometryAIAgent } from './GeometryAIAgent';
export { GeometryAIAgent } from './GeometryAIAgent';

// Export types
export type {
  AITask,
  CreateNodeRequest,
  PlanSceneRequest,
  ComposeSceneRequest,
  DiffSceneRequest,
  GenerateSceneRequest,
  ModifyNodeRequest,
  ModifySceneRequest,
  AIRequest,
  ValidationResult,
  AIGenerationResult
} from './types';

// Export utility functions
export {
  buildCatalog,
  buildNodeExamples,
  buildScenePresets,
  buildPromptForTask
} from './contextBuilders';

export {
  validateNodeCode,
  validateSceneJSON,
  validateAIRequest,
  validateAPIRequest
} from './validators';

export {
  createStreamingSession,
  getAvailableModels,
  BASE_SYSTEM_PROMPT
} from './aiClient';

// Export error handling system
export {
  ErrorType,
  createError,
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling,
  withErrorHandlingGenerator,
  handleError,
  validationToResponse,
  logError,
  createHTTPResponse,
  createStreamingErrorResponse
} from './errorHandler';

export type {
  StandardError,
  StandardResponse
} from './errorHandler';

// Export singleton instance  
export const geometryAI = new GeometryAIAgent(); 