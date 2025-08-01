import * as THREE from 'three';
import { GeometryData, GeometryFactory, BUILTIN_ATTRIBUTES, AttributeUtils } from '../types/geometry';

// ===========================
// BLENDER-STYLE FOUNDATION SYSTEM
// ===========================
// This demonstrates the proper separation:
// 1. Core operations (pure functions)
// 2. Node wrappers (thin UI layer)
// 3. Easy extensibility

// ===========================
// CORE OPERATION FUNCTIONS
// ===========================
// These are pure functions that do the actual work
// Each follows the pattern: (input, params) => result

export namespace CoreOperations {
  
  // Primitive operations - create geometry from scratch
  export function createCube(params: {
    width: number;
    height: number; 
    depth: number;
    segments?: { width: number; height: number; depth: number };
  }): GeometryData {
    const { width, height, depth } = params;
    const w = width / 2, h = height / 2, d = depth / 2;
    
    const vertices = [
      // Front face
      { x: -w, y: -h, z: d }, { x: w, y: -h, z: d }, { x: w, y: h, z: d }, { x: -w, y: h, z: d },
      // Back face  
      { x: -w, y: -h, z: -d }, { x: w, y: -h, z: -d }, { x: w, y: h, z: -d }, { x: -w, y: h, z: -d }
    ];
    
    const faces = [
      // Front: 0,1,2 & 0,2,3  Back: 4,6,5 & 4,7,6  Left: 4,0,3 & 4,3,7
      // Right: 1,5,6 & 1,6,2  Top: 3,2,6 & 3,6,7   Bottom: 4,5,1 & 4,1,0
      { vertices: [0, 1, 2] }, { vertices: [0, 2, 3] }, { vertices: [4, 6, 5] }, { vertices: [4, 7, 6] },
      { vertices: [4, 0, 3] }, { vertices: [4, 3, 7] }, { vertices: [1, 5, 6] }, { vertices: [1, 6, 2] },
      { vertices: [3, 2, 6] }, { vertices: [3, 6, 7] }, { vertices: [4, 5, 1] }, { vertices: [4, 1, 0] }
    ];
    
    return GeometryFactory.fromVerticesAndFaces(vertices, faces);
  }
  
  export function createSphere(params: {
    radius: number;
    widthSegments?: number;
    heightSegments?: number;
  }): GeometryData {
    const { radius, widthSegments = 32, heightSegments = 16 } = params;
    const vertices: Array<{ x: number; y: number; z: number }> = [];
    const faces: Array<{ vertices: number[] }> = [];
    
    // Generate sphere vertices
    for (let lat = 0; lat <= heightSegments; lat++) {
      const theta = (lat * Math.PI) / heightSegments;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      
      for (let lon = 0; lon <= widthSegments; lon++) {
        const phi = (lon * 2 * Math.PI) / widthSegments;
        vertices.push({
          x: radius * sinTheta * Math.cos(phi),
          y: radius * cosTheta,
          z: radius * sinTheta * Math.sin(phi)
        });
      }
    }
    
    // Generate faces
    for (let lat = 0; lat < heightSegments; lat++) {
      for (let lon = 0; lon < widthSegments; lon++) {
        const a = lat * (widthSegments + 1) + lon;
        const b = a + widthSegments + 1;
        const c = a + 1;
        const d = b + 1;
        
        if (lat !== 0) faces.push({ vertices: [a, b, c] });
        if (lat !== heightSegments - 1) faces.push({ vertices: [c, b, d] });
      }
    }
    
    return GeometryFactory.fromVerticesAndFaces(vertices, faces);
  }
  
