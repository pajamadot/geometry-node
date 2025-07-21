import { JsonNodeDefinition } from '../../types/jsonNodes';

export const perlinTerrainNode: JsonNodeDefinition = {
  type: 'perlin-terrain',
  name: 'Perlin Terrain',
  description: 'Generates natural terrain using Perlin noise',
  category: 'geometry',
  color: {
    primary: '#84cc16',
    secondary: '#65a30d'
  },
  inputs: [
    {
      id: 'seed',
      name: 'Seed',
      type: 'integer',
      defaultValue: 123,
      description: 'Terrain generation seed'
    }
  ],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Terrain surface geometry'
    }
  ],
  parameters: [
    {
      id: 'size',
      name: 'Terrain Size',
      type: 'integer',
      defaultValue: 64,
      min: 16,
      max: 256,
      description: 'Terrain grid size'
    },
    {
      id: 'scale',
      name: 'Noise Scale',
      type: 'number',
      defaultValue: 0.1,
      min: 0.01,
      max: 1,
      step: 0.01,
      description: 'Noise frequency scale'
    },
    {
      id: 'amplitude',
      name: 'Height Amplitude',
      type: 'number',
      defaultValue: 10,
      min: 1,
      max: 50,
      description: 'Maximum terrain height'
    },
    {
      id: 'octaves',
      name: 'Octaves',
      type: 'integer',
      defaultValue: 4,
      min: 1,
      max: 8,
      description: 'Noise detail levels'
    }
  ],
  executeCode: `
const seed = inputs.seed || 123;
const size = parameters.size || 64;
const scale = parameters.scale || 0.1;
const amplitude = parameters.amplitude || 10;
const octaves = parameters.octaves || 4;

// Simple hash function for deterministic random
function hash(x, y, seed) {
  let h = seed + x * 374761393 + y * 668265263;
  h = (h ^ (h >>> 13)) * 1274126177;
  return (h ^ (h >>> 16)) / 2147483647;
}

// Interpolation function
function lerp(a, b, t) {
  return a + t * (b - a);
}

// Smooth interpolation
function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

// 2D noise function
function noise2D(x, y, seed) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  
  const a = hash(xi, yi, seed);
  const b = hash(xi + 1, yi, seed);
  const c = hash(xi, yi + 1, seed);
  const d = hash(xi + 1, yi + 1, seed);
  
  const i1 = lerp(a, b, smoothstep(xf));
  const i2 = lerp(c, d, smoothstep(xf));
  
  return lerp(i1, i2, smoothstep(yf));
}

// Fractal noise with octaves
function fractalNoise(x, y, seed, octaves, scale, amplitude) {
  let value = 0;
  let freq = scale;
  let amp = amplitude;
  
  for (let i = 0; i < octaves; i++) {
    value += noise2D(x * freq, y * freq, seed + i) * amp;
    freq *= 2;
    amp *= 0.5;
  }
  
  return value;
}

const vertices = [];
const terrainScale = 20;

for (let i = 0; i < size; i++) {
  for (let j = 0; j < size; j++) {
    const x = (i / size - 0.5) * terrainScale;
    const z = (j / size - 0.5) * terrainScale;
    
    const height = fractalNoise(i, j, seed, octaves, scale, amplitude);
    
    vertices.push(x, height, z);
  }
}

// Generate indices for terrain mesh
const indices = [];
for (let i = 0; i < size - 1; i++) {
  for (let j = 0; j < size - 1; j++) {
    const a = i * size + j;
    const b = i * size + j + 1;
    const c = (i + 1) * size + j;
    const d = (i + 1) * size + j + 1;
    
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
    width: 260,
    icon: 'code',
    advanced: ['scale', 'octaves']
  },
  version: '1.0.0',
  author: 'GeometryScript',
  created: '2024-01-01T00:00:00.000Z',
  tags: ['terrain', 'perlin', 'procedural', 'landscape']
}; 