import { NodeDefinition } from '../../types/nodeSystem';
import { Download } from 'lucide-react';

// ATTRIBUTE CAPTURE NODE - Captures geometry attributes and converts to data
export const attributeCaptureNodeDefinition: NodeDefinition = {
  type: 'attribute-capture',
  name: 'Attribute Capture',
  description: 'Capture geometry attributes and convert to data formats',
  category: 'attributes',
  color: {
    primary: '#10b981',
    secondary: '#059669'
  },

  inputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      required: true,
      description: 'Input geometry to capture attributes from'
    }
  ],
  outputs: [
    {
      id: 'positions',
      name: 'Positions',
      type: 'vector',
      description: 'Vertex positions as vectors'
    },
    {
      id: 'normals',
      name: 'Normals',
      type: 'vector',
      description: 'Vertex normals as vectors'
    },
    {
      id: 'uvs',
      name: 'UVs',
      type: 'vector',
      description: 'UV coordinates as vectors'
    },
    {
      id: 'colors',
      name: 'Colors',
      type: 'color',
      description: 'Vertex colors'
    },
    {
      id: 'indices',
      name: 'Indices',
      type: 'number',
      description: 'Face indices'
    },
    {
      id: 'customAttributes',
      name: 'Custom Attributes',
      type: 'number',
      description: 'Custom attributes as arrays'
    }
  ],
  parameters: [
    {
      id: 'capturePositions',
      name: 'Capture Positions',
      type: 'boolean',
      defaultValue: true,
      description: 'Capture vertex positions'
    },
    {
      id: 'captureNormals',
      name: 'Capture Normals',
      type: 'boolean',
      defaultValue: true,
      description: 'Capture vertex normals'
    },
    {
      id: 'captureUVs',
      name: 'Capture UVs',
      type: 'boolean',
      defaultValue: true,
      description: 'Capture UV coordinates'
    },
    {
      id: 'captureColors',
      name: 'Capture Colors',
      type: 'boolean',
      defaultValue: true,
      description: 'Capture vertex colors'
    },
    {
      id: 'captureIndices',
      name: 'Capture Indices',
      type: 'boolean',
      defaultValue: true,
      description: 'Capture face indices'
    },
    {
      id: 'customAttributeNames',
      name: 'Custom Attributes',
      type: 'string',
      defaultValue: '',
      description: 'Comma-separated list of custom attribute names to capture'
    },
    {
      id: 'normalizeUVs',
      name: 'Normalize UVs',
      type: 'boolean',
      defaultValue: false,
      description: 'Normalize UV coordinates to 0-1 range'
    },
    {
      id: 'flattenOutput',
      name: 'Flatten Output',
      type: 'boolean',
      defaultValue: false,
      description: 'Flatten arrays to single values for single-vertex geometry'
    }
  ],
  ui: {
    icon: Download,
    width: 220,
    height: 650
  },
  execute: (inputs, parameters) => {
    const geometry = inputs.geometry;
    const capturePositions = parameters.capturePositions !== false;
    const captureNormals = parameters.captureNormals !== false;
    const captureUVs = parameters.captureUVs !== false;
    const captureColors = parameters.captureColors !== false;
    const captureIndices = parameters.captureIndices !== false;
    const customAttributeNames = parameters.customAttributeNames || '';
    const normalizeUVs = parameters.normalizeUVs || false;
    const flattenOutput = parameters.flattenOutput || false;

    if (!geometry) {
      return {
        positions: null,
        normals: null,
        uvs: null,
        colors: null,
        indices: null,
        customAttributes: null
      };
    }

    const result: any = {};

    // Capture positions
    if (capturePositions && geometry.attributes?.position) {
      const posAttr = geometry.attributes.position;
      if (posAttr.array && posAttr.array.length > 0) {
        const positions = [];
        for (let i = 0; i < posAttr.array.length; i += 3) {
          positions.push({
            x: posAttr.array[i],
            y: posAttr.array[i + 1],
            z: posAttr.array[i + 2]
          });
        }
        result.positions = flattenOutput && positions.length === 1 ? positions[0] : positions;
      }
    }

    // Capture normals
    if (captureNormals && geometry.attributes?.normal) {
      const normalAttr = geometry.attributes.normal;
      if (normalAttr.array && normalAttr.array.length > 0) {
        const normals = [];
        for (let i = 0; i < normalAttr.array.length; i += 3) {
          normals.push({
            x: normalAttr.array[i],
            y: normalAttr.array[i + 1],
            z: normalAttr.array[i + 2]
          });
        }
        result.normals = flattenOutput && normals.length === 1 ? normals[0] : normals;
      }
    }

    // Capture UVs
    if (captureUVs && geometry.attributes?.uv) {
      const uvAttr = geometry.attributes.uv;
      if (uvAttr.array && uvAttr.array.length > 0) {
        const uvs = [];
        for (let i = 0; i < uvAttr.array.length; i += 2) {
          let u = uvAttr.array[i];
          let v = uvAttr.array[i + 1];
          
          if (normalizeUVs) {
            u = Math.max(0, Math.min(1, u));
            v = Math.max(0, Math.min(1, v));
          }
          
          uvs.push({ x: u, y: v, z: 0 });
        }
        result.uvs = flattenOutput && uvs.length === 1 ? uvs[0] : uvs;
      }
    }

    // Capture colors
    if (captureColors && geometry.attributes?.color) {
      const colorAttr = geometry.attributes.color;
      if (colorAttr.array && colorAttr.array.length > 0) {
        const colors = [];
        const itemSize = colorAttr.itemSize || 3;
        
        for (let i = 0; i < colorAttr.array.length; i += itemSize) {
          colors.push({
            r: colorAttr.array[i],
            g: colorAttr.array[i + 1],
            b: colorAttr.array[i + 2],
            a: itemSize === 4 ? colorAttr.array[i + 3] : 1.0
          });
        }
        result.colors = flattenOutput && colors.length === 1 ? colors[0] : colors;
      }
    }

    // Capture indices
    if (captureIndices && geometry.index) {
      const indexArray = geometry.index.array;
      if (indexArray && indexArray.length > 0) {
        result.indices = Array.from(indexArray);
      }
    }

    // Capture custom attributes
    if (customAttributeNames.trim()) {
      const customAttrs: any = {};
      const attrNames = customAttributeNames.split(',').map((name: string) => name.trim());
      
      for (const attrName of attrNames) {
        if (geometry.attributes?.[attrName]) {
          const attr = geometry.attributes[attrName];
          if (attr.array && attr.array.length > 0) {
            customAttrs[attrName] = Array.from(attr.array);
          }
        }
      }
      
      if (Object.keys(customAttrs).length > 0) {
        result.customAttributes = customAttrs;
      }
    }

    return result;
  }
};
