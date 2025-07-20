'use client';

import React from 'react';
import { Handle, Position } from 'reactflow';
import NumberInput from './NumberInput';

interface ParameterInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  handleId: string;
  nodeId: string;
  hasConnection: boolean;
  liveValue?: number;
  step?: number;
  min?: number;
  max?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function ParameterInput({
  label,
  value,
  onChange,
  handleId,
  nodeId,
  hasConnection,
  liveValue,
  step = 0.1,
  min,
  max,
  className = "",
  style
}: ParameterInputProps) {
  return (
    <div className="flex items-center justify-between relative" style={style}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id={handleId}
        className="number-handle rounded-full"
        style={{ 
          left: '-8px',
          zIndex: hasConnection ? 1 : -1,
          opacity: hasConnection ? 1 : 0
        }}
      />
      
      <label className="text-xs text-gray-300 flex-shrink-0 ml-4">{label}</label>
      
      {/* Show input only when not connected */}
      {!hasConnection ? (
        <NumberInput
          value={value}
          onChange={onChange}
          className={`w-16 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:border-orange-400 focus:outline-none ${className}`}
          step={step}
          min={min}
          max={max}
        />
      ) : (
        <div className="w-16 px-1 py-1 text-xs bg-cyan-600/20 border border-cyan-500 rounded text-cyan-300 text-center">
          {(liveValue !== undefined ? liveValue : value).toFixed(2)}
        </div>
      )}
    </div>
  );
} 