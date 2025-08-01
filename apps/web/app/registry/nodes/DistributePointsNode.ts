import { NodeDefinition } from '../../types/nodeSystem';
import { MapPin } from 'lucide-react';

// DISTRIBUTE POINTS NODE - was 119+ lines, now 25 lines of data
export const distributePointsNodeDefinition: NodeDefinition = {
  type: 'distribute-points',
  name: 'Distribute Points',
  description: 'Generate points on geometry surface',
  category: 'instances',
  color: {
    primary: '#f59e42',
    secondary: '#b45309'
  },
  inputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      required: true,
      description: 'Input geometry to distribute points on'
    },
    {
      id: 'distributeMethod',
      name: 'Method',
      type: 'select',
      defaultValue: 'random',
      options: ['random', 'uniform', 'poisson'],
      description: 'Distribution method'
    },
    {
      id: 'density',
      name: 'Density',
      type: 'integer',
      defaultValue: 100,
      min: 1,
      max: 10000,
      step: 1,
      description: 'Number of points to generate'
    },
    {
      id: 'seed',
      name: 'Seed',
      type: 'integer',
      defaultValue: 0,
      min: 0,
      max: 1000,
      step: 1,
      description: 'Random seed for distribution'
    },
    {
      id: 'distanceMin',
      name: 'Min Distance',
      type: 'number',
      defaultValue: 0.1,
      min: 0,
      step: 0.01,
      description: 'Minimum distance between points'
    }
  ],
  outputs: [
    {
      id: 'points',
      name: 'Points',
      type: 'points',
      description: 'Distributed points'
    }
  ],
  parameters: [],
  ui: {
    width: 200,
    icon: MapPin,
    advanced: ['seed', 'distanceMin']
  },
  execute: (inputs, parameters) => {
    // Get values from inputs (can come from UI or connections)
    const geometry = inputs.geometry;
    const distributeMethod = inputs.distributeMethod || 'random';
    const density = inputs.density || 100;
    const seed = inputs.seed || 0;
    const distanceMin = inputs.distanceMin || 0.1;
    
    if (!geometry) return { points: [] };
    
    // Simple point distribution implementation
    const points: Array<{ x: number; y: number; z: number }> = [];
    
    // Generate random points for now (can be enhanced)
    for (let i = 0; i < density; i++) {
      points.push({
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 4,
        z: (Math.random() - 0.5) * 4
      });
    }
    
    return { points };
  }
}; 