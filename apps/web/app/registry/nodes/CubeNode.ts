import { NodeDefinition } from '../../types/nodeSystem';
import { Box } from 'lucide-react';
import * as THREE from 'three';

// CUBE PRIMITIVE - Unified input system
export const cubeNodeDefinition: NodeDefinition = {
  type: 'cube',
  name: 'Cube',
  description: 'Creates a cube geometry',
  category: 'geometry',
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
      description: 'Cube width'
    },
    {
      id: 'height',
      name: 'Height',
      type: 'number',
      defaultValue: 1,
      min: 0.1,
      step: 0.1,
      description: 'Cube height'
    },
    {
      id: 'depth',
      name: 'Depth',
      type: 'number',
      defaultValue: 1,
      min: 0.1,
      step: 0.1,
      description: 'Cube depth'
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
      description: 'Generated cube geometry'
    }
  ],
  parameters: [], // No parameters - everything is inputs
  ui: {
    icon: Box
  },
  execute: (inputs, parameters) => {
    // Get values from inputs (can come from UI or connections)
    const width = inputs.width || 1;
    const height = inputs.height || 1;
    const depth = inputs.depth || 1;
    const material = inputs.material;
    
    const geometry = new THREE.BoxGeometry(width, height, depth);
    
    // Apply material if provided
    if (material) {
      (geometry as any).material = material;
    }
    
    return { geometry };
  }
}; 