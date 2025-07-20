'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { SubdivideMeshNodeData } from '../types/nodes';
import { useNodeContext } from '../components/NodeContext';
import ParameterInput from '../components/ParameterInput';

interface SubdivideMeshNodeProps extends NodeProps {
  data: SubdivideMeshNodeData;
}

export default function SubdivideMeshNode({ data, id }: SubdivideMeshNodeProps) {
  const { level, label } = data;
  const { updateNodeData } = useNodeContext();

  const handleParameterChange = (key: string, value: number) => {
    updateNodeData(id, { [key]: value });
  };

  // Check if parameter has an input connection
  const hasInputConnection = (paramKey: string) => {
    return data.inputConnections && data.inputConnections[paramKey];
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600/50 rounded-lg min-w-[180px] overflow-hidden backdrop-blur-sm"
         style={{
           boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 12px 24px rgba(0, 0, 0, 0.4), 0 6px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
         }}>
      
      {/* Geometry Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="geometry-in"
        className="geometry-handle rounded-full"
        style={{ top: '24px' }}
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-violet-500 px-3 py-2 shadow-inner">
        <h3 className="text-sm font-semibold text-white tracking-wide">
          {label || 'Subdivide Mesh'}
        </h3>
      </div>

      {/* Parameters */}
      <div className="p-3">
        <ParameterInput
          label="Level"
          value={level}
          onChange={(value: number) => handleParameterChange('level', Math.floor(Math.max(0, value)))}
          handleId="level-in"
          nodeId={id}
          hasConnection={hasInputConnection('level')}
          step={1}
          min={0}
          max={6}
        />
        
        {level > 3 && (
          <div className="mt-2 p-2 bg-yellow-900/30 border border-yellow-700 rounded text-xs">
            <div className="text-yellow-400 font-semibold">⚠️ High subdivision level</div>
            <div className="text-gray-300 text-xs">
              May cause performance issues
            </div>
          </div>
        )}
      </div>

      {/* Output Handle - Geometry socket */}
      <Handle
        type="source"
        position={Position.Right}
        id="geometry-out"
        className="geometry-handle rounded-full"
      />
    </div>
  );
} 