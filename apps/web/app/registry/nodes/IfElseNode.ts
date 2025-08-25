import { NodeDefinition } from '../../types/nodeSystem';
import { GitBranch } from 'lucide-react';

// IF/ELSE NODE - Conditional execution with two paths
export const ifElseNodeDefinition: NodeDefinition = {
  type: 'if-else',
  name: 'If/Else',
  description: 'Executes different paths based on condition',
  category: 'control',
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
      id: 'ifValue',
      name: 'If True',
      type: 'number',
      defaultValue: 1,
      description: 'Value when condition is true'
    },
    {
      id: 'elseValue',
      name: 'If False',
      type: 'number',
      defaultValue: 0,
      description: 'Value when condition is false'
    }
  ],
  outputs: [
    {
      id: 'result',
      name: 'Result',
      type: 'number',
      description: 'Selected value based on condition'
    },
    {
      id: 'executedPath',
      name: 'Path',
      type: 'string',
      description: 'Which path was executed ("if" or "else")'
    }
  ],
  parameters: [
    {
      id: 'strictMode',
      name: 'Strict Mode',
      type: 'boolean',
      defaultValue: false,
      description: 'Use strict boolean evaluation'
    }
  ],
  ui: {
    icon: GitBranch
  },
  execute: (inputs, parameters) => {
    const condition = inputs.condition || false;
    const ifValue = inputs.ifValue || 1;
    const elseValue = inputs.elseValue || 0;
    const strictMode = parameters.strictMode || false;
    
    // Evaluate condition
    let isTrue: boolean;
    if (strictMode) {
      // Strict mode: only true boolean values are considered true
      isTrue = condition === true;
    } else {
      // Normal mode: truthy values are considered true
      isTrue = Boolean(condition);
    }
    
    // Select result based on condition
    const result = isTrue ? ifValue : elseValue;
    const executedPath = isTrue ? 'if' : 'else';
    
    return { 
      result,
      executedPath
    };
  }
};
