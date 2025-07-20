'use client';

import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { NodeDefinition, SocketDefinition, ParameterDefinition, SOCKET_METADATA, CATEGORY_METADATA } from '../types/nodeSystem';
import { createOutputHandleClickHandler } from '../utils/handleUtils';
import ParameterRenderer from './ParameterRenderer';
import NumberInput from './NumberInput';

interface GenericNodeProps {
  id: string;
  definition: NodeDefinition;
  parameters: Record<string, any>;
  inputConnections: Record<string, boolean>;
  liveParameterValues: Record<string, any>;
  socketValues?: Record<string, any>;
  selected?: boolean;
  disabled?: boolean;
  onParameterChange: (parameterId: string, value: any) => void;
  onSocketValueChange?: (socketId: string, value: any) => void;
}

// Function to get dynamic inputs for specific node types
const getDynamicInputs = (definition: NodeDefinition, parameters: Record<string, any>): SocketDefinition[] => {
  // Math node dynamic inputs
  if (definition.type === 'math') {
    const operation = parameters.operation || 'add';
    const twoInputOperations = ['add', 'subtract', 'multiply', 'divide', 'power'];
    
    const baseInputs: SocketDefinition[] = [
      {
        id: 'valueA',
        name: 'X',
        type: 'number',
        defaultValue: 0,
        description: 'First operand'
      }
    ];
    
    if (twoInputOperations.includes(operation)) {
      baseInputs.push({
        id: 'valueB',
        name: 'Y',
        type: 'number',
        defaultValue: 0,
        description: 'Second operand'
      });
    }
    
    return baseInputs;
  }
  
  // Return original inputs for other node types
  return definition.inputs;
};

// Function to get formula for math operations
const getMathFormula = (operation: string): string => {
  switch (operation) {
    case 'add': return 'X + Y';
    case 'subtract': return 'X - Y';
    case 'multiply': return 'X × Y';
    case 'divide': return 'X ÷ Y';
    case 'power': return 'X^Y';
    case 'sin': return 'sin(X)';
    case 'cos': return 'cos(X)';
    case 'sqrt': return '√X';
    case 'abs': return '|X|';
    default: return 'X';
  }
};

