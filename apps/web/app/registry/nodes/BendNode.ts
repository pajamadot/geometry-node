import { NodeDefinition } from '../../types/nodeSystem';
import { ArrowUpRight } from 'lucide-react';

// BEND NODE - Bends geometry along a specified axis
export const bendNodeDefinition: NodeDefinition = {
  type: 'bend',
  name: 'Bend',
  description: 'Bends geometry along a specified axis',
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
      description: 'Input geometry to bend'
    },
    {
      id: 'angle',
      name: 'Angle',
      type: 'number',
      defaultValue: 0,
      description: 'Bend angle in radians'
    },
    {
      id: 'direction',
      name: 'Direction',
      type: 'vector',
      defaultValue: { x: 0, y: 1, z: 0 },
      description: 'Bend direction vector'
    },
    {
      id: 'origin',
      name: 'Origin',
      type: 'vector',
      defaultValue: { x: 0, y: 0, z: 0 },
      description: 'Bend origin point'
    },
    {
      id: 'radius',
      name: 'Radius',
      type: 'number',
      defaultValue: 1,
      description: 'Bend radius'
    }
  ],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Bent geometry'
    }
  ],
  parameters: [
    {
      id: 'bendAxis',
      name: 'Bend Axis',
      type: 'select',
      defaultValue: 'y',
      options: ['x', 'y', 'z'],
      description: 'Axis to bend around'
    },
    {
      id: 'clamp',
      name: 'Clamp',
      type: 'boolean',
      defaultValue: false,
      description: 'Clamp the bend to prevent extreme deformation'
    }
  ],
  ui: {
    icon: ArrowUpRight,
    width: 380,
    height: 400
  },
  execute: (inputs, parameters) => {
    const geometry = inputs.geometry;
    const angle = inputs.angle || 0;
    const direction = inputs.direction || { x: 0, y: 1, z: 0 };
    const origin = inputs.origin || { x: 0, y: 0, z: 0 };
    const radius = inputs.radius || 1;
    const bendAxis = parameters.bendAxis || 'y';
    const clamp = parameters.clamp || false;
    
    if (!geometry) {
      return { geometry: null };
    }
    
    // Normalize direction vector
    const dirLength = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z);
    const normalizedDir = {
      x: direction.x / dirLength,
      y: direction.y / dirLength,
      z: direction.z / dirLength
    };
    
    // Clamp angle if requested
    const clampedAngle = clamp ? Math.max(-Math.PI, Math.min(Math.PI, angle)) : angle;
    
    // Apply bend transformation to geometry
    const bentGeometry = applyBendTransformation(geometry, {
      angle: clampedAngle,
      direction: normalizedDir,
      origin,
      radius,
      bendAxis
    });
    
    return { 
      geometry: bentGeometry,
      result: bentGeometry,
      'geometry-out': bentGeometry
    };
  }
};

// Helper function to apply bend transformation
function applyBendTransformation(geometry: any, params: {
  angle: number;
  direction: { x: number; y: number; z: number };
  origin: { x: number; y: number; z: number };
  radius: number;
  bendAxis: string;
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
    
    // Apply bend transformation to each vertex
    for (let i = 0; i < count; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      
      // Transform vertex based on bend axis
      const transformed = bendVertex(
        { x, y, z },
        params.angle,
        params.direction,
        params.origin,
        params.radius,
        params.bendAxis
      );
      
      positions[i * 3] = transformed.x;
      positions[i * 3 + 1] = transformed.y;
      positions[i * 3 + 2] = transformed.z;
    }
    
    // Update normals if they exist
    if (clonedGeometry.attributes.normal) {
      clonedGeometry.computeVertexNormals();
    }
    
    // Add bend metadata
    if (!clonedGeometry.userData) {
      clonedGeometry.userData = {};
    }
    clonedGeometry.userData.bend = {
      angle: params.angle,
      direction: params.direction,
      origin: params.origin,
      radius: params.radius,
      bendAxis: params.bendAxis
    };
    
    return clonedGeometry;
  }
  
  // For non-THREE.js geometries or objects without clone method
  // Return a new object with bend metadata
  return {
    ...geometry,
    userData: {
      ...(geometry.userData || {}),
      bend: {
        angle: params.angle,
        direction: params.direction,
        origin: params.origin,
        radius: params.radius,
        bendAxis: params.bendAxis
      }
    }
  };
}

// Helper function to bend a single vertex
function bendVertex(
  vertex: { x: number; y: number; z: number },
  angle: number,
  direction: { x: number; y: number; z: number },
  origin: { x: number; y: number; z: number },
  radius: number,
  bendAxis: string
): { x: number; y: number; z: number } {
  // Translate to origin
  const translated = {
    x: vertex.x - origin.x,
    y: vertex.y - origin.y,
    z: vertex.z - origin.z
  };
  
  let distance, bendAngle;
  
  // Calculate distance and bend angle based on bend axis
  switch (bendAxis) {
    case 'x':
      distance = Math.sqrt(translated.y * translated.y + translated.z * translated.z);
      bendAngle = (distance / radius) * angle;
      break;
    case 'y':
      distance = Math.sqrt(translated.x * translated.x + translated.z * translated.z);
      bendAngle = (distance / radius) * angle;
      break;
    case 'z':
      distance = Math.sqrt(translated.x * translated.x + translated.y * translated.y);
      bendAngle = (distance / radius) * angle;
      break;
    default:
      return vertex;
  }
  
  // Apply rotation based on bend axis
  let rotated = { ...translated };
  
  switch (bendAxis) {
    case 'x':
      // Rotate around X axis
      const cosY = Math.cos(bendAngle);
      const sinY = Math.sin(bendAngle);
      rotated.y = translated.y * cosY - translated.z * sinY;
      rotated.z = translated.y * sinY + translated.z * cosY;
      break;
    case 'y':
      // Rotate around Y axis
      const cosX = Math.cos(bendAngle);
      const sinX = Math.sin(bendAngle);
      rotated.x = translated.x * cosX + translated.z * sinX;
      rotated.z = -translated.x * sinX + translated.z * cosX;
      break;
    case 'z':
      // Rotate around Z axis
      const cosXY = Math.cos(bendAngle);
      const sinXY = Math.sin(bendAngle);
      rotated.x = translated.x * cosXY - translated.y * sinXY;
      rotated.y = translated.x * sinXY + translated.y * cosXY;
      break;
  }
  
  // Translate back from origin
  return {
    x: rotated.x + origin.x,
    y: rotated.y + origin.y,
    z: rotated.z + origin.z
  };
}
