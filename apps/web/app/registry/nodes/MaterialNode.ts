import { NodeDefinition } from '../../types/nodes';

export const standardMaterialNodeDefinition: NodeDefinition = {
  type: 'standard-material',
  name: 'Standard Material',
  description: 'Creates a standard PBR material',
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
  parameters: [
    { id: 'color', name: 'Color', type: 'color', defaultValue: '#808080' },
    { id: 'metalness', name: 'Metalness', type: 'number', defaultValue: 0.0, min: 0, max: 1 },
    { id: 'roughness', name: 'Roughness', type: 'number', defaultValue: 0.5, min: 0, max: 1 },
  ],
  execute: (inputs, parameters) => {
    const color = inputs.color ?? parameters.color ?? '#808080';
    const metalness = inputs.metalness ?? parameters.metalness ?? 0.0;
    const roughness = inputs.roughness ?? parameters.roughness ?? 0.5;
    return {
      material: {
        type: 'standard',
        color,
        metalness,
        roughness,
        opacity: 1.0,
      },
    };
  }
};

export const basicMaterialNodeDefinition: NodeDefinition = {
    type: 'basic-material',
    name: 'Basic Material',
    description: 'Unlit material with flat color',
    category: 'materials',
    color: { primary: '#78716c', secondary: '#57534e' },
    inputs: [{ id: 'color', name: 'Color', type: 'color' }],
    outputs: [{ id: 'material', name: 'Material', type: 'material' }],
    parameters: [
      { id: 'color', name: 'Color', type: 'color', defaultValue: '#ffffff' },
    ],
    execute: (inputs, parameters) => {
      const color = inputs.color ?? parameters.color ?? '#ffffff';
      return {
        material: {
          type: 'basic',
          color,
          unlit: true,
          opacity: 1.0,
        },
      };
    }
};

export const physicalMaterialNodeDefinition: NodeDefinition = {
    type: 'physical-material',
    name: 'Physical Material',
    description: 'Advanced PBR material with clearcoat and sheen',
    category: 'materials',
    color: { primary: '#78716c', secondary: '#57534e' },
    inputs: [],
    outputs: [{ id: 'material', name: 'Material', type: 'material' }],
    parameters: [
      { id: 'color', name: 'Color', type: 'color', defaultValue: '#808080' },
      { id: 'metalness', name: 'Metalness', type: 'number', defaultValue: 0.0, min: 0, max: 1 },
      { id: 'roughness', name: 'Roughness', type: 'number', defaultValue: 0.5, min: 0, max: 1 },
      { id: 'clearcoat', name: 'Clearcoat', type: 'number', defaultValue: 0.0, min: 0, max: 1 },
    ],
    execute: (_inputs, parameters) => {
      return {
        material: {
          type: 'physical',
          color: parameters.color ?? '#808080',
          metalness: parameters.metalness ?? 0.0,
          roughness: parameters.roughness ?? 0.5,
          clearcoat: parameters.clearcoat ?? 0.0,
          opacity: 1.0,
        },
      };
    }
};

export const emissiveMaterialNodeDefinition: NodeDefinition = {
    type: 'emissive-material',
    name: 'Emissive Material',
    description: 'Glowing material with emissive light',
    category: 'materials',
    color: { primary: '#78716c', secondary: '#57534e' },
    inputs: [{ id: 'color', name: 'Color', type: 'color' }, { id: 'intensity', name: 'Intensity', type: 'number' }],
    outputs: [{ id: 'material', name: 'Material', type: 'material' }],
    parameters: [
      { id: 'color', name: 'Color', type: 'color', defaultValue: '#ff6600' },
      { id: 'intensity', name: 'Intensity', type: 'number', defaultValue: 1.0, min: 0, max: 10 },
    ],
    execute: (inputs, parameters) => {
      const color = inputs.color ?? parameters.color ?? '#ff6600';
      const intensity = inputs.intensity ?? parameters.intensity ?? 1.0;
      return {
        material: {
          type: 'emissive',
          color,
          emissiveColor: color,
          emissiveIntensity: intensity,
          opacity: 1.0,
        },
      };
    }
};
