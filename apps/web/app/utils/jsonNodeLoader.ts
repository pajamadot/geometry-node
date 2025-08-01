import { NodeDefinition } from '../types/nodeSystem';
import { JsonNodeDefinition, JsonNodeCollection, ValidationResult } from '../types/jsonNodes';
import { Search, Code, Settings, Calculator, Box, Circle, Zap } from 'lucide-react';
import * as THREE from 'three';

// Icon mapping for string-based icons
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  'search': Search,
  'code': Code,
  'settings': Settings,
  'calculator': Calculator,
  'box': Box,
  'sphere': Circle,
  'zap': Zap,
  // Add more icons as needed
};

// Convert JSON node definition to executable NodeDefinition
export function jsonToNodeDefinition(jsonNode: JsonNodeDefinition): NodeDefinition {
  // Create execution function from code string
  const executeFunction = createExecuteFunction(jsonNode.executeCode);
  
  // Convert to NodeDefinition
  const nodeDefinition: NodeDefinition = {
    type: jsonNode.type,
    name: jsonNode.name,
    description: jsonNode.description,
    category: jsonNode.category,
    color: jsonNode.color,
    inputs: jsonNode.inputs,
    outputs: jsonNode.outputs,
    parameters: jsonNode.parameters,
    execute: executeFunction,
    ui: jsonNode.ui ? {
      ...jsonNode.ui,
      icon: jsonNode.ui.icon && typeof jsonNode.ui.icon === 'string' 
        ? ICON_MAP[jsonNode.ui.icon] || Code
        : jsonNode.ui.icon
    } : undefined
  };
  
  return nodeDefinition;
}

// Create safe execution function from code string
function createExecuteFunction(
  executeCode: string
): (inputs: Record<string, any>, parameters: Record<string, any>) => Record<string, any> {
  return (inputs: Record<string, any>, parameters: Record<string, any>) => {
    try {
      // Make THREE.js available to custom nodes
      const ThreeJS = THREE;
      
      // Create safe execution context
      const safeGlobals = {
        Math,
        THREE: ThreeJS,
        console: {
          log: (...args: any[]) => console.log('[CustomNode]', ...args),
          warn: (...args: any[]) => console.warn('[CustomNode]', ...args),
          error: (...args: any[]) => console.error('[CustomNode]', ...args)
        },
        inputs,
        parameters
      };
      
      // Create function with safe context
      const functionBody = `
        "use strict";
        ${executeCode}
      `;
      
      const executeFunc = new Function('inputs', 'parameters', 'Math', 'THREE', 'console', functionBody);
      const result = executeFunc(inputs, parameters, safeGlobals.Math, safeGlobals.THREE, safeGlobals.console);
      
      return result || {};
    } catch (error) {
      console.error('Error executing custom node:', error);
      return {};
    }
  };
}

// Validate JSON node definition
export function validateJsonNode(jsonNode: JsonNodeDefinition): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Required fields validation
  if (!jsonNode.type) errors.push('Node type is required');
  if (!jsonNode.name) errors.push('Node name is required');
  if (!jsonNode.description) errors.push('Node description is required');
  if (!jsonNode.category) errors.push('Node category is required');
  if (!jsonNode.executeCode) errors.push('Execute code is required');
  
  // Type validation
  if (jsonNode.type && !/^[a-z][a-z0-9-]*$/.test(jsonNode.type)) {
    errors.push('Node type must be lowercase alphanumeric with hyphens');
  }
  
  // Color validation
  if (!jsonNode.color?.primary) errors.push('Primary color is required');
  if (!jsonNode.color?.secondary) errors.push('Secondary color is required');
  
  // Socket validation
  jsonNode.inputs?.forEach((input, index) => {
    if (!input.id) errors.push(`Input ${index}: id is required`);
    if (!input.name) errors.push(`Input ${index}: name is required`);
    if (!input.type) errors.push(`Input ${index}: type is required`);
  });
  
  jsonNode.outputs?.forEach((output, index) => {
    if (!output.id) errors.push(`Output ${index}: id is required`);
    if (!output.name) errors.push(`Output ${index}: name is required`);
    if (!output.type) errors.push(`Output ${index}: type is required`);
  });
  
  // Parameter validation
  jsonNode.parameters?.forEach((param, index) => {
    if (!param.id) errors.push(`Parameter ${index}: id is required`);
    if (!param.name) errors.push(`Parameter ${index}: name is required`);
    if (!param.type) errors.push(`Parameter ${index}: type is required`);
    if (param.defaultValue === undefined) warnings.push(`Parameter ${index}: default value recommended`);
  });
  
  // Execute code validation
  try {
    new Function('inputs', 'parameters', jsonNode.executeCode);
  } catch (error) {
    errors.push(`Execute code syntax error: ${error}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// Parse JSON node collection from string
export function parseJsonNodeCollection(jsonString: string): JsonNodeCollection {
  try {
    const parsed = JSON.parse(jsonString);
    
    // Validate collection structure
    if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
      throw new Error('Invalid node collection: missing nodes array');
    }
    
    return {
      version: parsed.version || '1.0.0',
      created: parsed.created || new Date().toISOString(),
      modified: parsed.modified || new Date().toISOString(),
      nodes: parsed.nodes
    };
  } catch (error) {
    throw new Error(`Failed to parse JSON node collection: ${error}`);
  }
}

// Convert node collection to JSON string
export function stringifyJsonNodeCollection(collection: JsonNodeCollection): string {
  return JSON.stringify(collection, null, 2);
}

// Load multiple JSON nodes and validate them
export function loadJsonNodes(jsonNodes: JsonNodeDefinition[]): {
  valid: NodeDefinition[];
  invalid: { node: JsonNodeDefinition; validation: ValidationResult }[];
} {
  const valid: NodeDefinition[] = [];
  const invalid: { node: JsonNodeDefinition; validation: ValidationResult }[] = [];
  
  jsonNodes.forEach(jsonNode => {
    const validation = validateJsonNode(jsonNode);
    
    if (validation.valid) {
      try {
        const nodeDefinition = jsonToNodeDefinition(jsonNode);
        valid.push(nodeDefinition);
      } catch (error) {
        invalid.push({
          node: jsonNode,
          validation: {
            valid: false,
            errors: [`Conversion error: ${error}`],
            warnings: []
          }
        });
      }
    } else {
      invalid.push({ node: jsonNode, validation });
    }
  });
  
  return { valid, invalid };
} 