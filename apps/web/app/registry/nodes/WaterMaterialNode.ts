import * as pc from 'playcanvas';
import { NodeDefinition } from '../../types/nodes';
import { Waves } from 'lucide-react';

// WATER MATERIAL NODE
export const waterMaterialNodeDefinition: NodeDefinition = {
  type: 'water-material',
  name: 'Water Material',
  description: 'Procedural water material (PlayCanvas)',
  category: 'materials',
  color: {
    primary: '#0ea5e9',
    secondary: '#0284c7'
  },
  inputs: [
    {
      id: 'shallowColor',
      name: 'Shallow Color',
      type: 'color',
      defaultValue: '#40e0d0',
      description: 'Color of shallow water'
    },
    {
      id: 'deepColor',
      name: 'Deep Color',
      type: 'color',
      defaultValue: '#006994',
      description: 'Color of deep water'
    },
    // ... other params
  ],
  outputs: [
    {
      id: 'material',
      name: 'Material',
      type: 'material',
      description: 'Procedural water material'
    }
  ],
  parameters: [],
  ui: {
    icon: Waves,
    width: 280
  },
  execute: (inputs, parameters) => {
    const parseColor = (colorInput: any) => {
      if (typeof colorInput === 'string' && colorInput.startsWith('#')) {
        const c = new pc.Color();
        c.fromString(colorInput);
        return c;
      }
      return new pc.Color(1, 1, 1);
    };

    const shallowColor = parseColor(inputs.shallowColor || '#40e0d0');
    
    // Standard material with high gloss/reflection for water
    const material = new pc.StandardMaterial();
    material.diffuse = shallowColor;
    material.metalness = 0.1;
    material.gloss = 0.9; // High gloss for water reflection
    material.opacity = 0.6;
    material.blendType = pc.BLEND_NORMAL;
    material.useMetalness = true;
    
    // In a full implementation, we'd use custom chunks for waves
    
    material.update();

    return { material };
  }
};
