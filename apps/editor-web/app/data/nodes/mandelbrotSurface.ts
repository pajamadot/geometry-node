import { JsonNodeDefinition } from '../../types/jsonNodes';

export const mandelbrotSurfaceNode: JsonNodeDefinition = {
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
}; 