// Component to render socket input with number box
const SocketInputRenderer = ({ 
  socket, 
  index, 
  totalInputs, 
  isConnected, 
  liveValue, 
  socketValue,
  nodeId, 
  onSocketValueChange 
}: {
  socket: SocketDefinition;
  index: number;
  totalInputs: number;
  isConnected: boolean;
  liveValue?: any;
  socketValue?: any;
  nodeId: string;
  onSocketValueChange: (socketId: string, value: any) => void;
}) => {
  const socketMeta = SOCKET_METADATA[socket.type];
  const topPercent = totalInputs === 1 ? 50 : (index / (totalInputs - 1)) * 80 + 10;
  const displayValue = liveValue !== undefined ? liveValue : socketValue ?? socket.defaultValue ?? 0;
  
  // Handle Alt+click disconnection
  const handleClick = (event: React.MouseEvent) => {
    if (event.altKey && isConnected) {
      event.preventDefault();
      event.stopPropagation();
      
      const removeConnectionEvent = new CustomEvent('removeHandleConnection', {
        detail: { nodeId, handleId: `${socket.id}-in`, handleType: 'target' }
      });
      window.dispatchEvent(removeConnectionEvent);
    }
  };

  // Format display value
  const formatDisplayValue = (val: any): string => {
    if (typeof val === 'number') {
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
    <div className="flex items-center" style={{ position: 'absolute', top: `${topPercent}%`, transform: 'translateY(-50%)', left: '4px', right: '4px' }}>
      {/* Socket Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id={`${socket.id}-in`}
        className={`${socketMeta.className} rounded-full ${isConnected ? 'connected' : ''}`}
        style={{
          position: 'absolute',
          left: '0px',
          zIndex: isConnected ? 1 : -1,
          opacity: isConnected ? 1 : 0
        }}
        onClick={handleClick}
      />
      
      {/* Space after pin */}
      <div className="w-6" />
      
      {/* Socket Label */}
      <div className="text-xs text-gray-400 flex-shrink-0 w-8">
        {socket.type === 'geometry' ? 'Geometry' : socket.name}
      </div>
      
      {/* Space before input box - skip for geometry inputs */}
      {socket.type !== 'geometry' && <div className="w-6" />}
      
      {/* Input Box - for all socket types except geometry */}
      {socket.type !== 'geometry' && (
        <div className="flex-1 max-w-20">
          {isConnected ? (
            // Show live value when connected (for non-geometry types)
            <div className="w-full px-2 py-1 text-xs bg-cyan-600/20 border border-cyan-500 rounded text-cyan-300 text-center">
              {formatDisplayValue(displayValue)}
            </div>
          ) : (
            // Editable input when not connected - only for number types
            (socket.type === 'number' || socket.type === 'integer') ? (
              <NumberInput
                value={displayValue}
                onChange={(value) => onSocketValueChange(socket.id, value)}
                className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:border-orange-400 focus:outline-none"
                step={socket.type === 'integer' ? 1 : 0.1}
              />
            ) : (
              // For other non-number types, show a placeholder or disabled input
              <div className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-gray-500 text-center">
                {socket.type}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default function GenericNode({
  id,
  definition,
  parameters,
  inputConnections,
  liveParameterValues,
  socketValues = {},
  selected,
  disabled,
  onParameterChange,
  onSocketValueChange
}: GenericNodeProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const categoryMeta = CATEGORY_METADATA[definition.category];
  
  // Calculate dynamic dimensions based on content
  const calculateNodeDimensions = () => {
    const baseMinWidth = 180; // Minimum width for any node
    const baseMinHeight = 80; // Minimum height for any node
    
    // Calculate width based on content
    let calculatedWidth = baseMinWidth;
    
    // Consider title length
    const titleWidth = definition.name.length * 8 + 60; // Rough estimate
    calculatedWidth = Math.max(calculatedWidth, titleWidth);
    
    // Consider input count
    const totalInputs = definition.inputs.length;
    if (totalInputs > 0) {
      calculatedWidth = Math.max(calculatedWidth, 200 + (totalInputs * 20));
    }
    
    // Consider output count
    const totalOutputs = definition.outputs.length;
    if (totalOutputs > 0) {
      calculatedWidth = Math.max(calculatedWidth, 200 + (totalOutputs * 20));
    }
    
    // Consider parameter count
    const totalParameters = definition.parameters.length;
    if (totalParameters > 0) {
      calculatedWidth = Math.max(calculatedWidth, 220 + (totalParameters * 15));
    }
    
    // Calculate height based on content with more compact calculations
    let calculatedHeight = baseMinHeight;
    
    // Title row
    calculatedHeight += 40;
    
    // Outputs row - more compact
    if (definition.outputs.length > 0) {
      calculatedHeight += definition.outputs.length === 1 ? 32 : Math.min(40, 24 + (definition.outputs.length * 8));
    }
    
    // Inputs row - more compact
    if (definition.inputs.length > 0) {
      calculatedHeight += definition.inputs.length === 1 ? 32 : Math.min(40, 24 + (definition.inputs.length * 8));
    }
    
    // Parameters section - more compact
    const mainParameters = definition.parameters.filter(p => !definition.ui?.advanced?.includes(p.id));
    const advancedParameters = definition.parameters.filter(p => definition.ui?.advanced?.includes(p.id));
    
    if (mainParameters.length > 0) {
      calculatedHeight += 24 + (mainParameters.length * 20); // More compact parameter spacing
    }
    
    if (advancedParameters.length > 0) {
      calculatedHeight += 20; // Advanced toggle - more compact
      if (showAdvanced) {
        calculatedHeight += advancedParameters.length * 20; // More compact advanced parameter spacing
      }
    }
    
    // Remove any extra padding at the bottom
    calculatedHeight = Math.max(baseMinHeight, calculatedHeight - 8); // Remove 8px bottom padding
    
    return {
      width: Math.min(calculatedWidth, 400), // Cap maximum width
      height: Math.min(calculatedHeight, 600) // Cap maximum height
    };
  };
  
  const { width, height } = calculateNodeDimensions();
  const hasAdvanced = definition.ui?.advanced && definition.ui.advanced.length > 0;
  
  // Get dynamic inputs based on current parameters
  const dynamicInputs = getDynamicInputs(definition, parameters);
  
  // Handle socket value changes
  const handleSocketValueChange = (socketId: string, value: any) => {
    if (onSocketValueChange) {
      onSocketValueChange(socketId, value);
    }
  };
  
  // Render output socket
  const renderOutputSocket = (socket: SocketDefinition, index: number) => {
    const socketMeta = SOCKET_METADATA[socket.type];
    
      // Calculate handle position - Blender style: outputs in first row
  const totalOutputs = definition.outputs.length;
  const topPercent = totalOutputs === 1 ? 50 : (index / (totalOutputs - 1)) * 80 + 10;
    
    const handleOutputClick = createOutputHandleClickHandler(id, `${socket.id}-out`);
    
    return (
      <Handle
        key={socket.id}
        type="source"
        position={Position.Right}
        id={`${socket.id}-out`}
        className={`${socketMeta.className} rounded-full`}
        style={{
          top: `${topPercent}%`,
          right: '4px',
          zIndex: 1,
          opacity: 1
        }}
        onClick={handleOutputClick}
      />
    );
  };
  
  // Group parameters by category
  const groupedParameters = definition.parameters.reduce((groups, param) => {
    const category = param.category || 'main';
    if (!groups[category]) groups[category] = [];
    groups[category].push(param);
    return groups;
  }, {} as Record<string, ParameterDefinition[]>);
  
  // Separate advanced parameters
  const advancedParamIds = new Set(definition.ui?.advanced || []);
  const mainParameters = definition.parameters.filter(p => !advancedParamIds.has(p.id));
  const advancedParameters = definition.parameters.filter(p => advancedParamIds.has(p.id));
  
  return (
    <div 
      className={`bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600/50 rounded-lg overflow-hidden backdrop-blur-sm ${
        selected ? 'ring-2 ring-blue-400' : ''
      } ${disabled ? 'opacity-50' : ''}`}
      style={{
        minWidth: `${width}px`,
        minHeight: `${height}px`,
        width: `${width}px`,
        height: `${height}px`,
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 12px 24px rgba(0, 0, 0, 0.4), 0 6px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Header */}
      <div 
        className={`bg-gradient-to-r from-${categoryMeta.color}-600 to-${categoryMeta.color}-500 px-3 py-3`}
        style={{
          background: `linear-gradient(to right, ${definition.color.primary}, ${definition.color.secondary})`,
          minHeight: '40px'
        }}
      >
        <h3 
          className="text-sm font-semibold text-white tracking-wide flex items-center gap-2 cursor-help"
          title={definition.description}
        >
          {definition.ui?.icon && (
            <span className="flex items-center">
              {typeof definition.ui.icon === 'string' ? (
                <span>{definition.ui.icon}</span>
              ) : (
                <definition.ui.icon size={16} />
              )}
            </span>
          )}
          {definition.name}
        </h3>
      </div>
      
      {/* Output Sockets Row (First row below title) */}
      {definition.outputs.length > 0 && (
        <div className="h-8 flex items-center justify-end px-3 border-b border-slate-600/30 relative">
          {definition.outputs.map((socket, index) => renderOutputSocket(socket, index))}
          {/* Output Labels - aligned with socket handles */}
          {definition.outputs.map((socket, index) => {
            const totalOutputs = definition.outputs.length;
            const topPercent = totalOutputs === 1 ? 50 : (index / (totalOutputs - 1)) * 80 + 10;
            
            return (
              <div
                key={`label-${socket.id}`}
                className="text-xs text-gray-400 absolute right-8"
                style={{ 
                  top: `${topPercent}%`, 
                  transform: 'translateY(-50%)' 
                }}
              >
                {socket.name}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Input Sockets Row (Second row) */}
      {dynamicInputs.length > 0 && (
        <div className="h-8 flex items-center justify-start px-3 border-b border-slate-600/30 relative">
                     {/* Render socket inputs with number boxes */}
           {dynamicInputs.map((socket, index) => (
             <SocketInputRenderer
               key={socket.id}
               socket={socket}
               index={index}
               totalInputs={dynamicInputs.length}
               isConnected={inputConnections[socket.id] || false}
               liveValue={liveParameterValues[socket.id]}
               socketValue={socketValues[socket.id]}
               nodeId={id}
               onSocketValueChange={handleSocketValueChange}
             />
           ))}
          {/* Math Formula Display */}
          {definition.type === 'math' && (
            <div className="text-xs text-blue-400 absolute right-2 top-1/2 transform -translate-y-1/2 font-mono">
              {getMathFormula(parameters.operation || 'add')}
            </div>
          )}
        </div>
      )}
      
      {/* Parameters (Third row and beyond) */}
      {(mainParameters.length > 0 || advancedParameters.length > 0) && (
        <div className="px-3 py-2 space-y-2">
          {/* Group parameters by category */}
          {Object.entries(groupedParameters).map(([category, params]) => (
            <div key={category} className="space-y-1">
              {/* Category header for non-main categories */}
              {category !== 'main' && (
                <div className="text-xs font-medium text-gray-400 border-b border-gray-600/30 pb-1">
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </div>
              )}
              
              {/* Parameters in this category */}
              {params.map(param => (
                <ParameterRenderer
                  key={param.id}
                  definition={param}
                  value={parameters[param.id]}
                  liveValue={liveParameterValues[param.id]}
                  hasConnection={inputConnections[param.id] || false}
                  nodeId={id}
                  onChange={(value: any) => onParameterChange(param.id, value)}
                />
              ))}
            </div>
          ))}
          
          {/* Advanced Toggle */}
          {hasAdvanced && (
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <span className={`transform transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>▶</span>
              Advanced ({advancedParameters.length})
            </button>
          )}
          
          {/* Advanced Parameters */}
          {showAdvanced && advancedParameters.map(param => (
            <ParameterRenderer
              key={param.id}
              definition={param}
              value={parameters[param.id]}
              liveValue={liveParameterValues[param.id]}
              hasConnection={inputConnections[param.id] || false}
              nodeId={id}
              onChange={(value: any) => onParameterChange(param.id, value)}
            />
          ))}
        </div>
      )}
    </div>
  );
} 