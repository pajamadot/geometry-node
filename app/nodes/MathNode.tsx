'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { useNodeContext } from '../components/NodeContext';
import { getSocketClassName } from '../types/connections';

export interface MathNodeData {
  id: string;
  type: 'math';
  label: string;
  operation: MathOperation;
  valueA: number;
  valueB: number;
  inputConnections?: Record<string, boolean>;
}

export type MathOperation = 
  | 'add' | 'subtract' | 'multiply' | 'divide' | 'power' | 'modulo'
  | 'sin' | 'cos' | 'tan' | 'asin' | 'acos' | 'atan'
  | 'sqrt' | 'abs' | 'floor' | 'ceil' | 'round'
  | 'min' | 'max' | 'clamp'
  | 'greater_than' | 'less_than' | 'equal';

const MATH_OPERATIONS: Record<MathOperation, {
  name: string;
  inputs: number;
  category: string;
  description: string;
  compute: (a: number, b?: number, c?: number) => number;
}> = {
  // Basic arithmetic
  add: {
    name: 'Add',
    inputs: 2,
    category: 'Arithmetic',
    description: 'A + B',
    compute: (a, b = 0) => a + b,
  },
  subtract: {
    name: 'Subtract', 
    inputs: 2,
    category: 'Arithmetic',
    description: 'A - B',
    compute: (a, b = 0) => a - b,
  },
  multiply: {
    name: 'Multiply',
    inputs: 2, 
    category: 'Arithmetic',
    description: 'A × B',
    compute: (a, b = 1) => a * b,
  },
  divide: {
    name: 'Divide',
    inputs: 2,
    category: 'Arithmetic', 
    description: 'A ÷ B',
    compute: (a, b = 1) => b !== 0 ? a / b : 0,
  },
  power: {
    name: 'Power',
    inputs: 2,
    category: 'Arithmetic',
    description: 'A ^ B',
    compute: (a, b = 1) => Math.pow(a, b),
  },
  modulo: {
    name: 'Modulo',
    inputs: 2,
    category: 'Arithmetic',
    description: 'A % B',
    compute: (a, b = 1) => b !== 0 ? a % b : 0,
  },
  
  // Trigonometry
  sin: {
    name: 'Sine',
    inputs: 1,
    category: 'Trigonometry',
    description: 'sin(A)',
    compute: (a) => Math.sin(a),
  },
  cos: {
    name: 'Cosine',
    inputs: 1,
    category: 'Trigonometry',
    description: 'cos(A)',
    compute: (a) => Math.cos(a),
  },
  tan: {
    name: 'Tangent',
    inputs: 1,
    category: 'Trigonometry',
    description: 'tan(A)',
    compute: (a) => Math.tan(a),
  },
  asin: {
    name: 'Arcsine',
    inputs: 1,
    category: 'Trigonometry',
    description: 'arcsin(A)',
    compute: (a) => Math.asin(Math.max(-1, Math.min(1, a))),
  },
  acos: {
    name: 'Arccosine',
    inputs: 1,
    category: 'Trigonometry',
    description: 'arccos(A)',
    compute: (a) => Math.acos(Math.max(-1, Math.min(1, a))),
  },
  atan: {
    name: 'Arctangent',
    inputs: 1,
    category: 'Trigonometry',
    description: 'arctan(A)',
    compute: (a) => Math.atan(a),
  },
  
  // Functions
  sqrt: {
    name: 'Square Root',
    inputs: 1,
    category: 'Functions',
    description: '√A',
    compute: (a) => Math.sqrt(Math.max(0, a)),
  },
  abs: {
    name: 'Absolute',
    inputs: 1,
    category: 'Functions',
    description: '|A|',
    compute: (a) => Math.abs(a),
  },
  floor: {
    name: 'Floor',
    inputs: 1,
    category: 'Functions',
    description: 'floor(A)',
    compute: (a) => Math.floor(a),
  },
  ceil: {
    name: 'Ceiling',
    inputs: 1,
    category: 'Functions',
    description: 'ceil(A)',
    compute: (a) => Math.ceil(a),
  },
  round: {
    name: 'Round',
    inputs: 1,
    category: 'Functions',
    description: 'round(A)',
    compute: (a) => Math.round(a),
  },
  
  // Comparison
  min: {
    name: 'Minimum',
    inputs: 2,
    category: 'Comparison',
    description: 'min(A, B)',
    compute: (a, b = 0) => Math.min(a, b),
  },
  max: {
    name: 'Maximum',
    inputs: 2,
    category: 'Comparison',
    description: 'max(A, B)',
    compute: (a, b = 0) => Math.max(a, b),
  },
  clamp: {
    name: 'Clamp',
    inputs: 3,
    category: 'Comparison',
    description: 'clamp(Value, Min, Max)',
    compute: (value, min = 0, max = 1) => Math.max(min, Math.min(max, value)),
  },
  greater_than: {
    name: 'Greater Than',
    inputs: 2,
    category: 'Comparison',
    description: 'A > B',
    compute: (a, b = 0) => a > b ? 1 : 0,
  },
  less_than: {
    name: 'Less Than',
    inputs: 2,
    category: 'Comparison',
    description: 'A < B',
    compute: (a, b = 0) => a < b ? 1 : 0,
  },
  equal: {
    name: 'Equal',
    inputs: 2,
    category: 'Comparison',
    description: 'A == B',
    compute: (a, b = 0) => Math.abs(a - b) < 0.0001 ? 1 : 0,
  },
};

interface MathNodeProps extends NodeProps {
  data: MathNodeData;
}

