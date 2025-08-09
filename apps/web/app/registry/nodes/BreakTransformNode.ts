import { NodeDefinition } from '../../types/nodeSystem';
import { Move3d } from 'lucide-react';

// BREAK TRANSFORM NODE - extracts position, rotation, scale from a transform
export const breakTransformNodeDefinition: NodeDefinition = {
  type: 'break-transform',
  name: 'Break Transform',
  description: 'Extract position, rotation, scale from a transform',
  category: 'data',
  color: {
    primary: '#2563eb',
    secondary: '#1d4ed8'
  },
  inputs: [
    {
      id: 'transform',
      name: 'Transform',
      type: 'transform',
      required: true,
      description: 'Input transform'
    }
  ],
  outputs: [
    {
      id: 'position',
      name: 'Position',
      type: 'vector',
      description: 'Translation offset'
    },
    {
      id: 'rotation',
      name: 'Rotation',
      type: 'vector',
      description: 'Rotation in radians'
    },
    {
      id: 'scale',
      name: 'Scale',
      type: 'vector',
      description: 'Scale factors'
    }
  ],
  parameters: [],
  ui: {
    width: 220,
    icon: Move3d
  },
  execute: (inputs, parameters) => {
    const { transform } = inputs;
    
    if (!transform) {
      return {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      };
    }
    
    return {
      position: transform.position || { x: 0, y: 0, z: 0 },
      rotation: transform.rotation || { x: 0, y: 0, z: 0 },
      scale: transform.scale || { x: 1, y: 1, z: 1 }
    };
  }
}; 