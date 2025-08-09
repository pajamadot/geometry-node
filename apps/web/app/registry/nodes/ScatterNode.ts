import { NodeDefinition } from '../../types/nodeSystem';
import { ScatterChart } from 'lucide-react';
import * as THREE from 'three';

// SCATTER NODE - Scatters geometry instances randomly
export const scatterNodeDefinition: NodeDefinition = {
  type: 'scatter',
  name: 'Scatter',
  description: 'Scatters geometry instances randomly',
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
      description: 'Input geometry to scatter'
    },
    {
      id: 'count',
      name: 'Count',
      type: 'integer',
      defaultValue: 10,
      description: 'Number of instances to scatter'
    },
    {
      id: 'bounds',
      name: 'Bounds',
      type: 'vector',
      defaultValue: { x: 10, y: 10, z: 10 },
      description: 'Scattering bounds'
    },
    {
      id: 'seed',
      name: 'Seed',
      type: 'integer',
      defaultValue: 0,
      description: 'Random seed for consistent results'
    }
  ],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Scattered geometry'
    }
  ],
  parameters: [
    {
      id: 'distribution',
      name: 'Distribution',
      type: 'select',
      defaultValue: 'uniform',
      options: ['uniform', 'gaussian', 'spherical'],
      description: 'Distribution type for scattering'
    },
    {
      id: 'rotation',
      name: 'Random Rotation',
      type: 'boolean',
      defaultValue: false,
      description: 'Apply random rotation to instances'
    },
    {
      id: 'scale',
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
      description: 'Min/max scale range'
    },
    {
      id: 'center',
      name: 'Center',
      type: 'vector',
      defaultValue: { x: 0, y: 0, z: 0 },
      description: 'Center point for scattering'
    }
  ],
  ui: {
    icon: ScatterChart,
    width: 400,
    height: 500
  },
  execute: (inputs, parameters) => {
    const geometry = inputs.geometry;
    const count = inputs.count || 10;
    const bounds = inputs.bounds || { x: 10, y: 10, z: 10 };
    const seed = inputs.seed || 0;
    const distribution = parameters.distribution || 'uniform';
    const rotation = parameters.rotation || false;
    const scale = parameters.scale || false;
    const scaleRange = parameters.scaleRange || { x: 0.5, y: 1.5, z: 0.5 };
    const center = parameters.center || { x: 0, y: 0, z: 0 };
    
    if (!geometry) {
      return { geometry: null };
    }
    
    // Apply scatter transformation to geometry
    const scatteredGeometry = applyScatterTransformation(geometry, {
      count,
      bounds,
      seed,
      distribution,
      rotation,
      scale,
      scaleRange,
      center
    });
    
    return { 
      geometry: scatteredGeometry,
      result: scatteredGeometry,
      'geometry-out': scatteredGeometry
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

// Helper function to apply scatter transformation
function applyScatterTransformation(geometry: any, params: {
  count: number;
  bounds: { x: number; y: number; z: number };
  seed: number;
  distribution: string;
  rotation: boolean;
  scale: boolean;
  scaleRange: { x: number; y: number; z: number };
  center: { x: number; y: number; z: number };
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
    const random = seededRandom(params.seed);
    
    // Generate scattered instances
    for (let i = 0; i < params.count; i++) {
      // Generate random position based on distribution
      const position = generateRandomPosition(random, params.distribution, params.bounds, params.center);
      
      // Generate random rotation if enabled
      const rot = params.rotation ? {
        x: random() * Math.PI * 2,
        y: random() * Math.PI * 2,
        z: random() * Math.PI * 2
      } : { x: 0, y: 0, z: 0 };
      
      // Generate random scale if enabled
      const scl = params.scale ? {
        x: params.scaleRange.x + (params.scaleRange.y - params.scaleRange.x) * random(),
        y: params.scaleRange.x + (params.scaleRange.y - params.scaleRange.x) * random(),
        z: params.scaleRange.x + (params.scaleRange.y - params.scaleRange.x) * random()
      } : { x: 1, y: 1, z: 1 };
      
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
    
    // Add scatter metadata
    if (!mergedGeometry.userData) {
      mergedGeometry.userData = {};
    }
    mergedGeometry.userData.scatter = {
      count: params.count,
      bounds: params.bounds,
      seed: params.seed,
      distribution: params.distribution,
      rotation: params.rotation,
      scale: params.scale,
      scaleRange: params.scaleRange,
      center: params.center
    };
    
    return mergedGeometry;
  }
  
  // For non-THREE.js geometries or objects without clone method
  // Return a new object with scatter metadata
  return {
    ...geometry,
    userData: {
      ...(geometry.userData || {}),
      scatter: {
        count: params.count,
        bounds: params.bounds,
        seed: params.seed,
        distribution: params.distribution,
        rotation: params.rotation,
        scale: params.scale,
        scaleRange: params.scaleRange,
        center: params.center
      }
    }
  };
}

// Helper function to generate random position based on distribution
function generateRandomPosition(
  random: () => number,
  distribution: string,
  bounds: { x: number; y: number; z: number },
  center: { x: number; y: number; z: number }
): { x: number; y: number; z: number } {
  switch (distribution) {
    case 'uniform':
      return {
        x: center.x + (random() - 0.5) * bounds.x,
        y: center.y + (random() - 0.5) * bounds.y,
        z: center.z + (random() - 0.5) * bounds.z
      };
    
    case 'gaussian':
      // Box-Muller transform for Gaussian distribution
      const u1 = random();
      const u2 = random();
      const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const z2 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
      const z3 = Math.sqrt(-2 * Math.log(random())) * Math.cos(2 * Math.PI * random());
      
      return {
        x: center.x + z1 * bounds.x * 0.25,
        y: center.y + z2 * bounds.y * 0.25,
        z: center.z + z3 * bounds.z * 0.25
      };
    
    case 'spherical':
      // Spherical distribution
      const radius = Math.cbrt(random()) * Math.min(bounds.x, bounds.y, bounds.z) * 0.5;
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      
      return {
        x: center.x + radius * Math.sin(phi) * Math.cos(theta),
        y: center.y + radius * Math.sin(phi) * Math.sin(theta),
        z: center.z + radius * Math.cos(phi)
      };
    
    default:
      return {
        x: center.x + (random() - 0.5) * bounds.x,
        y: center.y + (random() - 0.5) * bounds.y,
        z: center.z + (random() - 0.5) * bounds.z
      };
  }
}
