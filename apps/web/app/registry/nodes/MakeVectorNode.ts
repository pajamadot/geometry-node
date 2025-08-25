import { NodeDefinition } from '../../types/nodeSystem';
import { GitBranch } from 'lucide-react';

// MAKE VECTOR NODE - combines X, Y, Z into a vector
export const makeVectorNodeDefinition: NodeDefinition = {
  type: 'make-vector',
  name: 'Make Vector',
  description: 'Combine X, Y, Z values into a vector',
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
    }
  ],
  outputs: [
    {
      id: 'result',
      name: 'Vector',
      type: 'vector',
      description: 'Combined vector'
    }
  ],
  parameters: [],
  ui: {
    width: 160,
    icon: GitBranch
  },
  execute: (inputs, parameters) => {
    const { x = 0, y = 0, z = 0 } = inputs;
    
    return {
      result: { x, y, z }
    };
  }
}; 