import { JsonNodeDefinition } from '../../types/jsonNodes';

export const crystalGrowthNode: JsonNodeDefinition = {
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
}; 