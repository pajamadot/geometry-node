import { NodeDefinition } from '../../types/nodeSystem';
import { Cylinder } from 'lucide-react';
import * as THREE from 'three';

// CAPSULE NODE - Creates a capsule geometry (cylinder with rounded ends)
export const capsuleNodeDefinition: NodeDefinition = {
  type: 'capsule',
  name: 'Capsule',
  description: 'Creates a capsule geometry (cylinder with rounded ends)',
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
      defaultValue: 0.5,
      min: 0.1,
      step: 0.1,
      description: 'Capsule radius'
    },
    {
      id: 'height',
      name: 'Height',
      type: 'number',
      defaultValue: 2,
      min: 0.1,
      step: 0.1,
      description: 'Capsule height (including end caps)'
    },
    {
      id: 'radialSegments',
      name: 'Radial Segments',
      type: 'integer',
      defaultValue: 32,
      min: 3,
      max: 128,
      step: 1,
      description: 'Radial segments around the capsule'
    },
    {
      id: 'heightSegments',
      name: 'Height Segments',
      type: 'integer',
      defaultValue: 16,
      min: 2,
      max: 64,
      step: 1,
      description: 'Height segments along the capsule'
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
      description: 'Generated capsule geometry'
    }
  ],
  parameters: [],
  ui: {
    width: 220,
    icon: Cylinder,
    advanced: ['radialSegments', 'heightSegments']
  },
  execute: (inputs, parameters) => {
    // Get values from inputs (can come from UI or connections)
    const radius = inputs.radius || 0.5;
    const height = inputs.height || 2;
    const radialSegments = inputs.radialSegments || 32;
    const heightSegments = inputs.heightSegments || 16;
    const material = inputs.material;
    
    // Create capsule geometry using Three.js CapsuleGeometry
    const geometry = new THREE.CapsuleGeometry(radius, height - 2 * radius, radialSegments, heightSegments);
    
    // Apply material if provided
    if (material) {
      (geometry as any).material = material;
    }
    
    return { geometry };
  }
};
