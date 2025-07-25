import { NodeDefinition } from '../types/nodeSystem';
import { JsonNodeDefinition } from '../types/jsonNodes';

// Task types and their schemas
export type AITask = 'create_node' | 'plan_scene' | 'compose_scene' | 'diff_scene' | 'generate_scene';

export interface CreateNodeRequest {
  task: 'create_node';
  behavior: string;
  validator_report?: string;
}

export interface PlanSceneRequest {
  task: 'plan_scene';
  scene_idea: string;
}

export interface ComposeSceneRequest {
  task: 'compose_scene';
  selected_node_ids: string[];
}

export interface DiffSceneRequest {
  task: 'diff_scene';
  old_scene_json: any;
  change_request: string;
}

export interface GenerateSceneRequest {
  task: 'generate_scene';
  scene_description: string;
}

export type AIRequest = CreateNodeRequest | PlanSceneRequest | ComposeSceneRequest | DiffSceneRequest | GenerateSceneRequest;

// Validation result interface
export interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings?: string[];
}

// AI generation result interface
export interface AIGenerationResult {
  type: 'node' | 'scene';
  data: any;
  success: boolean;
  error?: string;
} 