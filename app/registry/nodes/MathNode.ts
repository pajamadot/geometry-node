import { NodeDefinition, SocketDefinition } from '../../types/nodeSystem';
import { Calculator } from 'lucide-react';

// Dynamic input generation based on operation type
const getMathInputs = (operation: string): SocketDefinition[] => {
  const baseInputs: SocketDefinition[] = [
    {
      id: 'valueA',
      name: 'X',
      type: 'numeric',
      defaultValue: 0,
      description: 'First operand'
    }
  ];

  // Operations that need two inputs
  const twoInputOperations = ['add', 'subtract', 'multiply', 'divide', 'power'];
  
  if (twoInputOperations.includes(operation)) {
    baseInputs.push({
      id: 'valueB',
      name: 'Y',
      type: 'numeric',
      defaultValue: 0,
      description: 'Second operand'
    });
  }

  return baseInputs;
};

// MATH NODE - Systematic layout with dynamic inputs
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
      name: 'X',
      type: 'numeric',
      defaultValue: 0,
      description: 'First operand'
    },
    {
      id: 'valueB',
      name: 'Y',
      type: 'numeric',
      defaultValue: 0,
      description: 'Second operand'
    },
    {
      id: 'operation',
      name: 'Operation',
      type: 'select',
      defaultValue: 'add',
      options: ['add', 'subtract', 'multiply', 'divide', 'power', 'sin', 'cos', 'sqrt', 'abs'],
      description: 'Mathematical operation to perform'
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
  parameters: [],
  ui: {
    icon: Calculator
  },
  execute: (inputs, parameters) => {
    // Get values from inputs (can come from UI or connections)
    const valueA = inputs.valueA || 0;
    const valueB = inputs.valueB || 0;
    const operation = inputs.operation || 'add';
    
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
    
    return { result: result };
  }
};

// Function to get dynamic inputs for a math node based on its current operation
export const getMathNodeInputs = (operation: string): SocketDefinition[] => {
  return getMathInputs(operation);
}; 