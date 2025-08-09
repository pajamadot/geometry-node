import { NodeDefinition } from '../../types/nodeSystem';
import { TrendingUp } from 'lucide-react';

// SMOOTH STEP NODE - Smooth interpolation between values
export const smoothStepNodeDefinition: NodeDefinition = {
  type: 'smooth-step',
  name: 'Smooth Step',
  description: 'Smooth interpolation between values using cubic Hermite interpolation',
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
      description: 'Input value to interpolate'
    },
    {
      id: 'edge0',
      name: 'Edge 0',
      type: 'number',
      defaultValue: 0,
      description: 'Lower edge of the transition'
    },
    {
      id: 'edge1',
      name: 'Edge 1',
      type: 'number',
      defaultValue: 1,
      description: 'Upper edge of the transition'
    }
  ],
  outputs: [
    {
      id: 'result',
      name: 'Result',
      type: 'number',
      description: 'Smoothly interpolated value'
    }
  ],
  parameters: [
    {
      id: 'clamp',
      name: 'Clamp',
      type: 'boolean',
      defaultValue: true,
      description: 'Clamp the result to [0, 1] range'
    }
  ],
  ui: {
    icon: TrendingUp
  },
  execute: (inputs, parameters) => {
    const value = inputs.value || 0;
    const edge0 = inputs.edge0 || 0;
    const edge1 = inputs.edge1 || 1;
    const clamp = parameters.clamp !== false; // Default to true
    
    // Avoid division by zero
    if (edge1 === edge0) {
      return { result: clamp ? 0 : value };
    }
    
    // Calculate t in [0, 1] range
    let t = (value - edge0) / (edge1 - edge0);
    
    // Clamp t to [0, 1] if requested
    if (clamp) {
      t = Math.max(0, Math.min(1, t));
    }
    
    // Smooth step function: t * t * (3 - 2 * t)
    // This is equivalent to: 3t² - 2t³
    const result = t * t * (3 - 2 * t);
    
    return { result };
  }
};
