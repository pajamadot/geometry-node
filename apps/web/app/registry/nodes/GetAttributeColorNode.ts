import { NodeDefinition } from '../../types/nodeSystem';
import { Palette } from 'lucide-react';

// GET ATTRIBUTE COLOR NODE - Extracts color attributes from geometry
export const getAttributeColorNodeDefinition: NodeDefinition = {
  type: 'get-attribute-color',
  name: 'Get Attribute (Color)',
  description: 'Extract color attributes from geometry vertices',
  category: 'attributes',
  color: {
    primary: '#ec4899',
    secondary: '#be185d'
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
      id: 'colors',
      name: 'Colors',
      type: 'color',
      description: 'Extracted color attribute values'
    }
  ],
  parameters: [
    {
      id: 'attributeName',
      name: 'Attribute Name',
      type: 'string',
      defaultValue: 'color',
      description: 'Name of the color attribute to extract'
    },
    {
      id: 'defaultR',
      name: 'Default R',
      type: 'number',
      defaultValue: 1.0,
      min: 0.0,
      max: 1.0,
      step: 0.01,
      description: 'Default red component if attribute is not found'
    },
    {
      id: 'defaultG',
      name: 'Default G',
      type: 'number',
      defaultValue: 1.0,
      min: 0.0,
      max: 1.0,
      step: 0.01,
      description: 'Default green component if attribute is not found'
    },
    {
      id: 'defaultB',
      name: 'Default B',
      type: 'number',
      defaultValue: 1.0,
      min: 0.0,
      max: 1.0,
      step: 0.01,
      description: 'Default blue component if attribute is not found'
    },
    {
      id: 'defaultA',
      name: 'Default A',
      type: 'number',
      defaultValue: 1.0,
      min: 0.0,
      max: 1.0,
      step: 0.01,
      description: 'Default alpha component if attribute is not found'
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
    icon: Palette,
    width: 200,
    height: 180
  },
  execute: (inputs, parameters) => {
    const geometry = inputs.geometry;
    const attributeName = parameters.attributeName || 'color';
    const defaultR = parameters.defaultR || 1.0;
    const defaultG = parameters.defaultG || 1.0;
    const defaultB = parameters.defaultB || 1.0;
    const defaultA = parameters.defaultA || 1.0;
    const interpolation = parameters.interpolation || 'vertex';

    if (!geometry) {
      return {
        colors: { r: defaultR, g: defaultG, b: defaultB, a: defaultA }
      };
    }

    // Extract color attribute from geometry
    let colors: any = { r: defaultR, g: defaultG, b: defaultB, a: defaultA };
    
    if (geometry.attributes && geometry.attributes[attributeName]) {
      const attribute = geometry.attributes[attributeName];
      if (attribute.array && attribute.array.length > 0) {
        // Convert attribute array to array of colors
        const colorArray = [];
        const itemSize = attribute.itemSize || 3; // RGB or RGBA
        
        for (let i = 0; i < attribute.array.length; i += itemSize) {
          colorArray.push({
            r: attribute.array[i] || defaultR,
            g: attribute.array[i + 1] || defaultG,
            b: attribute.array[i + 2] || defaultB,
            a: itemSize === 4 ? (attribute.array[i + 3] || defaultA) : defaultA
          });
        }
        colors = colorArray;
      }
    } else if (geometry.userData && geometry.userData[attributeName]) {
      // Fallback to userData
      colors = geometry.userData[attributeName];
    }

    return {
      colors: colors
    };
  }
};
