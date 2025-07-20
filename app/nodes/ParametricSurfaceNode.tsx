'use client';

import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { ParametricSurfaceNodeData } from '../types/nodes';
import { useNodeContext } from '../components/NodeContext';
import NumberInput from '../components/NumberInput';

interface ParametricSurfaceNodeProps {
  data: ParametricSurfaceNodeData;
  id: string;
}

export default function ParametricSurfaceNode({ data, id }: ParametricSurfaceNodeProps) {
  const { 
    uFunction, 
    vFunction, 
    zFunction, 
    uMin, 
    uMax, 
    vMin, 
    vMax, 
    uSegments, 
    vSegments, 
    label 
  } = data;
  const { updateNodeData } = useNodeContext();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFunctionChange = (type: 'uFunction' | 'vFunction' | 'zFunction', value: string) => {
    updateNodeData(id, { [type]: value });
  };

  const handleParameterChange = (key: string, value: number) => {
    updateNodeData(id, { [key]: value });
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600/50 rounded-lg min-w-[280px] overflow-hidden backdrop-blur-sm"
         style={{
           boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 12px 24px rgba(0, 0, 0, 0.4), 0 6px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
         }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-3 py-2">
        <h3 className="text-sm font-semibold text-white tracking-wide">
          {label || 'Parametric Surface'}
        </h3>
      </div>

      {/* Parameters */}
      <div className="p-3 space-y-3">
        {/* Mathematical Functions */}
        <div className="space-y-2">
          <div className="text-xs text-gray-300 font-medium">Surface Equations</div>
          
          {/* X Function */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">X = f(u,v)</label>
            <input
              type="text"
              value={uFunction}
              onChange={(e) => handleFunctionChange('uFunction', e.target.value)}
              placeholder="Math.cos(u) * Math.sin(v)"
              className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white focus:border-purple-400 focus:outline-none font-mono"
            />
          </div>

          {/* Y Function */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Y = g(u,v)</label>
            <input
              type="text"
              value={vFunction}
              onChange={(e) => handleFunctionChange('vFunction', e.target.value)}
              placeholder="Math.sin(u) * Math.sin(v)"
              className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white focus:border-purple-400 focus:outline-none font-mono"
            />
          </div>

          {/* Z Function */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Z = h(u,v)</label>
            <input
              type="text"
              value={zFunction}
              onChange={(e) => handleFunctionChange('zFunction', e.target.value)}
              placeholder="Math.cos(v)"
              className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white focus:border-purple-400 focus:outline-none font-mono"
            />
          </div>
        </div>

        {/* Parameter Ranges */}
        <div className="space-y-2">
          <div className="text-xs text-gray-300 font-medium">Parameter Ranges</div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400 block mb-1">U Min</label>
              <NumberInput
                value={uMin}
                onChange={(value) => handleParameterChange('uMin', value)}
                className="w-full px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:border-purple-400 focus:outline-none"
                step={0.1}
                min={-50}
                max={50}
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">U Max</label>
              <NumberInput
                value={uMax}
                onChange={(value) => handleParameterChange('uMax', value)}
                className="w-full px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:border-purple-400 focus:outline-none"
                step={0.1}
                min={-50}
                max={50}
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">V Min</label>
              <NumberInput
                value={vMin}
                onChange={(value) => handleParameterChange('vMin', value)}
                className="w-full px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:border-purple-400 focus:outline-none"
                step={0.1}
                min={-50}
                max={50}
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">V Max</label>
              <NumberInput
                value={vMax}
                onChange={(value) => handleParameterChange('vMax', value)}
                className="w-full px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:border-purple-400 focus:outline-none"
                step={0.1}
                min={-50}
                max={50}
              />
            </div>
          </div>
        </div>

        {/* Quality Settings */}
        <div className="space-y-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-gray-400 hover:text-gray-300 transition-colors flex items-center"
          >
            <span className={`mr-1 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>▶</span>
            Quality Settings
          </button>
          
          {showAdvanced && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400 block mb-1">U Segments</label>
                <NumberInput
                  value={uSegments}
                  onChange={(value) => handleParameterChange('uSegments', Math.floor(value))}
                  className="w-full px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:border-purple-400 focus:outline-none"
                  step={1}
                  min={3}
                  max={200}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">V Segments</label>
                <NumberInput
                  value={vSegments}
                  onChange={(value) => handleParameterChange('vSegments', Math.floor(value))}
                  className="w-full px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:border-purple-400 focus:outline-none"
                  step={1}
                  min={3}
                  max={200}
                />
              </div>
            </div>
          )}
        </div>

        {/* Preset Examples */}
        <div className="space-y-2">
          <div className="text-xs text-gray-300 font-medium">Presets</div>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => {
                updateNodeData(id, {
                  uFunction: 'Math.cos(u) * Math.sin(v)',
                  vFunction: 'Math.sin(u) * Math.sin(v)',
                  zFunction: 'Math.cos(v)',
                  uMin: 0,
                  uMax: Math.PI * 2,
                  vMin: 0,
                  vMax: Math.PI
                });
              }}
              className="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors"
            >
              Sphere
            </button>
            <button
              onClick={() => {
                updateNodeData(id, {
                  uFunction: 'u',
                  vFunction: 'v',
                  zFunction: 'Math.sin(u) * Math.cos(v)',
                  uMin: -Math.PI,
                  uMax: Math.PI,
                  vMin: -Math.PI,
                  vMax: Math.PI
                });
              }}
              className="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors"
            >
              Wave
            </button>
            <button
              onClick={() => {
                updateNodeData(id, {
                  uFunction: '(2 + Math.cos(v)) * Math.cos(u)',
                  vFunction: '(2 + Math.cos(v)) * Math.sin(u)',
                  zFunction: 'Math.sin(v)',
                  uMin: 0,
                  uMax: Math.PI * 2,
                  vMin: 0,
                  vMax: Math.PI * 2
                });
              }}
              className="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors"
            >
              Torus
            </button>
          </div>
        </div>
      </div>

      {/* Output Handle - Geometry (Blender-style socket) */}
      <Handle
        type="source"
        position={Position.Right}
        id="geometry-out"
        className="geometry-handle rounded-full"
      />
    </div>
  );
} 