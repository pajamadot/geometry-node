import { NodeDefinition } from '../../types/nodeSystem';
import { Move3D } from 'lucide-react';
import * as THREE from 'three';

// SPIRAL STAIR NODE - Generates procedural spiral staircase geometry
export const spiralStairNodeDefinition: NodeDefinition = {
  type: 'spiralStair',
  name: 'Spiral Stair',
  description: 'Generate procedural spiral staircase with steps and handrails',
  category: 'geometry',
  color: {
    primary: '#8b5a2b',
    secondary: '#6b4423'
  },

  inputs: [
    {
      id: 'height',
      name: 'Height',
      type: 'number',
      defaultValue: 20.0,
      min: 1.0,
      max: 50.0,
      step: 0.5,
      description: 'Total height of the staircase'
    },
    {
      id: 'radius',
      name: 'Radius',
      type: 'number',
      defaultValue: 2.5,
      min: 0.5,
      max: 10.0,
      step: 0.1,
      description: 'Radius of the spiral'
    },
    {
      id: 'stepCount',
      name: 'Step Count',
      type: 'integer',
      defaultValue: 24,
      min: 6,
      max: 100,
      step: 1,
      description: 'Number of steps in the staircase'
    },
    {
      id: 'stepWidth',
      name: 'Step Width',
      type: 'number',
      defaultValue: 1.2,
      min: 0.3,
      max: 3.0,
      step: 0.1,
      description: 'Width of each step'
    },
    {
      id: 'stepDepth',
      name: 'Step Depth',
      type: 'number',
      defaultValue: 0.8,
      min: 0.2,
      max: 2.0,
      step: 0.1,
      description: 'Depth of each step'
    },
    {
      id: 'stepThickness',
      name: 'Step Thickness',
      type: 'number',
      defaultValue: 0.1,
      min: 0.05,
      max: 0.5,
      step: 0.01,
      description: 'Thickness of each step'
    },
    {
      id: 'handrailRadius',
      name: 'Handrail Radius',
      type: 'number',
      defaultValue: 3.0,
      min: 1.0,
      max: 12.0,
      step: 0.1,
      description: 'Radius of the handrail'
    },
    {
      id: 'handrailHeight',
      name: 'Handrail Height',
      type: 'number',
      defaultValue: 1.0,
      min: 0.5,
      max: 2.0,
      step: 0.1,
      description: 'Height of the handrail'
    },
    {
      id: 'handrailThickness',
      name: 'Handrail Thickness',
      type: 'number',
      defaultValue: 0.05,
      min: 0.02,
      max: 0.2,
      step: 0.01,
      description: 'Thickness of the handrail'
    },
    {
      id: 'centerPost',
      name: 'Center Post',
      type: 'boolean',
      defaultValue: true,
      description: 'Add central support post'
    },
    {
      id: 'centerPostRadius',
      name: 'Center Post Radius',
      type: 'number',
      defaultValue: 0.2,
      min: 0.05,
      max: 1.0,
      step: 0.05,
      description: 'Radius of the center post'
    },
    {
      id: 'turns',
      name: 'Turns',
      type: 'number',
      defaultValue: 2.0,
      min: 0.5,
      max: 5.0,
      step: 0.1,
      description: 'Number of complete turns in the spiral'
    }
  ],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Generated spiral staircase geometry'
    }
  ],
  parameters: [],
  ui: {
    width: 280,
    height: 620,
    icon: Move3D,
    advanced: ['handrailThickness', 'centerPostRadius', 'stepThickness']
  },
  execute: (inputs, parameters) => {
    // Get values from inputs
    const height = inputs.height || 20.0;
    const radius = inputs.radius || 2.5;
    const stepCount = inputs.stepCount || 24;
    const stepWidth = inputs.stepWidth || 1.2;
    const stepDepth = inputs.stepDepth || 0.8;
    const stepThickness = inputs.stepThickness || 0.1;
    const handrailRadius = inputs.handrailRadius || 3.0;
    const handrailHeight = inputs.handrailHeight || 1.0;
    const handrailThickness = inputs.handrailThickness || 0.05;
    const centerPost = inputs.centerPost !== false;
    const centerPostRadius = inputs.centerPostRadius || 0.2;
    const turns = inputs.turns || 2.0;

    // Create spiral staircase geometry
    const geometry = createSpiralStairGeometry({
      height,
      radius,
      stepCount,
      stepWidth,
      stepDepth,
      stepThickness,
      handrailRadius,
      handrailHeight,
      handrailThickness,
      centerPost,
      centerPostRadius,
      turns
    });

    return { geometry };
  }
};

