import { NodeDefinition } from '../../types/nodes';

export const cylinderNodeDefinition: NodeDefinition = {
  type: 'cylinder',
  name: 'Cylinder',
  description: 'Creates a cylinder geometry',
  category: 'geometry',
  color: {
    primary: '#eab308',
    secondary: '#ca8a04'
  },
  inputs: [],
  outputs: [
    { id: 'geometry', name: 'Geometry', type: 'geometry' }
  ],
  parameters: [
      { id: 'radiusTop', name: 'Radius Top', type: 'number', defaultValue: 1 },
      { id: 'radiusBottom', name: 'Radius Bottom', type: 'number', defaultValue: 1 },
      { id: 'height', name: 'Height', type: 'number', defaultValue: 2 },
      { id: 'radialSegments', name: 'Radial Segs', type: 'integer', defaultValue: 32 },
  ],
  execute: (_inputs, parameters) => {
      const rTop = (parameters?.radiusTop ?? 1) as number;
      const rBot = (parameters?.radiusBottom ?? 1) as number;
      const height = (parameters?.height ?? 2) as number;
      const segs = Math.max(3, (parameters?.radialSegments ?? 32) as number);
      const hh = height / 2;

      const vertices: number[] = [];
      const normals: number[] = [];
      const indices: number[] = [];

      // Side vertices: two rings (top and bottom)
      for (let i = 0; i <= segs; i++) {
        const angle = (i / segs) * Math.PI * 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        // Top ring
        vertices.push(cos * rTop, hh, sin * rTop);
        // Side normal: approximate for cone/cylinder
        const slope = rBot - rTop;
        const nLen = Math.sqrt(height * height + slope * slope) || 1;
        normals.push((cos * height) / nLen, slope / nLen, (sin * height) / nLen);

        // Bottom ring
        vertices.push(cos * rBot, -hh, sin * rBot);
        normals.push((cos * height) / nLen, slope / nLen, (sin * height) / nLen);
      }

      // Side faces
      for (let i = 0; i < segs; i++) {
        const a = i * 2;
        const b = a + 1;
        const c = a + 2;
        const d = a + 3;
        indices.push(a, b, d, a, d, c);
      }

      // Top cap
      const topCenter = vertices.length / 3;
      vertices.push(0, hh, 0);
      normals.push(0, 1, 0);
      for (let i = 0; i <= segs; i++) {
        const angle = (i / segs) * Math.PI * 2;
        vertices.push(Math.cos(angle) * rTop, hh, Math.sin(angle) * rTop);
        normals.push(0, 1, 0);
      }
      for (let i = 0; i < segs; i++) {
        indices.push(topCenter, topCenter + 1 + i, topCenter + 2 + i);
      }

      // Bottom cap
      const botCenter = vertices.length / 3;
      vertices.push(0, -hh, 0);
      normals.push(0, -1, 0);
      for (let i = 0; i <= segs; i++) {
        const angle = (i / segs) * Math.PI * 2;
        vertices.push(Math.cos(angle) * rBot, -hh, Math.sin(angle) * rBot);
        normals.push(0, -1, 0);
      }
      for (let i = 0; i < segs; i++) {
        indices.push(botCenter, botCenter + 2 + i, botCenter + 1 + i);
      }

      const positionsArray = new Float32Array(vertices);
      const indicesArray = new Uint32Array(indices);
      const normalsArray = new Float32Array(normals);

      return {
        geometry: {
          vertices: positionsArray,
          indices: indicesArray,
          normals: normalsArray,
          positionsArray,
          normalsArray,
          indicesArray,
          vertexCount: positionsArray.length / 3,
          faceCount: indicesArray.length / 3,
          faces: [],
          attributes: { vertex: new Map(), edge: new Map(), face: new Map(), corner: new Map() },
        },
      };
  }
};
