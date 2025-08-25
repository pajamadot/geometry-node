import { NodeDefinition } from '../../types/nodeSystem';
import { Filter } from 'lucide-react';
import * as THREE from 'three';

// SAMPLE GEOMETRY NODE - Samples, simplifies, and resamples geometry
export const sampleGeometryNodeDefinition: NodeDefinition = {
  type: 'sample-geometry',
  name: 'Sample Geometry',
  description: 'Samples, simplifies, and resamples geometry',
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
      description: 'Input geometry to sample'
    },
    {
      id: 'sampleRate',
      name: 'Sample Rate',
      type: 'number',
      defaultValue: 0.5,
      description: 'Sampling rate (0.1=10%, 1.0=100%)'
    }
  ],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Sampled geometry'
    },
    {
      id: 'points',
      name: 'Points',
      type: 'points',
      description: 'Sampled points'
    }
  ],
  parameters: [
    {
      id: 'sampleMode',
      name: 'Sample Mode',
      type: 'select',
      defaultValue: 'simplify',
      options: ['simplify', 'uniform', 'adaptive', 'feature_preserving', 'random'],
      description: 'How to sample the geometry'
    },
    {
      id: 'targetVertices',
      name: 'Target Vertices',
      type: 'integer',
      defaultValue: 1000,
      description: 'Target number of vertices (for uniform mode)'
    },
    {
      id: 'preserveEdges',
      name: 'Preserve Edges',
      type: 'boolean',
      defaultValue: true,
      description: 'Preserve sharp edges during simplification'
    },
    {
      id: 'preserveNormals',
      name: 'Preserve Normals',
      type: 'boolean',
      defaultValue: true,
      description: 'Preserve normal vectors'
    },
    {
      id: 'smoothNormals',
      name: 'Smooth Normals',
      type: 'boolean',
      defaultValue: false,
      description: 'Smooth normal vectors after sampling'
    },
    {
      id: 'removeDegenerate',
      name: 'Remove Degenerate',
      type: 'boolean',
      defaultValue: true,
      description: 'Remove degenerate faces'
    },
    {
      id: 'mergeVertices',
      name: 'Merge Vertices',
      type: 'boolean',
      defaultValue: true,
      description: 'Merge duplicate vertices'
    },
    {
      id: 'tolerance',
      name: 'Tolerance',
      type: 'number',
      defaultValue: 0.001,
      description: 'Tolerance for vertex merging and edge detection'
    },
    {
      id: 'seed',
      name: 'Seed',
      type: 'integer',
      defaultValue: 0,
      description: 'Random seed for random sampling'
    }
  ],
  ui: {
    icon: Filter,
    width: 400,
    height: 600
  },
  execute: (inputs, parameters) => {
    const geometry = inputs.geometry;
    const sampleRate = inputs.sampleRate || 0.5;
    const sampleMode = parameters.sampleMode || 'simplify';
    const targetVertices = parameters.targetVertices || 1000;
    const preserveEdges = parameters.preserveEdges !== false;
    const preserveNormals = parameters.preserveNormals !== false;
    const smoothNormals = parameters.smoothNormals || false;
    const removeDegenerate = parameters.removeDegenerate !== false;
    const mergeVertices = parameters.mergeVertices !== false;
    const tolerance = parameters.tolerance || 0.001;
    const seed = parameters.seed || 0;
    
    if (!geometry) {
      return { geometry: null, points: [] };
    }
    
    // Sample geometry
    const sampledGeometry = sampleGeometry(geometry, {
      mode: sampleMode,
      sampleRate,
      targetVertices,
      preserveEdges,
      preserveNormals,
      smoothNormals,
      removeDegenerate,
      mergeVertices,
      tolerance,
      seed
    });
    
    // Convert to points for output
    const points = geometryToPoints(sampledGeometry);
    
    // Debug information
    console.log(`Sample Geometry: Mode=${sampleMode}, Rate=${sampleRate}, Vertices=${sampledGeometry.attributes.position?.count || 0}`);
    
    return { 
      geometry: sampledGeometry,
      points,
      result: sampledGeometry,
      'geometry-out': sampledGeometry
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

// Point data structure
interface PointData {
  position: { x: number; y: number; z: number };
  normal?: { x: number; y: number; z: number };
  color?: { r: number; g: number; b: number; a: number };
  size?: number;
}

// Helper function to sample geometry
function sampleGeometry(geometry: any, params: {
  mode: string;
  sampleRate: number;
  targetVertices: number;
  preserveEdges: boolean;
  preserveNormals: boolean;
  smoothNormals: boolean;
  removeDegenerate: boolean;
  mergeVertices: boolean;
  tolerance: number;
  seed: number;
}): THREE.BufferGeometry {
  if (!geometry || !geometry.attributes || !geometry.attributes.position) {
    return new THREE.BufferGeometry();
  }
  
  const positionAttribute = geometry.attributes.position;
  const normalAttribute = geometry.attributes.normal;
  const colorAttribute = geometry.attributes.color;
  const indexAttribute = geometry.index;
  
  let sampledGeometry: THREE.BufferGeometry;
  
  switch (params.mode) {
    case 'simplify':
      sampledGeometry = simplifyGeometry(geometry, params);
      break;
      
    case 'uniform':
      sampledGeometry = uniformSampleGeometry(geometry, params);
      break;
      
    case 'adaptive':
      sampledGeometry = adaptiveSampleGeometry(geometry, params);
      break;
      
    case 'feature_preserving':
      sampledGeometry = featurePreservingSampleGeometry(geometry, params);
      break;
      
    case 'random':
      sampledGeometry = randomSampleGeometry(geometry, params);
      break;
      
    default:
      sampledGeometry = geometry.clone();
  }
  
  // Post-processing
  if (params.removeDegenerate) {
    sampledGeometry = removeDegenerateFaces(sampledGeometry, params.tolerance);
  }
  
  if (params.mergeVertices) {
    sampledGeometry = mergeDuplicateVertices(sampledGeometry, params.tolerance);
  }
  
  if (params.smoothNormals) {
    sampledGeometry.computeVertexNormals();
  }
  
  return sampledGeometry;
}

// Helper function to simplify geometry
function simplifyGeometry(geometry: any, params: any): THREE.BufferGeometry {
  const positionAttribute = geometry.attributes.position;
  const indexAttribute = geometry.index;
  
  if (!positionAttribute) {
    return new THREE.BufferGeometry();
  }
  
  const targetVertexCount = Math.floor(positionAttribute.count * params.sampleRate);
  const step = Math.max(1, Math.floor(positionAttribute.count / targetVertexCount));
  
  const simplifiedGeometry = new THREE.BufferGeometry();
  const newPositions: number[] = [];
  const newNormals: number[] = [];
  const newColors: number[] = [];
  const newIndices: number[] = [];
  
  // Sample vertices
  let vertexIndex = 0;
  for (let i = 0; i < positionAttribute.count; i += step) {
    newPositions.push(
      positionAttribute.getX(i),
      positionAttribute.getY(i),
      positionAttribute.getZ(i)
    );
    
    // Copy normals if available
    if (geometry.attributes.normal) {
      newNormals.push(
        geometry.attributes.normal.getX(i),
        geometry.attributes.normal.getY(i),
        geometry.attributes.normal.getZ(i)
      );
    }
    
    // Copy colors if available
    if (geometry.attributes.color) {
      newColors.push(
        geometry.attributes.color.getX(i),
        geometry.attributes.color.getY(i),
        geometry.attributes.color.getZ(i),
        geometry.attributes.color.getW ? geometry.attributes.color.getW(i) : 1.0
      );
    }
    
    vertexIndex++;
  }
  
  // Create simple triangle strips
  for (let i = 0; i < newPositions.length - 2; i += 3) {
    newIndices.push(i, i + 1, i + 2);
  }
  
  // Set attributes
  simplifiedGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(newPositions), 3));
  
  if (newNormals.length > 0) {
    simplifiedGeometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(newNormals), 3));
  }
  
  if (newColors.length > 0) {
    simplifiedGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(newColors), 4));
  }
  
  if (newIndices.length > 0) {
    simplifiedGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(newIndices), 1));
  }
  
  return simplifiedGeometry;
}

