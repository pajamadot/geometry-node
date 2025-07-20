'use client';

import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CreateVerticesNodeData } from '../types/nodes';
import { useNodeContext } from '../components/NodeContext';
import ParameterInput from '../components/ParameterInput';
import VectorInput from '../components/VectorInput';

interface CreateVerticesNodeProps extends NodeProps {
  data: CreateVerticesNodeData;
}

export default function CreateVerticesNode({ data, id }: CreateVerticesNodeProps) {
  const { vertices, vertexCount, label } = data;
  const { updateNodeData } = useNodeContext();
  const [showVertexList, setShowVertexList] = useState(false);

  const handleVertexCountChange = (newCount: number) => {
    const count = Math.max(1, Math.min(100, Math.floor(newCount))); // Limit to 1-100 vertices
    
    // Adjust vertices array to match new count
    const newVertices = [...vertices];
    while (newVertices.length < count) {
      newVertices.push({ x: 0, y: 0, z: 0 });
    }
    newVertices.length = count;
    
    updateNodeData(id, { vertexCount: count, vertices: newVertices });
  };

  const handleVertexChange = (index: number, newVertex: { x: number; y: number; z: number }) => {
    const newVertices = [...vertices];
    newVertices[index] = newVertex;
    updateNodeData(id, { vertices: newVertices });
  };

  const handleParameterChange = (key: string, value: number) => {
    updateNodeData(id, { [key]: value });
  };

  // Check if parameter has an input connection
  const hasInputConnection = (paramKey: string) => {
    return data.inputConnections && data.inputConnections[paramKey];
  };

  // Generate common vertex patterns
  const generatePattern = (pattern: 'triangle' | 'quad' | 'line' | 'grid') => {
    let newVertices: Array<{ x: number; y: number; z: number }> = [];
    
    switch (pattern) {
      case 'triangle':
        newVertices = [
          { x: 0, y: 1, z: 0 },
          { x: -1, y: -1, z: 0 },
          { x: 1, y: -1, z: 0 }
        ];
        break;
      case 'quad':
        newVertices = [
          { x: -1, y: 1, z: 0 },
          { x: 1, y: 1, z: 0 },
          { x: 1, y: -1, z: 0 },
          { x: -1, y: -1, z: 0 }
        ];
        break;
      case 'line':
        newVertices = [
          { x: -1, y: 0, z: 0 },
          { x: 1, y: 0, z: 0 }
        ];
        break;
      case 'grid':
        for (let y = 0; y < 3; y++) {
          for (let x = 0; x < 3; x++) {
            newVertices.push({ x: x - 1, y: y - 1, z: 0 });
          }
        }
        break;
    }
    
    updateNodeData(id, { 
      vertices: newVertices, 
      vertexCount: newVertices.length 
    });
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600/50 rounded-lg min-w-[250px] overflow-hidden backdrop-blur-sm"
         style={{
           boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 12px 24px rgba(0, 0, 0, 0.4), 0 6px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
         }}>

      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-500 px-3 py-2 shadow-inner">
        <h3 className="text-sm font-semibold text-white tracking-wide">
          {label || 'Create Vertices'}
        </h3>
      </div>

      {/* Parameters */}
      <div className="p-3 space-y-2">
        {/* Vertex Count */}
        <ParameterInput
          label="Count"
          value={vertexCount}
          onChange={handleVertexCountChange}
          handleId="vertexCount-in"
          nodeId={id}
          hasConnection={hasInputConnection('vertexCount')}
          step={1}
          min={1}
          max={100}
        />

        {/* Pattern Presets */}
        <div>
          <label className="text-xs text-gray-300 mb-1 block">Presets</label>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => generatePattern('triangle')}
              className="px-2 py-1 text-xs bg-red-600 hover:bg-red-500 text-white rounded transition-colors"
            >
              Triangle
            </button>
            <button
              onClick={() => generatePattern('quad')}
              className="px-2 py-1 text-xs bg-red-600 hover:bg-red-500 text-white rounded transition-colors"
            >
              Quad
            </button>
            <button
              onClick={() => generatePattern('line')}
              className="px-2 py-1 text-xs bg-red-600 hover:bg-red-500 text-white rounded transition-colors"
            >
              Line
            </button>
            <button
              onClick={() => generatePattern('grid')}
              className="px-2 py-1 text-xs bg-red-600 hover:bg-red-500 text-white rounded transition-colors"
            >
              Grid 3×3
            </button>
          </div>
        </div>

        {/* Toggle Vertex List */}
        <button
          onClick={() => setShowVertexList(!showVertexList)}
          className="w-full text-xs text-gray-400 hover:text-gray-300 transition-colors flex items-center justify-center"
        >
          <span className={`mr-1 transition-transform ${showVertexList ? 'rotate-90' : ''}`}>▶</span>
          Edit Vertices ({vertices.length})
        </button>

        {/* Vertex List (when expanded) */}
        {showVertexList && (
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {vertices.slice(0, 10).map((vertex, index) => (
              <div key={index} className="bg-gray-800/50 rounded p-2">
                <div className="text-xs text-gray-400 mb-1">Vertex {index}</div>
                <VectorInput
                  label=""
                  value={vertex}
                  onChange={(value) => handleVertexChange(index, value)}
                  nodeId={id}
                  baseName={`vertex-${index}`}
                  hasConnections={{ x: false, y: false, z: false }}
                  step={0.1}
                  className="w-8"
                />
              </div>
            ))}
            {vertices.length > 10 && (
              <div className="text-xs text-gray-500 text-center">
                ... and {vertices.length - 10} more vertices
              </div>
            )}
          </div>
        )}
      </div>

      {/* Output Handle - Vertices (red socket for raw vertex data) */}
      <Handle
        type="source"
        position={Position.Right}
        id="vertices-out"
        className="vertices-handle rounded-full"
      />
    </div>
  );
} 