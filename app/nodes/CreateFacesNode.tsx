'use client';

import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CreateFacesNodeData } from '../types/nodes';
import { useNodeContext } from '../components/NodeContext';
import ParameterInput from '../components/ParameterInput';

interface CreateFacesNodeProps extends NodeProps {
  data: CreateFacesNodeData;
}

export default function CreateFacesNode({ data, id }: CreateFacesNodeProps) {
  const { faces, faceCount, label } = data;
  const { updateNodeData } = useNodeContext();
  const [showFaceList, setShowFaceList] = useState(false);

  const handleFaceCountChange = (newCount: number) => {
    const count = Math.max(1, Math.min(50, Math.floor(newCount))); // Limit to 1-50 faces
    
    // Adjust faces array to match new count
    const newFaces = [...faces];
    while (newFaces.length < count) {
      newFaces.push({ a: 0, b: 1, c: 2 }); // Default triangle
    }
    newFaces.length = count;
    
    updateNodeData(id, { faceCount: count, faces: newFaces });
  };

  const handleFaceChange = (index: number, newFace: { a: number; b: number; c: number; d?: number }) => {
    const newFaces = [...faces];
    newFaces[index] = newFace;
    updateNodeData(id, { faces: newFaces });
  };

  // Check if parameter has an input connection
  const hasInputConnection = (paramKey: string) => {
    return data.inputConnections && data.inputConnections[paramKey];
  };

  // Generate common face patterns
  const generatePattern = (pattern: 'triangle' | 'quad' | 'trianglePair' | 'strip') => {
    let newFaces: Array<{ a: number; b: number; c: number; d?: number }> = [];
    
    switch (pattern) {
      case 'triangle':
        newFaces = [
          { a: 0, b: 1, c: 2 }
        ];
        break;
      case 'quad':
        newFaces = [
          { a: 0, b: 1, c: 2, d: 3 }
        ];
        break;
      case 'trianglePair':
        newFaces = [
          { a: 0, b: 1, c: 2 },
          { a: 0, b: 2, c: 3 }
        ];
        break;
      case 'strip':
        // Triangle strip pattern
        newFaces = [
          { a: 0, b: 1, c: 2 },
          { a: 1, b: 3, c: 2 },
          { a: 2, b: 3, c: 4 },
          { a: 3, b: 5, c: 4 }
        ];
        break;
    }
    
    updateNodeData(id, { 
      faces: newFaces, 
      faceCount: newFaces.length 
    });
  };

  const renderFaceInput = (face: { a: number; b: number; c: number; d?: number }, index: number) => {
    const isQuad = face.d !== undefined;
    
    return (
      <div key={index} className="bg-gray-800/50 rounded p-2">
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs text-gray-400">Face {index}</div>
          <button
            onClick={() => {
              const newFace = isQuad 
                ? { a: face.a, b: face.b, c: face.c } // Convert to triangle
                : { a: face.a, b: face.b, c: face.c, d: face.c }; // Convert to quad
              handleFaceChange(index, newFace);
            }}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            {isQuad ? 'Tri' : 'Quad'}
          </button>
        </div>
        
        <div className="grid grid-cols-4 gap-1">
          <input
            type="number"
            value={face.a}
            onChange={(e) => handleFaceChange(index, { ...face, a: parseInt(e.target.value) || 0 })}
            className="w-full px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:border-indigo-400 focus:outline-none"
            min="0"
            placeholder="A"
          />
          <input
            type="number"
            value={face.b}
            onChange={(e) => handleFaceChange(index, { ...face, b: parseInt(e.target.value) || 0 })}
            className="w-full px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:border-indigo-400 focus:outline-none"
            min="0"
            placeholder="B"
          />
          <input
            type="number"
            value={face.c}
            onChange={(e) => handleFaceChange(index, { ...face, c: parseInt(e.target.value) || 0 })}
            className="w-full px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:border-indigo-400 focus:outline-none"
            min="0"
            placeholder="C"
          />
          {isQuad ? (
            <input
              type="number"
              value={face.d || 0}
              onChange={(e) => handleFaceChange(index, { ...face, d: parseInt(e.target.value) || 0 })}
              className="w-full px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:border-indigo-400 focus:outline-none"
              min="0"
              placeholder="D"
            />
          ) : (
            <div className="w-full px-1 py-1 text-xs bg-gray-600 border border-gray-500 rounded text-gray-400 text-center">
              -
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600/50 rounded-lg min-w-[250px] overflow-hidden backdrop-blur-sm"
         style={{
           boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 12px 24px rgba(0, 0, 0, 0.4), 0 6px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
         }}>

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-3 py-2 shadow-inner">
        <h3 className="text-sm font-semibold text-white tracking-wide">
          {label || 'Create Faces'}
        </h3>
      </div>

      {/* Parameters */}
      <div className="p-3 space-y-2">
        {/* Face Count */}
        <ParameterInput
          label="Count"
          value={faceCount}
          onChange={handleFaceCountChange}
          handleId="faceCount-in"
          nodeId={id}
          hasConnection={hasInputConnection('faceCount')}
          step={1}
          min={1}
          max={50}
        />

        {/* Pattern Presets */}
        <div>
          <label className="text-xs text-gray-300 mb-1 block">Presets</label>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => generatePattern('triangle')}
              className="px-2 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
            >
              Triangle
            </button>
            <button
              onClick={() => generatePattern('quad')}
              className="px-2 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
            >
              Quad
            </button>
            <button
              onClick={() => generatePattern('trianglePair')}
              className="px-2 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
            >
              Tri Pair
            </button>
            <button
              onClick={() => generatePattern('strip')}
              className="px-2 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
            >
              Strip
            </button>
          </div>
        </div>

        {/* Toggle Face List */}
        <button
          onClick={() => setShowFaceList(!showFaceList)}
          className="w-full text-xs text-gray-400 hover:text-gray-300 transition-colors flex items-center justify-center"
        >
          <span className={`mr-1 transition-transform ${showFaceList ? 'rotate-90' : ''}`}>▶</span>
          Edit Faces ({faces.length})
        </button>

        {/* Face List (when expanded) */}
        {showFaceList && (
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {faces.slice(0, 8).map((face, index) => renderFaceInput(face, index))}
            {faces.length > 8 && (
              <div className="text-xs text-gray-500 text-center">
                ... and {faces.length - 8} more faces
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-gray-500">
          Vertex indices define face topology
        </div>
      </div>

      {/* Output Handle - Faces (indigo socket for face data) */}
      <Handle
        type="source"
        position={Position.Right}
        id="faces-out"
        className="faces-handle rounded-full"
      />
    </div>
  );
} 