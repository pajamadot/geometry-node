import { ValidationResult, AIRequest, CreateNodeRequest, PlanSceneRequest, ComposeSceneRequest, DiffSceneRequest, GenerateSceneRequest, ModifyNodeRequest, ModifySceneRequest } from './types';

/**
 * Validates AI request inputs comprehensively
 */
export function validateAIRequest(request: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if request exists and has required task field
  if (!request) {
    errors.push('Request object is required');
    return { success: false, errors, warnings };
  }

  if (!request.task) {
    errors.push('Task field is required');
    return { success: false, errors, warnings };
  }

  // Validate based on task type
  switch (request.task) {
    case 'create_node':
      return validateCreateNodeRequest(request);
    case 'plan_scene':
      return validatePlanSceneRequest(request);
    case 'compose_scene':
      return validateComposeSceneRequest(request);
    case 'diff_scene':
      return validateDiffSceneRequest(request);
    case 'generate_scene':
      return validateGenerateSceneRequest(request);
    case 'modify_node':
      return validateModifyNodeRequest(request);
    case 'modify_scene':
      return validateModifySceneRequest(request);
    default:
      errors.push(`Unknown task type: ${request.task}`);
      return { success: false, errors, warnings };
  }
}

/**
 * Validates CreateNodeRequest
 */
function validateCreateNodeRequest(request: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!request.behavior || typeof request.behavior !== 'string') {
    errors.push('Behavior field is required and must be a string');
  }

  if (request.behavior && request.behavior.trim().length < 5) {
    warnings.push('Behavior description is very short, consider adding more detail');
  }

  if (request.validator_report && typeof request.validator_report !== 'string') {
    errors.push('Validator report must be a string if provided');
  }

  return { success: errors.length === 0, errors, warnings };
}

/**
 * Validates PlanSceneRequest
 */
function validatePlanSceneRequest(request: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!request.scene_idea || typeof request.scene_idea !== 'string') {
    errors.push('Scene idea field is required and must be a string');
  }

  if (request.scene_idea && request.scene_idea.trim().length < 10) {
    warnings.push('Scene idea is very short, consider adding more detail');
  }

  return { success: errors.length === 0, errors, warnings };
}

/**
 * Validates ComposeSceneRequest
 */
function validateComposeSceneRequest(request: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!request.selected_node_ids || !Array.isArray(request.selected_node_ids)) {
    errors.push('Selected node IDs field is required and must be an array');
  }

  if (request.selected_node_ids && request.selected_node_ids.length === 0) {
    errors.push('At least one node ID must be selected');
  }

  if (request.selected_node_ids) {
    request.selected_node_ids.forEach((id: any, index: number) => {
      if (!id || typeof id !== 'string') {
        errors.push(`Node ID at index ${index} must be a non-empty string`);
      }
    });
  }

  return { success: errors.length === 0, errors, warnings };
}

/**
 * Validates DiffSceneRequest
 */
function validateDiffSceneRequest(request: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!request.old_scene_json) {
    errors.push('Old scene JSON field is required');
  }

  if (!request.change_request || typeof request.change_request !== 'string') {
    errors.push('Change request field is required and must be a string');
  }

  if (request.change_request && request.change_request.trim().length < 5) {
    warnings.push('Change request is very short, consider adding more detail');
  }

  // Validate old scene JSON structure
  if (request.old_scene_json) {
    const sceneValidation = validateSceneJSON(request.old_scene_json);
    if (!sceneValidation.success) {
      errors.push('Old scene JSON is invalid: ' + sceneValidation.errors.join(', '));
    }
  }

  return { success: errors.length === 0, errors, warnings };
}

/**
 * Validates GenerateSceneRequest
 */
function validateGenerateSceneRequest(request: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!request.scene_description || typeof request.scene_description !== 'string') {
    errors.push('Scene description field is required and must be a string');
  }

  if (request.scene_description && request.scene_description.trim().length < 10) {
    warnings.push('Scene description is very short, consider adding more detail');
  }

  return { success: errors.length === 0, errors, warnings };
}

/**
 * Validates ModifyNodeRequest
 */
function validateModifyNodeRequest(request: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!request.nodeData) {
    errors.push('Node data field is required');
  }

  if (!request.modification_description || typeof request.modification_description !== 'string') {
    errors.push('Modification description field is required and must be a string');
  }

  if (request.modification_description && request.modification_description.trim().length < 5) {
    warnings.push('Modification description is very short, consider adding more detail');
  }

  return { success: errors.length === 0, errors, warnings };
}

