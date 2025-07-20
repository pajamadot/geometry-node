'use client';

import React from 'react';
import { Handle, Position } from 'reactflow';
import { Play, Pause, RotateCcw, Clock } from 'lucide-react';
import { useTime } from './TimeContext';
import { timeNodeDefinition } from '../registry/nodes';

interface TimeNodeProps {
  id: string;
  data: {
    parameters?: Record<string, any>;
    inputConnections?: Record<string, boolean>;
    liveParameterValues?: Record<string, any>;
    socketValues?: Record<string, any>;
  };
  selected?: boolean;
  onParameterChange?: (parameterId: string, value: any) => void;
}

export default function TimeNode({ id, data, selected, onParameterChange }: TimeNodeProps) {
  const { 
    currentTime, 
    isPlaying, 
    frameRate, 
    speed, 
    totalFrames,
    play, 
    pause, 
    reset,
    setFrameRate,
    setSpeed,
    setTotalFrames
  } = useTime();

  const parameters = data.parameters || {};
  const socketValues = data.socketValues || {};

  // Sync TimeContext with node parameters
  React.useEffect(() => {
    if (parameters.frameRate !== undefined && parameters.frameRate !== frameRate) {
      setFrameRate(parameters.frameRate);
    }
    if (parameters.speed !== undefined && parameters.speed !== speed) {
      setSpeed(parameters.speed);
    }
    if (parameters.totalFrames !== undefined && parameters.totalFrames !== totalFrames) {
      setTotalFrames(parameters.totalFrames);
    }
  }, [parameters.frameRate, parameters.speed, parameters.totalFrames, frameRate, speed, totalFrames, setFrameRate, setSpeed, setTotalFrames]);

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
      onParameterChange?.('isPlaying', false);
    } else {
      play();
      onParameterChange?.('isPlaying', true);
    }
  };

  const handleReset = () => {
    reset();
    onParameterChange?.('isPlaying', false);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const frames = Math.floor((time % 1) * frameRate);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  const currentFrame = Math.floor(currentTime * frameRate);
  const progress = (currentFrame / totalFrames) * 100;

  return (
    <div 
      className={`bg-gradient-to-br from-pink-800 to-pink-900 border border-pink-600/50 rounded-lg backdrop-blur-sm ${
        selected ? 'ring-2 ring-pink-400' : ''
      }`}
      style={{
        width: '240px',
        minHeight: '120px',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 12px 24px rgba(0, 0, 0, 0.4), 0 6px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Title */}
      <div 
        className="bg-gradient-to-r from-pink-600 to-pink-500 px-3 py-3 rounded-t-lg"
        style={{
          background: `linear-gradient(to right, ${timeNodeDefinition.color.primary}, ${timeNodeDefinition.color.secondary})`,
          minHeight: '40px'
        }}
      >
        <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
          <Clock size={16} />
          {timeNodeDefinition.name}
        </h3>
      </div>

      {/* Time Display */}
      <div className="px-3 py-2 border-b border-pink-600/30">
        <div className="text-xs text-pink-400 font-mono text-center">
          {formatTime(currentTime)}
        </div>
        <div className="text-xs text-gray-400 text-center">
          Frame {currentFrame} / {totalFrames}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-3 py-1">
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-pink-500 h-2 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="px-3 py-2 flex items-center justify-center gap-2">
        <button
          onClick={handlePlayPause}
          className={`p-2 rounded-lg transition-colors ${
            isPlaying 
              ? 'bg-pink-600 hover:bg-pink-700 text-white' 
              : 'bg-gray-600 hover:bg-gray-700 text-white'
          }`}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
        
        <button
          onClick={handleReset}
          className="p-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white transition-colors"
          title="Reset"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Output Socket */}
      <div className="relative px-3 py-2">
        <div className="flex items-center justify-end gap-2">
          <div className="text-xs text-gray-400 flex-shrink-0 w-16 text-right">
            Time
          </div>
          <div className="w-4" />
          <Handle
            type="source"
            position={Position.Right}
            id="time-out"
            className="time-handle border-2 border-white cursor-pointer"
            style={{
              backgroundColor: '#ec4899',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              right: '4px',
              zIndex: 1
            }}
          />
        </div>
      </div>
    </div>
  );
} 