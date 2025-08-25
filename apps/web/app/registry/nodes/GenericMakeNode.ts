import { NodeDefinition } from '../../types/nodeSystem';
import { GitBranch } from 'lucide-react';

// Generic Make node that can combine any inputs into a compound structure
export const genericMakeNodeDefinition: NodeDefinition = {
  type: 'make',
  name: 'Make',
  description: 'Combine inputs into a compound data structure',
  category: 'data',
  color: {
    primary: '#3b82f6',
    secondary: '#1d4ed8'
  },
  inputs: [
    {
      id: 'x',
      name: 'X',
      type: 'numeric',
      defaultValue: 0,
      description: 'X component'
    },
    {
      id: 'y',
      name: 'Y',
      type: 'numeric',
      defaultValue: 0,
      description: 'Y component'
    },
    {
      id: 'z',
      name: 'Z',
      type: 'numeric',
      defaultValue: 0,
      description: 'Z component'
    },
    {
      id: 'w',
      name: 'W',
      type: 'numeric',
      defaultValue: 0,
      description: 'W component (for quaternions)'
    }
  ],
  outputs: [
    {
      id: 'result',
      name: 'Result',
      type: 'vector', // Will be dynamically typed based on template
      description: 'Combined result'
    }
  ],
  parameters: [
    {
      id: 'template',
      name: 'Template',
      type: 'select',
      defaultValue: 'vector',
      options: ['vector', 'quaternion', 'transform', 'color', 'custom'],
      description: 'Data structure template'
    },
    {
      id: 'customTemplate',
      name: 'Custom Template',
      type: 'string',
      defaultValue: '',
      description: 'Custom template definition (JSON)',
      category: 'advanced'
    }
  ],
  ui: {
    width: 220,
    icon: GitBranch,
    advanced: ['customTemplate']
  },
  execute: (inputs, parameters) => {
    const { template, customTemplate } = parameters;
    const { x = 0, y = 0, z = 0, w = 0 } = inputs;
    
    switch (template) {
      case 'vector':
        return { result: { x, y, z } };
        
      case 'quaternion':
        return { result: { x, y, z, w } };
        
      case 'transform':
        return { 
          result: { 
            position: { x, y, z },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 }
          } 
        };
        
      case 'color':
        return { result: { r: x, g: y, b: z, a: w } };
        
      case 'custom':
        try {
          const customDef = customTemplate ? JSON.parse(customTemplate) : {};
          return { result: { ...customDef, x, y, z, w } };
        } catch (error) {
          console.error('Invalid custom template:', error);
          return { result: { x, y, z, w } };
        }
        
      default:
        return { result: { x, y, z } };
    }
  }
}; 