  // Transform operations - modify existing geometry
  export function transformGeometry(
    geometry: GeometryData, 
    params: {
      position: { x: number; y: number; z: number };
      rotation: { x: number; y: number; z: number };
      scale: { x: number; y: number; z: number };
    }
  ): GeometryData {
    // Clone geometry
    const result: GeometryData = {
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
    
    // Transform vertices
    result.vertices = result.vertices.map(vertex => {
      const vec = new THREE.Vector3(vertex.x, vertex.y, vertex.z);
      vec.applyMatrix4(matrix);
      return { x: vec.x, y: vec.y, z: vec.z };
    });
    
    // Update position attribute
    const posAttr = result.attributes.vertex.get(BUILTIN_ATTRIBUTES.POSITION);
    if (posAttr) {
      const positions: number[] = [];
      result.vertices.forEach(v => positions.push(v.x, v.y, v.z));
      posAttr.data = positions;
    }
    
    return result;
  }
  
  // Join operations - combine multiple geometries
  export function joinGeometries(geometries: GeometryData[]): GeometryData {
    if (geometries.length === 0) {
      return GeometryFactory.createEmpty();
    }
    if (geometries.length === 1) {
      return geometries[0];
    }
    
    const result = GeometryFactory.createEmpty();
    let vertexOffset = 0;
    
    geometries.forEach(geom => {
      // Add vertices
      geom.vertices.forEach(vertex => {
        result.vertices.push({ ...vertex });
      });
      
      // Add faces with updated indices
      geom.faces.forEach(face => {
        result.faces.push({
          vertices: face.vertices.map(idx => idx + vertexOffset),
          material: face.material
        });
      });
      
      vertexOffset += geom.vertexCount;
    });
    
    result.vertexCount = result.vertices.length;
    result.faceCount = result.faces.length;
    
    // Update position attribute
    const positions: number[] = [];
    result.vertices.forEach(v => positions.push(v.x, v.y, v.z));
    result.attributes.vertex.set(
      BUILTIN_ATTRIBUTES.POSITION,
      AttributeUtils.createAttribute(BUILTIN_ATTRIBUTES.POSITION, 'vector3', result.vertexCount)
    );
    const posAttr = result.attributes.vertex.get(BUILTIN_ATTRIBUTES.POSITION)!;
    posAttr.data = positions;
    
    return result;
  }
}

// ===========================
// CONVERTER TO THREE.JS
// ===========================
// Bridge between our geometry system and Three.js

export function geometryDataToThreeJS(geometry: GeometryData): THREE.BufferGeometry {
  const threeGeometry = new THREE.BufferGeometry();
  
  // Convert vertices to position array
  const positions: number[] = [];
  geometry.vertices.forEach(vertex => {
    positions.push(vertex.x, vertex.y, vertex.z);
  });
  
  // Convert faces to indices (triangulate)
  const indices: number[] = [];
  geometry.faces.forEach(face => {
    if (face.vertices.length >= 3) {
      // Triangle
      indices.push(face.vertices[0], face.vertices[1], face.vertices[2]);
      
      // If quad, add second triangle
      if (face.vertices.length >= 4) {
        indices.push(face.vertices[0], face.vertices[2], face.vertices[3]);
      }
    }
  });
  
  // Set geometry attributes
  threeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  threeGeometry.setIndex(indices);
  threeGeometry.computeVertexNormals();
  
  return threeGeometry;
}

// ===========================
// OPERATION REGISTRY
// ===========================
// Makes it easy to add new operations

export interface OperationDefinition {
  name: string;
  execute: (...args: any[]) => GeometryData;
  category: 'primitive' | 'transform' | 'modifier' | 'utility';
  description: string;
}

export const OPERATION_REGISTRY = new Map<string, OperationDefinition>([
  ['cube', {
    name: 'Cube',
    execute: CoreOperations.createCube,
    category: 'primitive',
    description: 'Create a cube primitive'
  }],
  ['sphere', {
    name: 'Sphere', 
    execute: CoreOperations.createSphere,
    category: 'primitive',
    description: 'Create a sphere primitive'
  }],
  ['transform', {
    name: 'Transform',
    execute: CoreOperations.transformGeometry,
    category: 'transform',
    description: 'Apply transformations'
  }],
  ['join', {
    name: 'Join',
    execute: CoreOperations.joinGeometries,
    category: 'utility',
    description: 'Combine geometries'
  }]
]);

// ===========================
// EASY EXTENSION SYSTEM
// ===========================

export function registerOperation(id: string, definition: OperationDefinition): void {
  OPERATION_REGISTRY.set(id, definition);
}

export function getOperation(id: string): OperationDefinition | undefined {
  return OPERATION_REGISTRY.get(id);
}

// Example of how easy it is to add new operations:
export function addCustomOperation() {
  registerOperation('custom_pyramid', {
    name: 'Pyramid',
    execute: (params: { baseSize: number; height: number }) => {
      const { baseSize, height } = params;
      const half = baseSize / 2;
      
      const vertices = [
        // Base vertices
        { x: -half, y: 0, z: -half },
        { x: half, y: 0, z: -half },
        { x: half, y: 0, z: half },
        { x: -half, y: 0, z: half },
        // Apex
        { x: 0, y: height, z: 0 }
      ];
      
      const faces = [
        // Base
        { vertices: [0, 1, 2] }, { vertices: [0, 2, 3] },
        // Sides
        { vertices: [0, 4, 1] }, { vertices: [1, 4, 2] },
        { vertices: [2, 4, 3] }, { vertices: [3, 4, 0] }
      ];
      
      return GeometryFactory.fromVerticesAndFaces(vertices, faces);
    },
    category: 'primitive',
    description: 'Create a pyramid primitive'
  });
}

// ===========================
// DEMONSTRATION USAGE
// ===========================

export function demonstrateFoundationalApproach() {
  console.log('🏗️ Blender-Style Foundation System Demo');
  
  // 1. Create geometry using core operations
  const cube = CoreOperations.createCube({ width: 2, height: 2, depth: 2 });
  console.log('✅ Created cube:', cube.vertexCount, 'vertices');
  
  // 2. Transform it using pure functions
  const transformed = CoreOperations.transformGeometry(cube, {
    position: { x: 1, y: 0, z: 0 },
    rotation: { x: 0, y: Math.PI / 4, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  });
  console.log('✅ Transformed cube');
  
  // 3. Create another geometry
  const sphere = CoreOperations.createSphere({ radius: 1 });
  console.log('✅ Created sphere:', sphere.vertexCount, 'vertices');
  
  // 4. Join them together
  const joined = CoreOperations.joinGeometries([transformed, sphere]);
  console.log('✅ Joined geometries:', joined.vertexCount, 'total vertices');
  
  // 5. Convert to Three.js for rendering
  const threeGeometry = geometryDataToThreeJS(joined);
  console.log('✅ Converted to Three.js:', threeGeometry.attributes.position.count, 'vertices');
  
  // 6. Easy extension
  addCustomOperation();
  const customOp = getOperation('custom_pyramid');
  if (customOp) {
    const pyramid = customOp.execute({ baseSize: 2, height: 3 });
    console.log('✅ Created custom pyramid:', pyramid.vertexCount, 'vertices');
  }
  
  console.log('🎉 Foundation system works perfectly!');
  return threeGeometry;
} 