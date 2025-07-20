'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { DistributePointsNodeData } from '../types/nodes';
import { useNodeContext } from '../components/NodeContext';
import ParameterInput from '../components/ParameterInput';
import { createOutputHandleClickHandler } from '../utils/handleUtils';

interface DistributePointsNodeProps extends NodeProps {
  data: DistributePointsNodeData;
}

export default function DistributePointsNode({ data, id }: DistributePointsNodeProps) {
  const { distributeMethod, density, seed, distanceMin, label } = data;
  const { updateNodeData } = useNodeContext();

  const handleMethodChange = (newMethod: 'random' | 'poisson' | 'grid') => {
    updateNodeData(id, { distributeMethod: newMethod });
  };

  const handleParameterChange = (key: string, value: number) => {
    updateNodeData(id, { [key]: value });
  };

  // Check if parameter has an input connection
  const hasInputConnection = (paramKey: string) => {
    return data.inputConnections && data.inputConnections[paramKey];
  };

  // BLENDER BEHAVIOR: Alt+click on output handle to disconnect
  const handleOutputClick = createOutputHandleClickHandler(id, 'points-out');

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600/50 rounded-lg min-w-[200px] overflow-hidden backdrop-blur-sm"
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
      <div className="bg-gradient-to-r from-cyan-600 to-cyan-500 px-3 py-2 shadow-inner">
        <h3 className="text-sm font-semibold text-white tracking-wide">
          {label || 'Distribute Points'}
        </h3>
      </div>

      {/* Parameters */}
      <div className="p-3 space-y-2">
        {/* Distribution Method */}
        <div>
          <label className="text-xs text-gray-300 mb-1 block">Method</label>
          <select
            value={distributeMethod}
            onChange={(e) => handleMethodChange(e.target.value as any)}
            className="w-full px-2 py-1 text-xs bg-gray-600 border border-gray-500 rounded text-white focus:border-cyan-400 focus:outline-none"
          >
            <option value="random">Random</option>
            <option value="poisson">Poisson Disk</option>
            <option value="grid">Grid</option>
          </select>
        </div>

        {/* Density */}
        <ParameterInput
          label="Density"
          value={density}
          onChange={(value: number) => handleParameterChange('density', value)}
          handleId="density-in"
          nodeId={id}
          hasConnection={hasInputConnection('density')}
          step={1}
          min={1}
          max={1000}
        />

        {/* Seed */}
        <ParameterInput
          label="Seed"
          value={seed}
          onChange={(value: number) => handleParameterChange('seed', Math.floor(value))}
          handleId="seed-in"
          nodeId={id}
          hasConnection={hasInputConnection('seed')}
          step={1}
          min={0}
          max={10000}
        />

        {/* Distance Min (for Poisson) */}
        {distributeMethod === 'poisson' && (
          <ParameterInput
            label="Min Distance"
            value={distanceMin || 0.1}
            onChange={(value: number) => handleParameterChange('distanceMin', value)}
            handleId="distanceMin-in"
            nodeId={id}
            hasConnection={hasInputConnection('distanceMin')}
            step={0.01}
            min={0.001}
            max={1.0}
          />
        )}
      </div>

      {/* Output Handle - Points (special cyan socket for points) */}
      <Handle
        type="source"
        position={Position.Right}
        id="points-out"
        className="points-handle rounded-full"
        onClick={handleOutputClick}
      />
    </div>
  );
} 