// Helper function to uniform sample geometry
function uniformSampleGeometry(geometry: any, params: any): THREE.BufferGeometry {
  const positionAttribute = geometry.attributes.position;
  
  if (!positionAttribute) {
    return new THREE.BufferGeometry();
  }
  
  const targetVertexCount = Math.min(params.targetVertices, positionAttribute.count);
  const step = Math.max(1, Math.floor(positionAttribute.count / targetVertexCount));
  
  const sampledGeometry = new THREE.BufferGeometry();
  const newPositions: number[] = [];
  const newNormals: number[] = [];
  const newColors: number[] = [];
  const newIndices: number[] = [];
  
  // Uniform sampling
  for (let i = 0; i < positionAttribute.count; i += step) {
    newPositions.push(
      positionAttribute.getX(i),
      positionAttribute.getY(i),
      positionAttribute.getZ(i)
    );
    
    // Copy normals if available
    if (geometry.attributes.normal) {
      newNormals.push(
        geometry.attributes.normal.getX(i),
        geometry.attributes.normal.getY(i),
        geometry.attributes.normal.getZ(i)
      );
    }
    
    // Copy colors if available
    if (geometry.attributes.color) {
      newColors.push(
        geometry.attributes.color.getX(i),
        geometry.attributes.color.getY(i),
        geometry.attributes.color.getZ(i),
        geometry.attributes.color.getW ? geometry.attributes.color.getW(i) : 1.0
      );
    }
  }
  
  // Create triangles
  for (let i = 0; i < newPositions.length - 2; i += 3) {
    newIndices.push(i, i + 1, i + 2);
  }
  
  // Set attributes
  sampledGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(newPositions), 3));
  
  if (newNormals.length > 0) {
    sampledGeometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(newNormals), 3));
  }
  
  if (newColors.length > 0) {
    sampledGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(newColors), 4));
  }
  
  if (newIndices.length > 0) {
    sampledGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(newIndices), 1));
  }
  
  return sampledGeometry;
}

