import { NodeDefinition } from '../../types/nodeSystem';
import { GitBranch } from 'lucide-react';

// GET ATTRIBUTE VECTOR NODE - Extracts vector attributes from geometry
export const getAttributeVectorNodeDefinition: NodeDefinition = {
  type: 'get-attribute-vector',
  name: 'Get Attribute (Vector)',
  description: 'Extract vector attributes from geometry vertices',
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
      description: 'Input geometry to extract attributes from'
    }
  ],
  outputs: [
    {
      id: 'vectors',
      name: 'Vectors',
      type: 'vector',
      description: 'Extracted vector attribute values'
    }
  ],
  parameters: [
    {
      id: 'attributeName',
      name: 'Attribute Name',
      type: 'string',
      defaultValue: 'custom_vector',
      description: 'Name of the vector attribute to extract'
    },
    {
      id: 'defaultX',
      name: 'Default X',
      type: 'number',
      defaultValue: 0.0,
      description: 'Default X component if attribute is not found'
    },
    {
      id: 'defaultY',
      name: 'Default Y',
      type: 'number',
      defaultValue: 0.0,
      description: 'Default Y component if attribute is not found'
    },
    {
      id: 'defaultZ',
      name: 'Default Z',
      type: 'number',
      defaultValue: 0.0,
      description: 'Default Z component if attribute is not found'
    },
    {
      id: 'interpolation',
      name: 'Interpolation',
      type: 'select',
      defaultValue: 'vertex',
      options: ['vertex', 'face', 'uniform'],
      description: 'How to interpolate the attribute'
    }
  ],
  ui: {
    icon: GitBranch,
    width: 200,
    height: 160
  },
  execute: (inputs, parameters) => {
    const geometry = inputs.geometry;
    const attributeName = parameters.attributeName || 'custom_vector';
    const defaultX = parameters.defaultX || 0.0;
    const defaultY = parameters.defaultY || 0.0;
    const defaultZ = parameters.defaultZ || 0.0;
    const interpolation = parameters.interpolation || 'vertex';

    if (!geometry) {
      return {
        vectors: { x: defaultX, y: defaultY, z: defaultZ }
      };
    }

    // Extract vector attribute from geometry
    let vectors: any = { x: defaultX, y: defaultY, z: defaultZ };
    
    if (geometry.attributes && geometry.attributes[attributeName]) {
      const attribute = geometry.attributes[attributeName];
      if (attribute.array && attribute.array.length > 0) {
        // Convert attribute array to array of vectors
        const vectorArray = [];
        for (let i = 0; i < attribute.array.length; i += 3) {
          vectorArray.push({
            x: attribute.array[i] || defaultX,
            y: attribute.array[i + 1] || defaultY,
            z: attribute.array[i + 2] || defaultZ
          });
        }
        vectors = vectorArray;
      }
    } else if (geometry.userData && geometry.userData[attributeName]) {
      // Fallback to userData
      vectors = geometry.userData[attributeName];
    }

    return {
      vectors: vectors
    };
  }
};
