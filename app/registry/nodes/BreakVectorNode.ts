import { NodeDefinition } from '../../types/nodeSystem';
import { GitBranch } from 'lucide-react';

// BREAK VECTOR NODE - extracts X, Y, Z from a vector
export const breakVectorNodeDefinition: NodeDefinition = {
  type: 'break-vector',
  name: 'Break Vector',
  description: 'Extract X, Y, Z components from a vector',
  category: 'vector',
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
    }
  ],
  parameters: [],
  ui: {
    width: 160,
    icon: GitBranch
  },
  execute: (inputs, parameters) => {
    const { vector } = inputs;
    
    if (!vector) {
      return { x: 0, y: 0, z: 0 };
    }
    
    return {
      x: vector.x || 0,
      y: vector.y || 0,
      z: vector.z || 0
    };
  }
}; 