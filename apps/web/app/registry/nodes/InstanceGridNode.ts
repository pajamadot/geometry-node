import * as pc from 'playcanvas';
import { NodeDefinition } from '../../types/nodes';
import { Grid } from 'lucide-react';
import { EnhancedGeometryData } from '../../utils/builders/GeometryBuilder';
import { VertexDataUtils } from '../../utils/builders/VertexDataUtils';

export const instanceGridNodeDefinition: NodeDefinition = {
  type: 'instance-grid',
  name: 'Instance Grid',
  description: 'Instance geometry in a grid pattern',
  category: 'instancing',
  color: {
    primary: '#f59e0b',
    secondary: '#d97706',
  },

  inputs: [
    {
      id: 'instance',
      name: 'Instance',
      type: 'geometry',
      required: true,
      description: 'Geometry to instance',
    },
    {
      id: 'countX',
      name: 'Count X',
      type: 'integer',
      defaultValue: 5,
      min: 1,
      max: 50,
      step: 1,
      description: 'Instances along X',
    },
    {
      id: 'countY',
      name: 'Count Y',
      type: 'integer',
      defaultValue: 5,
      min: 1,
      max: 50,
      step: 1,
      description: 'Instances along Y',
    },
    {
      id: 'spacingX',
      name: 'Spacing X',
      type: 'number',
      defaultValue: 2,
      min: 0.1,
      max: 10,
      step: 0.1,
      description: 'Distance between instances X',
    },
    {
      id: 'spacingY',
      name: 'Spacing Y',
      type: 'number',
      defaultValue: 2,
      min: 0.1,
      max: 10,
      step: 0.1,
      description: 'Distance between instances Y',
    },
  ],

  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Instanced geometry',
    },
  ],

  parameters: [],

  ui: {
    icon: Grid,
    width: 220,
  },

  execute: (inputs, parameters) => {
    const instanceGeometry = inputs.instance as EnhancedGeometryData;
    if (!instanceGeometry) {
      return { geometry: null };
    }

    const countX = inputs.countX ?? 5;
    const countY = inputs.countY ?? 5;
    const spacingX = inputs.spacingX ?? 2;
    const spacingY = inputs.spacingY ?? 2;

    const startX = -((countX - 1) * spacingX) / 2;
    const startY = -((countY - 1) * spacingY) / 2;
    
    const geometries: EnhancedGeometryData[] = [];

    for (let y = 0; y < countY; y++) {
      for (let x = 0; x < countX; x++) {
        const posX = startX + x * spacingX;
        const posY = startY + y * spacingY;

        // Clone and translate
        let cloned = VertexDataUtils.clone(instanceGeometry);
        cloned = VertexDataUtils.translate(cloned, posX, 0, posY);
        
        geometries.push(cloned);
      }
    }

    const mergedGeometry = VertexDataUtils.merge(geometries);

    return { geometry: mergedGeometry };
  },
};
