'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { useNodeContext } from '../components/NodeContext';
import { getSocketClassName } from '../types/connections';

export interface VectorMathNodeData {
  id: string;
  type: 'vector-math';
  label: string;
  operation: VectorMathOperation;
  vectorA: { x: number; y: number; z: number };
  vectorB: { x: number; y: number; z: number };
  scale: number;
  inputConnections?: Record<string, boolean>;
}

export type VectorMathOperation = 
  | 'add' | 'subtract' | 'multiply' | 'divide' | 'cross_product' | 'dot_product'
  | 'normalize' | 'length' | 'distance' | 'scale' | 'reflect' | 'project'
  | 'mix' | 'snap' | 'floor' | 'ceil' | 'absolute' | 'minimum' | 'maximum';

const VECTOR_MATH_OPERATIONS: Record<VectorMathOperation, {
  name: string;
  inputs: number;
  outputType: 'vector' | 'number';
  category: string;
  description: string;
  compute: (a: { x: number; y: number; z: number }, b?: { x: number; y: number; z: number }, s?: number) => { x: number; y: number; z: number } | number;
}> = {
  // Basic arithmetic
  add: {
    name: 'Add',
    inputs: 2,
    outputType: 'vector',
    category: 'Arithmetic',
    description: 'A + B',
    compute: (a, b = { x: 0, y: 0, z: 0 }) => ({
      x: a.x + b.x,
      y: a.y + b.y,
      z: a.z + b.z
    }),
  },
  subtract: {
    name: 'Subtract',
    inputs: 2,
    outputType: 'vector', 
    category: 'Arithmetic',
    description: 'A - B',
    compute: (a, b = { x: 0, y: 0, z: 0 }) => ({
      x: a.x - b.x,
      y: a.y - b.y,
      z: a.z - b.z
    }),
  },
  multiply: {
    name: 'Multiply',
    inputs: 2,
    outputType: 'vector',
    category: 'Arithmetic', 
    description: 'A × B (component-wise)',
    compute: (a, b = { x: 1, y: 1, z: 1 }) => ({
      x: a.x * b.x,
      y: a.y * b.y,
      z: a.z * b.z
    }),
  },
  divide: {
    name: 'Divide',
    inputs: 2,
    outputType: 'vector',
    category: 'Arithmetic',
    description: 'A ÷ B (component-wise)',
    compute: (a, b = { x: 1, y: 1, z: 1 }) => ({
      x: b.x !== 0 ? a.x / b.x : 0,
      y: b.y !== 0 ? a.y / b.y : 0,
      z: b.z !== 0 ? a.z / b.z : 0
    }),
  },
  scale: {
    name: 'Scale',
    inputs: 2, // Vector + scalar
    outputType: 'vector',
    category: 'Arithmetic',
    description: 'A × scale',
    compute: (a, b, s = 1) => ({
      x: a.x * s,
      y: a.y * s,
      z: a.z * s
    }),
  },
  
  // Vector operations
  cross_product: {
    name: 'Cross Product',
    inputs: 2,
    outputType: 'vector',
    category: 'Vector',
    description: 'A × B (cross product)',
    compute: (a, b = { x: 0, y: 0, z: 1 }) => ({
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x
    }),
  },
  dot_product: {
    name: 'Dot Product',
    inputs: 2,
    outputType: 'number',
    category: 'Vector',
    description: 'A · B (dot product)',
    compute: (a, b = { x: 0, y: 0, z: 0 }) => a.x * b.x + a.y * b.y + a.z * b.z,
  },
  normalize: {
    name: 'Normalize',
    inputs: 1,
    outputType: 'vector',
    category: 'Vector',
    description: 'Unit vector of A',
    compute: (a) => {
      const length = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
      if (length === 0) return { x: 0, y: 0, z: 0 };
      return {
        x: a.x / length,
        y: a.y / length,
        z: a.z / length
      };
    },
  },
  length: {
    name: 'Length',
    inputs: 1,
    outputType: 'number',
    category: 'Vector',
    description: 'Length of vector A',
    compute: (a) => Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z),
  },
  distance: {
    name: 'Distance',
    inputs: 2,
    outputType: 'number',
    category: 'Vector',
    description: 'Distance between A and B',
    compute: (a, b = { x: 0, y: 0, z: 0 }) => {
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dz = a.z - b.z;
      return Math.sqrt(dx * dx + dy * dy + dz * dz);
    },
  },
  
  // Utility functions
  mix: {
    name: 'Mix',
    inputs: 3, // A, B, factor
    outputType: 'vector',
    category: 'Utility',
    description: 'Linear interpolation between A and B',
    compute: (a, b = { x: 0, y: 0, z: 0 }, factor = 0.5) => ({
      x: a.x + (b.x - a.x) * factor,
      y: a.y + (b.y - a.y) * factor,
      z: a.z + (b.z - a.z) * factor
    }),
  },
  snap: {
    name: 'Snap',
    inputs: 2,
    outputType: 'vector',
    category: 'Utility',
    description: 'Snap A to B increment',
    compute: (a, b = { x: 1, y: 1, z: 1 }) => ({
      x: b.x !== 0 ? Math.round(a.x / b.x) * b.x : a.x,
      y: b.y !== 0 ? Math.round(a.y / b.y) * b.y : a.y,
      z: b.z !== 0 ? Math.round(a.z / b.z) * b.z : a.z
    }),
  },
  floor: {
    name: 'Floor',
    inputs: 1,
    outputType: 'vector',
    category: 'Utility',
    description: 'Floor of each component',
    compute: (a) => ({
      x: Math.floor(a.x),
      y: Math.floor(a.y),
      z: Math.floor(a.z)
    }),
  },
  ceil: {
    name: 'Ceiling',
    inputs: 1,
    outputType: 'vector',
    category: 'Utility',
    description: 'Ceiling of each component',
    compute: (a) => ({
      x: Math.ceil(a.x),
      y: Math.ceil(a.y),
      z: Math.ceil(a.z)
    }),
  },
  absolute: {
    name: 'Absolute',
    inputs: 1,
    outputType: 'vector',
    category: 'Utility',
    description: 'Absolute value of each component',
    compute: (a) => ({
      x: Math.abs(a.x),
      y: Math.abs(a.y),
      z: Math.abs(a.z)
    }),
  },
  minimum: {
    name: 'Minimum',
    inputs: 2,
    outputType: 'vector',
    category: 'Utility',
    description: 'Component-wise minimum',
    compute: (a, b = { x: 0, y: 0, z: 0 }) => ({
      x: Math.min(a.x, b.x),
      y: Math.min(a.y, b.y),
      z: Math.min(a.z, b.z)
    }),
  },
  maximum: {
    name: 'Maximum',
    inputs: 2,
    outputType: 'vector',
    category: 'Utility',
    description: 'Component-wise maximum',
    compute: (a, b = { x: 0, y: 0, z: 0 }) => ({
      x: Math.max(a.x, b.x),
      y: Math.max(a.y, b.y),
      z: Math.max(a.z, b.z)
    }),
  },
  reflect: {
    name: 'Reflect',
    inputs: 2,
    outputType: 'vector',
    category: 'Vector',
    description: 'Reflect A across normal B',
    compute: (a, b = { x: 0, y: 1, z: 0 }) => {
      // Normalize the normal vector
      const length = Math.sqrt(b.x * b.x + b.y * b.y + b.z * b.z);
      if (length === 0) return a;
      const normal = { x: b.x / length, y: b.y / length, z: b.z / length };
      
      // R = A - 2 * (A · N) * N
      const dot = a.x * normal.x + a.y * normal.y + a.z * normal.z;
      return {
        x: a.x - 2 * dot * normal.x,
        y: a.y - 2 * dot * normal.y,
        z: a.z - 2 * dot * normal.z
      };
    },
  },
  project: {
    name: 'Project',
    inputs: 2,
    outputType: 'vector',
    category: 'Vector',
    description: 'Project A onto B',
    compute: (a, b = { x: 0, y: 1, z: 0 }) => {
      // Project A onto B: (A · B / |B|²) * B
      const dotProduct = a.x * b.x + a.y * b.y + a.z * b.z;
      const lengthSquared = b.x * b.x + b.y * b.y + b.z * b.z;
      
      if (lengthSquared === 0) return { x: 0, y: 0, z: 0 };
      
      const scale = dotProduct / lengthSquared;
      return {
        x: b.x * scale,
        y: b.y * scale,
        z: b.z * scale
      };
    },
  },
};

