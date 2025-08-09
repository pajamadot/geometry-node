import { NodeDefinition } from '../../types/nodeSystem';
import { Activity } from 'lucide-react';

// COSINE WAVE NODE - Generates cosine wave animation driver
export const cosineWaveNodeDefinition: NodeDefinition = {
  type: 'cosine-wave',
  name: 'Cosine Wave',
  description: 'Generates cosine wave oscillation between -1 and 1',
  category: 'animation-drivers',
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
      description: 'Time input for animation'
    },
    {
      id: 'frequency',
      name: 'Frequency',
      type: 'number',
      defaultValue: 1,
      description: 'Frequency of the cosine wave (cycles per second)'
    },
    {
      id: 'amplitude',
      name: 'Amplitude',
      type: 'number',
      defaultValue: 1,
      description: 'Amplitude of the wave (multiplier)'
    },
    {
      id: 'phase',
      name: 'Phase',
      type: 'number',
      defaultValue: 0,
      description: 'Phase offset in radians'
    }
  ],
  outputs: [
    {
      id: 'result',
      name: 'Result',
      type: 'number',
      description: 'Cosine wave value between -1 and 1'
    },
    {
      id: 'normalized',
      name: 'Normalized',
      type: 'number',
      description: 'Cosine wave value normalized to 0-1 range'
    }
  ],
  parameters: [
    {
      id: 'autoTime',
      name: 'Auto Time',
      type: 'boolean',
      defaultValue: true,
      description: 'Automatically use current time if no time input'
    }
  ],
  ui: {
    icon: Activity
  },
  execute: (inputs, parameters) => {
    const time = inputs.time || 0;
    const frequency = inputs.frequency || 1;
    const amplitude = inputs.amplitude || 1;
    const phase = inputs.phase || 0;
    const autoTime = parameters.autoTime !== false; // Default to true
    
    // Use current time if autoTime is enabled and no time input
    let currentTime = time;
    if (autoTime && time === 0) {
      currentTime = Date.now() / 1000; // Convert to seconds
    }
    
    // Calculate cosine wave: amplitude * cos(2π * frequency * time + phase)
    const cosineValue = amplitude * Math.cos(2 * Math.PI * frequency * currentTime + phase);
    
    // Clamp to [-1, 1] range
    const clampedValue = Math.max(-1, Math.min(1, cosineValue));
    
    // Normalize to [0, 1] range
    const normalizedValue = (clampedValue + 1) / 2;
    
    return { 
      result: clampedValue,
      normalized: normalizedValue
    };
  }
};
