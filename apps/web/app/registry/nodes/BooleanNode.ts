import { NodeDefinition } from '../../types/nodeSystem';
import { ToggleLeft } from 'lucide-react';

// BOOLEAN INPUT NODE - Unified input system
export const booleanNodeDefinition: NodeDefinition = {
  type: 'boolean',
  name: 'Boolean',
  description: 'Input a boolean value (true/false)',
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
      type: 'boolean',
      description: 'Output boolean value'
    }
  ],
  parameters: [
    {
      id: 'value',
      name: 'Value',
      type: 'boolean',
      defaultValue: false,
      description: 'Boolean value to output'
    }
  ],
  ui: {
    icon: ToggleLeft,
    width: 180,
    height: 120
  },
  execute: (inputs, parameters) => {
    // Get value from parameters only (user input)
    const value = parameters.value || false;
    
    return {
      value: Boolean(value) // Ensure it's a boolean
    };
  }
};
