import { NodeDefinition } from '../../types/nodeSystem';
import { Move } from 'lucide-react';
import { GeometryOperations } from '../../utils/builders';
import { EnhancedGeometryData } from '../../utils/builders/GeometryBuilder';
import { VertexDataUtils } from '../../utils/builders/VertexDataUtils';

export const bendNodeDefinition: NodeDefinition = {
  type: 'bend',
  name: 'Bend',
  description: 'Bend geometry along an axis',
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
      description: 'Input geometry to bend',
    },
    {
      id: 'angle',
      name: 'Angle',
      type: 'number',
      defaultValue: 0.5,
      min: -Math.PI,
      max: Math.PI,
      step: 0.1,
      description: 'Bend angle in radians',
    },
    {
      id: 'axis',
      name: 'Axis',
      type: 'select',
      defaultValue: 'y',
      options: ['x', 'y', 'z'],
      description: 'Bend axis',
    },
    {
      id: 'radius',
      name: 'Radius',
      type: 'number',
      defaultValue: 1,
      min: 0.1,
      max: 10,
      step: 0.1,
      description: 'Bend radius',
    },
  ],

  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Bent geometry',
    },
  ],

  parameters: [],

  ui: {
    icon: Move,
    width: 200,
  },

  execute: (inputs, parameters) => {
    const geometry = inputs.geometry as EnhancedGeometryData;
    if (!geometry) {
      return { geometry: null };
    }

    const angle = inputs.angle ?? 0.5;
    const axis = inputs.axis ?? 'y';
    const radius = inputs.radius ?? 1;

    const bent = GeometryOperations.bend(geometry, axis as 'x' | 'y' | 'z', angle, radius);
    const result = VertexDataUtils.computeNormals(bent);

    return { geometry: result };
  },
};
