import { NodeDefinition } from '../../types/nodeSystem';
import { Move3d } from 'lucide-react';

// MAKE TRANSFORM NODE - combines position, rotation, scale into a transform
export const makeTransformNodeDefinition: NodeDefinition = {
  type: 'make-transform',
  name: 'Make Transform',
  description: 'Combine position, rotation, scale into a transform',
  category: 'vector',
  color: {
    primary: '#3b82f6',
    secondary: '#1d4ed8'
  },
  inputs: [
    {
      id: 'position',
      name: 'Position',
      type: 'vector',
      defaultValue: { x: 0, y: 0, z: 0 },
      description: 'Translation offset'
    },
    {
      id: 'rotation',
      name: 'Rotation',
      type: 'vector',
      defaultValue: { x: 0, y: 0, z: 0 },
      description: 'Rotation in radians'
    },
    {
      id: 'scale',
      name: 'Scale',
      type: 'vector',
      defaultValue: { x: 1, y: 1, z: 1 },
      description: 'Scale factors'
    }
  ],
  outputs: [
    {
      id: 'transform',
      name: 'Transform',
      type: 'transform',
      description: 'Combined transform'
    }
  ],
  parameters: [],
  ui: {
    width: 220,
    icon: Move3d
  },
  execute: (inputs, parameters) => {
    const { 
      position = { x: 0, y: 0, z: 0 }, 
      rotation = { x: 0, y: 0, z: 0 }, 
      scale = { x: 1, y: 1, z: 1 } 
    } = inputs;
    
    return {
      transform: { position, rotation, scale }
    };
  }
}; 