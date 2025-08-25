import { NodeDefinition } from '../../types/nodeSystem';
import { GitBranch } from 'lucide-react';

// SET ATTRIBUTE VECTOR NODE - Sets vector attributes on geometry
export const setAttributeVectorNodeDefinition: NodeDefinition = {
  type: 'set-attribute-vector',
  name: 'Set Attribute (Vector)',
  description: 'Set vector attributes on geometry vertices',
  category: 'attributes',
  color: {
    primary: '#3b82f6',
    secondary: '#1d4ed8'
  },

  inputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      required: true,
      description: 'Input geometry to set attributes on'
    },
    {
      id: 'vectors',
      name: 'Vectors',
      type: 'vector',
      required: true,
      description: 'Vector values to set as attribute'
    }
  ],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Geometry with vector attribute set'
    }
  ],
  parameters: [
    {
      id: 'attributeName',
      name: 'Attribute Name',
      type: 'string',
      defaultValue: 'custom_vector',
      description: 'Name of the vector attribute to set'
    },
    {
      id: 'interpolation',
      name: 'Interpolation',
      type: 'select',
      defaultValue: 'vertex',
      options: ['vertex', 'face', 'uniform'],
      description: 'How to interpolate the attribute'
    },
    {
      id: 'overwrite',
      name: 'Overwrite',
      type: 'boolean',
      defaultValue: true,
      description: 'Overwrite existing attribute if it exists'
    }
  ],
  ui: {
    icon: GitBranch,
    width: 200,
    height: 160
  },
  execute: (inputs, parameters) => {
    const geometry = inputs.geometry;
    const vectors = inputs.vectors;
    const attributeName = parameters.attributeName || 'custom_vector';
    const interpolation = parameters.interpolation || 'vertex';
    const overwrite = parameters.overwrite !== false; // Default to true

    if (!geometry) {
      return {
        geometry: null
      };
    }

    // Clone the geometry to avoid modifying the original
    const clonedGeometry = JSON.parse(JSON.stringify(geometry));
    
    // Convert vectors to array format
    let vectorArray = [];
    if (Array.isArray(vectors)) {
      // If it's an array of vectors, flatten them
      for (const vector of vectors) {
        if (vector && typeof vector.x === 'number' && typeof vector.y === 'number' && typeof vector.z === 'number') {
          vectorArray.push(vector.x, vector.y, vector.z);
        }
      }
    } else if (vectors && typeof vectors.x === 'number' && typeof vectors.y === 'number' && typeof vectors.z === 'number') {
      // If it's a single vector, create an array with that vector for all vertices
      const vertexCount = clonedGeometry.attributes?.position?.count || 1;
      for (let i = 0; i < vertexCount; i++) {
        vectorArray.push(vectors.x, vectors.y, vectors.z);
      }
    }

    // Set the attribute
    if (!clonedGeometry.attributes) {
      clonedGeometry.attributes = {};
    }

    // Create or update the attribute
    if (overwrite || !clonedGeometry.attributes[attributeName]) {
      clonedGeometry.attributes[attributeName] = {
        array: vectorArray,
        itemSize: 3,
        count: vectorArray.length / 3,
        normalized: false
      };
    }

    // Also store in userData for compatibility
    if (!clonedGeometry.userData) {
      clonedGeometry.userData = {};
    }
    clonedGeometry.userData[attributeName] = vectors;

    return {
      geometry: clonedGeometry
    };
  }
};