// Helper function to adaptive sample geometry
function adaptiveSampleGeometry(geometry: any, params: any): THREE.BufferGeometry {
  const positionAttribute = geometry.attributes.position;
  
  if (!positionAttribute) {
    return new THREE.BufferGeometry();
  }
  
  // Adaptive sampling based on curvature
  const curvature = calculateCurvature(geometry);
  const sampledGeometry = new THREE.BufferGeometry();
  const newPositions: number[] = [];
  const newNormals: number[] = [];
  const newColors: number[] = [];
  const newIndices: number[] = [];
  
  // Sample based on curvature
  for (let i = 0; i < positionAttribute.count; i++) {
    const cur = curvature[i] || 0;
    const sampleProb = Math.min(1.0, cur * 2 + params.sampleRate);
    
    if (Math.random() < sampleProb) {
      newPositions.push(
        positionAttribute.getX(i),
        positionAttribute.getY(i),
        positionAttribute.getZ(i)
      );
      
      // Copy normals if available
      if (geometry.attributes.normal) {
        newNormals.push(
          geometry.attributes.normal.getX(i),
          geometry.attributes.normal.getY(i),
          geometry.attributes.normal.getZ(i)
        );
      }
      
      // Copy colors if available
      if (geometry.attributes.color) {
        newColors.push(
          geometry.attributes.color.getX(i),
          geometry.attributes.color.getY(i),
          geometry.attributes.color.getZ(i),
          geometry.attributes.color.getW ? geometry.attributes.color.getW(i) : 1.0
        );
      }
    }
  }
  
  // Create triangles
  for (let i = 0; i < newPositions.length - 2; i += 3) {
    newIndices.push(i, i + 1, i + 2);
  }
  
  // Set attributes
  sampledGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(newPositions), 3));
  
  if (newNormals.length > 0) {
    sampledGeometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(newNormals), 3));
  }
  
  if (newColors.length > 0) {
    sampledGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(newColors), 4));
  }
  
  if (newIndices.length > 0) {
    sampledGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(newIndices), 1));
  }
  
  return sampledGeometry;
}

