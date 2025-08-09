import { NodeDefinition } from '../../types/nodeSystem';
import { Activity } from 'lucide-react';

// NOISE WAVE NODE - Generates noise wave animation driver
export const noiseWaveNodeDefinition: NodeDefinition = {
  type: 'noise-wave',
  name: 'Noise Wave',
  description: 'Generates smooth noise oscillation between -1 and 1',
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
      description: 'Frequency of the noise wave'
    },
    {
      id: 'amplitude',
      name: 'Amplitude',
      type: 'number',
      defaultValue: 1,
      description: 'Amplitude of the wave (multiplier)'
    },
    {
      id: 'octaves',
      name: 'Octaves',
      type: 'number',
      defaultValue: 1,
      description: 'Number of noise octaves for detail'
    }
  ],
  outputs: [
    {
      id: 'result',
      name: 'Result',
      type: 'number',
      description: 'Noise wave value between -1 and 1'
    },
    {
      id: 'normalized',
      name: 'Normalized',
      type: 'number',
      description: 'Noise wave value normalized to 0-1 range'
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
      id: 'noiseType',
      name: 'Noise Type',
      type: 'select',
      defaultValue: 'perlin',
      options: ['perlin', 'simplex', 'value'],
      description: 'Type of noise algorithm to use'
    }
  ],
  ui: {
    icon: Activity,
    width: 200,
    height: 400
  },
  execute: (inputs, parameters) => {
    const time = inputs.time || 0;
    const frequency = inputs.frequency || 1;
    const amplitude = inputs.amplitude || 1;
    const octaves = Math.max(1, Math.floor(inputs.octaves || 1));
    const autoTime = parameters.autoTime !== false; // Default to true
    const noiseType = parameters.noiseType || 'perlin';
    
    // Use current time if autoTime is enabled and no time input
    let currentTime = time;
    if (autoTime && time === 0) {
      currentTime = Date.now() / 1000; // Convert to seconds
    }
    
    // Simple noise function (simplified Perlin-like noise)
    const noise = (x: number): number => {
      const X = Math.floor(x) & 255;
      const xf = x - Math.floor(x);
      const u = fade(xf);
      
      // Simple hash function
      const hash = (n: number): number => {
        n = (n << 13) ^ n;
        return ((n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff) / 0x7fffffff;
      };
      
      const a = hash(X);
      const b = hash(X + 1);
      
      return lerp(a, b, u);
    };
    
    // Helper functions
    const fade = (t: number): number => t * t * t * (t * (t * 6 - 15) + 10);
    const lerp = (a: number, b: number, t: number): number => a + t * (b - a);
    
    // Generate multi-octave noise
    let noiseValue = 0;
    let totalAmplitude = 0;
    let currentFrequency = frequency;
    let currentAmplitude = amplitude;
    
    for (let i = 0; i < octaves; i++) {
      noiseValue += noise(currentTime * currentFrequency) * currentAmplitude;
      totalAmplitude += currentAmplitude;
      currentFrequency *= 2;
      currentAmplitude *= 0.5;
    }
    
    // Normalize by total amplitude
    noiseValue = noiseValue / totalAmplitude;
    
    // Clamp to [-1, 1] range
    const clampedValue = Math.max(-1, Math.min(1, noiseValue));
    
    // Normalize to [0, 1] range
    const normalizedValue = (clampedValue + 1) / 2;
    
    return { 
      result: clampedValue,
      normalized: normalizedValue
    };
  }
};
