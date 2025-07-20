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
    
    const geometries = [geometryA, geometryB].filter(Boolean);
    
    if (geometries.length === 0) return { result: null };
    if (geometries.length === 1) return { result: geometries[0] };
    
    // Implement proper geometry merging
    const mergedGeometry = new THREE.BufferGeometry();
    
    let vertexOffset = 0;
    const allPositions: number[] = [];
    const allIndices: number[] = [];
    
    geometries.forEach(geometry => {
      if (!geometry) return;
      
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
        for (let i = 0; i < indices.count; i++) {
          allIndices.push(indices.getX(i) + vertexOffset);
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
    
    return { geometry: mergedGeometry };
  }
}; 