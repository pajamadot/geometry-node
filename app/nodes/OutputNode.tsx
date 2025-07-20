'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { OutputNodeData } from '../types/nodes';

interface OutputNodeProps extends NodeProps {
  data: OutputNodeData;
}

export default function OutputNode({ data, id }: OutputNodeProps) {
  const { label } = data;

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600/50 rounded-lg min-w-[140px] overflow-hidden backdrop-blur-sm"
         style={{
           boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 12px 24px rgba(0, 0, 0, 0.4), 0 6px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
         }}>
      {/* Input Handle - Geometry socket */}
      <Handle
        type="target"
        position={Position.Left}
        id="geometry-in"
        className="geometry-handle rounded-full"
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 px-3 py-2">
        <h3 className="text-sm font-semibold text-white tracking-wide">
          {label || 'Output'}
        </h3>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="text-xs text-gray-400 flex items-center space-x-2">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
          <span>Final result</span>
        </div>
      </div>
    </div>
  );
} 