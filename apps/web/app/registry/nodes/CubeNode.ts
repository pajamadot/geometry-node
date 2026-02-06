import { NodeDefinition } from '../../types/nodes';

export const cubeNodeDefinition: NodeDefinition = {
  type: 'cube',
  name: 'Cube',
  description: 'Creates a cube geometry',
  category: 'geometry',
  color: {
    primary: '#eab308',
    secondary: '#ca8a04'
  },
  inputs: [
    { id: 'width', name: 'Width', type: 'number', defaultValue: 1 },
    { id: 'height', name: 'Height', type: 'number', defaultValue: 1 },
    { id: 'depth', name: 'Depth', type: 'number', defaultValue: 1 },
    { id: 'widthSegments', name: 'Width Segs', type: 'integer', defaultValue: 1 },
    { id: 'heightSegments', name: 'Height Segs', type: 'integer', defaultValue: 1 },
    { id: 'depthSegments', name: 'Depth Segs', type: 'integer', defaultValue: 1 },
  ],
  outputs: [
    { id: 'geometry', name: 'Geometry', type: 'geometry' }
  ],
  parameters: [
    { id: 'width', name: 'Width', type: 'number', defaultValue: 1, min: 0, max: 10 },
    { id: 'height', name: 'Height', type: 'number', defaultValue: 1, min: 0, max: 10 },
    { id: 'depth', name: 'Depth', type: 'number', defaultValue: 1, min: 0, max: 10 },
  ],
  execute: (inputs, parameters) => {
      return { geometry: null };
  }
};
