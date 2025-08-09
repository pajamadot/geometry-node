import { NodeDefinition } from '../../types/nodeSystem';
import { TrendingDown } from 'lucide-react';

// TAPER NODE - Tapers geometry along a specified axis
export const taperNodeDefinition: NodeDefinition = {
  type: 'taper',
  name: 'Taper',
  description: 'Tapers geometry along a specified axis',
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
      description: 'Input geometry to taper'
    },
    {
      id: 'factor',
      name: 'Factor',
      type: 'number',
      defaultValue: 0,
      description: 'Taper factor (0 = no taper, 1 = full taper)'
    },
    {
      id: 'startScale',
      name: 'Start Scale',
      type: 'vector',
      defaultValue: { x: 1, y: 1, z: 1 },
      description: 'Scale at the start of the taper'
    },
    {
      id: 'endScale',
      name: 'End Scale',
      type: 'vector',
      defaultValue: { x: 0, y: 0, z: 0 },
      description: 'Scale at the end of the taper'
    },
    {
      id: 'origin',
      name: 'Origin',
      type: 'vector',
      defaultValue: { x: 0, y: 0, z: 0 },
      description: 'Taper origin point'
    }
  ],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Tapered geometry'
    }
  ],
  parameters: [
    {
      id: 'taperAxis',
      name: 'Taper Axis',
      type: 'select',
      defaultValue: 'y',
      options: ['x', 'y', 'z'],
      description: 'Axis to taper along'
    },
    {
      id: 'clamp',
      name: 'Clamp',
      type: 'boolean',
      defaultValue: false,
      description: 'Clamp the taper to prevent extreme deformation'
    },
    {
      id: 'symmetric',
      name: 'Symmetric',
      type: 'boolean',
      defaultValue: false,
      description: 'Apply symmetric tapering from center'
    }
  ],
  ui: {
    icon: TrendingDown,
    width: 380,
    height: 450
  },
  execute: (inputs, parameters) => {
    const geometry = inputs.geometry;
    const factor = inputs.factor || 0;
    const startScale = inputs.startScale || { x: 1, y: 1, z: 1 };
    const endScale = inputs.endScale || { x: 0, y: 0, z: 0 };
    const origin = inputs.origin || { x: 0, y: 0, z: 0 };
    const taperAxis = parameters.taperAxis || 'y';
    const clamp = parameters.clamp || false;
    const symmetric = parameters.symmetric || false;
    
    if (!geometry) {
      return { geometry: null };
    }
    
    // Clamp factor if requested
    const clampedFactor = clamp ? Math.max(0, Math.min(1, factor)) : factor;
    
    // Apply taper transformation to geometry
    const taperedGeometry = applyTaperTransformation(geometry, {
      factor: clampedFactor,
      startScale,
      endScale,
      origin,
      taperAxis,
      symmetric
    });
    
    return { 
      geometry: taperedGeometry,
      result: taperedGeometry,
      'geometry-out': taperedGeometry
    };
  }
};

// Helper function to apply taper transformation
function applyTaperTransformation(geometry: any, params: {
  factor: number;
  startScale: { x: number; y: number; z: number };
  endScale: { x: number; y: number; z: number };
  origin: { x: number; y: number; z: number };
  taperAxis: string;
  symmetric: boolean;
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
    
    // Calculate geometry bounds for taper calculation
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    
    for (let i = 0; i < count; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
    }
    
    // Apply taper transformation to each vertex
    for (let i = 0; i < count; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      
      // Transform vertex based on taper axis
      const transformed = taperVertex(
        { x, y, z },
        params.factor,
        params.startScale,
        params.endScale,
        params.origin,
        params.taperAxis,
        params.symmetric,
        { minX, maxX, minY, maxY, minZ, maxZ }
      );
      
      positions[i * 3] = transformed.x;
      positions[i * 3 + 1] = transformed.y;
      positions[i * 3 + 2] = transformed.z;
    }
    
    // Update normals if they exist
    if (clonedGeometry.attributes.normal) {
      clonedGeometry.computeVertexNormals();
    }
    
    // Add taper metadata
    if (!clonedGeometry.userData) {
      clonedGeometry.userData = {};
    }
    clonedGeometry.userData.taper = {
      factor: params.factor,
      startScale: params.startScale,
      endScale: params.endScale,
      origin: params.origin,
      taperAxis: params.taperAxis,
      symmetric: params.symmetric
    };
    
    return clonedGeometry;
  }
  
  // For non-THREE.js geometries or objects without clone method
  // Return a new object with taper metadata
  return {
    ...geometry,
    userData: {
      ...(geometry.userData || {}),
      taper: {
        factor: params.factor,
        startScale: params.startScale,
        endScale: params.endScale,
        origin: params.origin,
        taperAxis: params.taperAxis,
        symmetric: params.symmetric
      }
    }
  };
}

// Helper function to taper a single vertex
function taperVertex(
  vertex: { x: number; y: number; z: number },
  factor: number,
  startScale: { x: number; y: number; z: number },
  endScale: { x: number; y: number; z: number },
  origin: { x: number; y: number; z: number },
  taperAxis: string,
  symmetric: boolean,
  bounds: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number }
): { x: number; y: number; z: number } {
  // Translate to origin
  const translated = {
    x: vertex.x - origin.x,
    y: vertex.y - origin.y,
    z: vertex.z - origin.z
  };
  
  let progress, scaleX, scaleY, scaleZ;
  
  // Calculate progress along taper axis
  switch (taperAxis) {
    case 'x':
      const rangeX = bounds.maxX - bounds.minX;
      if (rangeX === 0) {
        progress = 0;
      } else {
        progress = (translated.x - (bounds.minX - origin.x)) / rangeX;
      }
      break;
    case 'y':
      const rangeY = bounds.maxY - bounds.minY;
      if (rangeY === 0) {
        progress = 0;
      } else {
        progress = (translated.y - (bounds.minY - origin.y)) / rangeY;
      }
      break;
    case 'z':
      const rangeZ = bounds.maxZ - bounds.minZ;
      if (rangeZ === 0) {
        progress = 0;
      } else {
        progress = (translated.z - (bounds.minZ - origin.z)) / rangeZ;
      }
      break;
    default:
      progress = 0;
  }
  
  // Clamp progress to [0, 1]
  progress = Math.max(0, Math.min(1, progress));
  
  // Apply symmetric tapering if requested
  if (symmetric) {
    progress = Math.abs(progress - 0.5) * 2; // Convert to [0, 1] from center
  }
  
  // Apply taper factor
  const taperedProgress = progress * factor;
  
  // Interpolate scale values
  scaleX = startScale.x + (endScale.x - startScale.x) * taperedProgress;
  scaleY = startScale.y + (endScale.y - startScale.y) * taperedProgress;
  scaleZ = startScale.z + (endScale.z - startScale.z) * taperedProgress;
  
  // Apply scaling
  const scaled = {
    x: translated.x * scaleX,
    y: translated.y * scaleY,
    z: translated.z * scaleZ
  };
  
  // Translate back from origin
  return {
    x: scaled.x + origin.x,
    y: scaled.y + origin.y,
    z: scaled.z + origin.z
  };
}
