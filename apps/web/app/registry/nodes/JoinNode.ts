import { NodeDefinition } from '../../types/nodeSystem';
import { Merge } from 'lucide-react';
import * as THREE from 'three';

// JOIN NODE - was 80+ lines, now 20 lines of data  
export const joinNodeDefinition: NodeDefinition = {
  type: 'join',
  name: 'Join Geometry',
  description: 'Combine multiple geometries',
  category: 'utilities',
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
      description: 'First geometry to join'
    },
    {
      id: 'geometryB',
      name: 'Geometry B',
      type: 'geometry',
      required: true,
      description: 'Second geometry to join'
    },
    {
      id: 'operation',
      name: 'Operation',
      type: 'select',
      defaultValue: 'merge',
      options: ['merge', 'instance', 'array'],
      description: 'Join operation type'
    }
  ],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Combined geometry'
    }
  ],
  parameters: [],
  ui: {
    // width: 160,
    icon: Merge
  },
  execute: (inputs, parameters) => {
    // Get values from inputs (can come from UI or connections)
    // Handle both naming conventions: geometryA/geometryB and geometry
    const geometryA = inputs.geometryA || inputs.geometry;
    const geometryB = inputs.geometryB;
    const operation = inputs.operation || 'merge';
    
    // console.log('Join node inputs:', {
    //   geometryA: geometryA?.type || 'undefined',
    //   geometryB: geometryB?.type || 'undefined',
    //   geometryAVertices: geometryA?.attributes?.position?.count || 0,
    //   geometryBVertices: geometryB?.attributes?.position?.count || 0,
    //   geometryAIndexed: !!geometryA?.index,
    //   geometryBIndexed: !!geometryB?.index
    // });
    
    const geometries = [geometryA, geometryB].filter(Boolean);
    
    if (geometries.length === 0) return { geometry: null };
    if (geometries.length === 1) return { geometry: geometries[0] };
    
    // Implement proper geometry merging with material preservation
    const mergedGeometry = new THREE.BufferGeometry();
    
    let vertexOffset = 0;
    const allPositions: number[] = [];
    const allIndices: number[] = [];
    const allMaterials: THREE.Material[] = [];
    const materialGroups: { start: number; count: number; materialIndex: number }[] = [];
    
    geometries.forEach((geometry, geomIndex) => {
      if (!geometry) return;
      
      // console.log(`Processing geometry ${geomIndex}:`, {
      //   type: geometry.type,
      //   hasPosition: !!geometry.attributes.position,
      //   positionCount: geometry.attributes.position?.count || 0,
      //   hasIndex: !!geometry.index,
      //   indexCount: geometry.index?.count || 0,
      //   isBufferGeometry: geometry.isBufferGeometry,
      //   hasMaterial: !!((geometry as any).material || geometry.userData?.materials?.[0])
      // });
      
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
        // Handle both BufferAttribute and TypedArray indices
        if (indices.isBufferAttribute) {
          for (let i = 0; i < indices.count; i++) {
            allIndices.push(indices.getX(i) + vertexOffset);
            indexCount++;
          }
        } else if (indices.array) {
          for (let i = 0; i < indices.array.length; i++) {
            allIndices.push(indices.array[i] + vertexOffset);
            indexCount++;
          }
        }
      } else {
        // Non-indexed geometry - create proper triangle indices
        const vertexCount = positions ? positions.count : 0;
        
        // For non-indexed geometry, vertices are already in triangle order
        // We need to create indices for each triangle (3 vertices per triangle)
        for (let i = 0; i < vertexCount; i += 3) {
          if (i + 2 < vertexCount) {
            allIndices.push(i + vertexOffset);
            allIndices.push(i + 1 + vertexOffset);
            allIndices.push(i + 2 + vertexOffset);
            indexCount += 3;
          }
        }
      }
      
      // Handle materials - collect ALL materials from each geometry
      const geometryMaterial = (geometry as any).material;
      const geometryMaterials = geometry.userData?.materials || [];
      const geometryGroups = geometry.groups || [];
      
      // If geometry has multiple materials (from previous joins), collect them all
      if (geometryMaterials.length > 0) {
        // console.log(`Geometry ${geomIndex} has ${geometryMaterials.length} existing materials`);
        
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
          // console.log(`Preserved ${geometryGroups.length} material groups for geometry ${geomIndex}`);
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
        // console.log(`Added single material for geometry ${geomIndex}`);
      }
      
      vertexOffset += positions ? positions.count : 0;
    });
    
    if (allPositions.length > 0) {
      mergedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(allPositions, 3));
    }
    
    if (allIndices.length > 0) {
      // Ensure indices are properly formatted as typed array
      mergedGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(allIndices), 1));
    }
    
    // Compute vertex normals and ensure geometry is valid
    mergedGeometry.computeVertexNormals();
    mergedGeometry.computeBoundingBox();
    mergedGeometry.computeBoundingSphere();
    
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
      
      // console.log('Join result with materials:', {
      //   totalMaterials: allMaterials.length,
      //   materialGroups: materialGroups.length
      // });
    }

    // console.log('Join result:', {
    //   totalPositions: allPositions.length / 3,
    //   totalIndices: allIndices.length,
    //   hasPosition: !!mergedGeometry.attributes.position,
    //   hasIndex: !!mergedGeometry.index,
    //   finalVertexCount: mergedGeometry.attributes.position?.count || 0,
    //   hasMaterials: allMaterials.length > 0
    // });
    
    return { geometry: mergedGeometry };
  }
}; 