export default function MathNode({ data, id }: MathNodeProps) {
  const { operation, valueA, valueB, label } = data;
  const { updateNodeData } = useNodeContext();
  
  const operationInfo = MATH_OPERATIONS[operation];
  const needsSecondInput = operationInfo.inputs >= 2;
  const needsThirdInput = operationInfo.inputs >= 3;

  const handleOperationChange = (newOperation: MathOperation) => {
    updateNodeData(id, { operation: newOperation });
  };

  const handleValueChange = (key: 'valueA' | 'valueB', value: number) => {
    updateNodeData(id, { [key]: value });
  };

  // Check if parameter has an input connection
  const hasInputConnection = (paramKey: string) => {
    return data.inputConnections && data.inputConnections[paramKey];
  };

  // BLENDER BEHAVIOR: Alt+click on output handle to disconnect
  const handleOutputClick = (event: React.MouseEvent) => {
    if (event.altKey) {
      event.preventDefault();
      event.stopPropagation();
      
      // Dispatch custom event to remove connections from this handle
      const removeConnectionEvent = new CustomEvent('removeHandleConnection', {
        detail: { nodeId: id, handleId: 'result-out', handleType: 'source' }
      });
      window.dispatchEvent(removeConnectionEvent);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Arithmetic': return 'from-green-600 to-green-500';
      case 'Trigonometry': return 'from-blue-600 to-blue-500';
      case 'Functions': return 'from-purple-600 to-purple-500';
      case 'Comparison': return 'from-orange-600 to-orange-500';
      default: return 'from-gray-600 to-gray-500';
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600/50 rounded-lg min-w-[180px] overflow-hidden backdrop-blur-sm">
      
      {/* Input Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="valueA-in"
        className={getSocketClassName('number')}
        style={{ top: needsSecondInput ? '30%' : '50%' }}
      />
      
      {needsSecondInput && (
        <Handle
          type="target"
          position={Position.Left}
          id="valueB-in"
          className={getSocketClassName('number')}
          style={{ top: needsThirdInput ? '50%' : '70%' }}
        />
      )}
      
      {needsThirdInput && (
        <Handle
          type="target"
          position={Position.Left}
          id="valueC-in"
          className={getSocketClassName('number')}
          style={{ top: '70%' }}
        />
      )}

      {/* Header */}
      <div className={`bg-gradient-to-r ${getCategoryColor(operationInfo.category)} px-3 py-2`}>
        <h3 className="text-sm font-semibold text-white tracking-wide">
          {label || operationInfo.name}
        </h3>
        <div className="text-xs text-white/70">{operationInfo.category}</div>
      </div>

      {/* Parameters */}
      <div className="p-3 space-y-2">
        {/* Operation Selection */}
        <div>
          <label className="text-xs text-gray-300 mb-1 block">Operation</label>
          <select
            value={operation}
            onChange={(e) => handleOperationChange(e.target.value as MathOperation)}
            className="w-full px-2 py-1 text-xs bg-gray-600 border border-gray-500 rounded text-white focus:border-green-400 focus:outline-none"
          >
            {Object.entries(MATH_OPERATIONS).map(([key, info]) => (
              <option key={key} value={key}>
                {info.name} - {info.description}
              </option>
            ))}
          </select>
        </div>

        {/* Value A Input */}
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-300 flex-shrink-0 ml-4">
            {operationInfo.inputs === 1 ? 'Value' : 'A'}
          </label>
          {!hasInputConnection('valueA') && (
            <input
              type="number"
              value={valueA}
              onChange={(e) => handleValueChange('valueA', parseFloat(e.target.value) || 0)}
              className="w-16 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:border-green-400 focus:outline-none"
              step={0.1}
            />
          )}
          {hasInputConnection('valueA') && (
            <div className="w-16 px-1 py-1 text-xs bg-green-600/20 border border-green-500 rounded text-green-300 text-center">
              {valueA.toFixed(2)}
            </div>
          )}
        </div>

        {/* Value B Input */}
        {needsSecondInput && (
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-300 flex-shrink-0 ml-4">
              {needsThirdInput ? 'Min' : 'B'}
            </label>
            {!hasInputConnection('valueB') && (
              <input
                type="number"
                value={valueB}
                onChange={(e) => handleValueChange('valueB', parseFloat(e.target.value) || 0)}
                className="w-16 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:border-green-400 focus:outline-none"
                step={0.1}
              />
            )}
            {hasInputConnection('valueB') && (
              <div className="w-16 px-1 py-1 text-xs bg-green-600/20 border border-green-500 rounded text-green-300 text-center">
                {valueB.toFixed(2)}
              </div>
            )}
          </div>
        )}

        {/* Value C Input (for clamp) */}
        {needsThirdInput && (
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-300 flex-shrink-0 ml-4">Max</label>
            {!hasInputConnection('valueC') && (
              <input
                type="number"
                value={1} // Default max value for clamp
                onChange={(e) => updateNodeData(id, { valueC: parseFloat(e.target.value) || 1 })}
                className="w-16 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:border-green-400 focus:outline-none"
                step={0.1}
              />
            )}
            {hasInputConnection('valueC') && (
              <div className="w-16 px-1 py-1 text-xs bg-green-600/20 border border-green-500 rounded text-green-300 text-center">
                1.00
              </div>
            )}
          </div>
        )}

        {/* Operation Info */}
        <div className="text-xs text-gray-500 mt-2">
          {operationInfo.description}
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="result-out"
        className={getSocketClassName('number')}
        onClick={handleOutputClick}
      />
    </div>
  );
} 