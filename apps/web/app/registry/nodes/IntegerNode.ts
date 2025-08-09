import { NodeDefinition } from '../../types/nodeSystem';
import { Hash } from 'lucide-react';

// INTEGER INPUT NODE - Unified input system
export const integerNodeDefinition: NodeDefinition = {
  type: 'integer',
  name: 'Integer',
  description: 'Input an integer value',
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
      type: 'integer',
      description: 'Output integer value'
    }
  ],
  parameters: [
    {
      id: 'value',
      name: 'Value',
      type: 'integer',
      defaultValue: 0,
      min: -1000,
      max: 1000,
      step: 1,
      description: 'Integer value to output'
    }
  ],
  ui: {
    icon: Hash,
    width: 210,
    height: 120
  },
  execute: (inputs, parameters) => {
    // Get value from parameters only (user input)
    const value = parameters.value || 0;
    
    return {
      value: Math.floor(value) // Ensure it's an integer
    };
  }
};
