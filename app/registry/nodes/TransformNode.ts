import { NodeDefinition } from '../../types/nodeSystem';
import { Move3d } from 'lucide-react';
import * as THREE from 'three';

// TRANSFORM NODE - was 116+ lines, now 35 lines of data
export const transformNodeDefinition: NodeDefinition = {
  type: 'transform',
  name: 'Transform',
  description: 'Apply transformations to geometry',
  category: 'geometry',
  color: {
    primary: '#2563eb',
    secondary: '#1d4ed8'
  },
  inputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      required: true,
      description: 'Input geometry to transform'
    }
  ],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Transformed geometry'
    }
  ],
  parameters: [
    {
      id: 'position',
      name: 'Position',
      type: 'vector',
      defaultValue: { x: 0, y: 0, z: 0 },
      step: 0.1,
      description: 'Translation offset'
    },
    {
      id: 'rotation',
      name: 'Rotation',
      type: 'vector',
      defaultValue: { x: 0, y: 0, z: 0 },
      step: 0.1,
      description: 'Rotation in radians'
    },
    {
      id: 'scale',
      name: 'Scale',
      type: 'vector',
      defaultValue: { x: 1, y: 1, z: 1 },
      step: 0.1,
      description: 'Scale factors'
    }
  ],
  ui: {
    width: 220,
    icon: Move3d
  },
  execute: (inputs, parameters) => {
    const geometry = inputs.geometry || inputs['geometry-in'];
    const { position, rotation, scale } = parameters;
    
    console.log('Transform node inputs:', inputs);
    console.log('Transform node geometry input:', geometry);
    
    if (!geometry) {
      console.log('Transform node: No geometry input received');
      return { geometry: null };
    }
    
    const transformedGeometry = geometry.clone();
    
    // Apply transformations
    transformedGeometry.scale(scale.x, scale.y, scale.z);
    transformedGeometry.rotateX(rotation.x);
    transformedGeometry.rotateY(rotation.y);
    transformedGeometry.rotateZ(rotation.z);
    transformedGeometry.translate(position.x, position.y, position.z);
    
    console.log('Transform node: Returning transformed geometry');
    return { geometry: transformedGeometry };
  }
}; 