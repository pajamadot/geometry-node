import * as pc from 'playcanvas';
import { NodeDefinition } from '../../types/nodes';

export const seagullNodeDefinition: NodeDefinition = {
  type: 'seagull',
  name: 'Seagull',
  category: 'animation',
  description: 'Creates a flying seagull with flapping wings that circles around a center point',
  color: {
    primary: '#0ea5e9',
    secondary: '#0284c7'
  },
  ui: {
    icon: '🕊️',
    advanced: []
  },
  inputs: [
    {
      id: 'center',
      name: 'Center',
      type: 'vector',
      defaultValue: [0, 0, 0]
    },
    {
      id: 'time',
      name: 'Time',
      type: 'time',
      defaultValue: 0
    }
  ],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry'
    }
  ],
  parameters: [
    {
      id: 'radius',
      name: 'Flight Radius',
      type: 'number',
      defaultValue: 10,
      min: 1,
      max: 50,
      step: 0.5,
      description: 'Radius of the circular flight path'
    },
    {
      id: 'height',
      name: 'Flight Height',
      type: 'number',
      defaultValue: 5,
      min: 0,
      max: 20,
      step: 0.5,
      description: 'Height of the flight path'
    },
    {
      id: 'speed',
      name: 'Flight Speed',
      type: 'number',
      defaultValue: 1,
      min: 0.1,
      max: 5,
      step: 0.1,
      description: 'Speed of the circular flight'
    },
    {
      id: 'wingFlapSpeed',
      name: 'Wing Flap Speed',
      type: 'number',
      defaultValue: 8,
      min: 1,
      max: 20,
      step: 0.5,
      description: 'Speed of wing flapping animation'
    },
    {
      id: 'wingFlapAmplitude',
      name: 'Wing Flap Amplitude',
      type: 'number',
      defaultValue: 0.3,
      min: 0.1,
      max: 1,
      step: 0.05,
      description: 'Amplitude of wing flapping'
    },
    {
      id: 'seagullSize',
      name: 'Seagull Size',
      type: 'number',
      defaultValue: 1,
      min: 0.5,
      max: 3,
      step: 0.1,
      description: 'Size of the seagull'
    }
  ],
  execute: (inputs: Record<string, any>, parameters: Record<string, any>) => {
      const time = inputs.time ?? 0;
      const center = inputs.center ?? [0, 0, 0];
      const cx = Array.isArray(center) ? center[0] : (center.x ?? 0);
      const cy = Array.isArray(center) ? center[1] : (center.y ?? 0);
      const cz = Array.isArray(center) ? center[2] : (center.z ?? 0);
      const flightRadius = parameters.radius ?? 10;
      const flightHeight = parameters.height ?? 5;
      const speed = parameters.speed ?? 1;
      const flapSpeed = parameters.wingFlapSpeed ?? 8;
      const flapAmp = parameters.wingFlapAmplitude ?? 0.3;
      const size = parameters.seagullSize ?? 1;

      // Flight path position
      const flightAngle = time * speed;
      const posX = cx + Math.cos(flightAngle) * flightRadius;
      const posY = cy + flightHeight + Math.sin(time * 2) * 0.5;
      const posZ = cz + Math.sin(flightAngle) * flightRadius;

      // Wing flap
      const wingAngle = Math.sin(time * flapSpeed) * flapAmp;

      // Build a simple seagull mesh: body (elongated ellipsoid) + 2 wings (flat quads)
      const vertices: number[] = [];
      const normals: number[] = [];
      const indices: number[] = [];

      // Body - an elongated ellipsoid along Z axis
      const bodySegs = 8;
      const bodyRings = 6;
      const bodyLenHalf = 0.6 * size;
      const bodyRadX = 0.15 * size;
      const bodyRadY = 0.12 * size;

      for (let ring = 0; ring <= bodyRings; ring++) {
        const t = ring / bodyRings;
        const z = -bodyLenHalf + t * 2 * bodyLenHalf;
        const profileScale = Math.sin(t * Math.PI); // 0 at ends, 1 at middle
        for (let seg = 0; seg <= bodySegs; seg++) {
          const a = (seg / bodySegs) * Math.PI * 2;
          const x = Math.cos(a) * bodyRadX * profileScale;
          const y = Math.sin(a) * bodyRadY * profileScale;
          vertices.push(posX + x, posY + y, posZ + z);
          const nx = Math.cos(a) * profileScale;
          const ny = Math.sin(a) * profileScale;
          const len = Math.sqrt(nx * nx + ny * ny + 0.01) || 1;
          normals.push(nx / len, ny / len, 0.1 / len);
        }
      }

      for (let ring = 0; ring < bodyRings; ring++) {
        for (let seg = 0; seg < bodySegs; seg++) {
          const a = ring * (bodySegs + 1) + seg;
          const b = a + bodySegs + 1;
          indices.push(a, b, a + 1);
          indices.push(b, b + 1, a + 1);
        }
      }

      // Wings - two flat triangulated quads, angled by wingAngle
      const wingSpan = 1.2 * size;
      const wingDepth = 0.3 * size;
      const baseVert = vertices.length / 3;

      // Each wing: 4 vertices forming a quad
      for (const side of [-1, 1]) {
        const tipY = Math.sin(wingAngle) * wingSpan * side;
        const tipX = Math.cos(wingAngle) * wingSpan * side;
        const vi = vertices.length / 3;

        // Wing root front
        vertices.push(posX, posY, posZ + wingDepth / 2);
        normals.push(0, 1, 0);
        // Wing root back
        vertices.push(posX, posY, posZ - wingDepth / 2);
        normals.push(0, 1, 0);
        // Wing tip front
        vertices.push(posX + tipX, posY + tipY, posZ + wingDepth / 4);
        normals.push(0, 1, 0);
        // Wing tip back
        vertices.push(posX + tipX, posY + tipY, posZ - wingDepth / 4);
        normals.push(0, 1, 0);

        // Two triangles per wing
        indices.push(vi, vi + 1, vi + 2);
        indices.push(vi + 1, vi + 3, vi + 2);
        // Back face
        indices.push(vi + 2, vi + 1, vi);
        indices.push(vi + 2, vi + 3, vi + 1);
      }

      // Head - small sphere at front of body
      const headRadius = 0.1 * size;
      const headCenter = [posX, posY + 0.05 * size, posZ + bodyLenHalf + headRadius * 0.8];
      const headSegs = 6;
      const headRings = 4;
      const headBaseVert = vertices.length / 3;

      for (let ring = 0; ring <= headRings; ring++) {
        const theta = (ring / headRings) * Math.PI;
        const sinT = Math.sin(theta);
        const cosT = Math.cos(theta);
        for (let seg = 0; seg <= headSegs; seg++) {
          const phi = (seg / headSegs) * Math.PI * 2;
          const nx = sinT * Math.cos(phi);
          const ny = cosT;
          const nz = sinT * Math.sin(phi);
          vertices.push(headCenter[0] + nx * headRadius, headCenter[1] + ny * headRadius, headCenter[2] + nz * headRadius);
          normals.push(nx, ny, nz);
        }
      }

      for (let ring = 0; ring < headRings; ring++) {
        for (let seg = 0; seg < headSegs; seg++) {
          const a = headBaseVert + ring * (headSegs + 1) + seg;
          const b = a + headSegs + 1;
          indices.push(a, b, a + 1);
          indices.push(b, b + 1, a + 1);
        }
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
