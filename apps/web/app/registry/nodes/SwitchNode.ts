import { NodeDefinition } from '../../types/nodeSystem';
import { GitBranch } from 'lucide-react';

// SWITCH NODE - Conditional output selection
export const switchNodeDefinition: NodeDefinition = {
  type: 'switch',
  name: 'Switch',
  description: 'Selects output based on condition (true/false)',
  category: 'control-flow',
  color: {
    primary: '#dc2626',
    secondary: '#b91c1c'
  },

  inputs: [
    {
      id: 'condition',
      name: 'Condition',
      type: 'boolean',
      defaultValue: true,
      description: 'Condition to evaluate'
    },
    {
      id: 'trueValue',
      name: 'True',
      type: 'number',
      defaultValue: 1,
      description: 'Output when condition is true'
    },
    {
      id: 'falseValue',
      name: 'False',
      type: 'number',
      defaultValue: 0,
      description: 'Output when condition is false'
    }
  ],
  outputs: [
    {
      id: 'result',
      name: 'Result',
      type: 'number',
      description: 'Selected value based on condition'
    }
  ],
  parameters: [],
  ui: {
    icon: GitBranch
  },
  execute: (inputs, parameters) => {
    const condition = inputs.condition || false;
    const trueValue = inputs.trueValue || 1;
    const falseValue = inputs.falseValue || 0;
    
    // Return trueValue if condition is true, falseValue otherwise
    const result = condition ? trueValue : falseValue;
    
    return { result };
  }
};
