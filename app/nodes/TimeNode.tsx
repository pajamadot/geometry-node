'use client';

import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { TimeNodeData } from '../types/nodes';
import { useNodeContext } from '../components/NodeContext';
import { useTime } from '../components/TimeContext';
import NumberInput from '../components/NumberInput';

interface TimeNodeProps {
  data: TimeNodeData;
  id: string;
}

export default function TimeNode({ data, id }: TimeNodeProps) {
  const { 
    timeMode, 
    outputType, 
    frequency, 
    amplitude, 
    offset, 
    phase, 
    label 
  } = data;
  const { updateNodeData } = useNodeContext();
  const { currentTime, isPlaying, play, pause, reset, frameRate } = useTime();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleModeChange = (mode: 'seconds' | 'frames') => {
    updateNodeData(id, { timeMode: mode });
  };

  const handleOutputTypeChange = (type: string) => {
    updateNodeData(id, { outputType: type });
  };

  const handleParameterChange = (key: string, value: number) => {
    updateNodeData(id, { [key]: value });
  };

  // Calculate current output value
  const getCurrentValue = () => {
    const timeValue = timeMode === 'frames' ? currentTime * frameRate : currentTime;
    const scaledTime = (timeValue * frequency) + phase;
    
    let rawValue = 0;
    switch (outputType) {
      case 'raw':
        rawValue = timeValue;
        break;
      case 'sin':
        rawValue = Math.sin(scaledTime);
        break;
      case 'cos':
        rawValue = Math.cos(scaledTime);
        break;
      case 'sawtooth':
        rawValue = 2 * (scaledTime / (2 * Math.PI) - Math.floor(scaledTime / (2 * Math.PI) + 0.5));
        break;
      case 'triangle':
        const sawValue = 2 * (scaledTime / (2 * Math.PI) - Math.floor(scaledTime / (2 * Math.PI) + 0.5));
        rawValue = 2 * Math.abs(sawValue) - 1;
        break;
      case 'square':
        rawValue = Math.sin(scaledTime) >= 0 ? 1 : -1;
        break;
      default:
        rawValue = timeValue;
    }
    
    return (rawValue * amplitude) + offset;
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600/50 rounded-lg min-w-[220px] overflow-hidden backdrop-blur-sm"
         style={{
           boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 12px 24px rgba(0, 0, 0, 0.4), 0 6px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
         }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-pink-500 px-3 py-2">
        <h3 className="text-sm font-semibold text-white tracking-wide">
          {label || 'Time'}
        </h3>
      </div>

      {/* Parameters */}
      <div className="p-3 space-y-3">
        {/* Playback Controls */}
        <div className="space-y-2">
          <div className="text-xs text-gray-300 font-medium">Animation</div>
          <div className="flex items-center space-x-2">
            <button
              onClick={isPlaying ? pause : play}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                isPlaying 
                  ? 'bg-pink-600 hover:bg-pink-500 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
            <button
              onClick={reset}
              className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
            >
              ⏹ Reset
            </button>
          </div>
        </div>

        {/* Current Value Display */}
        <div className="space-y-2">
          <div className="text-xs text-gray-300 font-medium">Current Value</div>
          <div className="bg-gray-800 rounded px-2 py-1 text-center">
            <span className="text-pink-400 font-mono text-sm">
              {getCurrentValue().toFixed(3)}
            </span>
          </div>
          <div className="text-xs text-gray-500 text-center">
            Time: {timeMode === 'frames' ? (currentTime * frameRate).toFixed(1) + 'f' : currentTime.toFixed(2) + 's'}
          </div>
        </div>

        {/* Time Mode */}
        <div className="space-y-2">
          <div className="text-xs text-gray-300 font-medium">Time Mode</div>
          <div className="flex space-x-1">
            <button
              onClick={() => handleModeChange('seconds')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                timeMode === 'seconds' 
                  ? 'bg-pink-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Seconds
            </button>
            <button
              onClick={() => handleModeChange('frames')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                timeMode === 'frames' 
                  ? 'bg-pink-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Frames
            </button>
          </div>
        </div>

        {/* Output Type */}
        <div className="space-y-2">
          <div className="text-xs text-gray-300 font-medium">Wave Type</div>
          <select
            value={outputType}
            onChange={(e) => handleOutputTypeChange(e.target.value)}
            className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:border-pink-400 focus:outline-none"
          >
            <option value="raw">Raw Time</option>
            <option value="sin">Sine Wave</option>
            <option value="cos">Cosine Wave</option>
            <option value="sawtooth">Sawtooth</option>
            <option value="triangle">Triangle</option>
            <option value="square">Square Wave</option>
          </select>
        </div>

        {/* Advanced Parameters */}
        <div className="space-y-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-gray-400 hover:text-gray-300 transition-colors flex items-center"
          >
            <span className={`mr-1 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>▶</span>
            Wave Parameters
          </button>
          
          {showAdvanced && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Frequency</label>
                  <NumberInput
                    value={frequency}
                    onChange={(value) => handleParameterChange('frequency', value)}
                    className="w-full px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:border-pink-400 focus:outline-none"
                    step={0.1}
                    min={0.1}
                    max={50}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Amplitude</label>
                  <NumberInput
                    value={amplitude}
                    onChange={(value) => handleParameterChange('amplitude', value)}
                    className="w-full px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:border-pink-400 focus:outline-none"
                    step={0.1}
                    min={0}
                    max={10}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Offset</label>
                  <NumberInput
                    value={offset}
                    onChange={(value) => handleParameterChange('offset', value)}
                    className="w-full px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:border-pink-400 focus:outline-none"
                    step={0.1}
                    min={-10}
                    max={10}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Phase</label>
                  <NumberInput
                    value={phase}
                    onChange={(value) => handleParameterChange('phase', value)}
                    className="w-full px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:border-pink-400 focus:outline-none"
                    step={0.1}
                    min={0}
                    max={Math.PI * 2}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Output Handle - Number (pink socket) */}
      <Handle
        type="source"
        position={Position.Right}
        id="time-out"
        className="time-handle rounded-full"
      />
    </div>
  );
} 