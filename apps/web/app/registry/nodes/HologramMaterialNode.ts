import * as pc from 'playcanvas';
import { NodeDefinition } from '../../types/nodes';
import { Zap } from 'lucide-react';
import { createDefaultMaterial } from '../../utils/nodeCompiler';

// HOLOGRAM MATERIAL NODE (PlayCanvas Implementation)
export const hologramMaterialNodeDefinition: NodeDefinition = {
  type: 'hologram-material',
  name: 'Hologram Material',
  description: 'Futuristic hologram/force field material (PlayCanvas)',
  category: 'materials',
  color: {
    primary: '#06ffa5',
    secondary: '#00d285'
  },
  inputs: [
    {
      id: 'hologramColor',
      name: 'Hologram Color',
      type: 'color',
      defaultValue: '#00ffff',
      description: 'Main hologram color'
    },
    // ... other params can be used for shader uniforms if implemented
  ],
  outputs: [
    {
      id: 'material',
      name: 'Material',
      type: 'material',
      description: 'Hologram material'
    }
  ],
  parameters: [],
  ui: {
    icon: Zap,
    width: 260,
  },
  execute: (inputs, parameters) => {
    const parseColor = (colorInput: any) => {
      if (typeof colorInput === 'string' && colorInput.startsWith('#')) {
         const c = new pc.Color();
         c.fromString(colorInput);
         return c;
      }
      return new pc.Color(0, 1, 1);
    };

    const hologramColor = parseColor(inputs.hologramColor || '#00ffff');

    // Create a StandardMaterial with emission and opacity to simulate hologram
    // For a true hologram, we would need a custom shader chunks, but StandardMaterial covers basics.
    const material = new pc.StandardMaterial();
    material.diffuse = new pc.Color(0, 0, 0); // Black diffuse
    material.emissive = hologramColor;
    material.emissiveIntensity = 2.0;
    material.opacity = 0.5;
    material.blendType = pc.BLEND_ADDITIVE;
    material.cull = pc.CULLFACE_NONE;
    material.update();

    return { material };
  }
};
