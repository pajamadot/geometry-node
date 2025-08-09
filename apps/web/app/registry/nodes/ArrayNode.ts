import { NodeDefinition } from '../../types/nodeSystem';
import { Grid3X3 } from 'lucide-react';
import * as THREE from 'three';

// ARRAY NODE - Creates arrays of geometry instances
export const arrayNodeDefinition: NodeDefinition = {
  type: 'array',
  name: 'Array',
  description: 'Creates arrays of geometry instances',
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
      description: 'Input geometry to array'
    },
    {
      id: 'count',
      name: 'Count',
      type: 'integer',
      defaultValue: 2,
      description: 'Number of instances to create'
    },
    {
      id: 'offset',
      name: 'Offset',
      type: 'vector',
      defaultValue: { x: 2, y: 0, z: 0 },
      description: 'Distance between instances'
    },
    {
      id: 'rotation',
      name: 'Rotation',
      type: 'vector',
      defaultValue: { x: 0, y: 0, z: 0 },
      description: 'Rotation increment between instances'
    },
    {
      id: 'scale',
      name: 'Scale',
      type: 'vector',
      defaultValue: { x: 1, y: 1, z: 1 },
      description: 'Scale increment between instances'
    }
  ],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Arrayed geometry'
    }
  ],
  parameters: [
    {
      id: 'arrayType',
      name: 'Array Type',
      type: 'select',
      defaultValue: 'linear',
      options: ['linear', 'circular', 'grid'],
      description: 'Type of array pattern'
    },
    {
      id: 'axis',
      name: 'Axis',
      type: 'select',
      defaultValue: 'x',
      options: ['x', 'y', 'z'],
      description: 'Primary axis for linear array'
    },
    {
      id: 'center',
      name: 'Center',
      type: 'vector',
      defaultValue: { x: 0, y: 0, z: 0 },
      description: 'Center point for circular/grid arrays'
    },
    {
      id: 'radius',
      name: 'Radius',
      type: 'number',
      defaultValue: 5,
      description: 'Radius for circular array'
    },
    {
      id: 'gridSize',
      name: 'Grid Size',
      type: 'vector',
      defaultValue: { x: 3, y: 3, z: 1 },
      description: 'Grid dimensions (X, Y, Z)'
    }
  ],
  ui: {
    icon: Grid3X3,
    width: 400,
    height: 500
  },
  execute: (inputs, parameters) => {
    const geometry = inputs.geometry;
    const count = inputs.count || 2;
    const offset = inputs.offset || { x: 2, y: 0, z: 0 };
    const rotation = inputs.rotation || { x: 0, y: 0, z: 0 };
    const scale = inputs.scale || { x: 1, y: 1, z: 1 };
    const arrayType = parameters.arrayType || 'linear';
    const axis = parameters.axis || 'x';
    const center = parameters.center || { x: 0, y: 0, z: 0 };
    const radius = parameters.radius || 5;
    const gridSize = parameters.gridSize || { x: 3, y: 3, z: 1 };
    
    // Debug: Log parameters to see what's being passed
    console.log('Array Node Parameters:', {
      arrayType,
      gridSize,
      gridSizeType: typeof gridSize,
      gridSizeKeys: gridSize ? Object.keys(gridSize) : 'null',
      count,
      offset,
      center,
      radius
    });
    
    if (!geometry) {
      return { geometry: null };
    }
    
    // Apply array transformation to geometry
    const arrayedGeometry = applyArrayTransformation(geometry, {
      count,
      offset,
      rotation,
      scale,
      arrayType,
      axis,
      center,
      radius,
      gridSize
    });
    
    return { 
      geometry: arrayedGeometry,
      result: arrayedGeometry,
      'geometry-out': arrayedGeometry
    };
  }
};

