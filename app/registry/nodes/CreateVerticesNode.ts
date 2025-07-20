import { NodeDefinition } from '../../types/nodeSystem';
import { Square } from 'lucide-react';

// CREATE VERTICES NODE - was 192+ lines, now 40 lines of data
export const createVerticesNodeDefinition: NodeDefinition = {
  type: 'create-vertices',
  name: 'Create Vertices',
  description: 'Create custom vertex positions',
  category: 'geometry',
  color: {
    primary: '#dc2626',
    secondary: '#b91c1c'
  },
  inputs: [],
  outputs: [
    {
      id: 'vertices',
      name: 'Vertices',
      type: 'vertices',
      description: 'Custom vertex positions'
    }
  ],
  parameters: [
    {
      id: 'vertexCount',
      name: 'Count',
      type: 'integer',
      defaultValue: 3,
      min: 1,
      max: 100,
      step: 1,
      description: 'Number of vertices to create'
    },
    {
      id: 'pattern',
      name: 'Pattern',
      type: 'select',
      defaultValue: 'triangle',
      options: ['triangle', 'quad', 'line', 'grid'],
      description: 'Vertex pattern preset'
    },
    {
      id: 'vertices',
      name: 'Vertices',
      type: 'vertices',
      defaultValue: [
        { x: 0, y: 1, z: 0 },
        { x: -1, y: -1, z: 0 },
        { x: 1, y: -1, z: 0 }
      ],
      description: 'Custom vertex positions'
    }
  ],
  ui: {
    width: 250,
    icon: Square,
    advanced: ['vertices']
  },
  execute: (inputs, parameters) => {
    const { vertexCount, pattern, vertices } = parameters;
    
    // Generate pattern if specified
    let finalVertices = vertices;
    if (pattern && pattern !== 'custom') {
      switch (pattern) {
        case 'triangle':
          finalVertices = [
            { x: 0, y: 1, z: 0 },
            { x: -1, y: -1, z: 0 },
            { x: 1, y: -1, z: 0 }
          ];
          break;
        case 'quad':
          finalVertices = [
            { x: -1, y: 1, z: 0 },
            { x: 1, y: 1, z: 0 },
            { x: 1, y: -1, z: 0 },
            { x: -1, y: -1, z: 0 }
          ];
          break;
        case 'line':
          finalVertices = [
            { x: -1, y: 0, z: 0 },
            { x: 1, y: 0, z: 0 }
          ];
          break;
        case 'grid':
          finalVertices = [
            { x: -1, y: 1, z: 0 },
            { x: 0, y: 1, z: 0 },
            { x: 1, y: 1, z: 0 },
            { x: -1, y: 0, z: 0 },
            { x: 0, y: 0, z: 0 },
            { x: 1, y: 0, z: 0 },
            { x: -1, y: -1, z: 0 },
            { x: 0, y: -1, z: 0 },
            { x: 1, y: -1, z: 0 }
          ];
          break;
      }
    }
    
    // Limit to vertexCount
    finalVertices = finalVertices.slice(0, vertexCount);
    
    return { vertices: finalVertices };
  }
}; 