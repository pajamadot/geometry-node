import { NodeDefinition } from '../../types/nodeSystem';
import { Cylinder } from 'lucide-react';
import * as THREE from 'three';

// CYLINDER NODE - was 150+ lines, now 25 lines of data
export const cylinderNodeDefinition: NodeDefinition = {
  type: 'cylinder',
  name: 'Cylinder',
  description: 'Creates a cylinder geometry',
  category: 'geometry',
  color: {
    primary: '#ea580c',
    secondary: '#c2410c'
  },

  inputs: [
    {
      id: 'radiusTop',
      name: 'Top Radius',
      type: 'number',
      defaultValue: 1,
      min: 0,
      step: 0.1,
      description: 'Top radius'
    },
    {
      id: 'radiusBottom',
      name: 'Bottom Radius',
      type: 'number',
      defaultValue: 1,
      min: 0,
      step: 0.1,
      description: 'Bottom radius'
    },
    {
      id: 'height',
      name: 'Height',
      type: 'number',
      defaultValue: 1,
      min: 0.1,
      step: 0.1,
      description: 'Cylinder height'
    },
    {
      id: 'radialSegments',
      name: 'Radial Segments',
      type: 'integer',
      defaultValue: 32,
      min: 3,
      max: 128,
      step: 1,
      description: 'Radial segments'
    }
  ],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Generated cylinder geometry'
    }
  ],
  parameters: [],
  ui: {
    width: 220,
    icon: Cylinder,
    advanced: ['radialSegments']
  },
  execution: {
    type: 'javascript'
  },
  execute: (inputs, parameters) => {
    // Get values from inputs (can come from UI or connections)
    const radiusTop = inputs.radiusTop || 1;
    const radiusBottom = inputs.radiusBottom || 1;
    const height = inputs.height || 1;
    const radialSegments = inputs.radialSegments || 32;
    
    const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments);
    return { geometry };
  }
}; 