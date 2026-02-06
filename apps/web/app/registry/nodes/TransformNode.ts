import { NodeDefinition } from '../../types/nodes';

export const transformNodeDefinition: NodeDefinition = {
  type: 'transform',
  name: 'Transform',
  description: 'Transforms geometry (translate, rotate, scale)',
  category: 'geometry',
  color: {
    primary: '#3b82f6',
    secondary: '#2563eb'
  },
  inputs: [
      { id: 'geometry-in', name: 'Geometry', type: 'geometry' },
      { id: 'translation', name: 'Translation', type: 'vector' },
      { id: 'rotation', name: 'Rotation', type: 'vector' },
      { id: 'scale', name: 'Scale', type: 'vector' },
  ],
  outputs: [
    { id: 'geometry-out', name: 'Geometry', type: 'geometry' }
  ],
  parameters: [
      { id: 'position-x', name: 'Pos X', type: 'number', defaultValue: 0 },
      { id: 'position-y', name: 'Pos Y', type: 'number', defaultValue: 0 },
      { id: 'position-z', name: 'Pos Z', type: 'number', defaultValue: 0 },
      { id: 'rotation-x', name: 'Rot X', type: 'number', defaultValue: 0 },
      { id: 'rotation-y', name: 'Rot Y', type: 'number', defaultValue: 0 },
      { id: 'rotation-z', name: 'Rot Z', type: 'number', defaultValue: 0 },
      { id: 'scale-x', name: 'Scale X', type: 'number', defaultValue: 1 },
      { id: 'scale-y', name: 'Scale Y', type: 'number', defaultValue: 1 },
      { id: 'scale-z', name: 'Scale Z', type: 'number', defaultValue: 1 },
  ],
  execute: (inputs, parameters) => { return {}; }
};
