import { NodeDefinition } from '../../types/nodeSystem';
import { Minus } from 'lucide-react';

// CLAMP NODE - Clamps a value between minimum and maximum bounds
export const clampNodeDefinition: NodeDefinition = {
  type: 'clamp',
  name: 'Clamp',
  description: 'Clamps a value between minimum and maximum bounds',
  category: 'math',
  color: {
    primary: '#16a34a',
    secondary: '#15803d'
  },

  inputs: [
    {
      id: 'value',
      name: 'Value',
      type: 'number',
      defaultValue: 0.5,
      description: 'Input value to clamp'
    },
    {
      id: 'min',
      name: 'Min',
      type: 'number',
      defaultValue: 0,
      description: 'Minimum bound'
    },
    {
      id: 'max',
      name: 'Max',
      type: 'number',
      defaultValue: 1,
      description: 'Maximum bound'
    }
  ],
  outputs: [
    {
      id: 'result',
      name: 'Result',
      type: 'number',
      description: 'Clamped value'
    }
  ],
  parameters: [],
  ui: {
    icon: Minus
  },
  execute: (inputs, parameters) => {
    const value = inputs.value || 0;
    const min = inputs.min || 0;
    const max = inputs.max || 1;
    
    // Clamp the value between min and max
    const result = Math.max(min, Math.min(max, value));
    
    return { result };
  }
};