/**
 * Validates ModifySceneRequest
 */
function validateModifySceneRequest(request: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!request.sceneData) {
    errors.push('Scene data field is required');
  }

  if (!request.modification_description || typeof request.modification_description !== 'string') {
    errors.push('Modification description field is required and must be a string');
  }

  if (request.modification_description && request.modification_description.trim().length < 5) {
    warnings.push('Modification description is very short, consider adding more detail');
  }

  // Validate scene data structure if provided
  if (request.sceneData) {
    const sceneValidation = validateSceneJSON(request.sceneData);
    if (!sceneValidation.success) {
      errors.push('Scene data is invalid: ' + sceneValidation.errors.join(', '));
    }
  }

  return { success: errors.length === 0, errors, warnings };
}

/**
 * Validates API request parameters (from HTTP requests)
 */
export function validateAPIRequest(body: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!body.prompt || typeof body.prompt !== 'string') {
    errors.push('Prompt field is required and must be a string');
  }

  if (body.prompt && body.prompt.trim().length < 3) {
    errors.push('Prompt must be at least 3 characters long');
  }

  if (body.model && typeof body.model !== 'string') {
    errors.push('Model field must be a string if provided');
  }

  if (body.mode && !['generate', 'explain'].includes(body.mode)) {
    errors.push('Mode must be either "generate" or "explain" if provided');
  }

  return { success: errors.length === 0, errors, warnings };
}

/**
 * Validates generated node code
 */
export function validateNodeCode(code: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!code || typeof code !== 'string') {
    errors.push('Code must be a non-empty string');
    return { success: false, errors, warnings };
  }

  // Basic syntax and structure validation
  if (!code.includes('NodeDefinition')) {
    errors.push('Code must export a NodeDefinition object');
  }

  if (!code.includes('executeCode:')) {
    errors.push('NodeDefinition must include executeCode property');
  }

  if (!code.includes('type:') || !code.includes('name:')) {
    errors.push('NodeDefinition must include type and name properties');
  }

  // Check for required imports
  if (code.includes('THREE.') && !code.includes('import') && !code.includes('THREE')) {
    warnings.push('Code uses THREE.js but no import statement found');
  }

  // Check for proper TypeScript syntax
  if (!code.includes('export') && !code.includes('const')) {
    warnings.push('Code should export a constant NodeDefinition');
  }

  return {
    success: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates scene JSON structure
 */
export function validateSceneJSON(sceneJSON: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!sceneJSON || typeof sceneJSON !== 'object') {
    errors.push('Scene must be a valid JSON object');
    return { success: false, errors, warnings };
  }

  if (!sceneJSON.nodes || !Array.isArray(sceneJSON.nodes)) {
    errors.push('Scene must have a nodes array');
  }

  if (!sceneJSON.edges || !Array.isArray(sceneJSON.edges)) {
    errors.push('Scene must have an edges array');
  }

  // Validate node structure
  if (sceneJSON.nodes) {
    sceneJSON.nodes.forEach((node: any, index: number) => {
      if (!node.id) errors.push(`Node ${index} missing id`);
      if (!node.type) errors.push(`Node ${index} missing type`);
      if (!node.position) errors.push(`Node ${index} missing position`);
      if (!node.data) errors.push(`Node ${index} missing data`);
      
      // Validate position structure
      if (node.position && (typeof node.position.x !== 'number' || typeof node.position.y !== 'number')) {
        errors.push(`Node ${index} position must have numeric x and y values`);
      }
    });
  }

  // Validate edge structure
  if (sceneJSON.edges) {
    sceneJSON.edges.forEach((edge: any, index: number) => {
      if (!edge.id) errors.push(`Edge ${index} missing id`);
      if (!edge.source) errors.push(`Edge ${index} missing source`);
      if (!edge.target) errors.push(`Edge ${index} missing target`);
      if (!edge.sourceHandle) warnings.push(`Edge ${index} missing sourceHandle`);
      if (!edge.targetHandle) warnings.push(`Edge ${index} missing targetHandle`);
    });
  }

  return {
    success: errors.length === 0,
    errors,
    warnings
  };
} 