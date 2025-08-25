import { NodeDefinition } from '../../types/nodeSystem';
import { Network } from 'lucide-react';
import * as THREE from 'three';

// POINTS TO MESH NODE - Converts point cloud to mesh geometry
export const pointsToMeshNodeDefinition: NodeDefinition = {
  type: 'points-to-mesh',
  name: 'Points to Mesh',
  description: 'Converts point cloud to mesh geometry',
  category: 'modifiers',
  color: {
    primary: '#8b5cf6',
    secondary: '#7c3aed'
  },

  inputs: [
    {
      id: 'points',
      name: 'Points',
      type: 'points',
      required: true,
      description: 'Input point cloud to convert'
    },
    {
      id: 'radius',
      name: 'Radius',
      type: 'number',
      defaultValue: 0.1,
      description: 'Radius for sphere/sphere-based meshes'
    }
  ],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Generated mesh geometry'
    }
  ],
  parameters: [
    {
      id: 'meshType',
      name: 'Mesh Type',
      type: 'select',
      defaultValue: 'spheres',
      options: ['spheres', 'cubes', 'icospheres', 'convex_hull', 'alpha_shape', 'delaunay'],
      description: 'Type of mesh to generate from points'
    },
    {
      id: 'sphereSegments',
      name: 'Sphere Segments',
      type: 'integer',
      defaultValue: 8,
      description: 'Number of segments for sphere meshes'
    },
    {
      id: 'cubeSize',
      name: 'Cube Size',
      type: 'number',
      defaultValue: 0.1,
      description: 'Size of cube meshes'
    },
    {
      id: 'mergeGeometry',
      name: 'Merge Geometry',
      type: 'boolean',
      defaultValue: true,
      description: 'Merge all meshes into single geometry'
    },
    {
      id: 'usePointSize',
      name: 'Use Point Size',
      type: 'boolean',
      defaultValue: false,
      description: 'Use point size data for mesh scaling'
    },
    {
      id: 'usePointColor',
      name: 'Use Point Color',
      type: 'boolean',
      defaultValue: false,
      description: 'Use point color data for mesh material'
    },
    {
      id: 'simplify',
      name: 'Simplify',
      type: 'boolean',
      defaultValue: false,
      description: 'Simplify generated geometry'
    },
    {
      id: 'simplifyRatio',
      name: 'Simplify Ratio',
      type: 'number',
      defaultValue: 0.5,
      description: 'Ratio of faces to keep (0.1=10%, 1.0=100%)'
    }
  ],
  ui: {
    icon: Network,
    width: 400,
    height: 550
  },
  execute: (inputs, parameters) => {
    const points = inputs.points || [];
    const radius = inputs.radius || 0.1;
    const meshType = parameters.meshType || 'spheres';
    const sphereSegments = parameters.sphereSegments || 8;
    const cubeSize = parameters.cubeSize || 0.1;
    const mergeGeometry = parameters.mergeGeometry !== false;
    const usePointSize = parameters.usePointSize || false;
    const usePointColor = parameters.usePointColor || false;
    const simplify = parameters.simplify || false;
    const simplifyRatio = parameters.simplifyRatio || 0.5;
    
    if (!points || points.length === 0) {
      return { geometry: null };
    }
    
    // Generate mesh from points
    const meshGeometry = generateMeshFromPoints(points, {
      type: meshType,
      radius,
      sphereSegments,
      cubeSize,
      mergeGeometry,
      usePointSize,
      usePointColor,
      simplify,
      simplifyRatio
    });
    
    // Debug information
    console.log(`Points to Mesh: Type=${meshType}, Points=${points.length}, Geometry generated`);
    
    return { 
      geometry: meshGeometry,
      result: meshGeometry,
      'geometry-out': meshGeometry
    };
  }
};

// Point data structure
interface PointData {
  position: { x: number; y: number; z: number };
  normal?: { x: number; y: number; z: number };
  color?: { r: number; g: number; b: number; a: number };
  size?: number;
}

