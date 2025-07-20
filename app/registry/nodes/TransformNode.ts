import { NodeDefinition } from '../../types/nodeSystem';
import { Move3d } from 'lucide-react';

// TRANSFORM NODE - Blender-style layout
export const transformNodeDefinition: NodeDefinition = {
  type: 'transform',
  name: 'Transform',
  description: 'Apply transformations to geometry',
  category: 'geometry',
  color: {
    primary: '#dc2626',
    secondary: '#b91c1c'
  },

  inputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Input geometry to transform'
    },
    {
      id: 'translation',
      name: 'Translation',
      type: 'vector',
      defaultValue: { x: 0, y: 0, z: 0 },
      description: 'Translation vector (in meters)'
    },
    {
      id: 'rotation',
      name: 'Rotation',
      type: 'vector',
      defaultValue: { x: 0, y: 0, z: 0 },
      description: 'Rotation in degrees'
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
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Transformed geometry'
    }
  ],
  parameters: [],
  ui: {
    icon: Move3d
  },
  execute: (inputs, parameters) => {
    const { geometry, translation, rotation, scale } = inputs;
    
    if (!geometry) {
      return { geometry: null };
    }

    // Simple transform logic - in a real implementation, this would use Three.js
    const transformedGeometry = {
      ...geometry,
      transform: {
        translation: translation || { x: 0, y: 0, z: 0 },
        rotation: rotation || { x: 0, y: 0, z: 0 },
        scale: scale || { x: 1, y: 1, z: 1 }
      }
    };

    return { geometry: transformedGeometry };
  }
}; 