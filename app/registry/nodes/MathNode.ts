import { NodeDefinition } from '../../types/nodeSystem';
import { Calculator } from 'lucide-react';

// MATH NODE - was 375+ lines, now 40 lines of data
export const mathNodeDefinition: NodeDefinition = {
  type: 'math',
  name: 'Math',
  description: 'Mathematical operations',
  category: 'math',
  color: {
    primary: '#16a34a',
    secondary: '#15803d'
  },
  inputs: [
    {
      id: 'valueA',
      name: 'A',
      type: 'number',
      defaultValue: 0,
      description: 'First operand'
    },
    {
      id: 'valueB',
      name: 'B',
      type: 'number',
      defaultValue: 0,
      description: 'Second operand'
    }
  ],
  outputs: [
    {
      id: 'result',
      name: 'Result',
      type: 'number',
      description: 'Mathematical result'
    }
  ],
  parameters: [
    {
      id: 'operation',
      name: 'Operation',
      type: 'select',
      defaultValue: 'add',
      options: ['add', 'subtract', 'multiply', 'divide', 'power', 'sin', 'cos', 'sqrt', 'abs'],
      description: 'Mathematical operation to perform'
    }
  ],
  ui: {
    width: 160,
    icon: Calculator
  },
  execute: (inputs, parameters) => {
    const { valueA = 0, valueB = 0 } = inputs;
    const { operation } = parameters;
    
    let result: number;
    switch (operation) {
      case 'add': result = valueA + valueB; break;
      case 'subtract': result = valueA - valueB; break;
      case 'multiply': result = valueA * valueB; break;
      case 'divide': result = valueB !== 0 ? valueA / valueB : 0; break;
      case 'power': result = Math.pow(valueA, valueB); break;
      case 'sin': result = Math.sin(valueA); break;
      case 'cos': result = Math.cos(valueA); break;
      case 'sqrt': result = Math.sqrt(valueA); break;
      case 'abs': result = Math.abs(valueA); break;
      default: result = valueA;
    }
    
    return { result };
  }
}; 