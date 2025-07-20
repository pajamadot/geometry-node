import { NodeDefinition } from '../../types/nodeSystem';
import { Clock } from 'lucide-react';

// TIME NODE - was 240+ lines, now 30 lines of data
export const timeNodeDefinition: NodeDefinition = {
  type: 'time',
  name: 'Time',
  description: 'Provides time-based values for animation',
  category: 'animation',
  color: {
    primary: '#ec4899',
    secondary: '#be185d'
  },
  inputs: [],
  outputs: [
    {
      id: 'time',
      name: 'Time',
      type: 'time',
      description: 'Current time value'
    }
  ],
  parameters: [
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
      options: ['raw', 'sine', 'cosine', 'sawtooth', 'triangle', 'square'],
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
      description: 'Wave frequency',
      category: 'advanced'
    },
    {
      id: 'amplitude',
      name: 'Amplitude', 
      type: 'number',
      defaultValue: 1,
      min: 0.1,
      max: 10,
      step: 0.1,
      description: 'Wave amplitude',
      category: 'advanced'
    },
    {
      id: 'offset',
      name: 'Offset',
      type: 'number',
      defaultValue: 0,
      min: -10,
      max: 10,
      step: 0.1,
      description: 'Value offset',
      category: 'advanced'
    },
    {
      id: 'phase',
      name: 'Phase',
      type: 'number',
      defaultValue: 0,
      min: 0,
      max: Math.PI * 2,
      step: 0.1,
      description: 'Wave phase shift',
      category: 'advanced'
    }
  ],
  ui: {
    width: 200,
    icon: Clock,
    advanced: ['frequency', 'amplitude', 'offset', 'phase']
  },
  execute: (inputs, parameters) => {
    const { timeMode, outputType, frequency, amplitude, offset, phase } = parameters;
    
    // Get current time (this would come from TimeContext)
    const currentTime = Date.now() / 1000; // Mock implementation
    const timeValue = timeMode === 'frames' ? currentTime * 30 : currentTime;
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
      default:
        rawValue = timeValue;
    }
    
    return {
      time: (rawValue * amplitude) + offset
    };
  }
}; 