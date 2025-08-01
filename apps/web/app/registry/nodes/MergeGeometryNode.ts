import { NodeDefinition } from '../../types/nodeSystem';
import { Merge } from 'lucide-react';
import * as THREE from 'three';

// MERGE GEOMETRY NODE - was 90+ lines, now 25 lines of data
export const mergeGeometryNodeDefinition: NodeDefinition = {
  type: 'merge-geometry',
  name: 'Merge Geometry',
  description: 'Combine multiple geometries into one',
  category: 'modifiers',
  color: {
    primary: '#f59e42',
    secondary: '#b45309'
  },
  inputs: [
    {
      id: 'geometryA',
      name: 'Geometry A',
      type: 'geometry',
      required: true,
      description: 'First geometry to merge'
    },
    {
      id: 'geometryB',
      name: 'Geometry B',
      type: 'geometry',
      required: true,
      description: 'Second geometry to merge'
    },
    {
      id: 'operation',
      name: 'Operation',
      type: 'select',
      defaultValue: 'union',
      options: ['union', 'intersection', 'difference'],
      description: 'Merge operation type'
    },
    {
      id: 'keepAttributes',
      name: 'Keep Attributes',
      type: 'boolean',
      defaultValue: true,
      description: 'Preserve geometry attributes'
    }
  ],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Merged geometry'
    }
  ],
  parameters: [],
  ui: {
    width: 200,
    icon: Merge
  },
  execute: (inputs, parameters) => {
    // Get values from inputs (can come from UI or connections)
    const geometryA = inputs.geometryA;
    const geometryB = inputs.geometryB;
    const operation = inputs.operation || 'union';
    const keepAttributes = inputs.keepAttributes !== undefined ? inputs.keepAttributes : true;
    
    const geometries = [geometryA, geometryB].filter(Boolean);
    
    if (geometries.length === 0) {
      return { geometry: new THREE.BufferGeometry() };
    }
    
    if (geometries.length === 1) {
      return { geometry: geometries[0].clone() };
    }
    
    // Simple merge - combine all geometries
    // In a more sophisticated system, this would use proper CSG operations
    const mergedGeometry = new THREE.BufferGeometry();
    
    let vertexOffset = 0;
    const allPositions: number[] = [];
    const allIndices: number[] = [];
    const allMaterials: THREE.Material[] = [];
    const materialGroups: { start: number; count: number; materialIndex: number }[] = [];
    
    geometries.forEach((geometry, geomIndex) => {
      const positions = geometry.attributes.position;
      const indices = geometry.index;
      
      if (positions) {
        for (let i = 0; i < positions.count; i++) {
          allPositions.push(
            positions.getX(i),
            positions.getY(i),
            positions.getZ(i)
          );
        }
      }
      
      let indexCount = 0;
      const indexStart = allIndices.length;
      
      if (indices) {
        for (let i = 0; i < indices.count; i++) {
          allIndices.push(indices.getX(i) + vertexOffset);
          indexCount++;
        }
      }
      
      // Handle materials - collect ALL materials from each geometry
      const geometryMaterial = (geometry as any).material;
      const geometryMaterials = geometry.userData?.materials || [];
      const geometryGroups = geometry.groups || [];
      
      // If geometry has multiple materials (from previous merges), collect them all
      if (geometryMaterials.length > 0) {
        // Add all existing materials
        const materialIndexOffset = allMaterials.length;
        geometryMaterials.forEach((mat: THREE.Material) => {
          allMaterials.push(mat);
        });
        
        // Preserve existing material groups with updated indices
        if (geometryGroups.length > 0) {
          geometryGroups.forEach((group: { start: number; count: number; materialIndex?: number }) => {
            materialGroups.push({
              start: indexStart + (group.start || 0),
              count: group.count,
              materialIndex: materialIndexOffset + (group.materialIndex || 0)
            });
          });
        } else {
          // No existing groups, so assign all faces to first material
          if (indexCount > 0) {
            materialGroups.push({
              start: indexStart,
              count: indexCount,
              materialIndex: materialIndexOffset
            });
          }
        }
      } else if (geometryMaterial) {
        // Single material geometry
        const materialIndex = allMaterials.length;
        allMaterials.push(geometryMaterial);
        
        if (indexCount > 0) {
          materialGroups.push({
            start: indexStart,
            count: indexCount,
            materialIndex
          });
        }
      }
      
      vertexOffset += positions ? positions.count : 0;
    });
    
    if (allPositions.length > 0) {
      mergedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(allPositions, 3));
    }
    
    if (allIndices.length > 0) {
      mergedGeometry.setIndex(allIndices);
    }
    
    mergedGeometry.computeVertexNormals();
    
    // Store materials and groups for multi-material rendering
    if (allMaterials.length > 0) {
      mergedGeometry.userData.materials = allMaterials;
      
      // Add material groups to geometry
      materialGroups.forEach(group => {
        mergedGeometry.addGroup(group.start, group.count, group.materialIndex);
      });
      
      // Set the first material as the primary material for simple rendering
      (mergedGeometry as any).material = allMaterials.length === 1 ? 
        allMaterials[0] : allMaterials;
    }
    
    return { geometry: mergedGeometry };
  }
}; 