// Helper function to generate mesh from points
function generateMeshFromPoints(points: PointData[], params: {
  type: string;
  radius: number;
  sphereSegments: number;
  cubeSize: number;
  mergeGeometry: boolean;
  usePointSize: boolean;
  usePointColor: boolean;
  simplify: boolean;
  simplifyRatio: number;
}): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = [];
  
  switch (params.type) {
    case 'spheres':
      // Generate sphere meshes at each point
      for (const point of points) {
        const sphereGeometry = new THREE.SphereGeometry(
          params.usePointSize && point.size ? point.size : params.radius,
          params.sphereSegments,
          params.sphereSegments
        );
        
        // Apply position transformation
        const matrix = new THREE.Matrix4();
        matrix.setPosition(point.position.x, point.position.y, point.position.z);
        sphereGeometry.applyMatrix4(matrix);
        
        geometries.push(sphereGeometry);
      }
      break;
      
    case 'cubes':
      // Generate cube meshes at each point
      for (const point of points) {
        const size = params.usePointSize && point.size ? point.size : params.cubeSize;
        const cubeGeometry = new THREE.BoxGeometry(size, size, size);
        
        // Apply position transformation
        const matrix = new THREE.Matrix4();
        matrix.setPosition(point.position.x, point.position.y, point.position.z);
        cubeGeometry.applyMatrix4(matrix);
        
        geometries.push(cubeGeometry);
      }
      break;
      
    case 'icospheres':
      // Generate icosphere meshes at each point
      for (const point of points) {
        const icosphereGeometry = new THREE.IcosahedronGeometry(
          params.usePointSize && point.size ? point.size : params.radius,
          Math.max(0, params.sphereSegments - 4) // Adjust detail level
        );
        
        // Apply position transformation
        const matrix = new THREE.Matrix4();
        matrix.setPosition(point.position.x, point.position.y, point.position.z);
        icosphereGeometry.applyMatrix4(matrix);
        
        geometries.push(icosphereGeometry);
      }
      break;
      
    case 'convex_hull':
      // Generate convex hull from points
      const convexHullGeometry = generateConvexHull(points);
      if (convexHullGeometry) {
        geometries.push(convexHullGeometry);
      }
      break;
      
    case 'alpha_shape':
      // Generate alpha shape from points
      const alphaShapeGeometry = generateAlphaShape(points, params.radius);
      if (alphaShapeGeometry) {
        geometries.push(alphaShapeGeometry);
      }
      break;
      
    case 'delaunay':
      // Generate Delaunay triangulation from points
      const delaunayGeometry = generateDelaunayTriangulation(points);
      if (delaunayGeometry) {
        geometries.push(delaunayGeometry);
      }
      break;
  }
  
  // Merge geometries if requested
  if (params.mergeGeometry && geometries.length > 1) {
    const mergedGeometry = mergeGeometries(geometries);
    
    // Simplify if requested
    if (params.simplify) {
      return simplifyGeometry(mergedGeometry, params.simplifyRatio);
    }
    
    return mergedGeometry;
  } else if (geometries.length === 1) {
    // Single geometry
    if (params.simplify) {
      return simplifyGeometry(geometries[0], params.simplifyRatio);
    }
    return geometries[0];
  } else {
    // Return empty geometry if no geometries were created
    return new THREE.BufferGeometry();
  }
}

