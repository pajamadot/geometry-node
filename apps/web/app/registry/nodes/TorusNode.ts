import { NodeDefinition } from '../../types/nodeSystem';
import { Circle } from 'lucide-react';
import * as THREE from 'three';

// TORUS PRIMITIVE - Unified input system
export const torusNodeDefinition: NodeDefinition = {
  type: 'torus',
  name: 'Torus',
  description: 'Creates a torus geometry',
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
      description: 'Torus radius (distance from center to tube center)'
    },
    {
      id: 'tubeRadius',
      name: 'Tube Radius',
      type: 'number',
      defaultValue: 0.3,
      min: 0.01,
      max: 0.99,
      step: 0.01,
      description: 'Tube radius (thickness of the torus)'
    },
    {
      id: 'radialSegments',
      name: 'Radial Segments',
      type: 'integer',
      defaultValue: 16,
      min: 3,
      max: 64,
      step: 1,
      description: 'Number of segments around the torus circumference'
    },
    {
      id: 'tubularSegments',
      name: 'Tubular Segments',
      type: 'integer',
      defaultValue: 32,
      min: 3,
      max: 128,
      step: 1,
      description: 'Number of segments around the tube circumference'
    },
    {
      id: 'arc',
      name: 'Arc',
      type: 'number',
      defaultValue: Math.PI * 2,
      min: 0.1,
      max: Math.PI * 2,
      step: 0.1,
      description: 'Arc length in radians (0 to 2π for full torus)'
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
      description: 'Generated torus geometry'
    }
  ],
  parameters: [], // No parameters - everything is inputs
  ui: {
    icon: Circle,
    advanced: ['radialSegments', 'tubularSegments', 'arc'],
    width: 250,  
    height: 200
  },
  execute: (inputs, parameters) => {
    // Get values from inputs (can come from UI or connections)
    const radius = inputs.radius || 1;
    const tubeRadius = inputs.tubeRadius || 0.3;
    const radialSegments = inputs.radialSegments || 16;
    const tubularSegments = inputs.tubularSegments || 32;
    const arc = inputs.arc || Math.PI * 2;
    const material = inputs.material;
    
    const geometry = new THREE.TorusGeometry(
      radius, 
      tubeRadius, 
      radialSegments, 
      tubularSegments, 
      arc
    );
    
    // Apply material if provided
    if (material) {
      (geometry as any).material = material;
    }
    
    return { geometry };
  }
};
