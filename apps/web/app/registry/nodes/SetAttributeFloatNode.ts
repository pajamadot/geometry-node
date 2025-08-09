import { NodeDefinition } from '../../types/nodeSystem';
import { Hash } from 'lucide-react';

// SET ATTRIBUTE FLOAT NODE - Sets float attributes on geometry
export const setAttributeFloatNodeDefinition: NodeDefinition = {
  type: 'set-attribute-float',
  name: 'Set Attribute (Float)',
  description: 'Set float attributes on geometry vertices',
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
      description: 'Input geometry to set attributes on'
    },
    {
      id: 'values',
      name: 'Values',
      type: 'number',
      required: true,
      description: 'Float values to set as attribute'
    }
  ],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Geometry with float attribute set'
    }
  ],
  parameters: [
    {
      id: 'attributeName',
      name: 'Attribute Name',
      type: 'string',
      defaultValue: 'custom_float',
      description: 'Name of the float attribute to set'
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
    icon: Hash,
    width: 200,
    height: 160
  },
  execute: (inputs, parameters) => {
    const geometry = inputs.geometry;
    const values = inputs.values;
    const attributeName = parameters.attributeName || 'custom_float';
    const interpolation = parameters.interpolation || 'vertex';
    const overwrite = parameters.overwrite !== false; // Default to true

    if (!geometry) {
      return {
        geometry: null
      };
    }

    // Clone the geometry to avoid modifying the original
    const clonedGeometry = JSON.parse(JSON.stringify(geometry));
    
    // Convert values to array if it's a single value
    let valueArray = values;
    if (!Array.isArray(values)) {
      // If it's a single value, create an array with that value for all vertices
      const vertexCount = clonedGeometry.attributes?.position?.count || 1;
      valueArray = new Array(vertexCount).fill(values);
    }

    // Set the attribute
    if (!clonedGeometry.attributes) {
      clonedGeometry.attributes = {};
    }

    // Create or update the attribute
    if (overwrite || !clonedGeometry.attributes[attributeName]) {
      clonedGeometry.attributes[attributeName] = {
        array: valueArray,
        itemSize: 1,
        count: valueArray.length,
        normalized: false
      };
    }

    // Also store in userData for compatibility
    if (!clonedGeometry.userData) {
      clonedGeometry.userData = {};
    }
    clonedGeometry.userData[attributeName] = valueArray;

    return {
      geometry: clonedGeometry
    };
  }
};
