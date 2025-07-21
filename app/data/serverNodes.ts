import { JsonNodeCollection } from '../types/jsonNodes';

// Server-side node definitions
// In a real application, this would come from a database
export const SERVER_NODE_DEFINITIONS: JsonNodeCollection = {
  version: '1.0.0',
  created: '2024-01-01T00:00:00.000Z',
  modified: new Date().toISOString(),
  nodes: [
    // ===== FRACTAL GENERATORS =====
    {
      type: 'mandelbrot-surface',
      name: 'Mandelbrot Surface',
      description: 'Generates 3D surface based on Mandelbrot set iterations',
      category: 'geometry',
      color: {
        primary: '#8b5cf6',
        secondary: '#7c3aed'
      },
      inputs: [
        {
          id: 'centerX',
          name: 'Center X',
          type: 'number',
          defaultValue: 0,
          description: 'Complex plane center X'
        },
        {
          id: 'centerY',
          name: 'Center Y',
          type: 'number',
          defaultValue: 0,
          description: 'Complex plane center Y'
        }
      ],
      outputs: [
        {
          id: 'geometry',
          name: 'Geometry',
          type: 'geometry',
          description: 'Fractal surface geometry'
        }
      ],
      parameters: [
        {
          id: 'resolution',
          name: 'Resolution',
          type: 'integer',
          defaultValue: 50,
          min: 10,
          max: 200,
          description: 'Grid resolution'
        },
        {
          id: 'zoom',
          name: 'Zoom',
          type: 'number',
          defaultValue: 1,
          min: 0.1,
          max: 100,
          description: 'Zoom level'
        },
        {
          id: 'maxIterations',
          name: 'Max Iterations',
          type: 'integer',
          defaultValue: 50,
          min: 10,
          max: 500,
          description: 'Fractal iteration depth'
        },
        {
          id: 'heightScale',
          name: 'Height Scale',
          type: 'number',
          defaultValue: 2,
          min: 0.1,
          max: 10,
          description: 'Vertical scaling factor'
        }
      ],
      executeCode: `
const centerX = inputs.centerX || 0;
const centerY = inputs.centerY || 0;
const resolution = Math.min(parameters.resolution || 50, 200);
const zoom = parameters.zoom || 1;
const maxIterations = parameters.maxIterations || 50;
const heightScale = parameters.heightScale || 2;

const vertices = [];
const indices = [];
const range = 4 / zoom;

// Generate vertices
for (let i = 0; i < resolution; i++) {
  for (let j = 0; j < resolution; j++) {
    const x = centerX + (i / resolution - 0.5) * range;
    const y = centerY + (j / resolution - 0.5) * range;
    
    // Mandelbrot calculation
    let zx = 0, zy = 0;
    let iterations = 0;
    
    while (zx * zx + zy * zy < 4 && iterations < maxIterations) {
      const temp = zx * zx - zy * zy + x;
      zy = 2 * zx * zy + y;
      zx = temp;
      iterations++;
    }
    
    const height = (iterations / maxIterations) * heightScale;
    vertices.push(x * 2, height, y * 2);
  }
}

// Generate indices for triangular mesh
for (let i = 0; i < resolution - 1; i++) {
  for (let j = 0; j < resolution - 1; j++) {
    const a = i * resolution + j;
    const b = i * resolution + j + 1;
    const c = (i + 1) * resolution + j;
    const d = (i + 1) * resolution + j + 1;
    
    // Two triangles per quad
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
        advanced: ['maxIterations', 'heightScale']
      },
      version: '1.0.0',
      author: 'GeometryScript',
      created: '2024-01-01T00:00:00.000Z',
      tags: ['fractal', 'procedural', 'mathematical']
    },

    // ===== ADVANCED DEFORMATIONS =====
    {
      type: 'twist-deform',
      name: 'Twist Deform',
      description: 'Applies helical twist deformation to geometry',
      category: 'modifiers',
      color: {
        primary: '#f59e0b',
        secondary: '#d97706'
      },
      inputs: [
        {
          id: 'vertices',
          name: 'Vertices',
          type: 'vertices',
          required: true,
          description: 'Input vertices to deform'
        }
      ],
      outputs: [
        {
          id: 'geometry',
          name: 'Geometry',
          type: 'geometry',
          description: 'Twisted geometry'
        }
      ],
      parameters: [
        {
          id: 'axis',
          name: 'Twist Axis',
          type: 'select',
          defaultValue: 'y',
          options: ['x', 'y', 'z'],
          description: 'Axis of twist rotation'
        },
        {
          id: 'angle',
          name: 'Twist Angle',
          type: 'number',
          defaultValue: 1,
          min: -10,
          max: 10,
          step: 0.1,
          description: 'Twist strength (radians per unit)'
        },
        {
          id: 'falloff',
          name: 'Falloff',
          type: 'number',
          defaultValue: 1,
          min: 0.1,
          max: 5,
          step: 0.1,
          description: 'Distance falloff factor'
        }
      ],
      executeCode: `
const inputGeometry = inputs.geometry;
const axis = parameters.axis || 'y';
const angle = parameters.angle || 1;
const falloff = parameters.falloff || 1;

if (!inputGeometry || !inputGeometry.attributes || !inputGeometry.attributes.position) {
  // Create a simple fallback geometry if no input
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  return { geometry };
}

// Clone the input geometry
const geometry = inputGeometry.clone();
const positionAttribute = geometry.attributes.position;
const vertices = positionAttribute.array;

// Apply twist deformation
for (let i = 0; i < vertices.length; i += 3) {
  let x = vertices[i];
  let y = vertices[i + 1];
  let z = vertices[i + 2];
  
  let twistAmount;
  
  if (axis === 'y') {
    twistAmount = angle * y / falloff;
    const cos = Math.cos(twistAmount);
    const sin = Math.sin(twistAmount);
    const newX = x * cos - z * sin;
    const newZ = x * sin + z * cos;
    vertices[i] = newX;
    vertices[i + 2] = newZ;
  } else if (axis === 'x') {
    twistAmount = angle * x / falloff;
    const cos = Math.cos(twistAmount);
    const sin = Math.sin(twistAmount);
    const newY = y * cos - z * sin;
    const newZ = y * sin + z * cos;
    vertices[i + 1] = newY;
    vertices[i + 2] = newZ;
  } else { // z axis
    twistAmount = angle * z / falloff;
    const cos = Math.cos(twistAmount);
    const sin = Math.sin(twistAmount);
    const newX = x * cos - y * sin;
    const newY = x * sin + y * cos;
    vertices[i] = newX;
    vertices[i + 1] = newY;
  }
}

// Mark position attribute as needing update
positionAttribute.needsUpdate = true;
geometry.computeVertexNormals();

return { geometry };`,
      ui: {
        width: 220,
        icon: 'zap',
        advanced: ['falloff']
      },
      version: '1.0.0',
      author: 'GeometryScript',
      created: '2024-01-01T00:00:00.000Z',
      tags: ['deformation', 'twist', 'modifier']
    },

    // ===== PROCEDURAL PATTERNS =====
    {
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
    },

    // ===== MATHEMATICAL SURFACES =====
    {
      type: 'klein-bottle',
      name: 'Klein Bottle',
      description: 'Generates Klein bottle mathematical surface',
      category: 'geometry',
      color: {
        primary: '#ec4899',
        secondary: '#be185d'
      },
      inputs: [
        {
          id: 'time',
          name: 'Time',
          type: 'number',
          defaultValue: 0,
          description: 'Animation parameter'
        }
      ],
      outputs: [
        {
          id: 'geometry',
          name: 'Geometry',
          type: 'geometry',
          description: 'Klein bottle geometry'
        }
      ],
      parameters: [
        {
          id: 'uResolution',
          name: 'U Resolution',
          type: 'integer',
          defaultValue: 32,
          min: 8,
          max: 128,
          description: 'U parameter resolution'
        },
        {
          id: 'vResolution',
          name: 'V Resolution',
          type: 'integer',
          defaultValue: 32,
          min: 8,
          max: 128,
          description: 'V parameter resolution'
        },
        {
          id: 'scale',
          name: 'Scale',
          type: 'number',
          defaultValue: 1,
          min: 0.1,
          max: 5,
          description: 'Overall scale factor'
        }
      ],
      executeCode: `
const time = inputs.time || 0;
const uRes = parameters.uResolution || 32;
const vRes = parameters.vResolution || 32;
const scale = parameters.scale || 1;

const vertices = [];

for (let i = 0; i <= uRes; i++) {
  for (let j = 0; j <= vRes; j++) {
    const u = (i / uRes) * 2 * Math.PI;
    const v = (j / vRes) * 2 * Math.PI;
    
    // Klein bottle parametric equations with time animation
    const timeOffset = time * 0.1;
    let x, y, z;
    
    if (u < Math.PI) {
      x = 3 * Math.cos(u) * (1 + Math.sin(u)) + 
          2 * (1 - Math.cos(u) / 2) * Math.cos(u) * Math.cos(v + timeOffset);
      z = -8 * Math.sin(u) - 
          2 * (1 - Math.cos(u) / 2) * Math.sin(u) * Math.cos(v + timeOffset);
    } else {
      x = 3 * Math.cos(u) * (1 + Math.sin(u)) + 
          2 * (1 - Math.cos(u) / 2) * Math.cos(v + Math.PI + timeOffset);
      z = -8 * Math.sin(u);
    }
    
    y = -2 * (1 - Math.cos(u) / 2) * Math.sin(v + timeOffset);
    
    vertices.push(x * scale, y * scale, z * scale);
  }
}

// Generate indices for parametric surface
const indices = [];
for (let i = 0; i < uRes; i++) {
  for (let j = 0; j < vRes; j++) {
    const a = i * (vRes + 1) + j;
    const b = i * (vRes + 1) + j + 1;
    const c = (i + 1) * (vRes + 1) + j;
    const d = (i + 1) * (vRes + 1) + j + 1;
    
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
        width: 220,
        icon: 'sphere',
        advanced: ['uResolution', 'vResolution']
      },
      version: '1.0.0',
      author: 'GeometryScript',
      created: '2024-01-01T00:00:00.000Z',
      tags: ['mathematical', 'topology', 'animated']
    },

    // ===== NOISE-BASED TERRAIN =====
    {
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
    },

    // ===== ARTISTIC EFFECTS =====
    {
      type: 'crystal-growth',
      name: 'Crystal Growth',
      description: 'Simulates crystal growth patterns in 3D',
      category: 'geometry',
      color: {
        primary: '#14b8a6',
        secondary: '#0f766e'
      },
      inputs: [
        {
          id: 'seed',
          name: 'Seed',
          type: 'integer',
          defaultValue: 777,
          description: 'Growth pattern seed'
        },
        {
          id: 'time',
          name: 'Growth Time',
          type: 'number',
          defaultValue: 1,
          min: 0,
          max: 10,
          description: 'Simulation time progress'
        }
      ],
      outputs: [
        {
          id: 'geometry',
          name: 'Geometry',
          type: 'geometry',
          description: 'Crystal structure geometry'
        }
      ],
      parameters: [
        {
          id: 'branches',
          name: 'Branch Count',
          type: 'integer',
          defaultValue: 6,
          min: 3,
          max: 12,
          description: 'Number of crystal branches'
        },
        {
          id: 'complexity',
          name: 'Complexity',
          type: 'integer',
          defaultValue: 3,
          min: 1,
          max: 6,
          description: 'Growth iteration depth'
        },
        {
          id: 'angleVariation',
          name: 'Angle Variation',
          type: 'number',
          defaultValue: 0.3,
          min: 0,
          max: 1,
          step: 0.1,
          description: 'Random angle deviation'
        }
      ],
      executeCode: `
const seed = inputs.seed || 777;
const time = Math.min(inputs.time || 1, 10);
const branches = parameters.branches || 6;
const complexity = parameters.complexity || 3;
const angleVariation = parameters.angleVariation || 0.3;

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const vertices = [];
const segments = [];

// Generate crystal structure recursively
function growBranch(startX, startY, startZ, dirX, dirY, dirZ, length, depth, seedOffset) {
  if (depth <= 0 || length < 0.1) return;
  
  const endX = startX + dirX * length;
  const endY = startY + dirY * length;
  const endZ = startZ + dirZ * length;
  
  // Add segment
  segments.push({
    start: [startX, startY, startZ],
    end: [endX, endY, endZ],
    thickness: length * 0.1
  });
  
  // Grow sub-branches
  const subBranches = Math.min(3, Math.floor(length * 2));
  for (let i = 0; i < subBranches; i++) {
    const angle1 = seededRandom(seedOffset + i * 7) * Math.PI * 2;
    const angle2 = (seededRandom(seedOffset + i * 11) - 0.5) * angleVariation;
    
    const newDirX = dirX * Math.cos(angle2) + Math.sin(angle1) * Math.sin(angle2);
    const newDirY = dirY * Math.cos(angle2) + Math.cos(angle1) * Math.sin(angle2);
    const newDirZ = dirZ * Math.cos(angle2);
    
    const newLength = length * (0.6 + seededRandom(seedOffset + i * 13) * 0.3);
    
    growBranch(endX, endY, endZ, newDirX, newDirY, newDirZ, newLength, depth - 1, seedOffset + i * 17);
  }
}

// Start main branches from center
const baseLength = time * 2;
for (let i = 0; i < branches; i++) {
  const angle = (i / branches) * Math.PI * 2;
  const dirX = Math.cos(angle);
  const dirY = 0.2;
  const dirZ = Math.sin(angle);
  
  growBranch(0, 0, 0, dirX, dirY, dirZ, baseLength, complexity, seed + i * 23);
}

// Convert segments to cylindrical geometry
const indices = [];
let vertexIndex = 0;

for (const segment of segments) {
  const start = new THREE.Vector3(...segment.start);
  const end = new THREE.Vector3(...segment.end);
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  
  if (length < 0.01) continue;
  
  direction.normalize();
  
  // Create cylinder geometry for each segment
  const radius = segment.thickness;
  const radialSegments = 6;
  
  // Find perpendicular vectors
  const up = Math.abs(direction.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const right = new THREE.Vector3().crossVectors(direction, up).normalize();
  const forward = new THREE.Vector3().crossVectors(right, direction).normalize();
  
  // Create ring vertices at start and end
  for (let i = 0; i <= radialSegments; i++) {
    const angle = (i / radialSegments) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    const offset = new THREE.Vector3()
      .addScaledVector(right, cos * radius)
      .addScaledVector(forward, sin * radius);
    
    // Start ring
    const startPos = new THREE.Vector3().addVectors(start, offset);
    vertices.push(startPos.x, startPos.y, startPos.z);
    
    // End ring
    const endPos = new THREE.Vector3().addVectors(end, offset);
    vertices.push(endPos.x, endPos.y, endPos.z);
  }
  
  // Create indices for cylinder
  const startIndex = vertexIndex;
  for (let i = 0; i < radialSegments; i++) {
    const a = startIndex + i * 2;
    const b = startIndex + i * 2 + 1;
    const c = startIndex + ((i + 1) % radialSegments) * 2;
    const d = startIndex + ((i + 1) % radialSegments) * 2 + 1;
    
    // Two triangles per segment face
    indices.push(a, c, b);
    indices.push(b, c, d);
  }
  
  vertexIndex += (radialSegments + 1) * 2;
}

// Create THREE.js geometry
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
geometry.setIndex(indices);
geometry.computeVertexNormals();

return { geometry };`,
      ui: {
        width: 240,
        icon: 'zap',
        advanced: ['complexity', 'angleVariation']
      },
      version: '1.0.0',
      author: 'GeometryScript',
      created: '2024-01-01T00:00:00.000Z',
      tags: ['crystal', 'growth', 'procedural', 'organic']
    },

    // ===== CUSTOM SHADER MATERIALS =====
    {
      type: 'holographic-material',
      name: 'Holographic Material',
      description: 'Creates iridescent holographic material with rainbow effects',
      category: 'materials',
      color: {
        primary: '#a855f7',
        secondary: '#7c3aed'
      },
      inputs: [
        {
          id: 'geometry',
          name: 'Geometry',
          type: 'geometry',
          required: true,
          description: 'Input geometry to apply material'
        },
        {
          id: 'time',
          name: 'Time',
          type: 'number',
          defaultValue: 0,
          description: 'Animation time'
        }
      ],
      outputs: [
        {
          id: 'mesh',
          name: 'Mesh',
          type: 'geometry',
          description: 'Geometry with holographic material'
        }
      ],
      parameters: [
        {
          id: 'intensity',
          name: 'Intensity',
          type: 'number',
          defaultValue: 2.0,
          min: 0.1,
          max: 5.0,
          step: 0.1,
          description: 'Hologram intensity'
        },
        {
          id: 'speed',
          name: 'Animation Speed',
          type: 'number',
          defaultValue: 1.0,
          min: 0.1,
          max: 3.0,
          step: 0.1,
          description: 'Animation speed'
        },
        {
          id: 'fresnelPower',
          name: 'Fresnel Power',
          type: 'number',
          defaultValue: 3.0,
          min: 1.0,
          max: 10.0,
          step: 0.5,
          description: 'Edge highlighting strength'
        }
      ],
      executeCode: `
const geometry = inputs.geometry;
const time = inputs.time || 0;
const intensity = parameters.intensity || 2.0;
const speed = parameters.speed || 1.0;
const fresnelPower = parameters.fresnelPower || 3.0;

if (!geometry) {
  return { mesh: null };
}

// Holographic vertex shader
const vertexShader = \`
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
\`;

// Holographic fragment shader
const fragmentShader = \`
  uniform float uTime;
  uniform float uIntensity;
  uniform float uFresnelPower;
  
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec2 vUv;
  
  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }
  
  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    vec3 normal = normalize(vWorldNormal);
    
    // Fresnel effect
    float fresnel = 1.0 - abs(dot(viewDir, normal));
    fresnel = pow(fresnel, uFresnelPower);
    
    // Animated rainbow colors
    float colorShift = vUv.x * 3.0 + vUv.y * 2.0 + uTime * 0.5;
    vec3 rainbow = hsv2rgb(vec3(fract(colorShift), 0.8, 1.0));
    
    // Holographic interference pattern
    float pattern = sin(vWorldPosition.y * 20.0 + uTime * 2.0) * 0.5 + 0.5;
    pattern *= sin(vWorldPosition.x * 15.0 + uTime * 1.5) * 0.5 + 0.5;
    
    // Combine effects
    vec3 color = rainbow * pattern * fresnel * uIntensity;
    float alpha = fresnel * 0.8 + pattern * 0.2;
    
    gl_FragColor = vec4(color, alpha);
  }
\`;

// Create shader material
const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uTime: { value: time * speed },
    uIntensity: { value: intensity },
    uFresnelPower: { value: fresnelPower }
  },
  transparent: true,
  side: THREE.DoubleSide
});

const mesh = new THREE.Mesh(geometry, material);

return { mesh };`,
      ui: {
        width: 260,
        icon: 'zap',
        advanced: ['fresnelPower', 'speed']
      },
      version: '1.0.0',
      author: 'GeometryScript',
      created: '2024-01-01T00:00:00.000Z',
      tags: ['material', 'shader', 'holographic', 'rainbow']
    },

    {
      type: 'lava-material',
      name: 'Lava Material',
      description: 'Animated molten lava material with flowing effects',
      category: 'materials',
      color: {
        primary: '#dc2626',
        secondary: '#b91c1c'
      },
      inputs: [
        {
          id: 'geometry',
          name: 'Geometry',
          type: 'geometry',
          required: true,
          description: 'Input geometry to apply material'
        },
        {
          id: 'time',
          name: 'Time',
          type: 'number',
          defaultValue: 0,
          description: 'Animation time'
        }
      ],
             outputs: [
        {
          id: 'mesh',
          name: 'Mesh',
          type: 'geometry',
          description: 'Geometry with lava material'
        }
      ],
      parameters: [
        {
          id: 'temperature',
          name: 'Temperature',
          type: 'number',
          defaultValue: 2000,
          min: 800,
          max: 4000,
          description: 'Lava temperature (affects color)'
        },
        {
          id: 'flowSpeed',
          name: 'Flow Speed',
          type: 'number',
          defaultValue: 1.0,
          min: 0.1,
          max: 3.0,
          step: 0.1,
          description: 'Lava flow animation speed'
        },
        {
          id: 'crustThickness',
          name: 'Crust Thickness',
          type: 'number',
          defaultValue: 0.3,
          min: 0.0,
          max: 1.0,
          step: 0.05,
          description: 'Dark crust layer thickness'
        }
      ],
             executeCode: `
const geometry = inputs.geometry;
const time = inputs.time || 0;
const temperature = parameters.temperature || 2000;
const flowSpeed = parameters.flowSpeed || 1.0;
const crustThickness = parameters.crustThickness || 0.3;

if (!geometry) {
  return { mesh: null };
}

const vertexShader = \`
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
\`;

const fragmentShader = \`
  uniform float uTime;
  uniform float uTemperature;
  uniform float uCrustThickness;
  
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec2 vUv;
  
  // Noise function
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }
  
  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  
  void main() {
    // Multi-octave noise for lava flow
    vec2 flowUV = vUv * 4.0 + vec2(uTime * 0.1, uTime * 0.05);
    float lavaFlow = noise(flowUV);
    lavaFlow += noise(flowUV * 2.0) * 0.5;
    lavaFlow += noise(flowUV * 4.0) * 0.25;
    lavaFlow /= 1.75;
    
    // Temperature-based color
    float heat = (uTemperature - 800.0) / 3200.0;
    vec3 coldColor = vec3(0.1, 0.05, 0.02); // Dark crust
    vec3 warmColor = vec3(0.8, 0.3, 0.1);   // Orange glow
    vec3 hotColor = vec3(1.0, 0.9, 0.3);    // Yellow hot
    
    // Flow pattern affects temperature
    float localHeat = heat + (lavaFlow - 0.5) * 0.4;
    
    vec3 lavaColor;
    if (localHeat < 0.3) {
      lavaColor = mix(coldColor, warmColor, localHeat / 0.3);
    } else {
      lavaColor = mix(warmColor, hotColor, (localHeat - 0.3) / 0.7);
    }
    
    // Crust effect
    float crustMask = smoothstep(uCrustThickness - 0.1, uCrustThickness + 0.1, lavaFlow);
    lavaColor = mix(coldColor, lavaColor, crustMask);
    
    // Glowing edges
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = 1.0 - abs(dot(viewDir, vWorldNormal));
    lavaColor += hotColor * fresnel * 0.3 * crustMask;
    
    gl_FragColor = vec4(lavaColor, 1.0);
  }
\`;

const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uTime: { value: time * flowSpeed },
    uTemperature: { value: temperature },
    uCrustThickness: { value: crustThickness }
  }
});

const mesh = new THREE.Mesh(geometry, material);

return { mesh };`,
      ui: {
        width: 240,
        icon: 'zap',
        advanced: ['crustThickness']
      },
      version: '1.0.0',
      author: 'GeometryScript',
      created: '2024-01-01T00:00:00.000Z',
      tags: ['material', 'shader', 'lava', 'animated']
    },

    {
      type: 'matrix-rain-material',
      name: 'Matrix Rain Material',
      description: 'Digital matrix rain effect with falling characters',
      category: 'materials',
      color: {
        primary: '#22c55e',
        secondary: '#16a34a'
      },
      inputs: [
        {
          id: 'geometry',
          name: 'Geometry',
          type: 'geometry',
          required: true,
          description: 'Input geometry to apply material'
        },
        {
          id: 'time',
          name: 'Time',
          type: 'number',
          defaultValue: 0,
          description: 'Animation time'
        }
      ],
             outputs: [
        {
          id: 'mesh',
          name: 'Mesh',
          type: 'geometry',
          description: 'Geometry with matrix material'
        }
      ],
      parameters: [
        {
          id: 'density',
          name: 'Character Density',
          type: 'number',
          defaultValue: 20,
          min: 5,
          max: 50,
          description: 'Number of character columns'
        },
        {
          id: 'speed',
          name: 'Fall Speed',
          type: 'number',
          defaultValue: 2.0,
          min: 0.5,
          max: 5.0,
          step: 0.1,
          description: 'Speed of falling characters'
        },
        {
          id: 'brightness',
          name: 'Brightness',
          type: 'number',
          defaultValue: 1.5,
          min: 0.5,
          max: 3.0,
          step: 0.1,
          description: 'Overall brightness'
        }
      ],
             executeCode: `
const geometry = inputs.geometry;
const time = inputs.time || 0;
const density = parameters.density || 20;
const speed = parameters.speed || 2.0;
const brightness = parameters.brightness || 1.5;

if (!geometry) {
  return { mesh: null };
}

const vertexShader = \`
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  
  void main() {
    vUv = uv;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
\`;

const fragmentShader = \`
  uniform float uTime;
  uniform float uDensity;
  uniform float uSpeed;
  uniform float uBrightness;
  
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }
  
  void main() {
    vec2 grid = vec2(uDensity, uDensity * 2.0);
    vec2 cell = floor(vUv * grid);
    vec2 cellUV = fract(vUv * grid);
    
    // Random offset for each column
    float columnOffset = random(vec2(cell.x, 0.0)) * 6.28;
    
    // Falling effect
    float fall = fract(uTime * uSpeed * 0.1 + columnOffset);
    float trailPos = cell.y / grid.y;
    
    // Distance from trail head
    float dist = abs(trailPos - fall);
    if (trailPos > fall) dist = min(dist, fall + 1.0 - trailPos);
    
    // Trail fade
    float trail = exp(-dist * 15.0);
    
    // Character pattern (simulated)
    float charPattern = step(0.3, random(cell + floor(uTime * uSpeed * 2.0)));
    
    // Matrix green color
    vec3 matrixGreen = vec3(0.0, 1.0, 0.3);
    vec3 darkGreen = vec3(0.0, 0.3, 0.1);
    
    // Lead character is brighter
    float leadBrightness = exp(-dist * 50.0) * 2.0;
    vec3 color = mix(darkGreen, matrixGreen, trail + leadBrightness);
    
    float alpha = (trail + leadBrightness) * charPattern * uBrightness;
    
    gl_FragColor = vec4(color * alpha, alpha);
  }
\`;

const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uTime: { value: time },
    uDensity: { value: density },
    uSpeed: { value: speed },
    uBrightness: { value: brightness }
  },
  transparent: true,
  side: THREE.DoubleSide
});

const mesh = new THREE.Mesh(geometry, material);

return { mesh };`,
      ui: {
        width: 260,
        icon: 'zap',
        advanced: ['density', 'brightness']
      },
      version: '1.0.0',
      author: 'GeometryScript',
      created: '2024-01-01T00:00:00.000Z',
      tags: ['material', 'shader', 'matrix', 'digital', 'cyberpunk']
    },

    {
      type: 'portal-material',
      name: 'Portal Material',
      description: 'Swirling interdimensional portal effect',
      category: 'materials',
      color: {
        primary: '#06b6d4',
        secondary: '#0891b2'
      },
      inputs: [
        {
          id: 'geometry',
          name: 'Geometry',
          type: 'geometry',
          required: true,
          description: 'Input geometry to apply material'
        },
        {
          id: 'time',
          name: 'Time',
          type: 'number',
          defaultValue: 0,
          description: 'Animation time'
        }
      ],
             outputs: [
        {
          id: 'mesh',
          name: 'Mesh',
          type: 'geometry',
          description: 'Geometry with portal material'
        }
      ],
      parameters: [
        {
          id: 'swirl',
          name: 'Swirl Intensity',
          type: 'number',
          defaultValue: 3.0,
          min: 0.5,
          max: 8.0,
          step: 0.1,
          description: 'Spiral distortion strength'
        },
        {
          id: 'color1',
          name: 'Inner Color',
          type: 'color',
          defaultValue: '#ff006e',
          description: 'Portal center color'
        },
        {
          id: 'color2',
          name: 'Outer Color',
          type: 'color',
          defaultValue: '#8338ec',
          description: 'Portal edge color'
        }
      ],
             executeCode: `
const geometry = inputs.geometry;
const time = inputs.time || 0;
const swirl = parameters.swirl || 3.0;
const color1 = parameters.color1 || '#ff006e';
const color2 = parameters.color2 || '#8338ec';

if (!geometry) {
  return { mesh: null };
}

// Convert hex colors to RGB
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

const rgb1 = hexToRgb(color1);
const rgb2 = hexToRgb(color2);

const vertexShader = \`
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  
  void main() {
    vUv = uv;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
\`;

const fragmentShader = \`
  uniform float uTime;
  uniform float uSwirl;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  
  void main() {
    vec2 center = vec2(0.5, 0.5);
    vec2 pos = vUv - center;
    
    // Polar coordinates
    float radius = length(pos);
    float angle = atan(pos.y, pos.x);
    
    // Spiral distortion
    angle += radius * uSwirl + uTime * 2.0;
    
    // Animated spiral pattern
    float spiral = sin(angle * 6.0 - radius * 20.0 + uTime * 3.0) * 0.5 + 0.5;
    
    // Radial fade
    float fade = 1.0 - smoothstep(0.0, 0.5, radius);
    
    // Energy rings
    float rings = sin(radius * 30.0 - uTime * 5.0) * 0.3 + 0.7;
    
    // Color mixing
    vec3 color = mix(uColor2, uColor1, spiral * rings);
    
    // Portal glow
    float glow = exp(-radius * 3.0) * 2.0;
    color += vec3(0.3, 0.6, 1.0) * glow;
    
    float alpha = fade * rings * (0.7 + spiral * 0.3);
    
    gl_FragColor = vec4(color, alpha);
  }
\`;

const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uTime: { value: time },
    uSwirl: { value: swirl },
    uColor1: { value: new THREE.Vector3(...rgb1) },
    uColor2: { value: new THREE.Vector3(...rgb2) }
  },
  transparent: true,
  side: THREE.DoubleSide
});

const mesh = new THREE.Mesh(geometry, material);

return { mesh };`,
      ui: {
        width: 240,
        icon: 'zap',
        advanced: ['swirl']
      },
      version: '1.0.0',
      author: 'GeometryScript',
      created: '2024-01-01T00:00:00.000Z',
      tags: ['material', 'shader', 'portal', 'dimensional', 'swirl']
    },

    {
      type: 'neon-glow-material',
      name: 'Neon Glow Material',
      description: 'Cyberpunk neon glow with edge lighting effects',
      category: 'materials',
      color: {
        primary: '#f97316',
        secondary: '#ea580c'
      },
      inputs: [
        {
          id: 'geometry',
          name: 'Geometry',
          type: 'geometry',
          required: true,
          description: 'Input geometry to apply material'
        },
        {
          id: 'time',
          name: 'Time',
          type: 'number',
          defaultValue: 0,
          description: 'Animation time'
        }
      ],
             outputs: [
        {
          id: 'mesh',
          name: 'Mesh',
          type: 'geometry',
          description: 'Geometry with neon material'
        }
      ],
      parameters: [
        {
          id: 'glowColor',
          name: 'Glow Color',
          type: 'color',
          defaultValue: '#00ffff',
          description: 'Neon glow color'
        },
        {
          id: 'intensity',
          name: 'Glow Intensity',
          type: 'number',
          defaultValue: 2.5,
          min: 0.5,
          max: 5.0,
          step: 0.1,
          description: 'Glow brightness'
        },
        {
          id: 'pulse',
          name: 'Pulse Speed',
          type: 'number',
          defaultValue: 2.0,
          min: 0.0,
          max: 5.0,
          step: 0.1,
          description: 'Pulsing animation speed'
        }
      ],
             executeCode: `
const geometry = inputs.geometry;
const time = inputs.time || 0;
const glowColor = parameters.glowColor || '#00ffff';
const intensity = parameters.intensity || 2.5;
const pulse = parameters.pulse || 2.0;

if (!geometry) {
  return { mesh: null };
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

const rgb = hexToRgb(glowColor);

const vertexShader = \`
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
\`;

const fragmentShader = \`
  uniform float uTime;
  uniform vec3 uGlowColor;
  uniform float uIntensity;
  uniform float uPulse;
  
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec2 vUv;
  
  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    vec3 normal = normalize(vWorldNormal);
    
    // Fresnel edge glow
    float fresnel = 1.0 - abs(dot(viewDir, normal));
    fresnel = pow(fresnel, 2.0);
    
    // Pulsing effect
    float pulseFactor = 1.0;
    if (uPulse > 0.0) {
      pulseFactor = 0.7 + 0.3 * sin(uTime * uPulse);
    }
    
    // Scanline effect
    float scanlines = sin(vUv.y * 100.0 + uTime * 10.0) * 0.1 + 0.9;
    
    // Base color with glow
    vec3 baseColor = uGlowColor * 0.3;
    vec3 glowEffect = uGlowColor * fresnel * uIntensity * pulseFactor * scanlines;
    
    vec3 finalColor = baseColor + glowEffect;
    
    // Alpha based on glow intensity
    float alpha = 0.8 + fresnel * 0.2;
    
    gl_FragColor = vec4(finalColor, alpha);
  }
\`;

const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uTime: { value: time },
    uGlowColor: { value: new THREE.Vector3(...rgb) },
    uIntensity: { value: intensity },
    uPulse: { value: pulse }
  },
  transparent: true,
  side: THREE.DoubleSide
});

const mesh = new THREE.Mesh(geometry, material);

return { mesh };`,
      ui: {
        width: 240,
        icon: 'zap',
        advanced: ['pulse']
      },
      version: '1.0.0',
      author: 'GeometryScript',
      created: '2024-01-01T00:00:00.000Z',
      tags: ['material', 'shader', 'neon', 'cyberpunk', 'glow']
    }
  ]
}; 