import { NodeDefinition } from '../../types/nodeSystem';
import { Box } from 'lucide-react';
import * as THREE from 'three';

// CUBE PRIMITIVE - was 150+ lines, now 25 lines of data
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
  parameters: [],
  ui: {
    icon: Box
  },
  execute: (inputs, parameters) => {
    // Get parameters from inputs (the registry system passes them here)
    // The input system adds -in suffix to socket values
    const width = inputs['width-in'] || inputs.width || 1;
    const height = inputs['height-in'] || inputs.height || 1;
    const depth = inputs['depth-in'] || inputs.depth || 1;
    
    console.log('Cube node inputs:', inputs);
    console.log('Cube node dimensions:', { width, height, depth });
    
    const geometry = new THREE.BoxGeometry(width, height, depth);
    return { geometry };
  }
}; 