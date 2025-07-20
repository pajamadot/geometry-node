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
    
    console.log('Join node inputs:', {
      geometryA: geometryA?.type || 'undefined',
      geometryB: geometryB?.type || 'undefined',
      geometryAVertices: geometryA?.attributes?.position?.count || 0,
      geometryBVertices: geometryB?.attributes?.position?.count || 0,
      geometryAIndexed: !!geometryA?.index,
      geometryBIndexed: !!geometryB?.index
    });
    
    const geometries = [geometryA, geometryB].filter(Boolean);
    
    if (geometries.length === 0) return { geometry: null };
    if (geometries.length === 1) return { geometry: geometries[0] };
    
    // Implement proper geometry merging
    const mergedGeometry = new THREE.BufferGeometry();
    
    let vertexOffset = 0;
    const allPositions: number[] = [];
    const allIndices: number[] = [];
    
    geometries.forEach((geometry, geomIndex) => {
      if (!geometry) return;
      
      console.log(`Processing geometry ${geomIndex}:`, {
        type: geometry.type,
        hasPosition: !!geometry.attributes.position,
        positionCount: geometry.attributes.position?.count || 0,
        hasIndex: !!geometry.index,
        indexCount: geometry.index?.count || 0,
        isBufferGeometry: geometry.isBufferGeometry
      });
      
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
      
      if (indices) {
        // Handle both BufferAttribute and TypedArray indices
        if (indices.isBufferAttribute) {
          for (let i = 0; i < indices.count; i++) {
            allIndices.push(indices.getX(i) + vertexOffset);
          }
        } else if (indices.array) {
          for (let i = 0; i < indices.array.length; i++) {
            allIndices.push(indices.array[i] + vertexOffset);
          }
        }
      } else {
        // Non-indexed geometry - create indices for triangulation
        const vertexCount = positions ? positions.count : 0;
        for (let i = 0; i < vertexCount; i++) {
          allIndices.push(i + vertexOffset);
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
    
    console.log('Join result:', {
      totalPositions: allPositions.length / 3,
      totalIndices: allIndices.length,
      hasPosition: !!mergedGeometry.attributes.position,
      hasIndex: !!mergedGeometry.index,
      finalVertexCount: mergedGeometry.attributes.position?.count || 0
    });
    
    return { geometry: mergedGeometry };
  }
}; 