// Helper function to apply array transformation
function applyArrayTransformation(geometry: any, params: {
  count: number;
  offset: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  arrayType: string;
  axis: string;
  center: { x: number; y: number; z: number };
  radius: number;
  gridSize: { x: number; y: number; z: number };
}) {
  // Check if geometry has clone method (THREE.js geometry)
  if (geometry && typeof geometry.clone === 'function') {
    const mergedGeometry = new THREE.BufferGeometry();
    const allPositions: number[] = [];
    const allIndices: number[] = [];
    let vertexOffset = 0;
    
    // Get original geometry data
    const originalGeometry = geometry.clone();
    const originalPositions = originalGeometry.attributes.position;
    const originalIndices = originalGeometry.index;
    
    if (!originalPositions) {
      return geometry;
    }
    
    const vertexCount = originalPositions.count;
    
    // Generate instances based on array type
    switch (params.arrayType) {
      case 'linear':
        generateLinearArray(originalPositions, originalIndices, params, allPositions, allIndices, vertexOffset);
        break;
      case 'circular':
        generateCircularArray(originalPositions, originalIndices, params, allPositions, allIndices, vertexOffset);
        break;
      case 'grid':
        generateGridArray(originalPositions, originalIndices, params, allPositions, allIndices, vertexOffset);
        break;
      default:
        return geometry;
    }
    
    // Set merged geometry attributes
    mergedGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(allPositions), 3));
    
    if (allIndices.length > 0) {
      mergedGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(allIndices), 1));
    }
    
    // Update normals
    mergedGeometry.computeVertexNormals();
    
    // Add array metadata
    if (!mergedGeometry.userData) {
      mergedGeometry.userData = {};
    }
    mergedGeometry.userData.array = {
      count: params.count,
      offset: params.offset,
      rotation: params.rotation,
      scale: params.scale,
      arrayType: params.arrayType,
      axis: params.axis,
      center: params.center,
      radius: params.radius,
      gridSize: params.gridSize
    };
    
    return mergedGeometry;
  }
  
  // For non-THREE.js geometries or objects without clone method
  // Return a new object with array metadata
  return {
    ...geometry,
    userData: {
      ...(geometry.userData || {}),
      array: {
        count: params.count,
        offset: params.offset,
        rotation: params.rotation,
        scale: params.scale,
        arrayType: params.arrayType,
        axis: params.axis,
        center: params.center,
        radius: params.radius,
        gridSize: params.gridSize
      }
    }
  };
}

// Helper function to generate linear array
function generateLinearArray(
  originalPositions: THREE.BufferAttribute,
  originalIndices: THREE.BufferAttribute | null,
  params: any,
  allPositions: number[],
  allIndices: number[],
  vertexOffset: number
) {
  const { count, offset, rotation, scale, axis } = params;
  
  for (let i = 0; i < count; i++) {
    // Calculate transform for this instance
    const position = {
      x: offset.x * i,
      y: offset.y * i,
      z: offset.z * i
    };
    
    const rot = {
      x: rotation.x * i,
      y: rotation.y * i,
      z: rotation.z * i
    };
    
    const scl = {
      x: 1 + (scale.x - 1) * i,
      y: 1 + (scale.y - 1) * i,
      z: 1 + (scale.z - 1) * i
    };
    
    // Transform and add vertices
    for (let j = 0; j < originalPositions.count; j++) {
      const x = originalPositions.getX(j);
      const y = originalPositions.getY(j);
      const z = originalPositions.getZ(j);
      
      // Apply scale
      let scaledX = x * scl.x;
      let scaledY = y * scl.y;
      let scaledZ = z * scl.z;
      
      // Apply rotation (simplified)
      const cosX = Math.cos(rot.x);
      const sinX = Math.sin(rot.x);
      const cosY = Math.cos(rot.y);
      const sinY = Math.sin(rot.y);
      const cosZ = Math.cos(rot.z);
      const sinZ = Math.sin(rot.z);
      
      // Rotate around X
      const tempY = scaledY * cosX - scaledZ * sinX;
      const tempZ = scaledY * sinX + scaledZ * cosX;
      scaledY = tempY;
      scaledZ = tempZ;
      
      // Rotate around Y
      const tempX = scaledX * cosY + scaledZ * sinY;
      scaledZ = -scaledX * sinY + scaledZ * cosY;
      scaledX = tempX;
      
      // Rotate around Z
      const finalX = scaledX * cosZ - scaledY * sinZ;
      const finalY = scaledX * sinZ + scaledY * cosZ;
      const finalZ = scaledZ;
      
      // Apply position offset
      allPositions.push(finalX + position.x, finalY + position.y, finalZ + position.z);
    }
    
    // Add indices
    if (originalIndices) {
      for (let j = 0; j < originalIndices.count; j++) {
        allIndices.push(originalIndices.getX(j) + vertexOffset);
      }
    }
    
    vertexOffset += originalPositions.count;
  }
}

