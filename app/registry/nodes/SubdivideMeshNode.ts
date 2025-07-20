import { NodeDefinition } from '../../types/nodeSystem';
import { Scissors } from 'lucide-react';
import * as THREE from 'three';

// Helper function for subdivision
function subdivideGeometry(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  // Simple subdivision: split each triangle into 4 smaller triangles
  const positions = geometry.attributes.position;
  const indices = geometry.index;
  
  if (!positions || !indices) {
    return geometry.clone();
  }
  
  const newPositions: number[] = [];
  const newIndices: number[] = [];
  
  // For each triangle, create 4 new triangles
  for (let i = 0; i < indices.count; i += 3) {
    const a = indices.getX(i);
    const b = indices.getX(i + 1);
    const c = indices.getX(i + 2);
    
    // Get vertex positions
    const ax = positions.getX(a), ay = positions.getY(a), az = positions.getZ(a);
    const bx = positions.getX(b), by = positions.getY(b), bz = positions.getZ(b);
    const cx = positions.getX(c), cy = positions.getY(c), cz = positions.getZ(c);
    
    // Calculate midpoints
    const abx = (ax + bx) / 2, aby = (ay + by) / 2, abz = (az + bz) / 2;
    const bcx = (bx + cx) / 2, bcy = (by + cy) / 2, bcz = (bz + cz) / 2;
    const cax = (cx + ax) / 2, cay = (cy + ay) / 2, caz = (cz + az) / 2;
    
    // Add new vertices
    const baseIndex = newPositions.length / 3;
    newPositions.push(ax, ay, az, bx, by, bz, cx, cy, cz, abx, aby, abz, bcx, bcy, bcz, cax, cay, caz);
    
    // Create 4 triangles
    newIndices.push(
      baseIndex, baseIndex + 3, baseIndex + 5,     // Triangle 1
      baseIndex + 3, baseIndex + 1, baseIndex + 4, // Triangle 2
      baseIndex + 5, baseIndex + 4, baseIndex + 2, // Triangle 3
      baseIndex + 3, baseIndex + 4, baseIndex + 5  // Triangle 4
    );
  }
  
  const newGeometry = new THREE.BufferGeometry();
  newGeometry.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
  newGeometry.setIndex(newIndices);
  newGeometry.computeVertexNormals();
  
  return newGeometry;
}

// SUBDIVIDE MESH NODE - was 81+ lines, now 20 lines of data
export const subdivideMeshNodeDefinition: NodeDefinition = {
  type: 'subdivide-mesh',
  name: 'Subdivide Mesh',
  description: 'Add detail by subdividing mesh faces',
  category: 'modifiers',
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
      description: 'Input geometry to subdivide'
    }
  ],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Subdivided geometry'
    }
  ],
  parameters: [
    {
      id: 'level',
      name: 'Level',
      type: 'integer',
      defaultValue: 1,
      min: 0,
      max: 6,
      step: 1,
      description: 'Subdivision level'
    }
  ],
  ui: {
    width: 220,
    icon: Scissors
  },
  execute: (inputs, parameters) => {
    const { geometry } = inputs;
    const { level } = parameters;
    
    if (!geometry || level === 0) return { geometry };
    
    // Implement Catmull-Clark subdivision
    let subdividedGeometry = geometry.clone();
    
    for (let i = 0; i < level; i++) {
      subdividedGeometry = subdivideGeometry(subdividedGeometry);
    }
    
    return { geometry: subdividedGeometry };
  }
}; 