// Helper function to feature preserving sample geometry
function featurePreservingSampleGeometry(geometry: any, params: any): THREE.BufferGeometry {
  const positionAttribute = geometry.attributes.position;
  
  if (!positionAttribute) {
    return new THREE.BufferGeometry();
  }
  
  // Feature preserving sampling
  const edges = detectEdges(geometry, params.tolerance);
  const sampledGeometry = new THREE.BufferGeometry();
  const newPositions: number[] = [];
  const newNormals: number[] = [];
  const newColors: number[] = [];
  const newIndices: number[] = [];
  
  // Sample edge vertices with higher priority
  for (let i = 0; i < positionAttribute.count; i++) {
    const isEdge = edges.has(i);
    const sampleProb = isEdge ? 0.8 : params.sampleRate;
    
    if (Math.random() < sampleProb) {
      newPositions.push(
        positionAttribute.getX(i),
        positionAttribute.getY(i),
        positionAttribute.getZ(i)
      );
      
      // Copy normals if available
      if (geometry.attributes.normal) {
        newNormals.push(
          geometry.attributes.normal.getX(i),
          geometry.attributes.normal.getY(i),
          geometry.attributes.normal.getZ(i)
        );
      }
      
      // Copy colors if available
      if (geometry.attributes.color) {
        newColors.push(
          geometry.attributes.color.getX(i),
          geometry.attributes.color.getY(i),
          geometry.attributes.color.getZ(i),
          geometry.attributes.color.getW ? geometry.attributes.color.getW(i) : 1.0
        );
      }
    }
  }
  
  // Create triangles
  for (let i = 0; i < newPositions.length - 2; i += 3) {
    newIndices.push(i, i + 1, i + 2);
  }
  
  // Set attributes
  sampledGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(newPositions), 3));
  
  if (newNormals.length > 0) {
    sampledGeometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(newNormals), 3));
  }
  
  if (newColors.length > 0) {
    sampledGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(newColors), 4));
  }
  
  if (newIndices.length > 0) {
    sampledGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(newIndices), 1));
  }
  
  return sampledGeometry;
}

// Helper function to random sample geometry
function randomSampleGeometry(geometry: any, params: any): THREE.BufferGeometry {
  const positionAttribute = geometry.attributes.position;
  const random = seededRandom(params.seed);
  
  if (!positionAttribute) {
    return new THREE.BufferGeometry();
  }
  
  const sampledGeometry = new THREE.BufferGeometry();
  const newPositions: number[] = [];
  const newNormals: number[] = [];
  const newColors: number[] = [];
  const newIndices: number[] = [];
  
  // Random sampling
  for (let i = 0; i < positionAttribute.count; i++) {
    if (random() < params.sampleRate) {
      newPositions.push(
        positionAttribute.getX(i),
        positionAttribute.getY(i),
        positionAttribute.getZ(i)
      );
      
      // Copy normals if available
      if (geometry.attributes.normal) {
        newNormals.push(
          geometry.attributes.normal.getX(i),
          geometry.attributes.normal.getY(i),
          geometry.attributes.normal.getZ(i)
        );
      }
      
      // Copy colors if available
      if (geometry.attributes.color) {
        newColors.push(
          geometry.attributes.color.getX(i),
          geometry.attributes.color.getY(i),
          geometry.attributes.color.getZ(i),
          geometry.attributes.color.getW ? geometry.attributes.color.getW(i) : 1.0
        );
      }
    }
  }
  
  // Create triangles
  for (let i = 0; i < newPositions.length - 2; i += 3) {
    newIndices.push(i, i + 1, i + 2);
  }
  
  // Set attributes
  sampledGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(newPositions), 3));
  
  if (newNormals.length > 0) {
    sampledGeometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(newNormals), 3));
  }
  
  if (newColors.length > 0) {
    sampledGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(newColors), 4));
  }
  
  if (newIndices.length > 0) {
    sampledGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(newIndices), 1));
  }
  
  return sampledGeometry;
}

