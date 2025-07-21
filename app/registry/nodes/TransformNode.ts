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

    // console.log('Transform node input:', {
    //   hasGeometry: !!geometry,
    //   hasInputMaterial: !!((geometry as any).material),
    //   inputUserDataMaterials: geometry.userData?.materials?.length || 0,
    //   geometryVertices: geometry.attributes?.position?.count || 0
    // });

    // Clone the geometry and apply transform
    const transformedGeometry = geometry.clone();
    
    // Preserve materials when cloning
    const originalMaterial = (geometry as any).material;
    const originalMaterials = geometry.userData?.materials;
    
    if (originalMaterial) {
      (transformedGeometry as any).material = originalMaterial;
      // console.log('Transform: Preserved direct material:', originalMaterial.type);
    }
    
    if (originalMaterials) {
      if (!transformedGeometry.userData) {
        transformedGeometry.userData = {};
      }
      transformedGeometry.userData.materials = [...originalMaterials];
      
      // console.log('Transform: Preserved userData materials:', originalMaterials.length);
      
      // Preserve material groups if they exist
      if (geometry.groups && geometry.groups.length > 0) {
        transformedGeometry.clearGroups();
        geometry.groups.forEach((group: { start: number; count: number; materialIndex?: number }) => {
          transformedGeometry.addGroup(group.start, group.count, group.materialIndex);
        });
        // console.log('Transform: Preserved material groups:', geometry.groups.length);
      }
    }
    
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
    
    // console.log('Transform node output:', {
    //   hasOutputGeometry: !!transformedGeometry,
    //   hasOutputMaterial: !!((transformedGeometry as any).material),
    //   outputUserDataMaterials: transformedGeometry.userData?.materials?.length || 0,
    //   outputVertices: transformedGeometry.attributes?.position?.count || 0
    // });
    
    return { geometry: transformedGeometry };
  }
}; 