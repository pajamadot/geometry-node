import { NodeDefinition } from '../../types/nodes';

export const cylinderNodeDefinition: NodeDefinition = {
  type: 'cylinder',
  name: 'Cylinder',
  description: 'Creates a cylinder geometry',
  category: 'geometry',
  color: {
    primary: '#eab308',
    secondary: '#ca8a04'
  },
  inputs: [],
  outputs: [
    { id: 'geometry', name: 'Geometry', type: 'geometry' }
  ],
  parameters: [
      { id: 'radiusTop', name: 'Radius Top', type: 'number', defaultValue: 1 },
      { id: 'radiusBottom', name: 'Radius Bottom', type: 'number', defaultValue: 1 },
      { id: 'height', name: 'Height', type: 'number', defaultValue: 2 },
      { id: 'radialSegments', name: 'Radial Segs', type: 'integer', defaultValue: 32 },
  ],
  execute: () => { return {}; }
};
