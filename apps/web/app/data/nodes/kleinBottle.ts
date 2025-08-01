import { JsonNodeDefinition } from '../../types/jsonNodes';

export const kleinBottleNode: JsonNodeDefinition = {
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
}; 