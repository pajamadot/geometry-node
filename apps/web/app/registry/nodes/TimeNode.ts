import { NodeDefinition } from '../../types/nodeSystem';
import { Clock } from 'lucide-react';

// TIME NODE - Unified input system
export const timeNodeDefinition: NodeDefinition = {
  type: 'time',
  name: 'Time',
  description: 'Generates time-based values and waveforms',
  category: 'input',
  color: {
    primary: '#ec4899',
    secondary: '#be185d'
  },

  inputs: [
    {
      id: 'timeMode',
      name: 'Mode',
      type: 'select',
      defaultValue: 'seconds',
      options: ['seconds', 'frames'],
      description: 'Time measurement mode'
    },
    {
      id: 'outputType',
      name: 'Output',
      type: 'select',
      defaultValue: 'raw',
      options: [
        'raw', 
        'sine', 
        'cosine', 
        'sawtooth', 
        'triangle', 
        'square',
        'tangent',
        'exponential',
        'logarithmic',
        'pulse',
        'noise',
        'bounce',
        'elastic',
        'ease-in',
        'ease-out',
        'ease-in-out'
      ],
      description: 'Output waveform type'
    },
    {
      id: 'frequency',
      name: 'Frequency',
      type: 'number',
      defaultValue: 1,
      min: 0.1,
      max: 10,
      step: 0.1,
      description: 'Wave frequency'
    },
    {
      id: 'amplitude',
      name: 'Amplitude', 
      type: 'number',
      defaultValue: 1,
      min: 0.1,
      max: 10,
      step: 0.1,
      description: 'Wave amplitude'
    },
    {
      id: 'offset',
      name: 'Offset',
      type: 'number',
      defaultValue: 0,
      min: -10,
      max: 10,
      step: 0.1,
      description: 'Value offset'
    },
    {
      id: 'phase',
      name: 'Phase',
      type: 'number',
      defaultValue: 0,
      min: 0,
      max: Math.PI * 2,
      step: 0.1,
      description: 'Wave phase shift'
    },
    {
      id: 'isPlaying',
      name: 'Playing',
      type: 'boolean',
      defaultValue: false,
      description: 'Play/pause state'
    },
    {
      id: 'frameRate',
      name: 'FPS',
      type: 'integer',
      defaultValue: 30,
      min: 1,
      max: 120,
      description: 'Frame rate'
    },
    {
      id: 'speed',
      name: 'Speed',
      type: 'number',
      defaultValue: 1,
      min: 0.1,
      max: 10,
      step: 0.1,
      description: 'Playback speed multiplier'
    },
    {
      id: 'totalFrames',
      name: 'Duration',
      type: 'integer',
      defaultValue: 300,
      min: 1,
      max: 3600,
      description: 'Total frames (duration)'
    }
  ],
  outputs: [
    {
      id: 'time',
      name: 'Time',
      type: 'number',
      description: 'Current time value'
    }
  ],
  parameters: [], // No parameters - everything is inputs
  ui: {
    width: 240,
    icon: Clock,
    advanced: ['frequency', 'amplitude', 'offset', 'phase', 'frameRate', 'speed', 'totalFrames']
  },
  execute: (inputs, parameters) => {
    // Extract values from inputs (can come from UI or connections)
    const timeMode = inputs.timeMode || 'seconds';
    const outputType = inputs.outputType || 'raw';
    const frequency = inputs.frequency || 1;
    const amplitude = inputs.amplitude || 1;
    const offset = inputs.offset || 0;
    const phase = inputs.phase || 0;
    
    const { isPlaying, frameRate, speed, totalFrames } = inputs;
    
    // Get current time from TimeContext (this will be injected by the compiler)
    const currentTime = inputs.currentTime || Date.now() / 1000; // Fallback to mock implementation
    const timeValue = timeMode === 'frames' ? currentTime * frameRate : currentTime;
    const scaledTime = (timeValue * frequency) + phase;
    
    let rawValue: number;
    switch (outputType) {
      case 'sine':
        rawValue = Math.sin(scaledTime);
        break;
      case 'cosine':
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
      case 'tangent':
        rawValue = Math.tan(scaledTime);
        // Clamp to prevent extreme values
        rawValue = Math.max(-10, Math.min(10, rawValue));
        break;
      case 'exponential':
        rawValue = Math.exp(Math.sin(scaledTime) * 0.5);
        break;
      case 'logarithmic':
        rawValue = Math.log(Math.abs(Math.sin(scaledTime)) + 1);
        break;
      case 'pulse':
        const pulseTime = scaledTime % (2 * Math.PI);
        rawValue = pulseTime < Math.PI ? 1 : -1;
        break;
      case 'noise':
        // Simple pseudo-random noise based on time
        const noiseTime = Math.floor(scaledTime * 10);
        rawValue = (Math.sin(noiseTime * 12.9898) * 43758.5453) % 1;
        rawValue = (rawValue - 0.5) * 2; // Convert to -1 to 1 range
        break;
      case 'bounce':
        const bounceTime = scaledTime % (2 * Math.PI);
        rawValue = Math.abs(Math.sin(bounceTime)) * Math.sin(bounceTime * 4);
        break;
      case 'elastic':
        const elasticTime = scaledTime % (2 * Math.PI);
        rawValue = Math.sin(elasticTime) * Math.exp(-elasticTime * 0.1);
        break;
      case 'ease-in':
        const easeInTime = (scaledTime % (2 * Math.PI)) / (2 * Math.PI);
        rawValue = easeInTime * easeInTime;
        break;
      case 'ease-out':
        const easeOutTime = (scaledTime % (2 * Math.PI)) / (2 * Math.PI);
        rawValue = 1 - (1 - easeOutTime) * (1 - easeOutTime);
        break;
      case 'ease-in-out':
        const easeInOutTime = (scaledTime % (2 * Math.PI)) / (2 * Math.PI);
        rawValue = easeInOutTime < 0.5 
          ? 2 * easeInOutTime * easeInOutTime 
          : 1 - Math.pow(-2 * easeInOutTime + 2, 2) / 2;
        break;
      default:
        rawValue = timeValue;
    }
    
    return {
      'time': (rawValue * amplitude) + offset
    };
  }
}; 