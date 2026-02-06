import * as pc from 'playcanvas';
import { NodeDefinition } from '../../types/nodes';
import { Copy } from 'lucide-react';
import { EnhancedGeometryData } from '../../utils/builders/GeometryBuilder';
import { VertexDataUtils } from '../../utils/builders/VertexDataUtils';

export const instanceOnFacesNodeDefinition: NodeDefinition = {
  type: 'instance-on-faces',
  name: 'Instance on Faces',
  description: 'Instance geometry on face centers',
  category: 'instancing',
  color: {
    primary: '#f59e0b',
    secondary: '#d97706',
  },

  inputs: [
    {
      id: 'points',
      name: 'Target Geometry',
      type: 'geometry',
      required: true,
      description: 'Geometry to instance on',
    },
    {
      id: 'instance',
      name: 'Instance',
      type: 'geometry',
      required: true,
      description: 'Geometry to instance',
    },
    {
      id: 'scale',
      name: 'Scale',
      type: 'number',
      defaultValue: 1.0,
      min: 0.01,
      max: 10,
      step: 0.1,
      description: 'Instance scale',
    },
    {
      id: 'alignToNormal',
      name: 'Align to Normal',
      type: 'boolean',
      defaultValue: true,
      description: 'Align instances to face normals',
    },
  ],

  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Instanced geometry',
    },
  ],

  parameters: [],

  ui: {
    icon: Copy,
    width: 240,
  },

  execute: (inputs, parameters) => {
    const targetGeometry = inputs.points as EnhancedGeometryData;
    const instanceGeometry = inputs.instance as EnhancedGeometryData;

    if (!targetGeometry || !instanceGeometry) {
      return { geometry: null };
    }

    const scale = inputs.scale ?? 1.0;
    const alignToNormal = inputs.alignToNormal ?? true;

    const positions = targetGeometry.positionsArray;
    const indices = targetGeometry.indicesArray;

    if (!indices || !positions) {
      return { geometry: null };
    }

    const geometries: EnhancedGeometryData[] = [];
    const v1 = new pc.Vec3();
    const v2 = new pc.Vec3();
    const v3 = new pc.Vec3();
    const center = new pc.Vec3();
    const normal = new pc.Vec3();
    const up = new pc.Vec3(0, 1, 0);
    const edge1 = new pc.Vec3();
    const edge2 = new pc.Vec3();
    const rot = new pc.Quat();
    const matrix = new pc.Mat4();
    const scaleVec = new pc.Vec3(scale, scale, scale);

    // Iterate through faces
    for (let i = 0; i < indices.length; i += 3) {
      const i1 = indices[i];
      const i2 = indices[i + 1];
      const i3 = indices[i + 2];

      v1.set(positions[i1*3], positions[i1*3+1], positions[i1*3+2]);
      v2.set(positions[i2*3], positions[i2*3+1], positions[i2*3+2]);
      v3.set(positions[i3*3], positions[i3*3+1], positions[i3*3+2]);

      // Center
      center.copy(v1).add(v2).add(v3).mulScalar(1/3);

      // Normal
      edge1.sub2(v2, v1);
      edge2.sub2(v3, v1);
      normal.cross(edge1, edge2).normalize();

      // Rotation
      if (alignToNormal) {
        // Calculate rotation from up to normal using axis-angle
        const axis = new pc.Vec3();
        axis.cross(up, normal);
        const dot = up.dot(normal);
        if (axis.length() < 0.0001) {
          // Vectors are parallel or anti-parallel
          if (dot > 0) {
            rot.set(0, 0, 0, 1); // Same direction
          } else {
            rot.setFromAxisAngle(new pc.Vec3(1, 0, 0), Math.PI); // Opposite direction
          }
        } else {
          axis.normalize();
          const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
          rot.setFromAxisAngle(axis, angle);
        }
      } else {
        rot.set(0, 0, 0, 1);
      }

      // Transform Matrix
      matrix.setTRS(center, rot, scaleVec);

      // Clone and transform
      let cloned = VertexDataUtils.clone(instanceGeometry);
      cloned = VertexDataUtils.transform(cloned, matrix);
      geometries.push(cloned);
    }

    const mergedGeometry = VertexDataUtils.merge(geometries);

    return { geometry: mergedGeometry };
  },
};
