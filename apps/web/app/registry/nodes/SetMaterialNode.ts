import * as pc from 'playcanvas';
import { NodeDefinition } from '../../types/nodes';
import { Brush } from 'lucide-react';
import { EnhancedGeometryData } from '../../utils/builders/GeometryBuilder';

// SET MATERIAL NODE
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
      defaultValue: 0
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
    const geometry = inputs.geometry as EnhancedGeometryData;
    const material = inputs.material as pc.StandardMaterial;
    const materialIndex = inputs.materialIndex ?? 0;

    if (!geometry || !material) {
      return { geometry: geometry || null };
    }

    // Clone to avoid mutation side-effects if reusing geometry
    // In our system, we treat inputs as immutable usually, but cloning is safer.
    // VertexDataUtils.clone creates a deep copy of data arrays but not materials array references initially.
    // We need to manage materials array.
    
    // For now, just modify the geometry object reference passed (if it's a fresh execute result) 
    // or do a shallow copy of structure if we want to be purely functional.
    
    // Let's do a shallow clone of the structure to attach new metadata
    const outputGeometry: EnhancedGeometryData = { ...geometry };
    
    if (!outputGeometry.materials) {
        outputGeometry.materials = [];
    }
    // Clone materials array to avoid affecting upstream
    outputGeometry.materials = [...outputGeometry.materials];
    
    outputGeometry.materials[materialIndex] = material;
    
    return { geometry: outputGeometry };
  }
};

// MATERIAL MIXER NODE
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
      required: true
    },
    {
      id: 'materialB',
      name: 'Material B',
      type: 'material',
      required: true
    },
    {
      id: 'factor',
      name: 'Mix Factor',
      type: 'number',
      defaultValue: 0.5,
      min: 0,
      max: 1
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
    const matA = inputs.materialA as pc.StandardMaterial;
    const matB = inputs.materialB as pc.StandardMaterial;
    const factor = inputs.factor ?? 0.5;

    if (!matA || !matB) return { material: matA || matB };

    const mixed = new pc.StandardMaterial();
    // Simple blending of diffuse color
    const colorA = matA.diffuse;
    const colorB = matB.diffuse;
    mixed.diffuse = new pc.Color(
        colorA.r + (colorB.r - colorA.r) * factor,
        colorA.g + (colorB.g - colorA.g) * factor,
        colorA.b + (colorB.b - colorA.b) * factor
    );
    mixed.update();

    return { material: mixed };
  }
};