// Helper function to calculate curvature
function calculateCurvature(geometry: any): number[] {
  const positionAttribute = geometry.attributes.position;
  const normalAttribute = geometry.attributes.normal;
  const curvature: number[] = [];
  
  if (!positionAttribute || !normalAttribute) {
    return curvature;
  }
  
  // Simple curvature estimation based on normal variation
  for (let i = 0; i < positionAttribute.count; i++) {
    let curvatureSum = 0;
    let neighborCount = 0;
    
    // Find nearby vertices
    for (let j = 0; j < positionAttribute.count; j++) {
      if (i === j) continue;
      
      const dist = Math.sqrt(
        Math.pow(positionAttribute.getX(i) - positionAttribute.getX(j), 2) +
        Math.pow(positionAttribute.getY(i) - positionAttribute.getY(j), 2) +
        Math.pow(positionAttribute.getZ(i) - positionAttribute.getZ(j), 2)
      );
      
      if (dist < 0.1) { // Nearby threshold
        const normalDiff = Math.sqrt(
          Math.pow(normalAttribute.getX(i) - normalAttribute.getX(j), 2) +
          Math.pow(normalAttribute.getY(i) - normalAttribute.getY(j), 2) +
          Math.pow(normalAttribute.getZ(i) - normalAttribute.getZ(j), 2)
        );
        
        curvatureSum += normalDiff / dist;
        neighborCount++;
      }
    }
    
    curvature[i] = neighborCount > 0 ? curvatureSum / neighborCount : 0;
  }
  
  return curvature;
}

// Helper function to detect edges
function detectEdges(geometry: any, tolerance: number): Set<number> {
  const positionAttribute = geometry.attributes.position;
  const normalAttribute = geometry.attributes.normal;
  const edges = new Set<number>();
  
  if (!positionAttribute || !normalAttribute) {
    return edges;
  }
  
  // Simple edge detection based on normal discontinuity
  for (let i = 0; i < positionAttribute.count; i++) {
    let maxNormalDiff = 0;
    
    // Find nearby vertices
    for (let j = 0; j < positionAttribute.count; j++) {
      if (i === j) continue;
      
      const dist = Math.sqrt(
        Math.pow(positionAttribute.getX(i) - positionAttribute.getX(j), 2) +
        Math.pow(positionAttribute.getY(i) - positionAttribute.getY(j), 2) +
        Math.pow(positionAttribute.getZ(i) - positionAttribute.getZ(j), 2)
      );
      
      if (dist < tolerance) {
        const normalDiff = Math.sqrt(
          Math.pow(normalAttribute.getX(i) - normalAttribute.getX(j), 2) +
          Math.pow(normalAttribute.getY(i) - normalAttribute.getY(j), 2) +
          Math.pow(normalAttribute.getZ(i) - normalAttribute.getZ(j), 2)
        );
        
        maxNormalDiff = Math.max(maxNormalDiff, normalDiff);
      }
    }
    
    if (maxNormalDiff > 0.5) { // Edge threshold
      edges.add(i);
    }
  }
  
  return edges;
}

// Helper function to remove degenerate faces
function removeDegenerateFaces(geometry: THREE.BufferGeometry, tolerance: number): THREE.BufferGeometry {
  const positionAttribute = geometry.attributes.position;
  const indexAttribute = geometry.index;
  
  if (!positionAttribute || !indexAttribute) {
    return geometry;
  }
  
  const newIndices: number[] = [];
  
  for (let i = 0; i < indexAttribute.count; i += 3) {
    const i1 = indexAttribute.getX(i);
    const i2 = indexAttribute.getX(i + 1);
    const i3 = indexAttribute.getX(i + 2);
    
    // Check if face is degenerate
    const v1 = new THREE.Vector3(
      positionAttribute.getX(i1),
      positionAttribute.getY(i1),
      positionAttribute.getZ(i1)
    );
    
    const v2 = new THREE.Vector3(
      positionAttribute.getX(i2),
      positionAttribute.getY(i2),
      positionAttribute.getZ(i2)
    );
    
    const v3 = new THREE.Vector3(
      positionAttribute.getX(i3),
      positionAttribute.getY(i3),
      positionAttribute.getZ(i3)
    );
    
    const area = calculateTriangleArea(v1, v2, v3);
    
    if (area > tolerance) {
      newIndices.push(i1, i2, i3);
    }
  }
  
  const newGeometry = geometry.clone();
  newGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(newIndices), 1));
  
  return newGeometry;
}

