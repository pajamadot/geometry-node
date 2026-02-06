import * as pc from 'playcanvas';
import { NodeDefinition } from '../../types/nodes';
import { ArrowUp } from 'lucide-react';
import { GeometryOperations } from '../../utils/builders/operations/GeometryOperations';
import { EnhancedGeometryData, GeometryBuilder } from '../../utils/builders/GeometryBuilder';
import { VertexDataUtils } from '../../utils/builders/VertexDataUtils';

export const extrudeNodeDefinition: NodeDefinition = {
  type: 'extrude',
  name: 'Extrude',
  description: 'Extrude geometry along a direction',
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
      id: 'depth',
      name: 'Depth',
      type: 'number',
      defaultValue: 1.0,
      min: 0.1,
      max: 10,
      step: 0.1,
      description: 'Extrusion depth',
    },
    {
      id: 'directionX',
      name: 'Direction X',
      type: 'number',
      defaultValue: 0,
      min: -1,
      max: 1,
      step: 0.1,
      description: 'X component of direction',
    },
    {
      id: 'directionY',
      name: 'Direction Y',
      type: 'number',
      defaultValue: 1,
      min: -1,
      max: 1,
      step: 0.1,
      description: 'Y component of direction',
    },
    {
      id: 'directionZ',
      name: 'Direction Z',
      type: 'number',
      defaultValue: 0,
      min: -1,
      max: 1,
      step: 0.1,
      description: 'Z component of direction',
    },
  ],

  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Extruded geometry',
    },
  ],

  parameters: [],

  ui: {
    icon: ArrowUp,
    width: 220,
  },

  execute: (inputs, parameters) => {
    const geometry = inputs.geometry as EnhancedGeometryData;
    if (!geometry) {
      return { geometry: null };
    }

    const depth = inputs.depth ?? 1.0;
    const dirX = inputs.directionX ?? 0;
    const dirY = inputs.directionY ?? 1;
    const dirZ = inputs.directionZ ?? 0;

    const direction = new pc.Vec3(dirX, dirY, dirZ).normalize();

    // Clone input to avoid mutation if necessary, but GeometryOperations usually return new
    const extruded = GeometryOperations.extrude(geometry, direction, depth);

    // Recompute normals after extrusion
    const withNormals = VertexDataUtils.computeNormals(extruded);

    return { geometry: withNormals };
  },
};
