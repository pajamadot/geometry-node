import { NodeDefinition } from '../../types/nodeSystem';
import { Hash } from 'lucide-react';

// GET ATTRIBUTE FLOAT NODE - Extracts float attributes from geometry
export const getAttributeFloatNodeDefinition: NodeDefinition = {
  type: 'get-attribute-float',
  name: 'Get Attribute (Float)',
  description: 'Extract float attributes from geometry vertices',
  category: 'attributes',
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
      description: 'Input geometry to extract attributes from'
    }
  ],
  outputs: [
    {
      id: 'values',
      name: 'Values',
      type: 'number',
      description: 'Extracted float attribute values'
    }
  ],
  parameters: [
    {
      id: 'attributeName',
      name: 'Attribute Name',
      type: 'string',
      defaultValue: 'custom_float',
      description: 'Name of the float attribute to extract'
    },
    {
      id: 'defaultValue',
      name: 'Default Value',
      type: 'number',
      defaultValue: 0.0,
      description: 'Default value if attribute is not found'
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
    icon: Hash,
    width: 200,
    height: 140
  },
  execute: (inputs, parameters) => {
    const geometry = inputs.geometry;
    const attributeName = parameters.attributeName || 'custom_float';
    const defaultValue = parameters.defaultValue || 0.0;
    const interpolation = parameters.interpolation || 'vertex';

    if (!geometry) {
      return {
        values: defaultValue
      };
    }

    // Extract float attribute from geometry
    let values = defaultValue;
    
    if (geometry.attributes && geometry.attributes[attributeName]) {
      const attribute = geometry.attributes[attributeName];
      if (attribute.array && attribute.array.length > 0) {
        // Convert attribute array to array of numbers
        values = Array.from(attribute.array);
      }
    } else if (geometry.userData && geometry.userData[attributeName]) {
      // Fallback to userData
      values = geometry.userData[attributeName];
    }

    return {
      values: values
    };
  }
};
