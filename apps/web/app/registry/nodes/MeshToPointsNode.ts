import { NodeDefinition } from '../../types/nodeSystem';
import { CircleDot } from 'lucide-react';
import * as THREE from 'three';

// MESH TO POINTS NODE - Converts mesh geometry to point cloud
export const meshToPointsNodeDefinition: NodeDefinition = {
  type: 'mesh-to-points',
  name: 'Mesh to Points',
  description: 'Converts mesh geometry to point cloud',
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
      description: 'Input mesh geometry to convert'
    },
         {
       id: 'density',
       name: 'Density',
       type: 'number',
       defaultValue: 1.0,
       description: 'Point density multiplier (0.1=sparse, 1.0=normal, 5.0=dense)'
     }
  ],
  outputs: [
    {
      id: 'points',
      name: 'Points',
      type: 'points',
      description: 'Generated point cloud'
    },
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Point cloud as geometry'
    }
  ],
  parameters: [
    {
      id: 'pointMode',
      name: 'Point Mode',
      type: 'select',
      defaultValue: 'vertices',
      options: ['vertices', 'faces', 'surface', 'volume'],
      description: 'How to generate points from mesh'
    },
    {
      id: 'pointSize',
      name: 'Point Size',
      type: 'number',
      defaultValue: 0.1,
      description: 'Size of generated points'
    },
    {
      id: 'includeNormals',
      name: 'Include Normals',
      type: 'boolean',
      defaultValue: true,
      description: 'Include normal vectors in point data'
    },
    {
      id: 'includeColors',
      name: 'Include Colors',
      type: 'boolean',
      defaultValue: false,
      description: 'Include color data in point data'
    },
    {
      id: 'randomize',
      name: 'Randomize',
      type: 'boolean',
      defaultValue: false,
      description: 'Add random offset to points'
    },
    {
      id: 'randomAmount',
      name: 'Random Amount',
      type: 'number',
      defaultValue: 0.01,
      description: 'Amount of random offset'
    },
    {
      id: 'seed',
      name: 'Seed',
      type: 'integer',
      defaultValue: 0,
      description: 'Random seed for consistent results'
    }
  ],
  ui: {
    icon: CircleDot,
    width: 400,
    height: 500
  },
  execute: (inputs, parameters) => {
    const geometry = inputs.geometry;
    const density = inputs.density || 1.0;
    const pointMode = parameters.pointMode || 'vertices';
    const pointSize = parameters.pointSize || 0.1;
    const includeNormals = parameters.includeNormals !== false;
    const includeColors = parameters.includeColors || false;
    const randomize = parameters.randomize || false;
    const randomAmount = parameters.randomAmount || 0.01;
    const seed = parameters.seed || 0;
    
    if (!geometry) {
      return { points: [], geometry: null };
    }
    
         // Generate points from mesh
     const points = generatePointsFromMesh(geometry, {
       mode: pointMode,
       density,
       includeNormals,
       includeColors,
       randomize,
       randomAmount,
       seed
     });
     
     // Debug information
     console.log(`Mesh to Points: Mode=${pointMode}, Density=${density}, Points generated=${points.length}`);
    
    // Create point cloud geometry
    const pointGeometry = createPointCloudGeometry(points, pointSize);
    
    return { 
      points,
      geometry: pointGeometry,
      result: pointGeometry,
      'geometry-out': pointGeometry
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

// Helper function to generate points from mesh
function generatePointsFromMesh(geometry: any, params: {
  mode: string;
  density: number;
  includeNormals: boolean;
  includeColors: boolean;
  randomize: boolean;
  randomAmount: number;
  seed: number;
}): PointData[] {
  const points: PointData[] = [];
  
  // Check if geometry has position attribute
  if (!geometry || !geometry.attributes || !geometry.attributes.position) {
    return points;
  }
  
  const positionAttribute = geometry.attributes.position;
  const normalAttribute = geometry.attributes.normal;
  const colorAttribute = geometry.attributes.color;
  const indexAttribute = geometry.index;
  
  const random = seededRandom(params.seed);
  
  switch (params.mode) {
    case 'vertices':
      // Use all vertices as points, with density control
      const vertexCount = Math.floor(positionAttribute.count * params.density);
      const vertexStep = Math.max(1, Math.floor(positionAttribute.count / vertexCount));
      
      for (let i = 0; i < positionAttribute.count; i += vertexStep) {
        const point = createPointFromVertex(
          positionAttribute, 
          normalAttribute, 
          colorAttribute, 
          i, 
          params
        );
        if (point) {
          points.push(point);
        }
      }
      break;
      
    case 'faces':
      // Use face centers as points, with density control
      if (indexAttribute) {
        const indices = indexAttribute.array;
        const totalFaces = indices.length / 3;
        const faceCount = Math.floor(totalFaces * params.density);
        const faceStep = Math.max(1, Math.floor(totalFaces / faceCount));
        
        for (let i = 0; i < indices.length; i += 3 * faceStep) {
          const v1 = getVertexPosition(positionAttribute, indices[i]);
          const v2 = getVertexPosition(positionAttribute, indices[i + 1]);
          const v3 = getVertexPosition(positionAttribute, indices[i + 2]);
          
          // Calculate face center
          const center = {
            x: (v1.x + v2.x + v3.x) / 3,
            y: (v1.y + v2.y + v3.y) / 3,
            z: (v1.z + v2.z + v3.z) / 3
          };
          
          // Calculate face normal
          const normal = calculateFaceNormal(v1, v2, v3);
          
          const point: PointData = {
            position: center,
            normal: params.includeNormals ? normal : undefined
          };
          
          if (params.randomize) {
            point.position.x += (random() - 0.5) * params.randomAmount;
            point.position.y += (random() - 0.5) * params.randomAmount;
            point.position.z += (random() - 0.5) * params.randomAmount;
          }
          
          points.push(point);
        }
      }
      break;
      
    case 'surface':
      // Generate points on surface using face sampling
      if (indexAttribute) {
        const indices = indexAttribute.array;
        const totalFaces = indices.length / 3;
        const pointsPerFace = Math.max(1, Math.floor(params.density * 5)); // Multiply by 5 for better density control
        
        for (let i = 0; i < indices.length; i += 3) {
          const v1 = getVertexPosition(positionAttribute, indices[i]);
          const v2 = getVertexPosition(positionAttribute, indices[i + 1]);
          const v3 = getVertexPosition(positionAttribute, indices[i + 2]);
          
          // Generate multiple points per face
          for (let j = 0; j < pointsPerFace; j++) {
            const point = generateRandomPointOnFace(v1, v2, v3, random);
            const normal = calculateFaceNormal(v1, v2, v3);
            
            const pointData: PointData = {
              position: point,
              normal: params.includeNormals ? normal : undefined
            };
            
            if (params.randomize) {
              pointData.position.x += (random() - 0.5) * params.randomAmount;
              pointData.position.y += (random() - 0.5) * params.randomAmount;
              pointData.position.z += (random() - 0.5) * params.randomAmount;
            }
            
            points.push(pointData);
          }
        }
      }
      break;
      
    case 'volume':
      // Generate points within the volume (simplified - uses bounding box)
      const boundingBox = calculateBoundingBox(positionAttribute);
      const volume = (boundingBox.max.x - boundingBox.min.x) * 
                    (boundingBox.max.y - boundingBox.min.y) * 
                    (boundingBox.max.z - boundingBox.min.z);
      
      const totalPoints = Math.floor(volume * params.density * 10000); // Increased multiplier for better density control
      
      for (let i = 0; i < totalPoints; i++) {
        const point = {
          x: boundingBox.min.x + random() * (boundingBox.max.x - boundingBox.min.x),
          y: boundingBox.min.y + random() * (boundingBox.max.y - boundingBox.min.y),
          z: boundingBox.min.z + random() * (boundingBox.max.z - boundingBox.min.z)
        };
        
        // Simple check if point is inside (this is a simplified version)
        // In a real implementation, you'd want more sophisticated inside/outside testing
        const pointData: PointData = {
          position: point
        };
        
        points.push(pointData);
      }
      break;
  }
  
  return points;
}

// Helper function to create point from vertex
function createPointFromVertex(
  positionAttribute: THREE.BufferAttribute,
  normalAttribute: THREE.BufferAttribute | undefined,
  colorAttribute: THREE.BufferAttribute | undefined,
  index: number,
  params: any
): PointData | null {
  const position = getVertexPosition(positionAttribute, index);
  
  const point: PointData = {
    position: { ...position }
  };
  
  // Add normal if available and requested
  if (params.includeNormals && normalAttribute) {
    point.normal = getVertexNormal(normalAttribute, index);
  }
  
  // Add color if available and requested
  if (params.includeColors && colorAttribute) {
    point.color = getVertexColor(colorAttribute, index);
  }
  
  // Add random offset if requested
  if (params.randomize) {
    const random = seededRandom(params.seed + index);
    point.position.x += (random() - 0.5) * params.randomAmount;
    point.position.y += (random() - 0.5) * params.randomAmount;
    point.position.z += (random() - 0.5) * params.randomAmount;
  }
  
  return point;
}

// Helper function to get vertex position
function getVertexPosition(attribute: THREE.BufferAttribute, index: number): { x: number; y: number; z: number } {
  return {
    x: attribute.getX(index),
    y: attribute.getY(index),
    z: attribute.getZ(index)
  };
}

// Helper function to get vertex normal
function getVertexNormal(attribute: THREE.BufferAttribute, index: number): { x: number; y: number; z: number } {
  return {
    x: attribute.getX(index),
    y: attribute.getY(index),
    z: attribute.getZ(index)
  };
}

// Helper function to get vertex color
function getVertexColor(attribute: THREE.BufferAttribute, index: number): { r: number; g: number; b: number; a: number } {
  return {
    r: attribute.getX(index),
    g: attribute.getY(index),
    b: attribute.getZ(index),
    a: attribute.getW ? attribute.getW(index) : 1.0
  };
}

// Helper function to calculate face normal
function calculateFaceNormal(v1: { x: number; y: number; z: number }, 
                           v2: { x: number; y: number; z: number }, 
                           v3: { x: number; y: number; z: number }): { x: number; y: number; z: number } {
  const edge1 = {
    x: v2.x - v1.x,
    y: v2.y - v1.y,
    z: v2.z - v1.z
  };
  
  const edge2 = {
    x: v3.x - v1.x,
    y: v3.y - v1.y,
    z: v3.z - v1.z
  };
  
  const normal = {
    x: edge1.y * edge2.z - edge1.z * edge2.y,
    y: edge1.z * edge2.x - edge1.x * edge2.z,
    z: edge1.x * edge2.y - edge1.y * edge2.x
  };
  
  // Normalize
  const length = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);
  if (length > 0) {
    normal.x /= length;
    normal.y /= length;
    normal.z /= length;
  }
  
  return normal;
}

// Helper function to generate random point on face
function generateRandomPointOnFace(v1: { x: number; y: number; z: number },
                                 v2: { x: number; y: number; z: number },
                                 v3: { x: number; y: number; z: number },
                                 random: () => number): { x: number; y: number; z: number } {
  // Barycentric coordinates
  const r1 = random();
  const r2 = random();
  
  const sqrtR1 = Math.sqrt(r1);
  const u = 1 - sqrtR1;
  const v = r2 * sqrtR1;
  const w = 1 - u - v;
  
  return {
    x: u * v1.x + v * v2.x + w * v3.x,
    y: u * v1.y + v * v2.y + w * v3.y,
    z: u * v1.z + v * v2.z + w * v3.z
  };
}

// Helper function to calculate bounding box
function calculateBoundingBox(positionAttribute: THREE.BufferAttribute): {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
} {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  
  for (let i = 0; i < positionAttribute.count; i++) {
    const x = positionAttribute.getX(i);
    const y = positionAttribute.getY(i);
    const z = positionAttribute.getZ(i);
    
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    minZ = Math.min(minZ, z);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    maxZ = Math.max(maxZ, z);
  }
  
  return {
    min: { x: minX, y: minY, z: minZ },
    max: { x: maxX, y: maxY, z: maxZ }
  };
}

// Helper function to create point cloud geometry
function createPointCloudGeometry(points: PointData[], pointSize: number): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  
  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const sizes: number[] = [];
  
  for (const point of points) {
    // Position
    positions.push(point.position.x, point.position.y, point.position.z);
    
    // Normal
    if (point.normal) {
      normals.push(point.normal.x, point.normal.y, point.normal.z);
    } else {
      normals.push(0, 1, 0); // Default normal
    }
    
    // Color
    if (point.color) {
      colors.push(point.color.r, point.color.g, point.color.b, point.color.a);
    } else {
      colors.push(1, 1, 1, 1); // Default white
    }
    
    // Size
    sizes.push(point.size || pointSize);
  }
  
  // Set attributes
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 4));
  geometry.setAttribute('size', new THREE.BufferAttribute(new Float32Array(sizes), 1));
  
  return geometry;
}
