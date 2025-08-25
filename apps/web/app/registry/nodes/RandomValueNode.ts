import { NodeDefinition } from '../../types/nodeSystem';
import { Shuffle } from 'lucide-react';

// RANDOM VALUE NODE - Generates random values within a specified range
export const randomValueNodeDefinition: NodeDefinition = {
  type: 'random-value',
  name: 'Random Value',
  description: 'Generates random values within a specified range',
  category: 'math',
  color: {
    primary: '#16a34a',
    secondary: '#15803d'
  },

  inputs: [
    {
      id: 'seed',
      name: 'Seed',
      type: 'number',
      defaultValue: 0,
      description: 'Seed for random number generation (0 = random)'
    },
    {
      id: 'min',
      name: 'Min',
      type: 'number',
      defaultValue: 0,
      description: 'Minimum value'
    },
    {
      id: 'max',
      name: 'Max',
      type: 'number',
      defaultValue: 1,
      description: 'Maximum value'
    }
  ],
  outputs: [
    {
      id: 'result',
      name: 'Result',
      type: 'number',
      description: 'Random value'
    }
  ],
  parameters: [
    {
      id: 'distribution',
      name: 'Distribution',
      type: 'select',
      defaultValue: 'uniform',
      options: ['uniform', 'gaussian', 'exponential'],
      description: 'Random distribution type'
    },
    {
      id: 'updateOnTime',
      name: 'Update on Time',
      type: 'boolean',
      defaultValue: false,
      description: 'Update random value based on time'
    }
  ],
  ui: {
    icon: Shuffle,
    width: 250,
    height:300

  },
  execute: (inputs, parameters) => {
    const seed = inputs.seed || 0;
    const min = inputs.min || 0;
    const max = inputs.max || 1;
    const distribution = parameters.distribution || 'uniform';
    const updateOnTime = parameters.updateOnTime || false;
    
    // Create a seeded random number generator
    let random: () => number;
    
    if (seed === 0) {
      // Use Math.random() for truly random values
      random = () => Math.random();
    } else {
      // Simple seeded random number generator
      let currentSeed = seed;
      random = () => {
        currentSeed = (currentSeed * 9301 + 49297) % 233280;
        return currentSeed / 233280;
      };
    }
    
    // Generate random value based on distribution
    let randomValue: number;
    
    switch (distribution) {
      case 'uniform':
        randomValue = min + random() * (max - min);
        break;
        
      case 'gaussian':
        // Box-Muller transform for normal distribution
        const u1 = random();
        const u2 = random();
        const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        // Map to range [min, max] with mean at center
        const mean = (min + max) / 2;
        const stdDev = (max - min) / 6; // 99.7% of values within 3 std devs
        randomValue = mean + z0 * stdDev;
        // Clamp to range
        randomValue = Math.max(min, Math.min(max, randomValue));
        break;
        
      case 'exponential':
        // Exponential distribution with lambda = 1, then scaled to range
        const expValue = -Math.log(1 - random());
        // Scale to range [min, max]
        randomValue = min + (expValue / 5) * (max - min); // Divide by 5 to keep most values in range
        randomValue = Math.max(min, Math.min(max, randomValue));
        break;
        
      default:
        randomValue = min + random() * (max - min);
    }
    
    return { result: randomValue };
  }
};
