import { NodeDefinition } from '../../types/nodeSystem';
import { Square } from 'lucide-react';
import * as THREE from 'three';

// PLANE PRIMITIVE - Unified input system
export const planeNodeDefinition: NodeDefinition = {
  type: 'plane',
  name: 'Plane',
  description: 'Creates a plane geometry',
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
      defaultValue: 1,
      min: 0.1,
      step: 0.1,
      description: 'Plane width'
    },
    {
      id: 'height',
      name: 'Height',
      type: 'number',
      defaultValue: 1,
      min: 0.1,
      step: 0.1,
      description: 'Plane height'
    },
    {
      id: 'subdivision',
      name: 'Subdivision',
      type: 'integer',
      defaultValue: 1,
      min: 1,
      max: 64,
      step: 1,
      description: 'Uniform subdivision for both axes'
    },
    {
      id: 'subdivisionX',
      name: 'Subdivision X',
      type: 'integer',
      defaultValue: 1,
      min: 1,
      max: 64,
      step: 1,
      description: 'Horizontal subdivision'
    },
    {
      id: 'subdivisionY',
      name: 'Subdivision Y',
      type: 'integer',
      defaultValue: 1,
      min: 1,
      max: 64,
      step: 1,
      description: 'Vertical subdivision'
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
      description: 'Generated plane geometry'
    }
  ],
  parameters: [], // No parameters - everything is inputs
  ui: {
    icon: Square,
    width: 250,  
    height: 200, 
    advanced: ['subdivision', 'subdivisionX', 'subdivisionY']
  },
  execute: (inputs, parameters) => {
    // Get values from inputs (can come from UI or connections)
    const width = inputs.width || 1;
    const height = inputs.height || 1;
    const subdivision = inputs.subdivision || 1;
    const subdivisionX = inputs.subdivisionX || 1;
    const subdivisionY = inputs.subdivisionY || 1;
    const material = inputs.material;
    
    // Use subdivision if provided, otherwise use individual X/Y subdivisions
    const widthSegments = subdivision > 1 ? subdivision : subdivisionX;
    const heightSegments = subdivision > 1 ? subdivision : subdivisionY;
    
    const geometry = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments);
    
    // Rotate the plane to be horizontal (rotate 90 degrees around X-axis)
    geometry.rotateX(-Math.PI / 2);
    
    // Apply material if provided
    if (material) {
      (geometry as any).material = material;
    }
    
    return { geometry };
  }
};
