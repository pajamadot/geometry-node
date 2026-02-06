import * as pc from 'playcanvas';
import { NodeDefinition } from '../../types/nodes';
import { Flame } from 'lucide-react';

// LAVA MATERIAL NODE (PlayCanvas Implementation)
export const lavaMaterialNodeDefinition: NodeDefinition = {
  type: 'lava-material',
  name: 'Lava Material',
  description: 'Animated lava material (PlayCanvas)',
  category: 'materials',
  color: {
    primary: '#ff4500',
    secondary: '#dc2626'
  },
  inputs: [
    {
      id: 'hotColor',
      name: 'Hot Color',
      type: 'color',
      defaultValue: '#ff6600',
      description: 'Color of hot lava regions'
    },
    {
      id: 'coolColor',
      name: 'Cool Color',
      type: 'color',
      defaultValue: '#330000',
      description: 'Color of cooled lava regions'
    },
    // ... other params
  ],
  outputs: [
    {
      id: 'material',
      name: 'Material',
      type: 'material',
      description: 'Lava material'
    }
  ],
  parameters: [],
  ui: {
    icon: Flame,
    width: 260,
  },
  execute: (inputs, parameters) => {
    const parseColor = (colorInput: any) => {
        if (typeof colorInput === 'string' && colorInput.startsWith('#')) {
           const c = new pc.Color();
           c.fromString(colorInput);
           return c;
        }
        return new pc.Color(1, 0.4, 0);
    };

    const hotColor = parseColor(inputs.hotColor || '#ff6600');
    
    // Create standard material for lava (emissive)
    const material = new pc.StandardMaterial();
    material.diffuse = new pc.Color(0.1, 0.05, 0.05);
    material.emissive = hotColor;
    material.emissiveIntensity = 3.0;
    material.useMetalness = false;
    material.update();

    return { material };
  }
};
