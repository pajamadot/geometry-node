import { NodeDefinition } from '../../types/nodeSystem';
import { Hash } from 'lucide-react';

// FLOAT INPUT NODE - Unified input system
export const floatNodeDefinition: NodeDefinition = {
  type: 'float',
  name: 'Float',
  description: 'Input a float value',
  category: 'input',
  color: {
    primary: '#06b6d4',
    secondary: '#0891b2'
  },

  inputs: [], 
  outputs: [
    {
      id: 'value',
      name: 'Value',
      type: 'number',
      description: 'Output float value'
    }
  ],
  parameters: [
    {
      id: 'value',
      name: 'Value',
      type: 'number',
      defaultValue: 0,
      min: -1000,
      max: 1000,
      step: 0.1,
      description: 'Float value to output'
    }
  ],
  ui: {
    icon: Hash,
    width: 180,
    height: 120
  },
  execute: (inputs, parameters) => {
    // Get value from parameters only (user input)
    const value = parameters.value || 0;
    
    return {
      value: value
    };
  }
};
