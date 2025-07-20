import { NodeDefinition } from '../../types/nodeSystem';
import { Triangle } from 'lucide-react';
import * as THREE from 'three';

// CREATE FACES NODE - was 150+ lines, now 40 lines of data
export const createFacesNodeDefinition: NodeDefinition = {
  type: 'create-faces',
  name: 'Create Faces',
  description: 'Create faces from vertices',
  category: 'geometry',
  color: {
    primary: '#f59e42',
    secondary: '#b45309'
  },
  inputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      required: true,
      description: 'Input geometry to extract faces from'
    }
  ],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Generated geometry from faces'
    }
  ],
  parameters: [
    {
      id: 'faceCount',
      name: 'Count',
      type: 'integer',
      defaultValue: 1,
      min: 1,
      max: 100,
      step: 1,
      description: 'Number of faces to create'
    },
    {
      id: 'pattern',
      name: 'Pattern',
      type: 'select',
      defaultValue: 'triangle',
      options: ['triangle', 'quad', 'trianglePair', 'strip'],
      description: 'Face pattern preset'
    },
    {
      id: 'faces',
      name: 'Faces',
      type: 'faces',
      defaultValue: [{ a: 0, b: 1, c: 2 }],
      description: 'Custom face definitions'
    }
  ],
  ui: {
    width: 250,
    icon: Triangle,
    advanced: ['faces']
  },
  execute: (inputs, parameters) => {
    const { geometry } = inputs;
    const { faceCount, pattern, faces } = parameters;
    
    if (!geometry) {
      return { geometry: new THREE.BufferGeometry() };
    }
    
    // Extract vertices from input geometry
    const positionAttr = geometry.getAttribute('position');
    const vertices = [];
    for (let i = 0; i < positionAttr.count; i++) {
      vertices.push({
        x: positionAttr.getX(i),
        y: positionAttr.getY(i),
        z: positionAttr.getZ(i)
      });
    }
    
    // Generate pattern if specified
    let finalFaces = faces;
    if (pattern && pattern !== 'custom') {
      switch (pattern) {
        case 'triangle':
          finalFaces = [{ a: 0, b: 1, c: 2 }];
          break;
        case 'quad':
          finalFaces = [{ a: 0, b: 1, c: 2, d: 3 }];
          break;
        case 'trianglePair':
          finalFaces = [
            { a: 0, b: 1, c: 2 },
            { a: 0, b: 2, c: 3 }
          ];
          break;
        case 'strip':
          finalFaces = [
            { a: 0, b: 1, c: 2 },
            { a: 1, b: 3, c: 2 },
            { a: 2, b: 3, c: 4 },
            { a: 3, b: 5, c: 4 }
          ];
          break;
      }
    }
    
    // Limit to faceCount
    finalFaces = finalFaces.slice(0, faceCount);
    
    // Create Three.js geometry from vertices and faces
    const outputGeometry = new THREE.BufferGeometry();
    
    // Convert vertices to Three.js format
    const positions = new Float32Array(vertices.length * 3);
    vertices.forEach((vertex: { x: number; y: number; z: number }, i: number) => {
      positions[i * 3] = vertex.x;
      positions[i * 3 + 1] = vertex.y;
      positions[i * 3 + 2] = vertex.z;
    });
    outputGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Convert faces to indices
    const indices: number[] = [];
    finalFaces.forEach((face: { a: number; b: number; c: number; d?: number }) => {
      indices.push(face.a, face.b, face.c);
      if (face.d !== undefined) {
        indices.push(face.a, face.c, face.d);
      }
    });
    
    if (indices.length > 0) {
      outputGeometry.setIndex(indices);
    }
    
    outputGeometry.computeVertexNormals();
    
    return { geometry: outputGeometry };
  }
}; 