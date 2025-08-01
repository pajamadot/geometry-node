import { JsonNodeDefinition } from '../../types/jsonNodes';

export const voronoiSurfaceNode: JsonNodeDefinition = {
  type: 'voronoi-surface',
  name: 'Voronoi Surface',
  description: 'Generates 3D surface based on Voronoi diagram',
  category: 'geometry',
  color: {
    primary: '#06b6d4',
    secondary: '#0891b2'
  },
  inputs: [
    {
      id: 'seed',
      name: 'Seed',
      type: 'integer',
      defaultValue: 42,
      description: 'Random seed for point distribution'
    }
  ],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Voronoi surface geometry'
    }
  ],
  parameters: [
    {
      id: 'resolution',
      name: 'Resolution',
      type: 'integer',
      defaultValue: 64,
      min: 16,
      max: 256,
      description: 'Grid resolution'
    },
    {
      id: 'pointCount',
      name: 'Point Count',
      type: 'integer',
      defaultValue: 8,
      min: 3,
      max: 50,
      description: 'Number of Voronoi points'
    },
    {
      id: 'heightVariation',
      name: 'Height Variation',
      type: 'number',
      defaultValue: 2,
      min: 0,
      max: 10,
      description: 'Height difference between cells'
    },
    {
      id: 'smoothing',
      name: 'Smoothing',
      type: 'number',
      defaultValue: 0.1,
      min: 0,
      max: 1,
      step: 0.01,
      description: 'Edge smoothing factor'
    }
  ],
  executeCode: `
const seed = inputs.seed || 42;
const resolution = parameters.resolution || 64;
const pointCount = parameters.pointCount || 8;
const heightVariation = parameters.heightVariation || 2;
const smoothing = parameters.smoothing || 0.1;

// Seeded random function
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Generate random Voronoi points
const points = [];
for (let i = 0; i < pointCount; i++) {
  const x = seededRandom(seed + i * 2) * 4 - 2;
  const y = seededRandom(seed + i * 2 + 1) * 4 - 2;
  const height = seededRandom(seed + i * 3) * heightVariation;
  points.push({ x, y, height });
}

const vertices = [];
for (let i = 0; i < resolution; i++) {
  for (let j = 0; j < resolution; j++) {
    const x = (i / resolution - 0.5) * 4;
    const y = (j / resolution - 0.5) * 4;
    
    // Find closest and second closest points
    let minDist1 = Infinity, minDist2 = Infinity;
    let closestHeight = 0, secondHeight = 0;
    
    for (const point of points) {
      const dist = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
      if (dist < minDist1) {
        minDist2 = minDist1;
        secondHeight = closestHeight;
        minDist1 = dist;
        closestHeight = point.height;
      } else if (dist < minDist2) {
        minDist2 = dist;
        secondHeight = point.height;
      }
    }
    
    // Smooth transition between cells
    const edgeFactor = Math.max(0, (minDist2 - minDist1) / smoothing);
    const smoothFactor = Math.min(1, edgeFactor);
    const height = closestHeight * smoothFactor + secondHeight * (1 - smoothFactor);
    
    vertices.push(x, height, y);
  }
}

// Generate indices for mesh
const indices = [];
for (let i = 0; i < resolution - 1; i++) {
  for (let j = 0; j < resolution - 1; j++) {
    const a = i * resolution + j;
    const b = i * resolution + j + 1;
    const c = (i + 1) * resolution + j;
    const d = (i + 1) * resolution + j + 1;
    
    indices.push(a, b, c);
    indices.push(b, d, c);
  }
}

// Create THREE.js geometry
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
geometry.setIndex(indices);
geometry.computeVertexNormals();

return { geometry };`,
  ui: {
    width: 240,
    icon: 'code',
    advanced: ['smoothing', 'heightVariation']
  },
  version: '1.0.0',
  author: 'GeometryScript',
  created: '2024-01-01T00:00:00.000Z',
  tags: ['voronoi', 'procedural', 'cellular']
}; 