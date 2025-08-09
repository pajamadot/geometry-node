import { NodeDefinition } from '../../types/nodeSystem';
import { ArrowRightLeft } from 'lucide-react';

// MAP RANGE NODE - Maps a value from one range to another
export const mapRangeNodeDefinition: NodeDefinition = {
  type: 'map-range',
  name: 'Map Range',
  description: 'Remaps a value from one range to another',
  category: 'math',
  color: {
    primary: '#16a34a',
    secondary: '#15803d'
  },

  inputs: [
    {
      id: 'value',
      name: 'Value',
      type: 'number',
      defaultValue: 0.5,
      description: 'Input value to remap'
    },
    {
      id: 'fromMin',
      name: 'From Min',
      type: 'number',
      defaultValue: 0,
      description: 'Minimum value of input range'
    },
    {
      id: 'fromMax',
      name: 'From Max',
      type: 'number',
      defaultValue: 1,
      description: 'Maximum value of input range'
    },
    {
      id: 'toMin',
      name: 'To Min',
      type: 'number',
      defaultValue: 0,
      description: 'Minimum value of output range'
    },
    {
      id: 'toMax',
      name: 'To Max',
      type: 'number',
      defaultValue: 1,
      description: 'Maximum value of output range'
    }
  ],
  outputs: [
    {
      id: 'result',
      name: 'Result',
      type: 'number',
      description: 'Remapped value'
    }
  ],
  parameters: [
    {
      id: 'clamp',
      name: 'Clamp',
      type: 'boolean',
      defaultValue: false,
      description: 'Clamp the result to the output range'
    }
  ],
  ui: {
    icon: ArrowRightLeft
  },
  execute: (inputs, parameters) => {
    const value = inputs.value || 0;
    const fromMin = inputs.fromMin || 0;
    const fromMax = inputs.fromMax || 1;
    const toMin = inputs.toMin || 0;
    const toMax = inputs.toMax || 1;
    const clamp = parameters.clamp || false;
    
    // Avoid division by zero
    if (fromMax === fromMin) {
      return { result: toMin };
    }
    
    // Calculate normalized value (0-1)
    let normalized = (value - fromMin) / (fromMax - fromMin);
    
    // Clamp if requested
    if (clamp) {
      normalized = Math.max(0, Math.min(1, normalized));
    }
    
    // Map to output range
    const result = toMin + normalized * (toMax - toMin);
    
    return { result };
  }
};
