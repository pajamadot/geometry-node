'use client';

import React from 'react';
import { Handle, Position } from 'reactflow';
import NumberInput from './NumberInput';

interface VectorInputProps {
  label: string;
  value: { x: number; y: number; z: number };
  onChange: (value: { x: number; y: number; z: number }) => void;
  nodeId: string;
  baseName: string; // e.g., "position", "rotation", "scale"
  hasConnections: { x: boolean; y: boolean; z: boolean };
  step?: number;
  className?: string;
}

export default function VectorInput({
  label,
  value,
  onChange,
  nodeId,
  baseName,
  hasConnections,
  step = 0.1,
  className = ""
}: VectorInputProps) {
  const handleComponentChange = (component: 'x' | 'y' | 'z', newValue: number) => {
    onChange({
      ...value,
      [component]: newValue
    });
  };

  const renderComponent = (component: 'x' | 'y' | 'z', label: string, color: string) => {
    const hasConnection = hasConnections[component];
    const handleId = `${baseName}-${component}-in`;
    
    return (
      <div key={component} className="flex items-center justify-between relative">
        {/* Input Handle */}
        <Handle
          type="target"
          position={Position.Left}
          id={handleId}
          className={`number-handle rounded-full`}
          style={{ 
            left: '-8px',
            zIndex: hasConnection ? 1 : -1,
            opacity: hasConnection ? 1 : 0,
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        />
        
        <label className="text-xs text-gray-400 flex-shrink-0 w-3 ml-4">{label}</label>
        
        {/* Show input only when not connected */}
        {!hasConnection ? (
          <NumberInput
            value={value[component]}
            onChange={(newValue) => handleComponentChange(component, newValue)}
            className={`w-12 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-400 focus:outline-none ${className}`}
            step={step}
          />
        ) : (
          <div className="w-12 px-1 py-1 text-xs bg-cyan-600/20 border border-cyan-500 rounded text-cyan-300 text-center">
            {value[component].toFixed(2)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      <div className="text-xs text-gray-300 font-medium">{label}</div>
      <div className="space-y-1 pl-2">
        {renderComponent('x', 'X', 'bg-red-500 border-red-600')}
        {renderComponent('y', 'Y', 'bg-green-500 border-green-600')}
        {renderComponent('z', 'Z', 'bg-blue-500 border-blue-600')}
      </div>
    </div>
  );
} 