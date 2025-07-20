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
    primary: '#059669',
    secondary: '#047857'
  },
  inputs: [
    {
      id: 'geometry-1',
      name: 'Geometry 1',
      type: 'geometry',
      required: true,
      description: 'First geometry to merge'
    },
    {
      id: 'geometry-2',
      name: 'Geometry 2',
      type: 'geometry',
      description: 'Second geometry to merge'
    },
    {
      id: 'geometry-3',
      name: 'Geometry 3',
      type: 'geometry',
      description: 'Third geometry to merge'
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
  parameters: [
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
  ui: {
    width: 200,
    icon: Merge
  },
  execute: (inputs, parameters) => {
    const { 'geometry-1': geom1, 'geometry-2': geom2, 'geometry-3': geom3 } = inputs;
    const { operation, keepAttributes } = parameters;
    
    const geometries = [geom1, geom2, geom3].filter(Boolean);
    
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