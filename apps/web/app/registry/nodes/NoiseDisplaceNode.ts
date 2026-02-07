import { NodeDefinition } from '../../types/nodeSystem';
import { Waves } from 'lucide-react';
import { GeometryOperations } from '../../utils/builders';
import { EnhancedGeometryData } from '../../utils/builders/GeometryBuilder';
import { VertexDataUtils } from '../../utils/builders/VertexDataUtils';

export const noiseDisplaceNodeDefinition: NodeDefinition = {
  type: 'noise-displace',
  name: 'Noise Displace',
  description: 'Displace geometry vertices using noise',
  category: 'modifiers',
  color: {
    primary: '#8b5cf6',
    secondary: '#7c3aed',
  },

  inputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      required: true,
      description: 'Input geometry to displace',
    },
    {
      id: 'amplitude',
      name: 'Amplitude',
      type: 'number',
      defaultValue: 0.5,
      min: 0,
      max: 10,
      step: 0.1,
      description: 'Displacement strength',
    },
    {
      id: 'frequency',
      name: 'Frequency',
      type: 'number',
      defaultValue: 1.0,
      min: 0.1,
      max: 10,
      step: 0.1,
      description: 'Noise frequency',
    },
    {
      id: 'seed',
      name: 'Seed',
      type: 'integer',
      defaultValue: 0,
      min: 0,
      max: 1000,
      step: 1,
      description: 'Random seed',
    },
  ],

  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Displaced geometry',
    },
  ],

  parameters: [],

  ui: {
    icon: Waves,
    width: 220,
  },

  execute: (inputs, parameters) => {
    const geometry = inputs.geometry as EnhancedGeometryData;
    if (!geometry) {
      return { geometry: null };
    }

    const amplitude = inputs.amplitude ?? 0.5;
    const frequency = inputs.frequency ?? 1.0;
    const seed = inputs.seed ?? 0;

    const displaced = GeometryOperations.displace(geometry, amplitude, frequency, seed);
    const result = VertexDataUtils.computeNormals(displaced);

    return { geometry: result };
  },
};
