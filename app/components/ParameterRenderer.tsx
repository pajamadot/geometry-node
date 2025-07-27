'use client';

import React from 'react';
import { Handle, Position } from 'reactflow';
import { ParameterDefinition, SOCKET_METADATA } from '../types/nodeSystem';
import NumberInput from './NumberInput';

interface ParameterRendererProps {
  definition: ParameterDefinition;
  value: any;
  liveValue?: any;
  hasConnection: boolean;
  nodeId: string;
  onChange: (value: any) => void;
}

export default function ParameterRenderer({
  definition,
  value,
  liveValue,
  hasConnection,
  nodeId,
  onChange
}: ParameterRendererProps) {
  const displayValue = liveValue !== undefined ? liveValue : value;
  
  // Handle Alt+click disconnection for parameter inputs
  const handleClick = (event: React.MouseEvent) => {
    if (event.altKey && hasConnection) {
      event.preventDefault();
      event.stopPropagation();
      
      const removeConnectionEvent = new CustomEvent('removeHandleConnection', {
        detail: { nodeId, handleId: `${definition.id}-in`, handleType: 'target' }
      });
      window.dispatchEvent(removeConnectionEvent);
    }
  };
  
  // Render based on parameter type
  const renderInput = () => {
    if (hasConnection) {
      // Show live value when connected
      return (
        <div className="w-16 px-2 py-1 text-xs bg-cyan-600/20 border border-cyan-500 rounded text-cyan-300 text-center">
          {formatDisplayValue(displayValue)}
        </div>
      );
    }
    
    switch (definition.type) {
      case 'number':
        return (
          <NumberInput
            value={value || definition.defaultValue}
            onChange={onChange}
            step={definition.step || 0.1}
            min={definition.min}
            max={definition.max}
          />
        );
        
      case 'integer':
        return (
          <NumberInput
            value={Math.floor(value || definition.defaultValue)}
            onChange={(val) => onChange(Math.floor(val))}
            step={1}
            min={definition.min}
            max={definition.max}
          />
        );
        
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={value || definition.defaultValue}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
          />
        );
        
      case 'string':
        return (
          <input
            type="text"
            value={value || definition.defaultValue}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:border-orange-400 focus:outline-none"
            placeholder={definition.description}
          />
        );
        
      case 'select':
        return (
          <select
            value={value || definition.defaultValue}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:border-orange-400 focus:outline-none"
          >
            {definition.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
        
      case 'vector':
        const vectorValue = value || definition.defaultValue || { x: 0, y: 0, z: 0 };
        return (
          <div className="flex gap-1">
            {(['x', 'y', 'z'] as const).map(component => (
              <div key={component} className="flex-1">
                <NumberInput
                  value={vectorValue[component]}
                  onChange={(val) => onChange({ ...vectorValue, [component]: val })}
                  step={definition.step || 0.1}
                />
              </div>
            ))}
          </div>
        );
        
      case 'color':
        return (
          <input
            type="color"
            value={value || definition.defaultValue}
            onChange={(e) => onChange(e.target.value)}
            className="w-8 h-6 border border-gray-600 rounded cursor-pointer"
          />
        );
        
      default:
        return (
          <div className="text-xs text-gray-500">Unsupported type: {definition.type}</div>
        );
    }
  };
  
  // Format display value for connected parameters
  const formatDisplayValue = (val: any): string => {
    if (typeof val === 'number') {
      // Show only 3 significant digits, remove trailing zeros
      const formatted = val.toFixed(3).replace(/\.?0+$/, '');
      return formatted === '' ? '0' : formatted;
    }
    if (typeof val === 'object' && val !== null) {
      if ('x' in val && 'y' in val && 'z' in val) {
        const formatComponent = (v: number) => v.toFixed(3).replace(/\.?0+$/, '');
        return `(${formatComponent(val.x)}, ${formatComponent(val.y)}, ${formatComponent(val.z)})`;
      }
      return JSON.stringify(val);
    }
    return String(val);
  };
  
  return (
    <div className="flex items-center justify-between relative">
      {/* Input Handle for parameters that can be connected */}
      {(definition.type === 'number' || definition.type === 'integer' || definition.type === 'vector') && (
        <Handle
          type="target"
          position={Position.Left}
          id={`${definition.id}-in`}
          className={`${SOCKET_METADATA[definition.type].className} rounded-full ${hasConnection ? 'connected' : ''}`}
          style={{ 
            left: '4px',
            zIndex: hasConnection ? 1 : -1,
            opacity: hasConnection ? 1 : 0
          }}
          onClick={handleClick}
        />
      )}
      
      <div className="flex items-center flex-1">
        <label className="text-xs text-gray-300 flex-shrink-0 w-20 ml-8" title={definition.description}>
          {definition.name}
        </label>
      </div>
      
      <div className="flex-shrink-0">
        {renderInput()}
      </div>
    </div>
  );
} 