// Helper function to create spiral staircase geometry
function createSpiralStairGeometry(params: {
  height: number;
  radius: number;
  stepCount: number;
  stepWidth: number;
  stepDepth: number;
  stepThickness: number;
  handrailRadius: number;
  handrailHeight: number;
  handrailThickness: number;
  centerPost: boolean;
  centerPostRadius: number;
  turns: number;
}): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];

  const {
    height, radius, stepCount, stepWidth, stepDepth, stepThickness,
    handrailRadius, handrailHeight, handrailThickness, centerPost,
    centerPostRadius, turns
  } = params;

  let vertexIndex = 0;

  // Helper function to add a box (for steps)
  const addBox = (width: number, height: number, depth: number, x: number, y: number, z: number, rotationY: number = 0) => {
    const startIndex = vertexIndex;
    
    // Create box vertices
    const hw = width / 2;
    const hh = height / 2;
    const hd = depth / 2;
    
    const cos = Math.cos(rotationY);
    const sin = Math.sin(rotationY);
    
    // 8 vertices of the box
    const boxVertices = [
      [-hw, -hh, -hd], [hw, -hh, -hd], [hw, hh, -hd], [-hw, hh, -hd], // front face
      [-hw, -hh, hd], [hw, -hh, hd], [hw, hh, hd], [-hw, hh, hd]      // back face
    ];
    
    boxVertices.forEach(([vx, vy, vz]) => {
      // Apply rotation and translation
      const rx = vx * cos - vz * sin + x;
      const ry = vy + y;
      const rz = vx * sin + vz * cos + z;
      
      vertices.push(rx, ry, rz);
      uvs.push(0, 0); // Simple UV mapping
      normals.push(0, 1, 0); // Will be recomputed later
    });
    
    // Box face indices
    const faces = [
      [0, 1, 2], [0, 2, 3], // front
      [5, 4, 7], [5, 7, 6], // back
      [4, 0, 3], [4, 3, 7], // left
      [1, 5, 6], [1, 6, 2], // right
      [3, 2, 6], [3, 6, 7], // top
      [4, 5, 1], [4, 1, 0]  // bottom
    ];
    
    faces.forEach(face => {
      indices.push(
        startIndex + face[0],
        startIndex + face[1],
        startIndex + face[2]
      );
    });
    
    vertexIndex += 8;
  };

  // Helper function to add cylinder
  const addCylinder = (height: number, radius: number, x: number, y: number, z: number, segments: number = 12) => {
    const startIndex = vertexIndex;
    
    // Create vertices for cylinder
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const vx = Math.cos(angle) * radius + x;
      const vz = Math.sin(angle) * radius + z;
      
      // Bottom ring
      vertices.push(vx, y, vz);
      uvs.push(i / segments, 0);
      normals.push(Math.cos(angle), 0, Math.sin(angle));
      
      // Top ring
      vertices.push(vx, y + height, vz);
      uvs.push(i / segments, 1);
      normals.push(Math.cos(angle), 0, Math.sin(angle));
    }
    
    // Create indices for cylinder sides
    for (let i = 0; i < segments; i++) {
      const a = startIndex + i * 2;
      const b = a + 1;
      const c = a + 2;
      const d = a + 3;
      
      indices.push(a, b, c);
      indices.push(b, d, c);
    }
    
    vertexIndex += (segments + 1) * 2;
    
    // Add caps
    const bottomCenter = vertexIndex;
    vertices.push(x, y, z);
    uvs.push(0.5, 0.5);
    normals.push(0, -1, 0);
    vertexIndex++;
    
    const topCenter = vertexIndex;
    vertices.push(x, y + height, z);
    uvs.push(0.5, 0.5);
    normals.push(0, 1, 0);
    vertexIndex++;
    
    // Bottom cap triangles
    for (let i = 0; i < segments; i++) {
      const a = startIndex + i * 2;
      const b = startIndex + ((i + 1) % (segments + 1)) * 2;
      indices.push(bottomCenter, b, a);
    }
    
    // Top cap triangles
    for (let i = 0; i < segments; i++) {
      const a = startIndex + i * 2 + 1;
      const b = startIndex + ((i + 1) % (segments + 1)) * 2 + 1;
      indices.push(topCenter, a, b);
    }
  };

  // Helper function to add spiral handrail
  const addSpiralHandrail = () => {
    const handrailSegments = stepCount * 4; // More segments for smooth curve
    const startIndex = vertexIndex;
    
    for (let i = 0; i <= handrailSegments; i++) {
      const t = i / handrailSegments;
      const angle = t * turns * Math.PI * 2;
      const y = t * height;
      
      // Inner rail
      const innerX = Math.cos(angle) * (handrailRadius - handrailThickness);
      const innerZ = Math.sin(angle) * (handrailRadius - handrailThickness);
      
      // Outer rail
      const outerX = Math.cos(angle) * handrailRadius;
      const outerZ = Math.sin(angle) * handrailRadius;
      
      // Add 4 vertices per segment (inner bottom, inner top, outer bottom, outer top)
      vertices.push(innerX, y, innerZ);
      vertices.push(innerX, y + handrailHeight, innerZ);
      vertices.push(outerX, y, outerZ);
      vertices.push(outerX, y + handrailHeight, outerZ);
      
      // UVs
      uvs.push(0, 0, 0, 1, 1, 0, 1, 1);
      
      // Normals (will be recomputed)
      normals.push(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }
    
    // Create indices for handrail
    for (let i = 0; i < handrailSegments; i++) {
      const base = startIndex + i * 4;
      const next = base + 4;
      
      // Inner face
      indices.push(base, base + 1, next);
      indices.push(base + 1, next + 1, next);
      
      // Outer face
      indices.push(base + 2, next + 2, base + 3);
      indices.push(base + 3, next + 2, next + 3);
      
      // Top face
      indices.push(base + 1, base + 3, next + 1);
      indices.push(base + 3, next + 3, next + 1);
      
      // Bottom face
      indices.push(base, next, base + 2);
      indices.push(base + 2, next, next + 2);
    }
    
    vertexIndex += (handrailSegments + 1) * 4;
  };

  // Build spiral staircase

  // 1. Add individual steps
  for (let i = 0; i < stepCount; i++) {
    const t = i / stepCount;
    const angle = t * turns * Math.PI * 2;
    const stepY = t * height;
    
    const stepX = Math.cos(angle) * radius;
    const stepZ = Math.sin(angle) * radius;
    
    addBox(stepWidth, stepThickness, stepDepth, stepX, stepY, stepZ, angle);
  }

  // 2. Add center post if requested
  if (centerPost) {
    addCylinder(height, centerPostRadius, 0, 0, 0, 12);
  }

  // 3. Add spiral handrail
  addSpiralHandrail();

  // Set geometry attributes
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  
  // Compute proper normals
  geometry.computeVertexNormals();

  // Add material for rendering
  const material = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b, // Wood brown color
    side: THREE.DoubleSide,
    roughness: 0.8,
    metalness: 0.1
  });

  (geometry as any).material = material;

  return geometry;
} 