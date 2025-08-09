import { NodeDefinition } from '../../types/nodeSystem';
import { Copy } from 'lucide-react';
import * as THREE from 'three';

// INSTANCE NODE - Creates instances of geometry at specified positions
export const instanceNodeDefinition: NodeDefinition = {
  type: 'instance',
  name: 'Instance',
  description: 'Creates instances of geometry at specified positions',
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
      description: 'Input geometry to instance'
    },
    {
      id: 'positions',
      name: 'Positions',
      type: 'points',
      defaultValue: [],
      description: 'Array of positions to create instances at'
    },
    {
      id: 'rotation',
      name: 'Rotation',
      type: 'vector',
      defaultValue: { x: 0, y: 0, z: 0 },
      description: 'Rotation to apply to all instances'
    },
    {
      id: 'scale',
      name: 'Scale',
      type: 'vector',
      defaultValue: { x: 1, y: 1, z: 1 },
      description: 'Scale to apply to all instances'
    }
  ],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Instanced geometry'
    }
  ],
  parameters: [
    {
      id: 'instanceMode',
      name: 'Instance Mode',
      type: 'select',
      defaultValue: 'points',
      options: ['points', 'grid', 'circle', 'random'],
      description: 'How to generate instance positions'
    },
    {
      id: 'count',
      name: 'Count',
      type: 'integer',
      defaultValue: 10,
      description: 'Number of instances to create'
    },
    {
      id: 'gridSize',
      name: 'Grid Size',
      type: 'vector',
      defaultValue: { x: 3, y: 3, z: 1 },
      description: 'Grid dimensions for grid mode'
    },
    {
      id: 'gridSpacing',
      name: 'Grid Spacing',
      type: 'vector',
      defaultValue: { x: 2, y: 2, z: 2 },
      description: 'Spacing between grid instances'
    },
    {
      id: 'circleRadius',
      name: 'Circle Radius',
      type: 'number',
      defaultValue: 5,
      description: 'Radius for circle mode'
    },
    {
      id: 'randomBounds',
      name: 'Random Bounds',
      type: 'vector',
      defaultValue: { x: 10, y: 10, z: 10 },
      description: 'Bounds for random mode'
    },
    {
      id: 'randomSeed',
      name: 'Random Seed',
      type: 'integer',
      defaultValue: 0,
      description: 'Seed for random generation'
    },
    {
      id: 'randomRotation',
      name: 'Random Rotation',
      type: 'boolean',
      defaultValue: false,
      description: 'Apply random rotation to instances'
    },
    {
      id: 'randomScale',
      name: 'Random Scale',
      type: 'boolean',
      defaultValue: false,
      description: 'Apply random scale to instances'
    },
    {
      id: 'scaleRange',
      name: 'Scale Range',
      type: 'vector',
      defaultValue: { x: 0.5, y: 1.5, z: 0.5 },
      description: 'Min/max scale range for random scale'
    }
  ],
  ui: {
    icon: Copy,
    width: 400,
    height: 650
  },
  execute: (inputs, parameters) => {
    const geometry = inputs.geometry;
    const positions = inputs.positions || [];
    const rotation = inputs.rotation || { x: 0, y: 0, z: 0 };
    const scale = inputs.scale || { x: 1, y: 1, z: 1 };
    const instanceMode = parameters.instanceMode || 'points';
    const count = parameters.count || 10;
    const gridSize = parameters.gridSize || { x: 3, y: 3, z: 1 };
    const gridSpacing = parameters.gridSpacing || { x: 2, y: 2, z: 2 };
    const circleRadius = parameters.circleRadius || 5;
    const randomBounds = parameters.randomBounds || { x: 10, y: 10, z: 10 };
    const randomSeed = parameters.randomSeed || 0;
    const randomRotation = parameters.randomRotation || false;
    const randomScale = parameters.randomScale || false;
    const scaleRange = parameters.scaleRange || { x: 0.5, y: 1.5, z: 0.5 };
    
    if (!geometry) {
      return { geometry: null };
    }
    
    // Generate positions based on mode
    let instancePositions = positions;
    if (instanceMode !== 'points' || positions.length === 0) {
      instancePositions = generateInstancePositions({
        mode: instanceMode,
        count,
        gridSize,
        gridSpacing,
        circleRadius,
        randomBounds,
        randomSeed
      });
    }
    
    // Apply instance transformation to geometry
    const instancedGeometry = applyInstanceTransformation(geometry, {
      positions: instancePositions,
      rotation,
      scale,
      randomRotation,
      randomScale,
      scaleRange,
      randomSeed
    });
    
    return { 
      geometry: instancedGeometry,
      result: instancedGeometry,
      'geometry-out': instancedGeometry
    };
  }
};

