import * as THREE from 'three';
import { 
  GeometryData, 
  GeometryOperation, 
  PrimitiveOperation,
  GeometryOperationResult, 
  GeometryOperationContext,
  PrimitiveParams,
  PrimitiveType,
  TransformParams,
  AttributeUtils,
  GeometryFactory,
  BUILTIN_ATTRIBUTES
} from '../types/geometry';

// ===========================
// CORE GEOMETRY OPERATIONS
// ===========================
// These are the foundation functions that ALL nodes use.
// Each operation is pure: (input, params, context) => result
// This makes the system highly modular and testable.

// ===========================
// PRIMITIVE OPERATIONS
// ===========================

export const primitiveOperations = {
  cube: (
    input: null,
    params: PrimitiveParams['cube'],
    context?: GeometryOperationContext
  ): GeometryOperationResult => {
    try {
      const { width, height, depth, widthSegments = 1, heightSegments = 1, depthSegments = 1 } = params;
      
      const vertices: Array<{ x: number; y: number; z: number }> = [];
      const faces: Array<{ vertices: number[] }> = [];
      
      // Generate cube vertices
      const w = width / 2;
      const h = height / 2; 
      const d = depth / 2;
      
      // Simple cube (8 vertices, 12 triangles)
      // Front face
      vertices.push({ x: -w, y: -h, z: d }); // 0
      vertices.push({ x: w, y: -h, z: d });  // 1
      vertices.push({ x: w, y: h, z: d });   // 2
      vertices.push({ x: -w, y: h, z: d });  // 3
      
      // Back face
      vertices.push({ x: -w, y: -h, z: -d }); // 4
      vertices.push({ x: w, y: -h, z: -d });  // 5
      vertices.push({ x: w, y: h, z: -d });   // 6
      vertices.push({ x: -w, y: h, z: -d });  // 7
      
      // Cube faces (12 triangles)
      const faceIndices = [
        // Front
        [0, 1, 2], [0, 2, 3],
        // Back  
        [4, 6, 5], [4, 7, 6],
        // Left
        [4, 0, 3], [4, 3, 7],
        // Right
        [1, 5, 6], [1, 6, 2],
        // Top
        [3, 2, 6], [3, 6, 7],
        // Bottom
        [4, 5, 1], [4, 1, 0]
      ];
      
      faceIndices.forEach(indices => {
        faces.push({ vertices: indices });
      });
      
      const geometry = GeometryFactory.fromVerticesAndFaces(vertices, faces);
      
      return {
        success: true,
        geometry
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create cube: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  },

  sphere: (
    input: null,
    params: PrimitiveParams['sphere'],
    context?: GeometryOperationContext
  ): GeometryOperationResult => {
    try {
      const { radius, widthSegments = 32, heightSegments = 16 } = params;
      
      const vertices: Array<{ x: number; y: number; z: number }> = [];
      const faces: Array<{ vertices: number[] }> = [];
      
      // Generate sphere vertices using spherical coordinates
      for (let lat = 0; lat <= heightSegments; lat++) {
        const theta = (lat * Math.PI) / heightSegments;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
        
        for (let lon = 0; lon <= widthSegments; lon++) {
          const phi = (lon * 2 * Math.PI) / widthSegments;
          const sinPhi = Math.sin(phi);
          const cosPhi = Math.cos(phi);
          
          vertices.push({
            x: radius * sinTheta * cosPhi,
            y: radius * cosTheta,
            z: radius * sinTheta * sinPhi
          });
        }
      }
      
      // Generate sphere faces
      for (let lat = 0; lat < heightSegments; lat++) {
        for (let lon = 0; lon < widthSegments; lon++) {
          const a = lat * (widthSegments + 1) + lon;
          const b = a + widthSegments + 1;
          const c = a + 1;
          const d = b + 1;
          
          if (lat !== 0) {
            faces.push({ vertices: [a, b, c] });
          }
          if (lat !== heightSegments - 1) {
            faces.push({ vertices: [c, b, d] });
          }
        }
      }
      
      const geometry = GeometryFactory.fromVerticesAndFaces(vertices, faces);
      
      return {
        success: true,
        geometry
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create sphere: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// ===========================
// TRANSFORM OPERATIONS  
// ===========================

export const transformOperation: GeometryOperation<TransformParams> = (
  input: GeometryData | GeometryData[] | null,
  params: TransformParams,
  context?: GeometryOperationContext
): GeometryOperationResult => {
  const geometry = Array.isArray(input) ? input[0] : input;
  if (!geometry) {
    return {
      success: false,
      error: 'Transform operation requires input geometry'
    };
  }

  try {
    // Clone the input geometry
    const clonedGeometry: GeometryData = {
      ...geometry,
      vertices: [...geometry.vertices],
      faces: [...geometry.faces],
      attributes: {
        vertex: new Map(geometry.attributes.vertex),
        edge: new Map(geometry.attributes.edge), 
        face: new Map(geometry.attributes.face),
        corner: new Map(geometry.attributes.corner)
      }
    };

    // Create transformation matrix
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3(params.position.x, params.position.y, params.position.z);
    const rotation = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(params.rotation.x, params.rotation.y, params.rotation.z)
    );
    const scale = new THREE.Vector3(params.scale.x, params.scale.y, params.scale.z);
    
    matrix.compose(position, rotation, scale);

    // Transform all vertices
    clonedGeometry.vertices = clonedGeometry.vertices.map(vertex => {
      const vec = new THREE.Vector3(vertex.x, vertex.y, vertex.z);
      vec.applyMatrix4(matrix);
      return { x: vec.x, y: vec.y, z: vec.z };
    });

    // Update position attribute if it exists
    const positionAttr = clonedGeometry.attributes.vertex.get(BUILTIN_ATTRIBUTES.POSITION);
    if (positionAttr) {
      const newPositions: number[] = [];
      clonedGeometry.vertices.forEach(vertex => {
        newPositions.push(vertex.x, vertex.y, vertex.z);
      });
      positionAttr.data = newPositions;
    }

    return {
      success: true,
      geometry: clonedGeometry
    };
  } catch (error) {
    return {
      success: false,
      error: `Transform operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// ===========================
// POINT DISTRIBUTION OPERATIONS
// ===========================

export interface DistributePointsParams {
  distributeMethod: 'random' | 'poisson' | 'grid';
  density: number;
  seed: number;
  distanceMin?: number;
}

export const distributePointsOperation: GeometryOperation<DistributePointsParams> = (
  input: GeometryData | GeometryData[] | null,
  params: DistributePointsParams,
  context?: GeometryOperationContext
): GeometryOperationResult => {
  if (!input) {
    return {
      success: false,
      error: 'Distribute Points operation requires input geometry'
    };
  }

  // Handle array input - use the first geometry for point distribution
  const geometry = Array.isArray(input) ? input[0] : input;
  if (!geometry) {
    return {
      success: false,
      error: 'Distribute Points operation requires valid input geometry'
    };
  }

  try {
    const { density, seed, distributeMethod } = params;
    const points: THREE.Vector3[] = [];
    
    // Simple seeded random number generator
    class SeededRandom {
      private seed: number;
      constructor(seed: number) { this.seed = seed; }
      random(): number {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
      }
    }
    
    const rng = new SeededRandom(seed);
    const numPoints = Math.floor(density);
    
    // Distribute points on faces
    for (let i = 0; i < numPoints; i++) {
      if (geometry.faces.length === 0) break;
      
      // Pick random face
      const faceIndex = Math.floor(rng.random() * geometry.faces.length);
      const face = geometry.faces[faceIndex];
      
      if (face.vertices.length >= 3) {
        // Get triangle vertices (use first 3 vertices of face)
        const v0 = geometry.vertices[face.vertices[0]];
        const v1 = geometry.vertices[face.vertices[1]]; 
        const v2 = geometry.vertices[face.vertices[2]];
        
        // Random point on triangle using barycentric coordinates
        const r1 = rng.random();
        const r2 = rng.random();
        const sqrt_r1 = Math.sqrt(r1);
        const u = 1 - sqrt_r1;
        const v = r2 * sqrt_r1;
        const w = 1 - u - v;
        
        const point = new THREE.Vector3(
          u * v0.x + v * v1.x + w * v2.x,
          u * v0.y + v * v1.y + w * v2.y,
          u * v0.z + v * v1.z + w * v2.z
        );
        
        points.push(point);
      }
    }
    
    // Create point cloud geometry
    const pointGeometry = GeometryFactory.createEmpty();
    points.forEach(point => {
      pointGeometry.vertices.push({ x: point.x, y: point.y, z: point.z });
    });
    pointGeometry.vertexCount = points.length;
    
    // Add position attribute
    const positions: number[] = [];
    points.forEach(point => {
      positions.push(point.x, point.y, point.z);
    });
    
    pointGeometry.attributes.vertex.set(
      BUILTIN_ATTRIBUTES.POSITION,
      AttributeUtils.createAttribute(BUILTIN_ATTRIBUTES.POSITION, 'vector3', points.length)
    );
    
    const posAttr = pointGeometry.attributes.vertex.get(BUILTIN_ATTRIBUTES.POSITION)!;
    posAttr.data = positions;

    return {
      success: true,
      geometry: pointGeometry
    };
  } catch (error) {
    return {
      success: false,
      error: `Distribute Points operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// ===========================
// UTILITY OPERATIONS
// ===========================

export const joinOperation: GeometryOperation<{ operation: 'merge' | 'instance' | 'array' }> = (
  input: GeometryData | GeometryData[] | null,
  params: { operation: 'merge' | 'instance' | 'array' },
  context?: GeometryOperationContext
): GeometryOperationResult => {
  const geometries = Array.isArray(input) ? input : (input ? [input] : []);
  
  if (geometries.length === 0) {
    return {
      success: false,
      error: 'Join operation requires at least one input geometry'
    };
  }

  try {
    if (geometries.length === 1) {
      return {
        success: true,
        geometry: geometries[0]
      };
    }

    // Simple merge - combine all vertices and faces
    const mergedGeometry = GeometryFactory.createEmpty();
    let vertexOffset = 0;

    geometries.forEach(geom => {
      // Add vertices
      geom.vertices.forEach(vertex => {
        mergedGeometry.vertices.push({ ...vertex });
      });

      // Add faces with updated indices
      geom.faces.forEach(face => {
        const newFace = {
          vertices: face.vertices.map(idx => idx + vertexOffset),
          material: face.material
        };
        mergedGeometry.faces.push(newFace);
      });

      vertexOffset += geom.vertexCount;
    });

    mergedGeometry.vertexCount = mergedGeometry.vertices.length;
    mergedGeometry.faceCount = mergedGeometry.faces.length;

    // Update position attribute
    const positions: number[] = [];
    mergedGeometry.vertices.forEach(vertex => {
      positions.push(vertex.x, vertex.y, vertex.z);
    });

    mergedGeometry.attributes.vertex.set(
      BUILTIN_ATTRIBUTES.POSITION,
      AttributeUtils.createAttribute(BUILTIN_ATTRIBUTES.POSITION, 'vector3', mergedGeometry.vertexCount)
    );

    const posAttr = mergedGeometry.attributes.vertex.get(BUILTIN_ATTRIBUTES.POSITION)!;
    posAttr.data = positions;

    return {
      success: true,
      geometry: mergedGeometry
    };
  } catch (error) {
    return {
      success: false,
      error: `Join operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// ===========================
// REGISTRY FOR EASY EXTENSION
// ===========================

export interface OperationDefinition {
  name: string;
  operation: GeometryOperation<any> | PrimitiveOperation<any>;
  category: 'primitive' | 'transform' | 'modifier' | 'utility' | 'custom';
  description: string;
  ParameterTypes: ('geometry' | 'points' | 'number' | 'vector')[];
  outputTypes: ('geometry' | 'points' | 'number' | 'vector')[];
}

// Operation registry - makes it easy to add new operations
export const GEOMETRY_OPERATIONS = new Map<string, OperationDefinition>([
  ['primitive_cube', {
    name: 'Cube',
    operation: primitiveOperations.cube,
    category: 'primitive',
    description: 'Creates a cube primitive',
    ParameterTypes: [],
    outputTypes: ['geometry']
  }],
  ['primitive_sphere', {
    name: 'Sphere', 
    operation: primitiveOperations.sphere,
    category: 'primitive',
    description: 'Creates a sphere primitive',
    ParameterTypes: [],
    outputTypes: ['geometry']
  }],
  ['transform', {
    name: 'Transform',
    operation: transformOperation,
    category: 'transform', 
    description: 'Apply position, rotation, and scale transforms',
    ParameterTypes: ['geometry'],
    outputTypes: ['geometry']
  }],
  ['distribute_points', {
    name: 'Distribute Points',
    operation: distributePointsOperation,
    category: 'modifier',
    description: 'Distribute points on geometry surface',
    ParameterTypes: ['geometry'],
    outputTypes: ['points']
  }],
  ['join', {
    name: 'Join',
    operation: joinOperation,
    category: 'utility',
    description: 'Combine multiple geometries',
    ParameterTypes: ['geometry'],
    outputTypes: ['geometry']
  }]
]);

// Helper to get operation by name
export function getOperation(name: string): OperationDefinition | undefined {
  return GEOMETRY_OPERATIONS.get(name);
}

// Helper to register new operation
export function registerOperation(name: string, definition: OperationDefinition): void {
  GEOMETRY_OPERATIONS.set(name, definition);
} 