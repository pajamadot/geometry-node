import { NodeDefinition } from '../../types/nodeSystem';
import { GitBranch } from 'lucide-react';

// Generic Break node that can extract components from any compound structure
export const genericBreakNodeDefinition: NodeDefinition = {
  type: 'break',
  name: 'Break',
  description: 'Extract components from a compound data structure',
  category: 'utilities',
  color: {
    primary: '#3b82f6',
    secondary: '#1d4ed8'
  },
  inputs: [
    {
      id: 'vector',
      name: 'Vector',
      type: 'vector',
      required: true,
      description: 'Input vector'
    }
  ],
  outputs: [
    {
      id: 'x',
      name: 'X',
      type: 'numeric',
      description: 'X component'
    },
    {
      id: 'y',
      name: 'Y',
      type: 'numeric',
      description: 'Y component'
    },
    {
      id: 'z',
      name: 'Z',
      type: 'numeric',
      description: 'Z component'
    },
    {
      id: 'w',
      name: 'W',
      type: 'numeric',
      description: 'W component'
    }
  ],
  parameters: [
    {
      id: 'template',
      name: 'Template',
      type: 'select',
      defaultValue: 'auto',
      options: ['auto', 'vector', 'quaternion', 'transform', 'color', 'custom'],
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
  execution: {
    type: 'javascript'
  },
  execute: (inputs, parameters) => {
    const { input } = inputs;
    const { template, customTemplate } = parameters;
    
    if (!input) {
      return { x: 0, y: 0, z: 0, w: 0 };
    }
    
    // Auto-detect template if not specified
    let detectedTemplate = template;
    if (template === 'auto') {
      if (input.position && input.rotation && input.scale) {
        detectedTemplate = 'transform';
      } else if (input.r !== undefined && input.g !== undefined && input.b !== undefined) {
        detectedTemplate = 'color';
      } else if (input.w !== undefined) {
        detectedTemplate = 'quaternion';
      } else {
        detectedTemplate = 'vector';
      }
    }
    
    switch (detectedTemplate) {
      case 'vector':
        return {
          x: input.x || 0,
          y: input.y || 0,
          z: input.z || 0,
          w: 0
        };
        
      case 'quaternion':
        return {
          x: input.x || 0,
          y: input.y || 0,
          z: input.z || 0,
          w: input.w || 0
        };
        
      case 'transform':
        return {
          x: input.position?.x || 0,
          y: input.position?.y || 0,
          z: input.position?.z || 0,
          w: 0
        };
        
      case 'color':
        return {
          x: input.r || 0,
          y: input.g || 0,
          z: input.b || 0,
          w: input.a || 0
        };
        
      case 'custom':
        try {
          const customDef = customTemplate ? JSON.parse(customTemplate) : {};
          return {
            x: input.x || customDef.x || 0,
            y: input.y || customDef.y || 0,
            z: input.z || customDef.z || 0,
            w: input.w || customDef.w || 0
          };
        } catch (error) {
          console.error('Invalid custom template:', error);
          return { x: 0, y: 0, z: 0, w: 0 };
        }
        
      default:
        return {
          x: input.x || 0,
          y: input.y || 0,
          z: input.z || 0,
          w: input.w || 0
        };
    }
  }
}; 