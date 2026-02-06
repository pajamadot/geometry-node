import { NodeDefinition } from '../../types/nodes';

export const transformNodeDefinition: NodeDefinition = {
  type: 'transform',
  name: 'Transform',
  description: 'Transforms geometry (translate, rotate, scale)',
  category: 'geometry',
  color: {
    primary: '#3b82f6',
    secondary: '#2563eb'
  },
  inputs: [
      { id: 'geometry-in', name: 'Geometry', type: 'geometry' },
      { id: 'translation', name: 'Translation', type: 'vector' },
      { id: 'rotation', name: 'Rotation', type: 'vector' },
      { id: 'scale', name: 'Scale', type: 'vector' },
  ],
  outputs: [
    { id: 'geometry-out', name: 'Geometry', type: 'geometry' }
  ],
  parameters: [
      { id: 'position-x', name: 'Pos X', type: 'number', defaultValue: 0 },
      { id: 'position-y', name: 'Pos Y', type: 'number', defaultValue: 0 },
      { id: 'position-z', name: 'Pos Z', type: 'number', defaultValue: 0 },
      { id: 'rotation-x', name: 'Rot X', type: 'number', defaultValue: 0 },
      { id: 'rotation-y', name: 'Rot Y', type: 'number', defaultValue: 0 },
      { id: 'rotation-z', name: 'Rot Z', type: 'number', defaultValue: 0 },
      { id: 'scale-x', name: 'Scale X', type: 'number', defaultValue: 1 },
      { id: 'scale-y', name: 'Scale Y', type: 'number', defaultValue: 1 },
      { id: 'scale-z', name: 'Scale Z', type: 'number', defaultValue: 1 },
  ],
  execute: (inputs, parameters) => {
      const geom = inputs['geometry-in'] ?? inputs.geometry;
      if (!geom || !geom.vertices) {
        return { 'geometry-out': geom ?? null };
      }

      const tx = (parameters['position-x'] ?? 0) as number;
      const ty = (parameters['position-y'] ?? 0) as number;
      const tz = (parameters['position-z'] ?? 0) as number;
      const rx = ((parameters['rotation-x'] ?? 0) as number) * Math.PI / 180;
      const ry = ((parameters['rotation-y'] ?? 0) as number) * Math.PI / 180;
      const rz = ((parameters['rotation-z'] ?? 0) as number) * Math.PI / 180;
      const sx = (parameters['scale-x'] ?? 1) as number;
      const sy = (parameters['scale-y'] ?? 1) as number;
      const sz = (parameters['scale-z'] ?? 1) as number;

      const verts = geom.vertices;
      const newVerts = new Float32Array(verts.length);

      // Pre-compute rotation matrix (ZYX order)
      const cx = Math.cos(rx), sx2 = Math.sin(rx);
      const cy = Math.cos(ry), sy2 = Math.sin(ry);
      const cz = Math.cos(rz), sz2 = Math.sin(rz);

      const m00 = cy * cz, m01 = sx2 * sy2 * cz - cx * sz2, m02 = cx * sy2 * cz + sx2 * sz2;
      const m10 = cy * sz2, m11 = sx2 * sy2 * sz2 + cx * cz, m12 = cx * sy2 * sz2 - sx2 * cz;
      const m20 = -sy2, m21 = sx2 * cy, m22 = cx * cy;

      for (let i = 0; i < verts.length; i += 3) {
        // Scale
        let x = verts[i] * sx;
        let y = verts[i + 1] * sy;
        let z = verts[i + 2] * sz;
        // Rotate
        const rx2 = m00 * x + m01 * y + m02 * z;
        const ry2 = m10 * x + m11 * y + m12 * z;
        const rz2 = m20 * x + m21 * y + m22 * z;
        // Translate
        newVerts[i] = rx2 + tx;
        newVerts[i + 1] = ry2 + ty;
        newVerts[i + 2] = rz2 + tz;
      }

      // Transform normals (rotation only, no translation/scale)
      let newNormals = geom.normals;
      if (geom.normals && (rx !== 0 || ry !== 0 || rz !== 0)) {
        newNormals = new Float32Array(geom.normals.length);
        for (let i = 0; i < geom.normals.length; i += 3) {
          const nx = geom.normals[i], ny = geom.normals[i + 1], nz = geom.normals[i + 2];
          newNormals[i] = m00 * nx + m01 * ny + m02 * nz;
          newNormals[i + 1] = m10 * nx + m11 * ny + m12 * nz;
          newNormals[i + 2] = m20 * nx + m21 * ny + m22 * nz;
        }
      }

      return {
        'geometry-out': {
          ...geom,
          vertices: newVerts,
          normals: newNormals,
        },
      };
  }
};
