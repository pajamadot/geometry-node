import { NodeDefinition } from '../../types/nodes';

export const sphereNodeDefinition: NodeDefinition = {
  type: 'sphere',
  name: 'Sphere',
  description: 'Creates a sphere geometry',
  category: 'geometry',
  color: {
    primary: '#eab308',
    secondary: '#ca8a04'
  },
  inputs: [
    { id: 'radius', name: 'Radius', type: 'number', defaultValue: 1 },
    { id: 'widthSegments', name: 'Width Segs', type: 'integer', defaultValue: 32 },
    { id: 'heightSegments', name: 'Height Segs', type: 'integer', defaultValue: 16 },
  ],
  outputs: [
    { id: 'geometry', name: 'Geometry', type: 'geometry' }
  ],
  parameters: [
    { id: 'radius', name: 'Radius', type: 'number', defaultValue: 1, min: 0, max: 10 },
  ],
  execute: (inputs, parameters) => {
      return {};
  }
};
