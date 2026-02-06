import { NodeDefinition } from '../../types/nodes';

export const standardMaterialNodeDefinition: NodeDefinition = {
  type: 'standard-material',
  name: 'Standard Material',
  description: 'Creates a standard material',
  category: 'materials',
  color: {
    primary: '#78716c',
    secondary: '#57534e'
  },
  inputs: [
      { id: 'color', name: 'Color', type: 'color' },
      { id: 'metalness', name: 'Metalness', type: 'number' },
      { id: 'roughness', name: 'Roughness', type: 'number' }
  ],
  outputs: [
    { id: 'material', name: 'Material', type: 'material' }
  ],
  parameters: [],
  execute: () => { return {}; }
};

export const basicMaterialNodeDefinition: NodeDefinition = {
    type: 'basic-material',
    name: 'Basic Material',
    description: 'Unlit material',
    category: 'materials',
    color: { primary: '#78716c', secondary: '#57534e' },
    inputs: [{ id: 'color', name: 'Color', type: 'color' }],
    outputs: [{ id: 'material', name: 'Material', type: 'material' }],
    parameters: [],
    execute: () => ({})
};

export const physicalMaterialNodeDefinition: NodeDefinition = {
    type: 'physical-material',
    name: 'Physical Material',
    description: 'Advanced PBR material',
    category: 'materials',
    color: { primary: '#78716c', secondary: '#57534e' },
    inputs: [],
    outputs: [{ id: 'material', name: 'Material', type: 'material' }],
    parameters: [],
    execute: () => ({})
};

export const emissiveMaterialNodeDefinition: NodeDefinition = {
    type: 'emissive-material',
    name: 'Emissive Material',
    description: 'Glowing material',
    category: 'materials',
    color: { primary: '#78716c', secondary: '#57534e' },
    inputs: [{ id: 'color', name: 'Color', type: 'color' }, { id: 'intensity', name: 'Intensity', type: 'number' }],
    outputs: [{ id: 'material', name: 'Material', type: 'material' }],
    parameters: [],
    execute: () => ({})
};
