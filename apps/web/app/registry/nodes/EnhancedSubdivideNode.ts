import { NodeDefinition } from '../../types/nodeSystem';
import { Grid3x3 } from 'lucide-react';
import { GeometryOperations, EnhancedGeometryData } from '../../utils/builders';

export const enhancedSubdivideNodeDefinition: NodeDefinition = {
  type: 'enhanced-subdivide',
  name: 'Enhanced Subdivide',
  description: 'Subdivide geometry with advanced algorithms',
  category: 'modifiers',
  color: {
    primary: '#10b981',
    secondary: '#059669',
  },

  inputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      required: true,
      description: 'Input geometry',
    },
    {
      id: 'iterations',
      name: 'Iterations',
      type: 'integer',
      defaultValue: 1,
      min: 1,
      max: 4,
      step: 1,
      description: 'Number of subdivision iterations',
    },
  ],

  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Subdivided geometry',
    },
  ],

  parameters: [],

  ui: {
    icon: Grid3x3,
    width: 220,
  },

  execute: (inputs, parameters) => {
    const geometry = inputs.geometry as EnhancedGeometryData;
    if (!geometry) {
      return { geometry: null };
    }

    const iterations = inputs.iterations ?? 1;

    if (iterations === 0) {
      return { geometry };
    }

    const subdividedGeometry = GeometryOperations.subdivide(geometry, iterations);

    return { geometry: subdividedGeometry };
  },
};
