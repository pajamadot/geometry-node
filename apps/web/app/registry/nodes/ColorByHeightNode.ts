import * as pc from 'playcanvas';
import { NodeDefinition } from '../../types/nodes';
import { Palette } from 'lucide-react';
import { AttributeOperations } from '../../utils/builders/operations/AttributeOperations';
import { EnhancedGeometryData } from '../../utils/builders/GeometryBuilder';
import { VertexDataUtils } from '../../utils/builders/VertexDataUtils';

export const colorByHeightNodeDefinition: NodeDefinition = {
  type: 'color-by-height',
  name: 'Color by Height',
  description: 'Color vertices based on Y position',
  category: 'modifiers',
  color: {
    primary: '#ec4899',
    secondary: '#db2777',
  },

  inputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      required: true,
      description: 'Input geometry',
    },
    {
      id: 'minColor',
      name: 'Min Color',
      type: 'color',
      defaultValue: { r: 0, g: 0, b: 1 },
      description: 'Color at minimum height',
    },
    {
      id: 'maxColor',
      name: 'Max Color',
      type: 'color',
      defaultValue: { r: 1, g: 0, b: 0 },
      description: 'Color at maximum height',
    },
  ],

  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Colored geometry',
    },
  ],

  parameters: [],

  ui: {
    icon: Palette,
    width: 220,
  },

  execute: (inputs, parameters) => {
    const geometry = inputs.geometry as EnhancedGeometryData;
    if (!geometry) {
      return { geometry: null };
    }

    const minColor = inputs.minColor ?? { r: 0, g: 0, b: 1 };
    const maxColor = inputs.maxColor ?? { r: 1, g: 0, b: 0 };

    // Convert input colors to PlayCanvas colors
    const minColorPC = new pc.Color(minColor.r, minColor.g, minColor.b);
    const maxColorPC = new pc.Color(maxColor.r, maxColor.g, maxColor.b);

    const colored = AttributeOperations.colorByHeight(
      geometry,
      minColorPC,
      maxColorPC
    );

    return { geometry: colored };
  },
};
