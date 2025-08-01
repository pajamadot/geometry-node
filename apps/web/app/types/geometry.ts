import * as THREE from 'three';

// Blender-inspired unified geometry data structure
export interface GeometryData {
  // Core mesh data
  vertices: Array<{ x: number; y: number; z: number }>;
  edges?: Array<{ a: number; b: number }>;
  faces: Array<{ vertices: number[]; material?: number }>;
  
  // Attribute system - the core of Blender's power
  attributes: {
    // Per-vertex attributes
    vertex: Map<string, AttributeData>;
    // Per-edge attributes  
    edge: Map<string, AttributeData>;
    // Per-face attributes
    face: Map<string, AttributeData>;
    // Per-corner attributes (face-vertex combinations)
    corner: Map<string, AttributeData>;
  };
  
  // Metadata
  bounds?: { min: THREE.Vector3; max: THREE.Vector3 };
  vertexCount: number;
  faceCount: number;
}

// Attribute data types - supports various data formats
export interface AttributeData {
  name: string;
  type: 'float' | 'int' | 'bool' | 'vector2' | 'vector3' | 'vector4' | 'color';
  data: number[] | boolean[];
  default?: number | boolean | number[];
}

// Operation context - passed to all geometry operations
export interface GeometryOperationContext {
  time?: number;
  frameRate?: number;
  seed?: number;
  [key: string]: any;
}

// Operation result - consistent return type for all operations
export interface GeometryOperationResult {
  success: boolean;
  geometry?: GeometryData;
  error?: string;
  warnings?: string[];
}

// Core operation function signature - ALL geometry operations follow this
export type GeometryOperation<TParams = any> = (
  input: GeometryData | GeometryData[] | null,
  params: TParams,
  context?: GeometryOperationContext
) => GeometryOperationResult;

// Primitive operation function signature - for operations that generate geometry from scratch
export type PrimitiveOperation<TParams = any> = (
  input: null,
  params: TParams,
  context?: GeometryOperationContext
) => GeometryOperationResult;

// Built-in attribute names (Blender standards)
export const BUILTIN_ATTRIBUTES = {
  POSITION: 'position',
  NORMAL: 'normal', 
  UV: 'uv',
  COLOR: 'color',
  MATERIAL_INDEX: 'material_index',
  ID: 'id',
  SELECTION: 'selection'
} as const;

// Primitive operation parameters
export interface PrimitiveParams {
  cube: {
    width: number;
    height: number;
    depth: number;
    widthSegments?: number;
    heightSegments?: number;
    depthSegments?: number;
  };
  sphere: {
    radius: number;
    widthSegments?: number;
    heightSegments?: number;
  };
  cylinder: {
    radiusTop: number;
    radiusBottom: number;
    height: number;
    radialSegments?: number;
    heightSegments?: number;
  };
  plane: {
    width: number;
    height: number;
    widthSegments?: number;
    heightSegments?: number;
  };
  cone: {
    radius: number;
    height: number;
    radialSegments?: number;
    heightSegments?: number;
  };
  torus: {
    radius: number;
    tube: number;
    radialSegments?: number;
    tubularSegments?: number;
  };
}

export type PrimitiveType = keyof PrimitiveParams;

// Transform operation parameters
export interface TransformParams {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
}

// Transform data (legacy compatibility)
export interface TransformData {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
}

// Material data (legacy compatibility)
export interface MaterialData {
  color: { r: number; g: number; b: number };
  metalness: number;
  roughness: number;
  emissive?: { r: number; g: number; b: number };
  emissiveIntensity?: number;
}

// Compiled geometry for Three.js rendering
export interface CompiledGeometry {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
}

// Utility functions for attribute management
export class AttributeUtils {
  static createAttribute(
    name: string, 
    type: AttributeData['type'], 
    count: number, 
    defaultValue?: number | boolean | number[]
  ): AttributeData {
    const componentCount = this.getComponentCount(type);
    
    if (type === 'bool') {
      const boolDefault = defaultValue as boolean || false;
      const data: boolean[] = new Array(count).fill(boolDefault);
      return { name, type, data, default: defaultValue };
    } else {
      const numericDefault = defaultValue as number | number[] || 0;
      let data: number[];
      
      if (Array.isArray(numericDefault)) {
        data = [];
        for (let i = 0; i < count; i++) {
          data.push(...numericDefault.slice(0, componentCount));
        }
      } else {
        data = new Array(count * componentCount).fill(numericDefault);
      }
      
      return { name, type, data, default: defaultValue };
    }
  }
  
  static getComponentCount(type: AttributeData['type']): number {
    switch (type) {
      case 'float':
      case 'int':
      case 'bool':
        return 1;
      case 'vector2':
        return 2;
      case 'vector3':
        return 3;
      case 'vector4':
      case 'color':
        return 4;
      default:
        return 1;
    }
  }
  
  static getAttributeValue(attr: AttributeData, index: number): number | boolean | number[] {
    const componentCount = this.getComponentCount(attr.type);
    
    if (attr.type === 'bool') {
      return attr.data[index] as boolean;
    } else if (componentCount === 1) {
      return attr.data[index] as number;
    } else {
      const startIndex = index * componentCount;
      return (attr.data as number[]).slice(startIndex, startIndex + componentCount);
    }
  }
  
  static setAttributeValue(attr: AttributeData, index: number, value: number | boolean | number[]): void {
    const componentCount = this.getComponentCount(attr.type);
    
    if (attr.type === 'bool') {
      attr.data[index] = value as boolean;
    } else if (componentCount === 1) {
      attr.data[index] = value as number;
    } else {
      const values = Array.isArray(value) ? value : [value as number];
      const startIndex = index * componentCount;
      for (let i = 0; i < componentCount && i < values.length; i++) {
        attr.data[startIndex + i] = values[i];
      }
    }
  }
}

// Factory for creating empty geometry with standard attributes
export class GeometryFactory {
  static createEmpty(): GeometryData {
    return {
      vertices: [],
      faces: [],
      attributes: {
        vertex: new Map(),
        edge: new Map(),
        face: new Map(),
        corner: new Map()
      },
      vertexCount: 0,
      faceCount: 0
    };
  }
  
  static fromVerticesAndFaces(
    vertices: Array<{ x: number; y: number; z: number }>,
    faces: Array<{ vertices: number[]; material?: number }>
  ): GeometryData {
    const geometry = this.createEmpty();
    geometry.vertices = vertices;
    geometry.faces = faces;
    geometry.vertexCount = vertices.length;
    geometry.faceCount = faces.length;
    
    // Create position attribute from vertices
    const positions: number[] = [];
    vertices.forEach(v => {
      positions.push(v.x, v.y, v.z);
    });
    
    geometry.attributes.vertex.set(
      BUILTIN_ATTRIBUTES.POSITION,
      AttributeUtils.createAttribute(BUILTIN_ATTRIBUTES.POSITION, 'vector3', vertices.length)
    );
    
    const posAttr = geometry.attributes.vertex.get(BUILTIN_ATTRIBUTES.POSITION)!;
    posAttr.data = positions;
    
    return geometry;
  }
} 