// Helper function to generate convex hull
function generateConvexHull(points: PointData[]): THREE.BufferGeometry | null {
  if (points.length < 4) {
    return null; // Need at least 4 points for 3D convex hull
  }
  
  // Convert points to array format for convex hull algorithm
  const pointArray = points.map(p => [p.position.x, p.position.y, p.position.z]);
  
  // Simple convex hull implementation (Graham scan for 3D)
  const hull = computeConvexHull3D(pointArray);
  
  if (hull.length < 4) {
    return null;
  }
  
  // Create geometry from hull faces
  const geometry = new THREE.BufferGeometry();
  const positions: number[] = [];
  const indices: number[] = [];
  
  // For simplicity, create a triangulated surface
  // In a real implementation, you'd want to properly triangulate the convex hull
  for (let i = 0; i < hull.length - 2; i++) {
    const v0 = hull[0];
    const v1 = hull[i + 1];
    const v2 = hull[i + 2];
    
    positions.push(v0[0], v0[1], v0[2]);
    positions.push(v1[0], v1[1], v1[2]);
    positions.push(v2[0], v2[1], v2[2]);
    
    const baseIndex = i * 3;
    indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
  geometry.computeVertexNormals();
  
  return geometry;
}

// Simple 3D convex hull implementation
function computeConvexHull3D(points: number[][]): number[][] {
  if (points.length < 4) {
    return points;
  }
  
  // Find the centroid
  const centroid = [0, 0, 0];
  for (const point of points) {
    centroid[0] += point[0];
    centroid[1] += point[1];
    centroid[2] += point[2];
  }
  centroid[0] /= points.length;
  centroid[1] /= points.length;
  centroid[2] /= points.length;
  
  // Sort points by distance from centroid
  const sortedPoints = points.sort((a, b) => {
    const distA = Math.sqrt((a[0] - centroid[0])**2 + (a[1] - centroid[1])**2 + (a[2] - centroid[2])**2);
    const distB = Math.sqrt((b[0] - centroid[0])**2 + (b[1] - centroid[1])**2 + (b[2] - centroid[2])**2);
    return distB - distA; // Furthest first
  });
  
  // Take the first few points as a simple approximation
  // In a real implementation, you'd want a proper 3D convex hull algorithm
  return sortedPoints.slice(0, Math.min(8, sortedPoints.length));
}

// Helper function to generate alpha shape
function generateAlphaShape(points: PointData[], alpha: number): THREE.BufferGeometry | null {
  if (points.length < 3) {
    return null;
  }
  
  // Simple alpha shape approximation
  // In a real implementation, you'd want a proper alpha shape algorithm
  const geometry = new THREE.BufferGeometry();
  const positions: number[] = [];
  const indices: number[] = [];
  
  // Create triangles between nearby points
  let index = 0;
  for (let i = 0; i < points.length - 2; i++) {
    for (let j = i + 1; j < points.length - 1; j++) {
      for (let k = j + 1; k < points.length; k++) {
        const p1 = points[i].position;
        const p2 = points[j].position;
        const p3 = points[k].position;
        
        // Check if points are within alpha distance
        const dist12 = Math.sqrt((p2.x - p1.x)**2 + (p2.y - p1.y)**2 + (p2.z - p1.z)**2);
        const dist23 = Math.sqrt((p3.x - p2.x)**2 + (p3.y - p2.y)**2 + (p3.z - p2.z)**2);
        const dist31 = Math.sqrt((p1.x - p3.x)**2 + (p1.y - p3.y)**2 + (p1.z - p3.z)**2);
        
        if (dist12 <= alpha * 2 && dist23 <= alpha * 2 && dist31 <= alpha * 2) {
          positions.push(p1.x, p1.y, p1.z);
          positions.push(p2.x, p2.y, p2.z);
          positions.push(p3.x, p3.y, p3.z);
          
          indices.push(index, index + 1, index + 2);
          index += 3;
        }
      }
    }
  }
  
  if (positions.length === 0) {
    return null;
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
  geometry.computeVertexNormals();
  
  return geometry;
}

// Helper function to generate Delaunay triangulation
function generateDelaunayTriangulation(points: PointData[]): THREE.BufferGeometry | null {
  if (points.length < 3) {
    return null;
  }
  
  // Simple 2D projection triangulation
  // In a real implementation, you'd want a proper 3D Delaunay triangulation
  const geometry = new THREE.BufferGeometry();
  const positions: number[] = [];
  const indices: number[] = [];
  
  // Project points to 2D (using XY plane)
  const projectedPoints = points.map((p, i) => ({
    x: p.position.x,
    y: p.position.y,
    z: p.position.z,
    index: i
  }));
  
  // Simple triangulation: connect each point to its nearest neighbors
  let index = 0;
  for (let i = 0; i < projectedPoints.length - 2; i++) {
    const p1 = projectedPoints[i];
    const p2 = projectedPoints[i + 1];
    const p3 = projectedPoints[i + 2];
    
    positions.push(p1.x, p1.y, p1.z);
    positions.push(p2.x, p2.y, p2.z);
    positions.push(p3.x, p3.y, p3.z);
    
    indices.push(index, index + 1, index + 2);
    index += 3;
  }
  
  if (positions.length === 0) {
    return null;
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
  geometry.computeVertexNormals();
  
  return geometry;
}

// Helper function to merge geometries
function mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  if (geometries.length === 0) {
    return new THREE.BufferGeometry();
  }
  
  if (geometries.length === 1) {
    return geometries[0];
  }
  
  // Use THREE.js BufferGeometryUtils if available, otherwise manual merge
  const mergedGeometry = new THREE.BufferGeometry();
  const allPositions: number[] = [];
  const allIndices: number[] = [];
  let vertexOffset = 0;
  
  for (const geometry of geometries) {
    const positions = geometry.attributes.position;
    const indices = geometry.index;
    
    if (!positions) continue;
    
    // Add positions
    for (let i = 0; i < positions.count; i++) {
      allPositions.push(
        positions.getX(i),
        positions.getY(i),
        positions.getZ(i)
      );
    }
    
    // Add indices with offset
    if (indices) {
      for (let i = 0; i < indices.count; i++) {
        allIndices.push(indices.getX(i) + vertexOffset);
      }
    }
    
    vertexOffset += positions.count;
  }
  
  mergedGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(allPositions), 3));
  
  if (allIndices.length > 0) {
    mergedGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(allIndices), 1));
  }
  
  mergedGeometry.computeVertexNormals();
  
  return mergedGeometry;
}

// Helper function to simplify geometry
function simplifyGeometry(geometry: THREE.BufferGeometry, ratio: number): THREE.BufferGeometry {
  // Simple simplification by removing vertices
  // In a real implementation, you'd want to use a proper simplification algorithm
  
  const positions = geometry.attributes.position;
  const indices = geometry.index;
  
  if (!positions) {
    return geometry;
  }
  
  const targetVertexCount = Math.floor(positions.count * ratio);
  const step = Math.max(1, Math.floor(positions.count / targetVertexCount));
  
  const simplifiedGeometry = new THREE.BufferGeometry();
  const newPositions: number[] = [];
  const newIndices: number[] = [];
  
  // Sample vertices
  for (let i = 0; i < positions.count; i += step) {
    newPositions.push(
      positions.getX(i),
      positions.getY(i),
      positions.getZ(i)
    );
  }
  
  // Create simple triangle strips
  for (let i = 0; i < newPositions.length - 2; i += 3) {
    newIndices.push(i, i + 1, i + 2);
  }
  
  simplifiedGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(newPositions), 3));
  
  if (newIndices.length > 0) {
    simplifiedGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(newIndices), 1));
  }
  
  simplifiedGeometry.computeVertexNormals();
  
  return simplifiedGeometry;
}
