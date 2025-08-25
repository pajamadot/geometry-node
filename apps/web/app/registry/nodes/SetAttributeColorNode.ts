import { NodeDefinition } from '../../types/nodeSystem';
import { Palette } from 'lucide-react';

// SET ATTRIBUTE COLOR NODE - Sets color attributes on geometry
export const setAttributeColorNodeDefinition: NodeDefinition = {
  type: 'set-attribute-color',
  name: 'Set Attribute (Color)',
  description: 'Set color attributes on geometry vertices',
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
      description: 'Input geometry to set attributes on'
    },
    {
      id: 'colors',
      name: 'Colors',
      type: 'color',
      required: true,
      description: 'Color values to set as attribute'
    }
  ],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Geometry with color attribute set'
    }
  ],
  parameters: [
    {
      id: 'attributeName',
      name: 'Attribute Name',
      type: 'string',
      defaultValue: 'color',
      description: 'Name of the color attribute to set'
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
    },
    {
      id: 'includeAlpha',
      name: 'Include Alpha',
      type: 'boolean',
      defaultValue: false,
      description: 'Include alpha channel in color attribute'
    }
  ],
  ui: {
    icon: Palette,
    width: 200,
    height: 180
  },
  execute: (inputs, parameters) => {
    const geometry = inputs.geometry;
    const colors = inputs.colors;
    const attributeName = parameters.attributeName || 'color';
    const interpolation = parameters.interpolation || 'vertex';
    const overwrite = parameters.overwrite !== false; // Default to true
    const includeAlpha = parameters.includeAlpha || false;

    if (!geometry) {
      return {
        geometry: null
      };
    }

    // Clone the geometry to avoid modifying the original
    const clonedGeometry = JSON.parse(JSON.stringify(geometry));
    
    // Convert colors to array format
    let colorArray = [];
    const itemSize = includeAlpha ? 4 : 3;
    
    if (Array.isArray(colors)) {
      // If it's an array of colors, flatten them
      for (const color of colors) {
        if (color && typeof color.r === 'number' && typeof color.g === 'number' && typeof color.b === 'number') {
          colorArray.push(color.r, color.g, color.b);
          if (includeAlpha) {
            colorArray.push(color.a !== undefined ? color.a : 1.0);
          }
        }
      }
    } else if (colors && typeof colors.r === 'number' && typeof colors.g === 'number' && typeof colors.b === 'number') {
      // If it's a single color, create an array with that color for all vertices
      const vertexCount = clonedGeometry.attributes?.position?.count || 1;
      for (let i = 0; i < vertexCount; i++) {
        colorArray.push(colors.r, colors.g, colors.b);
        if (includeAlpha) {
          colorArray.push(colors.a !== undefined ? colors.a : 1.0);
        }
      }
    }

    // Set the attribute
    if (!clonedGeometry.attributes) {
      clonedGeometry.attributes = {};
    }

    // Create or update the attribute
    if (overwrite || !clonedGeometry.attributes[attributeName]) {
      clonedGeometry.attributes[attributeName] = {
        array: colorArray,
        itemSize: itemSize,
        count: colorArray.length / itemSize,
        normalized: true // Colors are typically normalized
      };
    }

    // Also store in userData for compatibility
    if (!clonedGeometry.userData) {
      clonedGeometry.userData = {};
    }
    clonedGeometry.userData[attributeName] = colors;

    return {
      geometry: clonedGeometry
    };
  }
};
