import { NodeDefinition } from '../../types/nodeSystem';
import { Clock } from 'lucide-react';

// TIME OFFSET NODE - Offsets time input for delayed or advanced animations
export const timeOffsetNodeDefinition: NodeDefinition = {
  type: 'time-offset',
  name: 'Time Offset',
  description: 'Offsets time input for delayed or advanced animations',
  category: 'drivers',
  color: {
    primary: '#9333ea',
    secondary: '#7c3aed'
  },

  inputs: [
    {
      id: 'time',
      name: 'Time',
      type: 'time',
      defaultValue: 0,
      description: 'Input time to offset'
    },
    {
      id: 'offset',
      name: 'Offset',
      type: 'number',
      defaultValue: 0,
      description: 'Time offset in seconds (positive = delay, negative = advance)'
    },
    {
      id: 'scale',
      name: 'Scale',
      type: 'number',
      defaultValue: 1,
      description: 'Time scale multiplier'
    }
  ],
  outputs: [
    {
      id: 'result',
      name: 'Result',
      type: 'time',
      description: 'Offset and scaled time'
    },
    {
      id: 'normalized',
      name: 'Normalized',
      type: 'number',
      description: 'Normalized time value (0-1)'
    }
  ],
  parameters: [
    {
      id: 'autoTime',
      name: 'Auto Time',
      type: 'boolean',
      defaultValue: true,
      description: 'Automatically use current time if no time input'
    },
    {
      id: 'wrapMode',
      name: 'Wrap Mode',
      type: 'select',
      defaultValue: 'none',
      options: ['none', 'modulo', 'clamp'],
      description: 'How to handle time wrapping'
    },
    {
      id: 'wrapPeriod',
      name: 'Wrap Period',
      type: 'number',
      defaultValue: 1,
      description: 'Period for time wrapping (seconds)'
    }
  ],
  ui: {
    icon: Clock,
    width: 200,
    height: 400
  },
  execute: (inputs, parameters) => {
    const time = inputs.time || 0;
    const offset = inputs.offset || 0;
    const scale = inputs.scale || 1;
    const autoTime = parameters.autoTime !== false; // Default to true
    const wrapMode = parameters.wrapMode || 'none';
    const wrapPeriod = parameters.wrapPeriod || 1;
    
    // Use current time if autoTime is enabled and no time input
    let currentTime = time;
    if (autoTime && time === 0) {
      currentTime = Date.now() / 1000; // Convert to seconds
    }
    
    // Apply offset and scale
    let resultTime = (currentTime + offset) * scale;
    
    // Apply wrapping if enabled
    switch (wrapMode) {
      case 'modulo':
        // Wrap time using modulo
        resultTime = ((resultTime % wrapPeriod) + wrapPeriod) % wrapPeriod;
        break;
      case 'clamp':
        // Clamp time to period
        resultTime = Math.max(0, Math.min(wrapPeriod, resultTime));
        break;
      case 'none':
      default:
        // No wrapping
        break;
    }
    
    // Calculate normalized value (0-1) based on wrap period
    let normalizedValue = 0;
    if (wrapMode === 'modulo' || wrapMode === 'clamp') {
      normalizedValue = resultTime / wrapPeriod;
    } else {
      // For no wrapping, normalize based on a reasonable range
      normalizedValue = Math.max(0, Math.min(1, resultTime / 10)); // 10 second range
    }
    
    return { 
      result: resultTime,
      normalized: normalizedValue
    };
  }
};
