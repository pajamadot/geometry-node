'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { InstanceOnPointsNodeData } from '../types/nodes';
import { useNodeContext } from '../components/NodeContext';
import ParameterInput from '../components/ParameterInput';
import VectorInput from '../components/VectorInput';
import { createOutputHandleClickHandler } from '../utils/handleUtils';

interface InstanceOnPointsNodeProps extends NodeProps {
  data: InstanceOnPointsNodeData;
}

export default function InstanceOnPointsNode({ data, id }: InstanceOnPointsNodeProps) {
  const { pickInstance, instanceIndex, rotation, scale, label } = data;
  const { updateNodeData } = useNodeContext();

  const handleParameterChange = (key: string, value: number | boolean) => {
    updateNodeData(id, { [key]: value });
  };

  const handleVectorChange = (
    type: 'rotation' | 'scale',
    value: { x: number; y: number; z: number }
  ) => {
    updateNodeData(id, { [type]: value });
  };

  // Check if parameter has an input connection
  const hasInputConnection = (paramKey: string) => {
    return data.inputConnections && data.inputConnections[paramKey];
  };

  const getConnections = (type: string) => ({
    x: hasInputConnection(`${type}-x`),
    y: hasInputConnection(`${type}-y`),
    z: hasInputConnection(`${type}-z`)
  });

  // BLENDER BEHAVIOR: Alt+click on output handle to disconnect
  const handleOutputClick = createOutputHandleClickHandler(id, 'instances-out');

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600/50 rounded-lg min-w-[220px] overflow-hidden backdrop-blur-sm"
         style={{
           boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 12px 24px rgba(0, 0, 0, 0.4), 0 6px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
         }}>
      
      {/* Points Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="points-in"
        className="points-handle rounded-full"
        style={{ top: '20%' }}
      />

      {/* Instance Geometry Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="instance-in"
        className="geometry-handle rounded-full"
        style={{ top: '40%' }}
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-3 py-2 shadow-inner">
        <h3 className="text-sm font-semibold text-white tracking-wide">
          {label || 'Instance on Points'}
        </h3>
      </div>

      {/* Parameters */}
      <div className="p-3 space-y-2">
        {/* Pick Instance Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-300">Pick Instance</label>
          <input
            type="checkbox"
            checked={pickInstance}
            onChange={(e) => handleParameterChange('pickInstance', e.target.checked)}
            className="w-4 h-4 text-emerald-600 bg-gray-700 border-gray-600 rounded focus:ring-emerald-500 focus:ring-2"
          />
        </div>

        {/* Instance Index (if Pick Instance is enabled) */}
        {pickInstance && (
          <ParameterInput
            label="Instance Index"
            value={instanceIndex}
            onChange={(value: number) => handleParameterChange('instanceIndex', Math.floor(value))}
            handleId="instanceIndex-in"
            nodeId={id}
            hasConnection={hasInputConnection('instanceIndex')}
            step={1}
            min={0}
          />
        )}

        {/* Rotation */}
        <VectorInput
          label="Rotation"
          value={rotation}
          onChange={(value) => handleVectorChange('rotation', value)}
          nodeId={id}
          baseName="rotation"
          hasConnections={getConnections('rotation')}
          step={0.1}
        />

        {/* Scale */}
        <VectorInput
          label="Scale"
          value={scale}
          onChange={(value) => handleVectorChange('scale', value)}
          nodeId={id}
          baseName="scale"
          hasConnections={getConnections('scale')}
          step={0.1}
        />
      </div>

      {/* Output Handle - Instances (geometry socket) */}
      <Handle
        type="source"
        position={Position.Right}
        id="instances-out"
        className="instances-handle rounded-full"
        onClick={handleOutputClick}
      />
    </div>
  );
} 