// Simple seeded random number generator
function seededRandom(seed: number): () => number {
  let state = seed;
  return function() {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

// Helper function to generate instance positions
function generateInstancePositions(params: {
  mode: string;
  count: number;
  gridSize: { x: number; y: number; z: number };
  gridSpacing: { x: number; y: number; z: number };
  circleRadius: number;
  randomBounds: { x: number; y: number; z: number };
  randomSeed: number;
}): { x: number; y: number; z: number }[] {
  const positions: { x: number; y: number; z: number }[] = [];
  const random = seededRandom(params.randomSeed);
  
  switch (params.mode) {
    case 'grid':
      const totalGridInstances = params.gridSize.x * params.gridSize.y * params.gridSize.z;
      const actualCount = Math.min(params.count, totalGridInstances);
      
      for (let i = 0; i < actualCount; i++) {
        const gridX = i % params.gridSize.x;
        const gridY = Math.floor(i / params.gridSize.x) % params.gridSize.y;
        const gridZ = Math.floor(i / (params.gridSize.x * params.gridSize.y));
        
        positions.push({
          x: (gridX - (params.gridSize.x - 1) / 2) * params.gridSpacing.x,
          y: (gridY - (params.gridSize.y - 1) / 2) * params.gridSpacing.y,
          z: (gridZ - (params.gridSize.z - 1) / 2) * params.gridSpacing.z
        });
      }
      break;
      
    case 'circle':
      for (let i = 0; i < params.count; i++) {
        const angle = (2 * Math.PI * i) / params.count;
        positions.push({
          x: params.circleRadius * Math.cos(angle),
          y: 0,
          z: params.circleRadius * Math.sin(angle)
        });
      }
      break;
      
    case 'random':
      for (let i = 0; i < params.count; i++) {
        positions.push({
          x: (random() - 0.5) * params.randomBounds.x,
          y: (random() - 0.5) * params.randomBounds.y,
          z: (random() - 0.5) * params.randomBounds.z
        });
      }
      break;
      
    default:
      // Default to single instance at origin
      positions.push({ x: 0, y: 0, z: 0 });
  }
  
  return positions;
}

// Helper function to apply instance transformation
function applyInstanceTransformation(geometry: any, params: {
  positions: { x: number; y: number; z: number }[];
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  randomRotation: boolean;
  randomScale: boolean;
  scaleRange: { x: number; y: number; z: number };
  randomSeed: number;
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
    
    const random = seededRandom(params.randomSeed);
    
    // Generate instances at each position
    for (let i = 0; i < params.positions.length; i++) {
      const position = params.positions[i];
      
      // Generate random rotation if enabled
      const rot = params.randomRotation ? {
        x: random() * Math.PI * 2,
        y: random() * Math.PI * 2,
        z: random() * Math.PI * 2
      } : params.rotation;
      
      // Generate random scale if enabled
      const scl = params.randomScale ? {
        x: params.scaleRange.x + (params.scaleRange.y - params.scaleRange.x) * random(),
        y: params.scaleRange.x + (params.scaleRange.y - params.scaleRange.x) * random(),
        z: params.scaleRange.x + (params.scaleRange.y - params.scaleRange.x) * random()
      } : params.scale;
      
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
    
    // Set merged geometry attributes
    mergedGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(allPositions), 3));
    
    if (allIndices.length > 0) {
      mergedGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(allIndices), 1));
    }
    
    // Update normals
    mergedGeometry.computeVertexNormals();
    
    // Add instance metadata
    if (!mergedGeometry.userData) {
      mergedGeometry.userData = {};
    }
    mergedGeometry.userData.instance = {
      positions: params.positions,
      rotation: params.rotation,
      scale: params.scale,
      randomRotation: params.randomRotation,
      randomScale: params.randomScale,
      scaleRange: params.scaleRange,
      randomSeed: params.randomSeed
    };
    
    return mergedGeometry;
  }
  
  // For non-THREE.js geometries or objects without clone method
  // Return a new object with instance metadata
  return {
    ...geometry,
    userData: {
      ...(geometry.userData || {}),
      instance: {
        positions: params.positions,
        rotation: params.rotation,
        scale: params.scale,
        randomRotation: params.randomRotation,
        randomScale: params.randomScale,
        scaleRange: params.scaleRange,
        randomSeed: params.randomSeed
      }
    }
  };
}
