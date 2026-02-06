import { NodeDefinition } from '../../types/nodes';

export const sphereNodeDefinition: NodeDefinition = {
  type: 'sphere',
  name: 'Sphere',
  description: 'Creates a sphere geometry',
  category: 'geometry',
  color: {
    primary: '#eab308',
    secondary: '#ca8a04'
  },
  inputs: [
    { id: 'radius', name: 'Radius', type: 'number', defaultValue: 1 },
    { id: 'widthSegments', name: 'Width Segs', type: 'integer', defaultValue: 32 },
    { id: 'heightSegments', name: 'Height Segs', type: 'integer', defaultValue: 16 },
  ],
  outputs: [
    { id: 'geometry', name: 'Geometry', type: 'geometry' }
  ],
  parameters: [
    { id: 'radius', name: 'Radius', type: 'number', defaultValue: 1, min: 0, max: 10 },
  ],
  execute: (inputs, parameters) => {
      const radius = parameters.radius ?? inputs.radius ?? 1;
      const widthSegs = inputs.widthSegments ?? 32;
      const heightSegs = inputs.heightSegments ?? 16;

      // Generate icosphere-style vertices
      const vertices: number[] = [];
      const indices: number[] = [];
      const normals: number[] = [];

      for (let lat = 0; lat <= heightSegs; lat++) {
        const theta = (lat * Math.PI) / heightSegs;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        for (let lon = 0; lon <= widthSegs; lon++) {
          const phi = (lon * 2 * Math.PI) / widthSegs;
          const x = sinTheta * Math.cos(phi);
          const y = cosTheta;
          const z = sinTheta * Math.sin(phi);

          vertices.push(x * radius, y * radius, z * radius);
          normals.push(x, y, z);
        }
      }

      for (let lat = 0; lat < heightSegs; lat++) {
        for (let lon = 0; lon < widthSegs; lon++) {
          const a = lat * (widthSegs + 1) + lon;
          const b = a + widthSegs + 1;
          indices.push(a, b, a + 1);
          indices.push(b, b + 1, a + 1);
        }
      }

      return {
        geometry: {
          vertices: new Float32Array(vertices),
          indices: new Uint32Array(indices),
          normals: new Float32Array(normals),
        },
      };
  }
};
