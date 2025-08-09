import { NodeDefinition } from '../../types/nodeSystem';
import { RotateCcw } from 'lucide-react';

// TWIST NODE - Twists geometry around a specified axis
export const twistNodeDefinition: NodeDefinition = {
  type: 'twist',
  name: 'Twist',
  description: 'Twists geometry around a specified axis',
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
      description: 'Input geometry to twist'
    },
    {
      id: 'angle',
      name: 'Angle',
      type: 'number',
      defaultValue: 0,
      description: 'Twist angle in radians'
    },
    {
      id: 'axis',
      name: 'Axis',
      type: 'vector',
      defaultValue: { x: 0, y: 1, z: 0 },
      description: 'Twist axis direction'
    },
    {
      id: 'origin',
      name: 'Origin',
      type: 'vector',
      defaultValue: { x: 0, y: 0, z: 0 },
      description: 'Twist origin point'
    },
    {
      id: 'radius',
      name: 'Radius',
      type: 'number',
      defaultValue: 1,
      description: 'Twist radius'
    }
  ],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Twisted geometry'
    }
  ],
  parameters: [
    {
      id: 'twistAxis',
      name: 'Twist Axis',
      type: 'select',
      defaultValue: 'y',
      options: ['x', 'y', 'z'],
      description: 'Axis to twist around'
    },
    {
      id: 'clamp',
      name: 'Clamp',
      type: 'boolean',
      defaultValue: false,
      description: 'Clamp the twist to prevent extreme deformation'
    }
  ],
  ui: {
    icon: RotateCcw
  },
  execute: (inputs, parameters) => {
    const geometry = inputs.geometry;
    const angle = inputs.angle || 0;
    const axis = inputs.axis || { x: 0, y: 1, z: 0 };
    const origin = inputs.origin || { x: 0, y: 0, z: 0 };
    const radius = inputs.radius || 1;
    const twistAxis = parameters.twistAxis || 'y';
    const clamp = parameters.clamp || false;
    
    if (!geometry) {
      return { geometry: null };
    }
    
    // Normalize axis vector
    const axisLength = Math.sqrt(axis.x * axis.x + axis.y * axis.y + axis.z * axis.z);
    const normalizedAxis = {
      x: axis.x / axisLength,
      y: axis.y / axisLength,
      z: axis.z / axisLength
    };
    
    // Clamp angle if requested
    const clampedAngle = clamp ? Math.max(-Math.PI * 2, Math.min(Math.PI * 2, angle)) : angle;
    
    // Apply twist transformation to geometry
    const twistedGeometry = applyTwistTransformation(geometry, {
      angle: clampedAngle,
      axis: normalizedAxis,
      origin,
      radius,
      twistAxis
    });
    
    return { 
      geometry: twistedGeometry,
      result: twistedGeometry,
      'geometry-out': twistedGeometry
    };
  }
};

// Helper function to apply twist transformation
function applyTwistTransformation(geometry: any, params: {
  angle: number;
  axis: { x: number; y: number; z: number };
  origin: { x: number; y: number; z: number };
  radius: number;
  twistAxis: string;
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
    
    // Apply twist transformation to each vertex
    for (let i = 0; i < count; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      
      // Transform vertex based on twist axis
      const transformed = twistVertex(
        { x, y, z },
        params.angle,
        params.axis,
        params.origin,
        params.radius,
        params.twistAxis
      );
      
      positions[i * 3] = transformed.x;
      positions[i * 3 + 1] = transformed.y;
      positions[i * 3 + 2] = transformed.z;
    }
    
    // Update normals if they exist
    if (clonedGeometry.attributes.normal) {
      clonedGeometry.computeVertexNormals();
    }
    
    // Add twist metadata
    if (!clonedGeometry.userData) {
      clonedGeometry.userData = {};
    }
    clonedGeometry.userData.twist = {
      angle: params.angle,
      axis: params.axis,
      origin: params.origin,
      radius: params.radius,
      twistAxis: params.twistAxis
    };
    
    return clonedGeometry;
  }
  
  // For non-THREE.js geometries or objects without clone method
  // Return a new object with twist metadata
  return {
    ...geometry,
    userData: {
      ...(geometry.userData || {}),
      twist: {
        angle: params.angle,
        axis: params.axis,
        origin: params.origin,
        radius: params.radius,
        twistAxis: params.twistAxis
      }
    }
  };
}

// Helper function to twist a single vertex
function twistVertex(
  vertex: { x: number; y: number; z: number },
  angle: number,
  axis: { x: number; y: number; z: number },
  origin: { x: number; y: number; z: number },
  radius: number,
  twistAxis: string
): { x: number; y: number; z: number } {
  // Translate to origin
  const translated = {
    x: vertex.x - origin.x,
    y: vertex.y - origin.y,
    z: vertex.z - origin.z
  };
  
  let distance, twistAngle;
  
  // Calculate distance and twist angle based on twist axis
  switch (twistAxis) {
    case 'x':
      distance = Math.sqrt(translated.y * translated.y + translated.z * translated.z);
      twistAngle = (distance / radius) * angle;
      break;
    case 'y':
      distance = Math.sqrt(translated.x * translated.x + translated.z * translated.z);
      twistAngle = (distance / radius) * angle;
      break;
    case 'z':
      distance = Math.sqrt(translated.x * translated.x + translated.y * translated.y);
      twistAngle = (distance / radius) * angle;
      break;
    default:
      return vertex;
  }
  
  // Apply rotation around the twist axis
  let rotated = { ...translated };
  
  switch (twistAxis) {
    case 'x':
      // Rotate around X axis (twist)
      const cosY = Math.cos(twistAngle);
      const sinY = Math.sin(twistAngle);
      rotated.y = translated.y * cosY - translated.z * sinY;
      rotated.z = translated.y * sinY + translated.z * cosY;
      break;
    case 'y':
      // Rotate around Y axis (twist)
      const cosX = Math.cos(twistAngle);
      const sinX = Math.sin(twistAngle);
      rotated.x = translated.x * cosX + translated.z * sinX;
      rotated.z = -translated.x * sinX + translated.z * cosX;
      break;
    case 'z':
      // Rotate around Z axis (twist)
      const cosXY = Math.cos(twistAngle);
      const sinXY = Math.sin(twistAngle);
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
