'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { JoinNodeData } from '../types/nodes';
import { useNodeContext } from '../components/NodeContext';

interface JoinNodeProps extends NodeProps {
  data: JoinNodeData;
}

export default function JoinNode({ data, id }: JoinNodeProps) {
  const { operation, label } = data;
  const { updateNodeData } = useNodeContext();

  const handleOperationChange = (newOperation: 'merge' | 'instance' | 'array') => {
    updateNodeData(id, { operation: newOperation });
  };

  // BLENDER BEHAVIOR: Alt+click on output handle to disconnect
  const handleOutputClick = (event: React.MouseEvent) => {
    if (event.altKey) {
      event.preventDefault();
      event.stopPropagation();
      
      // Dispatch custom event to remove connections from this handle
      const removeConnectionEvent = new CustomEvent('removeHandleConnection', {
        detail: { nodeId: id, handleId: 'geometry-out', handleType: 'source' }
      });
      window.dispatchEvent(removeConnectionEvent);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600/50 rounded-lg min-w-[160px] overflow-hidden backdrop-blur-sm"
         style={{
           boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 12px 24px rgba(0, 0, 0, 0.4), 0 6px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
         }}>
      {/* Input Handles - Multiple geometry inputs */}
      <Handle
        type="target"
        position={Position.Left}
        id="geometry-in-1"
        style={{ top: '30%' }}
        className="geometry-handle rounded-full"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="geometry-in-2"
        style={{ top: '50%' }}
        className="geometry-handle rounded-full"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="geometry-in-3"
        style={{ top: '70%' }}
        className="geometry-handle rounded-full"
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-3 py-2 shadow-inner">
        <h3 className="text-sm font-semibold text-white tracking-wide">
          {label || 'Join Geometry'}
        </h3>
      </div>

      {/* Operation Selection */}
      <div className="p-3">
        <div className="mb-2">
          <label className="text-xs text-gray-300 mb-1 block">Operation</label>
          <select
            value={operation}
            onChange={(e) => handleOperationChange(e.target.value as any)}
            className="w-full px-2 py-1 text-xs bg-gray-600 border border-gray-500 rounded text-white focus:border-purple-400 focus:outline-none"
          >
            <option value="merge">Merge</option>
            <option value="instance">Instance</option>
            <option value="array">Array</option>
          </select>
        </div>
      </div>

      {/* Output Handle - Geometry socket */}
      <Handle
        type="source"
        position={Position.Right}
        id="geometry-out"
        className="geometry-handle rounded-full"
        onClick={handleOutputClick}
      />
    </div>
  );
} 