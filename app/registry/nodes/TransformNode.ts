import { NodeDefinition } from '../../types/nodeSystem';
import { Move3d } from 'lucide-react';
import * as THREE from 'three';

// TRANSFORM NODE - Blender-style layout
export const transformNodeDefinition: NodeDefinition = {
  type: 'transform',
  name: 'Transform',
  description: 'Apply transformations to geometry',
  category: 'geometry',
  color: {
    primary: '#dc2626',
    secondary: '#b91c1c'
  },

  inputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Input geometry to transform'
    },
    {
      id: 'translation',
      name: 'Translation',
      type: 'vector',
      defaultValue: { x: 0, y: 0, z: 0 },
      description: 'Translation vector (in meters)'
    },
    {
      id: 'rotation',
      name: 'Rotation',
      type: 'vector',
      defaultValue: { x: 0, y: 0, z: 0 },
      description: 'Rotation in degrees'
    },
    {
      id: 'scale',
      name: 'Scale',
      type: 'vector',
      defaultValue: { x: 1, y: 1, z: 1 },
      description: 'Scale factors'
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
  parameters: [],
  ui: {
    icon: Move3d
  },
  execute: (inputs, parameters) => {
    // Handle both 'geometry' and 'geometry-in' input keys
    const geometry = inputs.geometry || inputs['geometry-in'];
    const translation = inputs.translation || inputs['translation-in'] || { x: 0, y: 0, z: 0 };
    const rotation = inputs.rotation || inputs['rotation-in'] || { x: 0, y: 0, z: 0 };
    const scale = inputs.scale || inputs['scale-in'] || { x: 1, y: 1, z: 1 };
    
    if (!geometry) {
      return { geometry: null };
    }

    // Clone the geometry and apply transform
    const transformedGeometry = geometry.clone();
    
    // Apply transformations via matrix
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(rotation.x, rotation.y, rotation.z)
    );
    matrix.compose(
      new THREE.Vector3(translation.x, translation.y, translation.z),
      quaternion,
      new THREE.Vector3(scale.x, scale.y, scale.z)
    );
    
    transformedGeometry.applyMatrix4(matrix);
    
    return { geometry: transformedGeometry };
  }
}; 