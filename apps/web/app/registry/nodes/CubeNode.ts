import { NodeDefinition } from '../../types/nodes';

export const cubeNodeDefinition: NodeDefinition = {
  type: 'cube',
  name: 'Cube',
  description: 'Creates a cube geometry',
  category: 'geometry',
  color: {
    primary: '#eab308',
    secondary: '#ca8a04'
  },
  inputs: [
    { id: 'width', name: 'Width', type: 'number', defaultValue: 1 },
    { id: 'height', name: 'Height', type: 'number', defaultValue: 1 },
    { id: 'depth', name: 'Depth', type: 'number', defaultValue: 1 },
    { id: 'widthSegments', name: 'Width Segs', type: 'integer', defaultValue: 1 },
    { id: 'heightSegments', name: 'Height Segs', type: 'integer', defaultValue: 1 },
    { id: 'depthSegments', name: 'Depth Segs', type: 'integer', defaultValue: 1 },
  ],
  outputs: [
    { id: 'geometry', name: 'Geometry', type: 'geometry' }
  ],
  parameters: [
    { id: 'width', name: 'Width', type: 'number', defaultValue: 1, min: 0, max: 10 },
    { id: 'height', name: 'Height', type: 'number', defaultValue: 1, min: 0, max: 10 },
    { id: 'depth', name: 'Depth', type: 'number', defaultValue: 1, min: 0, max: 10 },
  ],
  execute: (inputs, parameters) => {
      const w = (parameters.width ?? inputs.width ?? 1) as number;
      const h = (parameters.height ?? inputs.height ?? 1) as number;
      const d = (parameters.depth ?? inputs.depth ?? 1) as number;
      const hw = w / 2, hh = h / 2, hd = d / 2;

      // 8 corners, 6 faces, 24 vertices (4 per face for proper normals)
      const vertices: number[] = [];
      const normals: number[] = [];
      const indices: number[] = [];

      const faces = [
        // +Z front
        { corners: [[-hw,-hh,hd],[hw,-hh,hd],[hw,hh,hd],[-hw,hh,hd]], normal: [0,0,1] },
        // -Z back
        { corners: [[hw,-hh,-hd],[-hw,-hh,-hd],[-hw,hh,-hd],[hw,hh,-hd]], normal: [0,0,-1] },
        // +Y top
        { corners: [[-hw,hh,hd],[hw,hh,hd],[hw,hh,-hd],[-hw,hh,-hd]], normal: [0,1,0] },
        // -Y bottom
        { corners: [[-hw,-hh,-hd],[hw,-hh,-hd],[hw,-hh,hd],[-hw,-hh,hd]], normal: [0,-1,0] },
        // +X right
        { corners: [[hw,-hh,hd],[hw,-hh,-hd],[hw,hh,-hd],[hw,hh,hd]], normal: [1,0,0] },
        // -X left
        { corners: [[-hw,-hh,-hd],[-hw,-hh,hd],[-hw,hh,hd],[-hw,hh,-hd]], normal: [-1,0,0] },
      ];

      let vi = 0;
      for (const face of faces) {
        for (const c of face.corners) {
          vertices.push(c[0], c[1], c[2]);
          normals.push(face.normal[0], face.normal[1], face.normal[2]);
        }
        indices.push(vi, vi+1, vi+2, vi, vi+2, vi+3);
        vi += 4;
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
