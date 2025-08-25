import { NodeDefinition } from '../../types/nodeSystem';
import { Copy } from 'lucide-react';
import * as THREE from 'three';

// MIRROR NODE - Mirrors geometry along a specified plane
export const mirrorNodeDefinition: NodeDefinition = {
  type: 'mirror',
  name: 'Mirror',
  description: 'Mirrors geometry along a specified plane',
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
      description: 'Input geometry to mirror'
    },
    {
      id: 'origin',
      name: 'Origin',
      type: 'vector',
      defaultValue: { x: 0, y: 0, z: 0 },
      description: 'Mirror plane origin point'
    },
    {
      id: 'normal',
      name: 'Normal',
      type: 'vector',
      defaultValue: { x: 1, y: 0, z: 0 },
      description: 'Mirror plane normal vector'
    }
  ],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Mirrored geometry'
    }
  ],
  parameters: [
    {
      id: 'mirrorPlane',
      name: 'Mirror Plane',
      type: 'select',
      defaultValue: 'x',
      options: ['x', 'y', 'z', 'custom'],
      description: 'Mirror plane orientation'
    },
    {
      id: 'merge',
      name: 'Merge',
      type: 'boolean',
      defaultValue: false,
      description: 'Merge original and mirrored geometry'
    },
    {
      id: 'flipNormals',
      name: 'Flip Normals',
      type: 'boolean',
      defaultValue: false,
      description: 'Flip normals of mirrored geometry'
    }
  ],
  ui: {
    icon: Copy,
    width: 400,
    height: 350
  },
  execute: (inputs, parameters) => {
    const geometry = inputs.geometry;
    const origin = inputs.origin || { x: 0, y: 0, z: 0 };
    const normal = inputs.normal || { x: 1, y: 0, z: 0 };
    const mirrorPlane = parameters.mirrorPlane || 'x';
    const merge = parameters.merge || false;
    const flipNormals = parameters.flipNormals || false;
    
    if (!geometry) {
      return { geometry: null };
    }
    
    // Normalize the normal vector
    const normalLength = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);
    const normalizedNormal = {
      x: normal.x / normalLength,
      y: normal.y / normalLength,
      z: normal.z / normalLength
    };
    
    // Apply mirror transformation to geometry
    const mirroredGeometry = applyMirrorTransformation(geometry, {
      origin,
      normal: normalizedNormal,
      mirrorPlane,
      merge,
      flipNormals
    });
    
    return { 
      geometry: mirroredGeometry,
      result: mirroredGeometry,
      'geometry-out': mirroredGeometry
    };
  }
};