// Helper function to generate circular array
function generateCircularArray(
  originalPositions: THREE.BufferAttribute,
  originalIndices: THREE.BufferAttribute | null,
  params: any,
  allPositions: number[],
  allIndices: number[],
  vertexOffset: number
) {
  const { count, rotation, scale, center, radius } = params;
  
  for (let i = 0; i < count; i++) {
    // Calculate angle for this instance
    const angle = (2 * Math.PI * i) / count;
    
    // Calculate position on circle
    const position = {
      x: center.x + radius * Math.cos(angle),
      y: center.y,
      z: center.z + radius * Math.sin(angle)
    };
    
    const rot = {
      x: rotation.x * i,
      y: rotation.y * i,
      z: rotation.z * i
    };
    
    const scl = {
      x: 1 + (scale.x - 1) * i,
      y: 1 + (scale.y - 1) * i,
      z: 1 + (scale.z - 1) * i
    };
    
    // Transform and add vertices
    for (let j = 0; j < originalPositions.count; j++) {
      const x = originalPositions.getX(j);
      const y = originalPositions.getY(j);
      const z = originalPositions.getZ(j);
      
      // Apply scale
      let scaledX = x * scl.x;
      let scaledY = y * scl.y;
      let scaledZ = z * scl.z;
      
      // Apply rotation
      const cosX = Math.cos(rot.x);
      const sinX = Math.sin(rot.x);
      const cosY = Math.cos(rot.y);
      const sinY = Math.sin(rot.y);
      const cosZ = Math.cos(rot.z);
      const sinZ = Math.sin(rot.z);
      
      // Rotate around X
      const tempY = scaledY * cosX - scaledZ * sinX;
      const tempZ = scaledY * sinX + scaledZ * cosX;
      scaledY = tempY;
      scaledZ = tempZ;
      
      // Rotate around Y
      const tempX = scaledX * cosY + scaledZ * sinY;
      scaledZ = -scaledX * sinY + scaledZ * cosY;
      scaledX = tempX;
      
      // Rotate around Z
      const finalX = scaledX * cosZ - scaledY * sinZ;
      const finalY = scaledX * sinZ + scaledY * cosZ;
      const finalZ = scaledZ;
      
      // Apply position offset
      allPositions.push(finalX + position.x, finalY + position.y, finalZ + position.z);
    }
    
    // Add indices
    if (originalIndices) {
      for (let j = 0; j < originalIndices.count; j++) {
        allIndices.push(originalIndices.getX(j) + vertexOffset);
      }
    }
    
    vertexOffset += originalPositions.count;
  }
}

// Helper function to generate grid array
function generateGridArray(
  originalPositions: THREE.BufferAttribute,
  originalIndices: THREE.BufferAttribute | null,
  params: any,
  allPositions: number[],
  allIndices: number[],
  vertexOffset: number
) {
  const { count, offset, rotation, scale, center, gridSize } = params;
  
  // Debug: Log grid parameters
  console.log('Grid Array Debug:', {
    gridSize,
    totalInstances: gridSize.x * gridSize.y * gridSize.z,
    offset,
    center
  });
  
  // Use gridSize to determine total instances, not count
  const totalInstances = gridSize.x * gridSize.y * gridSize.z;
  
  for (let i = 0; i < totalInstances; i++) {
    // Calculate grid position
    const gridX = i % gridSize.x;
    const gridY = Math.floor(i / gridSize.x) % gridSize.y;
    const gridZ = Math.floor(i / (gridSize.x * gridSize.y));
    
    // Calculate world position
    const position = {
      x: center.x + (gridX - (gridSize.x - 1) / 2) * offset.x,
      y: center.y + (gridY - (gridSize.y - 1) / 2) * offset.y,
      z: center.z + (gridZ - (gridSize.z - 1) / 2) * offset.z
    };
    
    const rot = {
      x: rotation.x * i,
      y: rotation.y * i,
      z: rotation.z * i
    };
    
    const scl = {
      x: 1 + (scale.x - 1) * i,
      y: 1 + (scale.y - 1) * i,
      z: 1 + (scale.z - 1) * i
    };
    
    // Transform and add vertices
    for (let j = 0; j < originalPositions.count; j++) {
      const x = originalPositions.getX(j);
      const y = originalPositions.getY(j);
      const z = originalPositions.getZ(j);
      
      // Apply scale
      let scaledX = x * scl.x;
      let scaledY = y * scl.y;
      let scaledZ = z * scl.z;
      
      // Apply rotation
      const cosX = Math.cos(rot.x);
      const sinX = Math.sin(rot.x);
      const cosY = Math.cos(rot.y);
      const sinY = Math.sin(rot.y);
      const cosZ = Math.cos(rot.z);
      const sinZ = Math.sin(rot.z);
      
      // Rotate around X
      const tempY = scaledY * cosX - scaledZ * sinX;
      const tempZ = scaledY * sinX + scaledZ * cosX;
      scaledY = tempY;
      scaledZ = tempZ;
      
      // Rotate around Y
      const tempX = scaledX * cosY + scaledZ * sinY;
      scaledZ = -scaledX * sinY + scaledZ * cosY;
      scaledX = tempX;
      
      // Rotate around Z
      const finalX = scaledX * cosZ - scaledY * sinZ;
      const finalY = scaledX * sinZ + scaledY * cosZ;
      const finalZ = scaledZ;
      
      // Apply position offset
      allPositions.push(finalX + position.x, finalY + position.y, finalZ + position.z);
    }
    
    // Add indices
    if (originalIndices) {
      for (let j = 0; j < originalIndices.count; j++) {
        allIndices.push(originalIndices.getX(j) + vertexOffset);
      }
    }
    
    vertexOffset += originalPositions.count;
  }
}
