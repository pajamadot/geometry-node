import { NodeDefinition } from '../../types/nodes';
import { BoxSelect } from 'lucide-react';
import { EnhancedGeometryData } from '../../utils/builders/GeometryBuilder';
// import { createGeometryFromVerticesAndFaces } from '../../utils/nodeCompiler'; // Circular dep, assuming simplified logic here

export const createFacesNodeDefinition: NodeDefinition = {
  type: 'create-faces',
  name: 'Create Faces',
  description: 'Create faces from vertex indices',
  category: 'geometry',
  color: {
    primary: '#6366f1',
    secondary: '#4f46e5',
  },

  inputs: [
    {
      id: 'vertices-in', // Using hyphenated ID to match legacy connection logic if needed
      name: 'Vertices',
      type: 'vertices', // Custom type for array of vertices
      required: true,
      description: 'Array of vertices',
    },
  ],

  outputs: [
    {
      id: 'faces-out',
      name: 'Faces',
      type: 'faces', // Custom type for array of faces
      description: 'Array of face definitions',
    },
  ],

  parameters: [
    {
      id: 'indices',
      name: 'Indices (comma separated)',
      type: 'string',
      defaultValue: '0,1,2',
      description: 'Indices of vertices to form faces',
    },
  ],

  ui: {
    icon: BoxSelect,
    width: 240,
  },

  execute: (inputs, parameters) => {
    const vertices = inputs['vertices-in'] || [];
    const indicesStr = parameters.indices || '0,1,2';
    
    // Parse indices string "0,1,2, 2,3,0"
    const indices = indicesStr.split(',')
      .map((s: string) => parseInt(s.trim(), 10))
      .filter((n: number) => !isNaN(n));

    const faces = [];
    for (let i = 0; i < indices.length; i += 3) {
      if (i + 2 < indices.length) {
        faces.push({
          a: indices[i],
          b: indices[i+1],
          c: indices[i+2]
        });
      }
    }

    return {
      'faces-out': faces
    };
  },
};
