import { NodeDefinition } from '../../types/nodeSystem';
import { TrendingUp } from 'lucide-react';
import { GeometryOperations } from '../../utils/builders';

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
    const geometry = inputs.geometry;
    if (!geometry) {
      return { geometry: null };
    }

    const amount = inputs.amount ?? 1.0;
    const axis = inputs.axis ?? 'y';

    const enhancedGeom = {
      vertices: [],
      faces: [],
      attributes: {
        vertex: new Map(),
        edge: new Map(),
        face: new Map(),
        corner: new Map(),
      },
      vertexCount: geometry.attributes.position.count,
      faceCount: geometry.index ? geometry.index.count / 3 : 0,
      positionsArray: geometry.attributes.position.array as Float32Array,
      normalsArray: geometry.attributes.normal?.array as Float32Array,
      indicesArray: geometry.index?.array as Uint32Array,
    };

    const tapered = GeometryOperations.taper(enhancedGeom, axis as 'x' | 'y' | 'z', amount);

    geometry.attributes.position.array = tapered.positionsArray!;
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();

    return { geometry };
  },
};