interface VectorMathNodeProps extends NodeProps {
  data: VectorMathNodeData;
}

export default function VectorMathNode({ data, id }: VectorMathNodeProps) {
  const { operation, vectorA, vectorB, scale, label } = data;
  const { updateNodeData } = useNodeContext();
  
  const operationInfo = VECTOR_MATH_OPERATIONS[operation];
  const needsSecondInput = operationInfo.inputs >= 2;
  const needsScalarInput = operation === 'scale' || operation === 'mix';

  const handleOperationChange = (newOperation: VectorMathOperation) => {
    updateNodeData(id, { operation: newOperation });
  };

  const handleVectorChange = (key: 'vectorA' | 'vectorB', value: { x: number; y: number; z: number }) => {
    updateNodeData(id, { [key]: value });
  };

  const handleScaleChange = (value: number) => {
    updateNodeData(id, { scale: value });
  };

  // Check if parameter has an input connection
  const hasInputConnection = (paramKey: string) => {
    return data.inputConnections && data.inputConnections[paramKey];
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Arithmetic': return 'from-blue-600 to-blue-500';
      case 'Vector': return 'from-indigo-600 to-indigo-500';
      case 'Utility': return 'from-teal-600 to-teal-500';
      default: return 'from-gray-600 to-gray-500';
    }
  };

  const renderVectorInput = (vector: { x: number; y: number; z: number }, key: 'vectorA' | 'vectorB', label: string) => {
    const connected = hasInputConnection(key);
    
    return (
      <div className="space-y-1">
        <label className="text-xs text-gray-300">{label}</label>
        {!connected && (
          <div className="grid grid-cols-3 gap-1">
            <input
              type="number"
              value={vector.x}
              onChange={(e) => handleVectorChange(key, { ...vector, x: parseFloat(e.target.value) || 0 })}
              className="px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-400 focus:outline-none"
              step={0.1}
              placeholder="X"
            />
            <input
              type="number"
              value={vector.y}
              onChange={(e) => handleVectorChange(key, { ...vector, y: parseFloat(e.target.value) || 0 })}
              className="px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-400 focus:outline-none"
              step={0.1}
              placeholder="Y"
            />
            <input
              type="number"
              value={vector.z}
              onChange={(e) => handleVectorChange(key, { ...vector, z: parseFloat(e.target.value) || 0 })}
              className="px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-400 focus:outline-none"
              step={0.1}
              placeholder="Z"
            />
          </div>
        )}
        {connected && (
          <div className="px-2 py-1 text-xs bg-blue-600/20 border border-blue-500 rounded text-blue-300 text-center">
            ({vector.x.toFixed(2)}, {vector.y.toFixed(2)}, {vector.z.toFixed(2)})
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600/50 rounded-lg min-w-[200px] overflow-hidden backdrop-blur-sm">
      
      {/* Input Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="vectorA-in"
        className={getSocketClassName('vector')}
        style={{ top: needsSecondInput ? '25%' : '40%' }}
      />
      
      {needsSecondInput && (
        <Handle
          type="target"
          position={Position.Left}
          id="vectorB-in"
          className={getSocketClassName('vector')}
          style={{ top: needsScalarInput ? '40%' : '55%' }}
        />
      )}
      
      {needsScalarInput && (
        <Handle
          type="target"
          position={Position.Left}
          id="scale-in"
          className={getSocketClassName('number')}
          style={{ top: '70%' }}
        />
      )}

      {/* Header */}
      <div className={`bg-gradient-to-r ${getCategoryColor(operationInfo.category)} px-3 py-2`}>
        <h3 className="text-sm font-semibold text-white tracking-wide">
          {label || operationInfo.name}
        </h3>
        <div className="text-xs text-white/70">Vector {operationInfo.category}</div>
      </div>

      {/* Parameters */}
      <div className="p-3 space-y-3">
        {/* Operation Selection */}
        <div>
          <label className="text-xs text-gray-300 mb-1 block">Operation</label>
          <select
            value={operation}
            onChange={(e) => handleOperationChange(e.target.value as VectorMathOperation)}
            className="w-full px-2 py-1 text-xs bg-gray-600 border border-gray-500 rounded text-white focus:border-blue-400 focus:outline-none"
          >
            {Object.entries(VECTOR_MATH_OPERATIONS).map(([key, info]) => (
              <option key={key} value={key}>
                {info.name} - {info.description}
              </option>
            ))}
          </select>
        </div>

        {/* Vector A Input */}
        {renderVectorInput(vectorA, 'vectorA', operationInfo.inputs === 1 ? 'Vector' : 'Vector A')}

        {/* Vector B Input */}
        {needsSecondInput && !needsScalarInput && renderVectorInput(vectorB, 'vectorB', 'Vector B')}
        
        {/* Scalar Input for scale/mix operations */}
        {needsScalarInput && (
          <div>
            <label className="text-xs text-gray-300">
              {operation === 'scale' ? 'Scale Factor' : 'Mix Factor'}
            </label>
            {!hasInputConnection('scale') && (
              <input
                type="number"
                value={scale || (operation === 'mix' ? 0.5 : 1)}
                onChange={(e) => handleScaleChange(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-400 focus:outline-none"
                step={0.1}
              />
            )}
            {hasInputConnection('scale') && (
              <div className="px-2 py-1 text-xs bg-green-600/20 border border-green-500 rounded text-green-300 text-center">
                {(scale || 1).toFixed(2)}
              </div>
            )}
          </div>
        )}

        {/* Operation Info */}
        <div className="text-xs text-gray-500">
          {operationInfo.description}
        </div>
        <div className="text-xs text-blue-400">
          Output: {operationInfo.outputType === 'vector' ? 'Vector' : 'Number'}
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="result-out"
        className={getSocketClassName(operationInfo.outputType)}
      />
    </div>
  );
} 