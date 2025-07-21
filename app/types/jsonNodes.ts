import { NodeDefinition, ParameterType, NodeCategory } from './nodeSystem';

// JSON-serializable node definition (without execute function)
export interface JsonNodeDefinition {
  type: string;
  name: string;
  description: string;
  category: NodeCategory;
  color: {
    primary: string;
    secondary: string;
  };
  
  inputs: JsonSocketDefinition[];
  outputs: JsonSocketDefinition[];
  parameters: JsonParameterDefinition[];
  
  // Execution code as string (JavaScript function body)
  executeCode: string;
  
  // Optional UI customization
  ui?: {
    width?: number;
    height?: number;
    icon?: string; // Icon name only (string)
    advanced?: string[];
  };
  
  // Metadata for tracking
  version?: string;
  author?: string;
  created?: string;
  modified?: string;
  tags?: string[];
}

// JSON-serializable socket definition
export interface JsonSocketDefinition {
  id: string;
  name: string;
  type: ParameterType;
  required?: boolean;
  defaultValue?: any;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}

// JSON-serializable parameter definition
export interface JsonParameterDefinition {
  id: string;
  name: string;
  type: ParameterType;
  defaultValue: any;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  description?: string;
  category?: string;
}

// Collection of JSON node definitions for storage
export interface JsonNodeCollection {
  version: string;
  created: string;
  modified: string;
  nodes: JsonNodeDefinition[];
}

// Validation result for JSON node definitions
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Template for creating new JSON nodes
export const JSON_NODE_TEMPLATE: JsonNodeDefinition = {
  type: 'custom-node',
  name: 'Custom Node',
  description: 'A custom node created from JSON',
  category: 'utilities',
  color: {
    primary: '#6366f1',
    secondary: '#4f46e5'
  },
  inputs: [
    {
      id: 'input1',
      name: 'Input',
      type: 'number',
      defaultValue: 0,
      description: 'Input value'
    }
  ],
  outputs: [
    {
      id: 'output1',
      name: 'Output',
      type: 'number',
      description: 'Output value'
    }
  ],
  parameters: [],
  executeCode: `
    // Get input values
    const input1 = inputs.input1 || 0;
    
    // Perform calculation
    const result = input1 * 2;
    
    // Return outputs
    return { output1: result };
  `,
  ui: {
    width: 200,
    icon: 'code'
  },
  version: '1.0.0',
  author: 'User',
  created: new Date().toISOString(),
  tags: ['custom', 'utility']
}; 