// Helper function to merge duplicate vertices
function mergeDuplicateVertices(geometry: THREE.BufferGeometry, tolerance: number): THREE.BufferGeometry {
  const positionAttribute = geometry.attributes.position;
  
  if (!positionAttribute) {
    return geometry;
  }
  
  const newPositions: number[] = [];
  const newNormals: number[] = [];
  const newColors: number[] = [];
  const vertexMap = new Map<string, number>();
  
  for (let i = 0; i < positionAttribute.count; i++) {
    const x = positionAttribute.getX(i);
    const y = positionAttribute.getY(i);
    const z = positionAttribute.getZ(i);
    
    // Round to tolerance
    const roundedX = Math.round(x / tolerance) * tolerance;
    const roundedY = Math.round(y / tolerance) * tolerance;
    const roundedZ = Math.round(z / tolerance) * tolerance;
    
    const key = `${roundedX},${roundedY},${roundedZ}`;
    
    if (!vertexMap.has(key)) {
      vertexMap.set(key, newPositions.length / 3);
      
      newPositions.push(x, y, z);
      
      // Copy normals if available
      if (geometry.attributes.normal) {
        newNormals.push(
          geometry.attributes.normal.getX(i),
          geometry.attributes.normal.getY(i),
          geometry.attributes.normal.getZ(i)
        );
      }
      
      // Copy colors if available
      if (geometry.attributes.color) {
        newColors.push(
          geometry.attributes.color.getX(i),
          geometry.attributes.color.getY(i),
          geometry.attributes.color.getZ(i),
          geometry.attributes.color.getW ? geometry.attributes.color.getW(i) : 1.0
        );
      }
    }
  }
  
  const newGeometry = new THREE.BufferGeometry();
  newGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(newPositions), 3));
  
  if (newNormals.length > 0) {
    newGeometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(newNormals), 3));
  }
  
  if (newColors.length > 0) {
    newGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(newColors), 4));
  }
  
  return newGeometry;
}

// Helper function to calculate triangle area
function calculateTriangleArea(v1: THREE.Vector3, v2: THREE.Vector3, v3: THREE.Vector3): number {
  const edge1 = v2.clone().sub(v1);
  const edge2 = v3.clone().sub(v1);
  const cross = edge1.cross(edge2);
  return cross.length() * 0.5;
}

// Helper function to convert geometry to points
function geometryToPoints(geometry: THREE.BufferGeometry): PointData[] {
  const points: PointData[] = [];
  const positionAttribute = geometry.attributes.position;
  const normalAttribute = geometry.attributes.normal;
  const colorAttribute = geometry.attributes.color;
  
  if (!positionAttribute) {
    return points;
  }
  
  for (let i = 0; i < positionAttribute.count; i++) {
    const point: PointData = {
      position: {
        x: positionAttribute.getX(i),
        y: positionAttribute.getY(i),
        z: positionAttribute.getZ(i)
      }
    };
    
    // Add normal if available
    if (normalAttribute) {
      point.normal = {
        x: normalAttribute.getX(i),
        y: normalAttribute.getY(i),
        z: normalAttribute.getZ(i)
      };
    }
    
    // Add color if available
    if (colorAttribute) {
      point.color = {
        r: colorAttribute.getX(i),
        g: colorAttribute.getY(i),
        b: colorAttribute.getZ(i),
        a: colorAttribute.getW ? colorAttribute.getW(i) : 1.0
      };
    }
    
    points.push(point);
  }
  
  return points;
}
