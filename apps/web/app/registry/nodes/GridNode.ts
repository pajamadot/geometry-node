import { NodeDefinition } from '../../types/nodeSystem';
import { Grid } from 'lucide-react';
import * as THREE from 'three';

// GRID PRIMITIVE - Unified input system
export const gridNodeDefinition: NodeDefinition = {
  type: 'grid',
  name: 'Grid',
  description: 'Creates a grid geometry',
  category: 'primitives',
  color: {
    primary: '#ea580c',
    secondary: '#c2410c'
  },

  inputs: [
    {
      id: 'width',
      name: 'Width',
      type: 'number',
      defaultValue: 10,
      min: 0.1,
      step: 0.1,
      description: 'Grid width'
    },
    {
      id: 'height',
      name: 'Height',
      type: 'number',
      defaultValue: 10,
      min: 0.1,
      step: 0.1,
      description: 'Grid height'
    },
    {
      id: 'widthSegments',
      name: 'Width Segments',
      type: 'integer',
      defaultValue: 10,
      min: 1,
      max: 100,
      step: 1,
      description: 'Number of segments along the width'
    },
    {
      id: 'heightSegments',
      name: 'Height Segments',
      type: 'integer',
      defaultValue: 10,
      min: 1,
      max: 100,
      step: 1,
      description: 'Number of segments along the height'
    },
    {
      id: 'material',
      name: 'Material',
      type: 'material',
      required: false,
      description: 'Optional material to apply'
    }
  ],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Generated grid geometry'
    }
  ],
  parameters: [], // No parameters - everything is inputs
  ui: {
    icon: Grid,
    advanced: ['widthSegments', 'heightSegments'],
    width: 250,  
    height: 200
  },
  execute: (inputs, parameters) => {
    // Get values from inputs (can come from UI or connections)
    const width = inputs.width || 10;
    const height = inputs.height || 10;
    const widthSegments = inputs.widthSegments || 10;
    const heightSegments = inputs.heightSegments || 10;
    const material = inputs.material;
    
    const geometry = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments);
    
    // Apply material if provided
    if (material) {
      (geometry as any).material = material;
    }
    
    return { geometry };
  }
};
