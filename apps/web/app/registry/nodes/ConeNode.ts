import { NodeDefinition } from '../../types/nodeSystem';
import { Triangle } from 'lucide-react';
import * as THREE from 'three';

// CONE PRIMITIVE - Unified input system
export const coneNodeDefinition: NodeDefinition = {
  type: 'cone',
  name: 'Cone',
  description: 'Creates a cone geometry',
  category: 'primitives',
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
      description: 'Cone base radius'
    },
    {
      id: 'height',
      name: 'Height',
      type: 'number',
      defaultValue: 2,
      min: 0.1,
      step: 0.1,
      description: 'Cone height'
    },
    {
      id: 'radialSegments',
      name: 'Radial Segments',
      type: 'integer',
      defaultValue: 32,
      min: 3,
      max: 64,
      step: 1,
      description: 'Number of segments around the cone circumference'
    },
    {
      id: 'heightSegments',
      name: 'Height Segments',
      type: 'integer',
      defaultValue: 1,
      min: 1,
      max: 32,
      step: 1,
      description: 'Number of segments along the cone height'
    },
    {
      id: 'openEnded',
      name: 'Open Ended',
      type: 'boolean',
      defaultValue: false,
      description: 'Whether the cone is open at the bottom'
    },
    {
      id: 'thetaStart',
      name: 'Theta Start',
      type: 'number',
      defaultValue: 0,
      min: 0,
      max: Math.PI * 2,
      step: 0.1,
      description: 'Start angle in radians'
    },
    {
      id: 'thetaLength',
      name: 'Theta Length',
      type: 'number',
      defaultValue: Math.PI * 2,
      min: 0.1,
      max: Math.PI * 2,
      step: 0.1,
      description: 'Arc length in radians'
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
      description: 'Generated cone geometry'
    }
  ],
  parameters: [], // No parameters - everything is inputs
  ui: {
    icon: Triangle,
    advanced: ['radialSegments', 'heightSegments', 'openEnded', 'thetaStart', 'thetaLength'],
    width: 250,  
    height: 200
  },
  execute: (inputs, parameters) => {
    // Get values from inputs (can come from UI or connections)
    const radius = inputs.radius || 1;
    const height = inputs.height || 2;
    const radialSegments = inputs.radialSegments || 32;
    const heightSegments = inputs.heightSegments || 1;
    const openEnded = inputs.openEnded || false;
    const thetaStart = inputs.thetaStart || 0;
    const thetaLength = inputs.thetaLength || Math.PI * 2;
    const material = inputs.material;
    
    const geometry = new THREE.ConeGeometry(
      radius,
      height,
      radialSegments,
      heightSegments,
      openEnded,
      thetaStart,
      thetaLength
    );
    
    // Apply material if provided
    if (material) {
      (geometry as any).material = material;
    }
    
    return { geometry };
  }
};
