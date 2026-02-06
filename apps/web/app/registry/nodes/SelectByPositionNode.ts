import { NodeDefinition } from '../../types/nodeSystem';
import { Target } from 'lucide-react';
import { EnhancedGeometryData } from '../../utils/builders/GeometryBuilder';

export const selectByPositionNodeDefinition: NodeDefinition = {
  type: 'select-by-position',
  name: 'Select by Position',
  description: 'Create selection attribute based on position',
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
      id: 'minY',
      name: 'Min Y',
      type: 'number',
      defaultValue: 0,
      step: 0.1,
      description: 'Minimum Y position',
    },
    {
      id: 'maxY',
      name: 'Max Y',
      type: 'number',
      defaultValue: 10,
      step: 0.1,
      description: 'Maximum Y position',
    },
  ],

  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Geometry with selection attribute',
    },
  ],

  parameters: [],

  ui: {
    icon: Target,
    width: 220,
  },

  execute: (inputs, parameters) => {
    const geometry = inputs.geometry as EnhancedGeometryData;
    if (!geometry || !geometry.positionsArray) {
      return { geometry: null };
    }

    const minY = inputs.minY ?? 0;
    const maxY = inputs.maxY ?? 10;

    const positions = geometry.positionsArray;
    const vertexCount = positions.length / 3;

    // Create selection array (1.0 = selected, 0.0 = not selected)
    const selectionData: number[] = [];

    for (let i = 0; i < vertexCount; i++) {
      const y = positions[i * 3 + 1];
      selectionData.push((y >= minY && y <= maxY) ? 1.0 : 0.0);
    }

    // Return geometry with selection attribute
    const result: EnhancedGeometryData = {
      ...geometry,
      attributes: {
        ...geometry.attributes,
        vertex: new Map(geometry.attributes?.vertex || []),
      },
    };

    result.attributes!.vertex!.set('selection', {
      name: 'selection',
      type: 'float',
      data: selectionData,
      default: 0,
    });

    return { geometry: result };
  },
};
