import { NodeDefinition } from '../../types/nodeSystem';
import { Globe } from 'lucide-react';
import * as THREE from 'three';

// SPHERE NODE - was 150+ lines, now 20 lines of data
export const sphereNodeDefinition: NodeDefinition = {
  type: 'sphere',
  name: 'Sphere',
  description: 'Creates a sphere geometry',
  category: 'geometry',
  color: {
    primary: '#ea580c',
    secondary: '#c2410c'
  },

  inputs: [
    {
      id: 'radius',
      name: 'Radius',
      type: 'number',
      defaultValue: 1,
      min: 0.1,
      step: 0.1,
      description: 'Sphere radius'
    },
    {
      id: 'widthSegments',
      name: 'Width Segments',
      type: 'integer',
      defaultValue: 32,
      min: 3,
      max: 128,
      step: 1,
      description: 'Horizontal segments'
    },
    {
      id: 'heightSegments',
      name: 'Height Segments',
      type: 'integer',
      defaultValue: 16,
      min: 2,
      max: 64,
      step: 1,
      description: 'Vertical segments'
    }
  ],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Generated sphere geometry'
    }
  ],
  parameters: [],
  ui: {
    icon: Globe,
    advanced: ['heightSegments']
  },
  execute: (inputs, parameters) => {
    const { radius, widthSegments, heightSegments } = parameters;
    const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
    return { geometry };
  }
}; 