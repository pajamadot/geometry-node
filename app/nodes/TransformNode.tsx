'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { TransformNodeData } from '../types/nodes';
import { useNodeContext } from '../components/NodeContext';
import VectorInput from '../components/VectorInput';

interface TransformNodeProps extends NodeProps {
  data: TransformNodeData;
}

export default function TransformNode({ data, id }: TransformNodeProps) {
  const { transform, label } = data;
  const { updateNodeData } = useNodeContext();

  // Check if component has an input connection
  const hasInputConnection = (type: string, component?: string) => {
    const key = component ? `${type}-${component}` : type;
    return data.inputConnections && data.inputConnections[key];
  };

  const handleVectorChange = (
    type: 'position' | 'rotation' | 'scale',
    value: { x: number; y: number; z: number }
  ) => {
    const newTransform = {
      ...transform,
      [type]: value,
    };
    updateNodeData(id, { transform: newTransform });
  };

  const getConnections = (type: string) => ({
    x: hasInputConnection(type, 'x'),
    y: hasInputConnection(type, 'y'),
    z: hasInputConnection(type, 'z')
  });

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600/50 rounded-lg min-w-[220px] overflow-hidden backdrop-blur-sm"
         style={{
           boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 12px 24px rgba(0, 0, 0, 0.4), 0 6px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
         }}>
      {/* Main Geometry Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="geometry-in"
        className="geometry-handle rounded-full"
        style={{ top: '24px' }}
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-3 py-2 shadow-inner">
        <h3 className="text-sm font-semibold text-white tracking-wide">
          {label || 'Transform'}
        </h3>
      </div>

      {/* Transform Controls */}
      <div className="p-3 space-y-3">
        <VectorInput
          label="Position"
          value={transform.position}
          onChange={(value) => handleVectorChange('position', value)}
          nodeId={id}
          baseName="position"
          hasConnections={getConnections('position')}
          step={0.1}
        />
        <VectorInput
          label="Rotation"
          value={transform.rotation}
          onChange={(value) => handleVectorChange('rotation', value)}
          nodeId={id}
          baseName="rotation"
          hasConnections={getConnections('rotation')}
          step={0.1}
        />
        <VectorInput
          label="Scale"
          value={transform.scale}
          onChange={(value) => handleVectorChange('scale', value)}
          nodeId={id}
          baseName="scale"
          hasConnections={getConnections('scale')}
          step={0.1}
        />
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