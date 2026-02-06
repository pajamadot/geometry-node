import * as pc from 'playcanvas';
import { NodeDefinition } from '../../types/nodes';
import { RotateCw } from 'lucide-react';
import { EnhancedGeometryData } from '../../utils/builders/GeometryBuilder';
import { GeometryOperations } from '../../utils/builders/operations/GeometryOperations';
import { VertexDataUtils } from '../../utils/builders/VertexDataUtils';

export const twistNodeDefinition: NodeDefinition = {
  type: 'twist',
  name: 'Twist',
  description: 'Twist geometry around an axis',
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
      description: 'Input geometry to twist',
    },
    {
      id: 'angle',
      name: 'Angle',
      type: 'number',
      defaultValue: 1.0,
      min: -10,
      max: 10,
      step: 0.1,
      description: 'Twist angle',
    },
    {
      id: 'axis',
      name: 'Axis',
      type: 'select',
      defaultValue: 'y',
      options: ['x', 'y', 'z'],
      description: 'Twist axis',
    },
    {
      id: 'offset',
      name: 'Offset',
      type: 'number',
      defaultValue: 0,
      min: -10,
      max: 10,
      step: 0.1,
      description: 'Twist offset',
    },
  ],

  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Twisted geometry',
    },
  ],

  parameters: [],

  ui: {
    icon: RotateCw,
    width: 200,
  },

  execute: (inputs, parameters) => {
    const geometry = inputs.geometry as EnhancedGeometryData;
    if (!geometry) {
      return { geometry: null };
    }

    const angle = inputs.angle ?? 1.0;
    const axisName = inputs.axis ?? 'y';
    const offset = inputs.offset ?? 0;

    const axis =
      axisName === 'x'
        ? new pc.Vec3(1, 0, 0)
        : axisName === 'y'
        ? new pc.Vec3(0, 1, 0)
        : new pc.Vec3(0, 0, 1);

    // Create twisted geometry
    const twisted = GeometryOperations.twist(geometry, axis, angle, offset);

    // Recompute normals
    const result = VertexDataUtils.computeNormals(twisted);

    return { geometry: result };
  },
};
