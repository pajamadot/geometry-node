'use client';

import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { NodeDefinition, SocketDefinition, ParameterDefinition, SOCKET_METADATA, CATEGORY_METADATA } from '../types/nodeSystem';
import { createOutputHandleClickHandler } from '../utils/handleUtils';
import ParameterRenderer from './ParameterRenderer';

interface GenericNodeProps {
  id: string;
  definition: NodeDefinition;
  parameters: Record<string, any>;
  inputConnections: Record<string, boolean>;
  liveParameterValues: Record<string, any>;
  selected?: boolean;
  disabled?: boolean;
  onParameterChange: (parameterId: string, value: any) => void;
}

export default function GenericNode({
  id,
  definition,
  parameters,
  inputConnections,
  liveParameterValues,
  selected,
  disabled,
  onParameterChange
}: GenericNodeProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const categoryMeta = CATEGORY_METADATA[definition.category];
  
  // Calculate node dimensions based on content
  const baseWidth = definition.ui?.width || 200;
  const hasAdvanced = definition.ui?.advanced && definition.ui.advanced.length > 0;
  
  // Render input socket
  const renderInputSocket = (socket: SocketDefinition, index: number) => {
    const socketMeta = SOCKET_METADATA[socket.type];
    const isConnected = inputConnections[socket.id] || false;
    const liveValue = liveParameterValues[socket.id];
    
    // Calculate handle position - evenly distribute along left side
    const totalInputs = definition.inputs.length;
    const topPercent = totalInputs === 1 ? 50 : (index / (totalInputs - 1)) * 60 + 20;
    
    return (
      <Handle
        key={socket.id}
        type="target"
        position={Position.Left}
        id={`${socket.id}-in`}
        className={`${socketMeta.className} rounded-full ${isConnected ? 'connected' : ''}`}
        style={{
          top: `${topPercent}%`,
          left: '-8px',
          zIndex: isConnected ? 1 : -1,
          opacity: isConnected ? 1 : 0
        }}
        onClick={(event: React.MouseEvent) => {
          if (event.altKey && isConnected) {
            event.preventDefault();
            event.stopPropagation();
            
            const removeConnectionEvent = new CustomEvent('removeHandleConnection', {
              detail: { nodeId: id, handleId: `${socket.id}-in`, handleType: 'target' }
            });
            window.dispatchEvent(removeConnectionEvent);
          }
        }}
      />
    );
  };
  
  // Render output socket
  const renderOutputSocket = (socket: SocketDefinition, index: number) => {
    const socketMeta = SOCKET_METADATA[socket.type];
    
    // Calculate handle position - evenly distribute along right side
    const totalOutputs = definition.outputs.length;
    const topPercent = totalOutputs === 1 ? 50 : (index / (totalOutputs - 1)) * 60 + 20;
    
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
          right: '-8px'
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
        minWidth: `${baseWidth}px`,
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 12px 24px rgba(0, 0, 0, 0.4), 0 6px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Input Sockets */}
      {definition.inputs.map((socket, index) => renderInputSocket(socket, index))}
      
      {/* Output Sockets */}
      {definition.outputs.map((socket, index) => renderOutputSocket(socket, index))}
      
      {/* Header */}
      <div 
        className={`bg-gradient-to-r from-${categoryMeta.color}-600 to-${categoryMeta.color}-500 px-3 py-2`}
        style={{
          background: `linear-gradient(to right, ${definition.color.primary}, ${definition.color.secondary})`
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
      
      {/* Parameters */}
      {(mainParameters.length > 0 || advancedParameters.length > 0) && (
        <div className="p-3 space-y-2">
          {/* Main Parameters */}
          {mainParameters.map(param => (
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
      
      {/* Socket Labels */}
      <div className="px-3 pb-2">
        {/* Input Labels */}
        {definition.inputs.length > 1 && (
          <div className="space-y-0.5 mb-2">
            {definition.inputs.map((socket, index) => {
              const topPercent = definition.inputs.length === 1 ? 50 : (index / (definition.inputs.length - 1)) * 60 + 20;
              return (
                <div
                  key={socket.id}
                  className="text-xs text-gray-400 absolute left-2"
                  style={{ top: `${topPercent}%`, transform: 'translateY(-50%)' }}
                >
                  {socket.name}
                </div>
              );
            })}
          </div>
        )}
        
        {/* Output Labels */}
        {definition.outputs.length > 1 && (
          <div className="space-y-0.5">
            {definition.outputs.map((socket, index) => {
              const topPercent = definition.outputs.length === 1 ? 50 : (index / (definition.outputs.length - 1)) * 60 + 20;
              return (
                <div
                  key={socket.id}
                  className="text-xs text-gray-400 absolute right-2 text-right"
                  style={{ top: `${topPercent}%`, transform: 'translateY(-50%)' }}
                >
                  {socket.name}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 