// Helper function to apply mirror transformation
function applyMirrorTransformation(geometry: any, params: {
  origin: { x: number; y: number; z: number };
  normal: { x: number; y: number; z: number };
  mirrorPlane: string;
  merge: boolean;
  flipNormals: boolean;
}) {
  // Check if geometry has clone method (THREE.js geometry)
  if (geometry && typeof geometry.clone === 'function') {
    const clonedGeometry = geometry.clone();
    
    // Get position attribute
    const positionAttribute = clonedGeometry.attributes.position;
    if (!positionAttribute) {
      return clonedGeometry;
    }
    
    const positions = positionAttribute.array;
    const count = positionAttribute.count;
    
    // Create mirrored positions array
    const mirroredPositions = new Float32Array(count * 3);
    
    // Apply mirror transformation to each vertex
    for (let i = 0; i < count; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      
      // Mirror vertex based on mirror plane
      const mirrored = mirrorVertex(
        { x, y, z },
        params.origin,
        params.normal,
        params.mirrorPlane
      );
      
      mirroredPositions[i * 3] = mirrored.x;
      mirroredPositions[i * 3 + 1] = mirrored.y;
      mirroredPositions[i * 3 + 2] = mirrored.z;
    }
    
    if (params.merge) {
      // Merge original and mirrored geometry
      const mergedGeometry = new THREE.BufferGeometry();
      
      // Combine original and mirrored positions
      const combinedPositions = new Float32Array(count * 6);
      combinedPositions.set(positions, 0);
      combinedPositions.set(mirroredPositions, count * 3);
      
      mergedGeometry.setAttribute('position', new THREE.BufferAttribute(combinedPositions, 3));
      
      // Handle indices if they exist
      if (clonedGeometry.index) {
        const originalIndices = clonedGeometry.index.array;
        const indexCount = clonedGeometry.index.count;
        
        // Create mirrored indices
        const mirroredIndices = new Uint32Array(indexCount);
        for (let i = 0; i < indexCount; i++) {
          mirroredIndices[i] = originalIndices[i] + count;
        }
        
        // Combine indices
        const combinedIndices = new Uint32Array(indexCount * 2);
        combinedIndices.set(originalIndices, 0);
        combinedIndices.set(mirroredIndices, indexCount);
        
        mergedGeometry.setIndex(new THREE.BufferAttribute(combinedIndices, 1));
      }
      
      // Update normals
      mergedGeometry.computeVertexNormals();
      
      // Add mirror metadata
      if (!mergedGeometry.userData) {
        mergedGeometry.userData = {};
      }
      mergedGeometry.userData.mirror = {
        origin: params.origin,
        normal: params.normal,
        mirrorPlane: params.mirrorPlane,
        merge: params.merge,
        flipNormals: params.flipNormals
      };
      
      return mergedGeometry;
    } else {
      // Return only mirrored geometry
      const mirroredGeometry = new THREE.BufferGeometry();
      mirroredGeometry.setAttribute('position', new THREE.BufferAttribute(mirroredPositions, 3));
      
      // Handle indices if they exist
      if (clonedGeometry.index) {
        const originalIndices = clonedGeometry.index.array;
        const indexCount = clonedGeometry.index.count;
        mirroredGeometry.setIndex(new THREE.BufferAttribute(originalIndices.slice(), 1));
      }
      
      // Update normals
      if (params.flipNormals) {
        // Flip normals by reversing indices
        if (mirroredGeometry.index) {
          const indices = mirroredGeometry.index.array;
          for (let i = 0; i < indices.length; i += 3) {
            const temp = indices[i];
            indices[i] = indices[i + 2];
            indices[i + 2] = temp;
          }
        }
      }
      
      mirroredGeometry.computeVertexNormals();
      
      // Add mirror metadata
      if (!mirroredGeometry.userData) {
        mirroredGeometry.userData = {};
      }
      mirroredGeometry.userData.mirror = {
        origin: params.origin,
        normal: params.normal,
        mirrorPlane: params.mirrorPlane,
        merge: params.merge,
        flipNormals: params.flipNormals
      };
      
      return mirroredGeometry;
    }
  }
  
  // For non-THREE.js geometries or objects without clone method
  // Return a new object with mirror metadata
  return {
    ...geometry,
    userData: {
      ...(geometry.userData || {}),
      mirror: {
        origin: params.origin,
        normal: params.normal,
        mirrorPlane: params.mirrorPlane,
        merge: params.merge,
        flipNormals: params.flipNormals
      }
    }
  };
}

// Helper function to mirror a single vertex
function mirrorVertex(
  vertex: { x: number; y: number; z: number },
  origin: { x: number; y: number; z: number },
  normal: { x: number; y: number; z: number },
  mirrorPlane: string
): { x: number; y: number; z: number } {
  // Translate to origin
  const translated = {
    x: vertex.x - origin.x,
    y: vertex.y - origin.y,
    z: vertex.z - origin.z
  };
  
  let mirrored;
  
  // Apply mirror transformation based on plane
  switch (mirrorPlane) {
    case 'x':
      // Mirror across X plane
      mirrored = {
        x: -translated.x,
        y: translated.y,
        z: translated.z
      };
      break;
    case 'y':
      // Mirror across Y plane
      mirrored = {
        x: translated.x,
        y: -translated.y,
        z: translated.z
      };
      break;
    case 'z':
      // Mirror across Z plane
      mirrored = {
        x: translated.x,
        y: translated.y,
        z: -translated.z
      };
      break;
    case 'custom':
      // Mirror across custom plane using normal vector
      const dot = translated.x * normal.x + translated.y * normal.y + translated.z * normal.z;
      mirrored = {
        x: translated.x - 2 * dot * normal.x,
        y: translated.y - 2 * dot * normal.y,
        z: translated.z - 2 * dot * normal.z
      };
      break;
    default:
      mirrored = translated;
  }
  
  // Translate back from origin
  return {
    x: mirrored.x + origin.x,
    y: mirrored.y + origin.y,
    z: mirrored.z + origin.z
  };
}
