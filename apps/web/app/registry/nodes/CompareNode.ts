import { NodeDefinition } from '../../types/nodeSystem';
import { Equal } from 'lucide-react';

// COMPARE NODE - Compares two values and outputs boolean result
export const compareNodeDefinition: NodeDefinition = {
  type: 'compare',
  name: 'Compare',
  description: 'Compares two values using various operators',
  category: 'control-flow',
  color: {
    primary: '#dc2626',
    secondary: '#b91c1c'
  },

  inputs: [
    {
      id: 'valueA',
      name: 'A',
      type: 'number',
      defaultValue: 0,
      description: 'First value to compare'
    },
    {
      id: 'valueB',
      name: 'B',
      type: 'number',
      defaultValue: 0,
      description: 'Second value to compare'
    }
  ],
  outputs: [
    {
      id: 'result',
      name: 'Result',
      type: 'boolean',
      description: 'Comparison result (true/false)'
    }
  ],
  parameters: [
    {
      id: 'operator',
      name: 'Operator',
      type: 'select',
      defaultValue: 'equal',
      options: ['equal', 'not_equal', 'greater', 'greater_equal', 'less', 'less_equal'],
      description: 'Comparison operator to use'
    }
  ],
  ui: {
    icon: Equal
  },
  execute: (inputs, parameters) => {
    const valueA = inputs.valueA || 0;
    const valueB = inputs.valueB || 0;
    const operator = parameters.operator || 'equal';
    
    let result: boolean;
    
    switch (operator) {
      case 'equal':
        result = valueA === valueB;
        break;
      case 'not_equal':
        result = valueA !== valueB;
        break;
      case 'greater':
        result = valueA > valueB;
        break;
      case 'greater_equal':
        result = valueA >= valueB;
        break;
      case 'less':
        result = valueA < valueB;
        break;
      case 'less_equal':
        result = valueA <= valueB;
        break;
      default:
        result = valueA === valueB;
    }
    
    return { result };
  }
};
