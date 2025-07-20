'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { MergeGeometryNodeData } from '../types/nodes';
import { useNodeContext } from '../components/NodeContext';

interface MergeGeometryNodeProps extends NodeProps {
  data: MergeGeometryNodeData;
}

export default function MergeGeometryNode({ data, id }: MergeGeometryNodeProps) {
  const { computeNormals, generateUVs, label } = data;
  const { updateNodeData } = useNodeContext();

  const handleParameterChange = (key: string, value: boolean) => {
    updateNodeData(id, { [key]: value });
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600/50 rounded-lg min-w-[200px] overflow-hidden backdrop-blur-sm"
         style={{
           boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 12px 24px rgba(0, 0, 0, 0.4), 0 6px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
         }}>
      
      {/* Vertices Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="vertices-in"
        className="vertices-handle rounded-full"
        style={{ top: '25%' }}
      />

      {/* Faces Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="faces-in"
        className="faces-handle rounded-full"
        style={{ top: '50%' }}
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-500 px-3 py-2 shadow-inner">
        <h3 className="text-sm font-semibold text-white tracking-wide">
          {label || 'Merge Geometry'}
        </h3>
      </div>

      {/* Parameters */}
      <div className="p-3 space-y-2">
        {/* Compute Normals */}
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-300">Compute Normals</label>
          <input
            type="checkbox"
            checked={computeNormals}
            onChange={(e) => handleParameterChange('computeNormals', e.target.checked)}
            className="w-4 h-4 text-amber-600 bg-gray-700 border-gray-600 rounded focus:ring-amber-500 focus:ring-2"
          />
        </div>

        {/* Generate UVs */}
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-300">Generate UVs</label>
          <input
            type="checkbox"
            checked={generateUVs}
            onChange={(e) => handleParameterChange('generateUVs', e.target.checked)}
            className="w-4 h-4 text-amber-600 bg-gray-700 border-gray-600 rounded focus:ring-amber-500 focus:ring-2"
          />
        </div>

        {/* Info */}
        <div className="text-xs text-gray-500 mt-2">
          Combines vertices and faces into Three.js geometry
        </div>
      </div>

      {/* Output Handle - Geometry (geometry socket) */}
      <Handle
        type="source"
        position={Position.Right}
        id="geometry-out"
        className="geometry-handle rounded-full"
      />
    </div>
  );
} 