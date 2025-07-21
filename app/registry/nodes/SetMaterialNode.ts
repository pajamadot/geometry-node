import { NodeDefinition } from '../../types/nodeSystem';
import { Brush } from 'lucide-react';
import * as THREE from 'three';

// SET MATERIAL NODE - Assigns a material to geometry
export const setMaterialNodeDefinition: NodeDefinition = {
  type: 'set-material',
  name: 'Set Material',
  description: 'Assign a material to geometry',
  category: 'materials',
  color: {
    primary: '#8b5cf6',
    secondary: '#7c3aed'
  },
  inputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      required: true,
      description: 'Input geometry'
    },
    {
      id: 'material',
      name: 'Material',
      type: 'material',
      required: true,
      description: 'Material to apply'
    },
    {
      id: 'materialIndex',
      name: 'Material Index',
      type: 'integer',
      defaultValue: 0,
      min: 0,
      max: 10,
      step: 1,
      description: 'Material slot index for multi-materials'
    }
  ],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Geometry with applied material'
    }
  ],
  parameters: [],
  ui: {
    icon: Brush,
    width: 200
  },
  execute: (inputs, parameters) => {
    const geometry = inputs.geometry;
    const material = inputs.material;
    const materialIndex = inputs.materialIndex ?? 0;

    console.log('Set Material node execution:', {
      hasGeometry: !!geometry,
      hasMaterial: !!material,
      materialIndex,
      geometryType: geometry?.type,
      materialType: material?.type,
      geometryVertices: geometry?.attributes?.position?.count || 0
    });

    if (!geometry || !material) {
      console.warn('Set Material: Missing geometry or material input', {
        geometry: !!geometry,
        material: !!material
      });
      return { geometry: geometry || new THREE.BufferGeometry() };
    }

    // Clone the geometry to avoid modifying the original
    const outputGeometry = geometry.clone();
    
    // Ensure userData exists
    if (!outputGeometry.userData) {
      outputGeometry.userData = {};
    }
    
    // Store material reference on the geometry
    // For multi-material support, we'll store materials in an array
    if (!outputGeometry.userData.materials) {
      outputGeometry.userData.materials = [];
    }
    
    outputGeometry.userData.materials[materialIndex] = material;
    
    // For single material, also set it directly
    if (materialIndex === 0) {
      (outputGeometry as any).material = material;
    }

    console.log('Set Material result:', {
      hasOutputMaterial: !!((outputGeometry as any).material),
      userDataMaterials: outputGeometry.userData.materials?.length || 0,
      materialSet: !!outputGeometry.userData.materials[materialIndex]
    });

    return { geometry: outputGeometry };
  }
};

// MATERIAL MIXER NODE - Blend between multiple materials
export const materialMixerNodeDefinition: NodeDefinition = {
  type: 'material-mixer',
  name: 'Material Mixer',
  description: 'Blend between multiple materials',
  category: 'materials',
  color: {
    primary: '#8b5cf6',
    secondary: '#7c3aed'
  },
  inputs: [
    {
      id: 'materialA',
      name: 'Material A',
      type: 'material',
      required: true,
      description: 'First material'
    },
    {
      id: 'materialB',
      name: 'Material B',
      type: 'material',
      required: true,
      description: 'Second material'
    },
    {
      id: 'factor',
      name: 'Mix Factor',
      type: 'number',
      defaultValue: 0.5,
      min: 0,
      max: 1,
      step: 0.01,
      description: 'Blend factor (0 = A, 1 = B)'
    }
  ],
  outputs: [
    {
      id: 'material',
      name: 'Material',
      type: 'material',
      description: 'Mixed material'
    }
  ],
  parameters: [],
  ui: {
    icon: Brush,
    width: 220
  },
  execute: (inputs, parameters) => {
    const materialA = inputs.materialA;
    const materialB = inputs.materialB;
    const factor = inputs.factor ?? 0.5;

    if (!materialA || !materialB) {
      return { material: materialA || materialB || new THREE.MeshStandardMaterial() };
    }

    // Create a new material by interpolating properties
    const mixedMaterial = new THREE.MeshStandardMaterial();
    
    // Blend colors
    if (materialA.color && materialB.color) {
      mixedMaterial.color = materialA.color.clone().lerp(materialB.color, factor);
    }
    
    // Blend emissive colors
    if (materialA.emissive && materialB.emissive) {
      mixedMaterial.emissive = materialA.emissive.clone().lerp(materialB.emissive, factor);
    }
    
    // Blend numeric properties
    if (typeof materialA.metalness === 'number' && typeof materialB.metalness === 'number') {
      mixedMaterial.metalness = THREE.MathUtils.lerp(materialA.metalness, materialB.metalness, factor);
    }
    
    if (typeof materialA.roughness === 'number' && typeof materialB.roughness === 'number') {
      mixedMaterial.roughness = THREE.MathUtils.lerp(materialA.roughness, materialB.roughness, factor);
    }
    
    if (typeof materialA.opacity === 'number' && typeof materialB.opacity === 'number') {
      mixedMaterial.opacity = THREE.MathUtils.lerp(materialA.opacity, materialB.opacity, factor);
      mixedMaterial.transparent = mixedMaterial.opacity < 1.0;
    }

    mixedMaterial.side = THREE.DoubleSide;

    return { material: mixedMaterial };
  }
}; 