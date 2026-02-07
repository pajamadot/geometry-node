import { NodeDefinition } from '../../types/nodeSystem';
import { TrendingUp } from 'lucide-react';
import { GeometryOperations } from '../../utils/builders';
import { EnhancedGeometryData } from '../../utils/builders/GeometryBuilder';
import { VertexDataUtils } from '../../utils/builders/VertexDataUtils';

export const taperNodeDefinition: NodeDefinition = {
  type: 'taper',
  name: 'Taper',
  description: 'Scale geometry along an axis',
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
      description: 'Input geometry to taper',
    },
    {
      id: 'amount',
      name: 'Amount',
      type: 'number',
      defaultValue: 1.0,
      min: -5,
      max: 5,
      step: 0.1,
      description: 'Taper amount',
    },
    {
      id: 'axis',
      name: 'Axis',
      type: 'select',
      defaultValue: 'y',
      options: ['x', 'y', 'z'],
      description: 'Taper axis',
    },
  ],

  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Tapered geometry',
    },
  ],

  parameters: [],

  ui: {
    icon: TrendingUp,
    width: 200,
  },

  execute: (inputs, parameters) => {
    const geometry = inputs.geometry as EnhancedGeometryData;
    if (!geometry) {
      return { geometry: null };
    }

    const amount = inputs.amount ?? 1.0;
    const axis = inputs.axis ?? 'y';

    const tapered = GeometryOperations.taper(geometry, axis as 'x' | 'y' | 'z', amount);
    const result = VertexDataUtils.computeNormals(tapered);

    return { geometry: result };
  },
};
