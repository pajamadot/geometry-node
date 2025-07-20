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
    
    geometries.forEach(geometry => {
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