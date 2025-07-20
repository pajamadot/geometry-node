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
  inputs: [],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Generated cube geometry'
    }
  ],
  parameters: [
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
  ui: {
    width: 180,
    icon: Box
  },
  execute: (inputs, parameters) => {
    const { width, height, depth } = parameters;
    const geometry = new THREE.BoxGeometry(width, height, depth);
    console.log('Cube node: Creating geometry with dimensions:', { width, height, depth });
    console.log('Cube node: Returning geometry:', geometry);
    return { geometry };
  }
}; 