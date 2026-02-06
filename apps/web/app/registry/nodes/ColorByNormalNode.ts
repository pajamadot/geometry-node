import * as pc from 'playcanvas';
import { NodeDefinition } from '../../types/nodes';
import { Compass } from 'lucide-react';
import { AttributeOperations } from '../../utils/builders/operations/AttributeOperations';
import { EnhancedGeometryData } from '../../utils/builders/GeometryBuilder';

export const colorByNormalNodeDefinition: NodeDefinition = {
  type: 'color-by-normal',
  name: 'Color by Normal',
  description: 'Color vertices based on normal direction',
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
    icon: Compass,
    width: 200,
  },

  execute: (inputs, parameters) => {
    const geometry = inputs.geometry as EnhancedGeometryData;
    if (!geometry || !geometry.normalsArray) {
      return { geometry: geometry || null };
    }

    const colored = AttributeOperations.colorByNormal(geometry);

    return { geometry: colored };
  },
};
