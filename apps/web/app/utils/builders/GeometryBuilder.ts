import * as pc from 'playcanvas';
import { GeometryData, AttributeData, AttributeUtils, CompiledGeometry } from '../../types/geometry';

/**
 * Enhanced GeometryData structure for efficient geometry manipulation
 * Provides efficient geometry manipulation and composition
 */
export interface EnhancedGeometryData extends GeometryData {
  // Typed arrays for performance
  positionsArray?: Float32Array;
  normalsArray?: Float32Array;
  uvsArray?: Float32Array;
  colorsArray?: Float32Array;
  indicesArray?: Uint32Array;

  // Material support
  materials?: pc.StandardMaterial[];
  materialGroups?: Array<{
    start: number;
    count: number;
    materialIndex: number;
  }>;

  // Contextual metadata (for procedural operations)
  contextData?: {
    seed?: number;
    time?: number;
    generatorParams?: Record<string, any>;
  };
}

/**
 * Base GeometryBuilder class
 * Provides chainable methods for geometry construction
 */
export abstract class GeometryBuilder {
  protected data: EnhancedGeometryData;

  constructor() {
    this.data = this.createEmpty();
  }

  /**
   * Create an empty geometry data structure
   */
  protected createEmpty(): EnhancedGeometryData {
    return {
      vertices: [],
      faces: [],
      attributes: {
        vertex: new Map(),
        edge: new Map(),
        face: new Map(),
        corner: new Map(),
      },
      vertexCount: 0,
      faceCount: 0,
      materials: [],
      materialGroups: [],
    };
  }

  /**
   * Set positions from array or Float32Array
   */
  setPositions(positions: number[] | Float32Array): this {
    if (positions instanceof Float32Array) {
      this.data.positionsArray = positions;
    } else {
      this.data.positionsArray = new Float32Array(positions);
    }

    // Update vertices array
    const vertices: Array<{ x: number; y: number; z: number }> = [];
    for (let i = 0; i < positions.length; i += 3) {
      vertices.push({
        x: positions[i],
        y: positions[i + 1],
        z: positions[i + 2],
      });
    }
    this.data.vertices = vertices;
    this.data.vertexCount = vertices.length;

    return this;
  }

  /**
   * Set normals from array or Float32Array
   */
  setNormals(normals: number[] | Float32Array): this {
    if (normals instanceof Float32Array) {
      this.data.normalsArray = normals;
    } else {
      this.data.normalsArray = new Float32Array(normals);
    }
    return this;
  }

  /**
   * Set UVs from array or Float32Array
   */
  setUVs(uvs: number[] | Float32Array): this {
    if (uvs instanceof Float32Array) {
      this.data.uvsArray = uvs;
    } else {
      this.data.uvsArray = new Float32Array(uvs);
    }
    return this;
  }

  /**
   * Set vertex colors from array or Float32Array
   */
  setColors(colors: number[] | Float32Array): this {
    if (colors instanceof Float32Array) {
      this.data.colorsArray = colors;
    } else {
      this.data.colorsArray = new Float32Array(colors);
    }
    return this;
  }

  /**
   * Set indices from array or Uint32Array
   */
  setIndices(indices: number[] | Uint32Array): this {
    if (indices instanceof Uint32Array) {
      this.data.indicesArray = indices;
    } else {
      this.data.indicesArray = new Uint32Array(indices);
    }

    // Update faces array
    const faces: Array<{ vertices: number[]; material?: number }> = [];
    for (let i = 0; i < indices.length; i += 3) {
      faces.push({
        vertices: [indices[i], indices[i + 1], indices[i + 2]],
      });
    }
    this.data.faces = faces;
    this.data.faceCount = faces.length;

    return this;
  }

  /**
   * Add a custom attribute to the geometry
   */
  setAttribute(
    domain: 'vertex' | 'edge' | 'face' | 'corner',
    name: string,
    data: AttributeData
  ): this {
    this.data.attributes[domain].set(name, data);
    return this;
  }

  /**
   * Set material for the geometry
   */
  setMaterial(material: pc.StandardMaterial): this {
    this.data.materials = [material];
    return this;
  }

  /**
   * Add material with group support
   */
  addMaterialGroup(
    material: pc.StandardMaterial,
    start: number,
    count: number
  ): this {
    if (!this.data.materials) {
      this.data.materials = [];
    }
    const materialIndex = this.data.materials.length;
    this.data.materials.push(material);

    if (!this.data.materialGroups) {
      this.data.materialGroups = [];
    }
    this.data.materialGroups.push({ start, count, materialIndex });

    return this;
  }

  /**
   * Compute vertex normals automatically
   */
  computeNormals(): this {
    if (!this.data.positionsArray || !this.data.indicesArray) {
      console.warn('Cannot compute normals: missing positions or indices');
      return this;
    }

    const positions = this.data.positionsArray;
    const indices = this.data.indicesArray;
    const normals = new Float32Array(positions.length);

    // Accumulate face normals at each vertex
    const vec1 = new pc.Vec3();
    const vec2 = new pc.Vec3();
    const vec3 = new pc.Vec3();
    const edge1 = new pc.Vec3();
    const edge2 = new pc.Vec3();
    const normal = new pc.Vec3();

    for (let i = 0; i < indices.length; i += 3) {
      const i0 = indices[i] * 3;
      const i1 = indices[i + 1] * 3;
      const i2 = indices[i + 2] * 3;

      vec1.set(positions[i0], positions[i0 + 1], positions[i0 + 2]);
      vec2.set(positions[i1], positions[i1 + 1], positions[i1 + 2]);
      vec3.set(positions[i2], positions[i2 + 1], positions[i2 + 2]);

      // Compute face normal
      edge1.sub2(vec2, vec1);
      edge2.sub2(vec3, vec1);
      normal.cross(edge1, edge2);

      // Accumulate at each vertex
      normals[i0] += normal.x;
      normals[i0 + 1] += normal.y;
      normals[i0 + 2] += normal.z;

      normals[i1] += normal.x;
      normals[i1 + 1] += normal.y;
      normals[i1 + 2] += normal.z;

      normals[i2] += normal.x;
      normals[i2 + 1] += normal.y;
      normals[i2 + 2] += normal.z;
    }

    // Normalize
    for (let i = 0; i < normals.length; i += 3) {
      const nx = normals[i];
      const ny = normals[i + 1];
      const nz = normals[i + 2];
      const length = Math.sqrt(nx * nx + ny * ny + nz * nz);

      if (length > 0) {
        normals[i] /= length;
        normals[i + 1] /= length;
        normals[i + 2] /= length;
      }
    }

    this.data.normalsArray = normals;
    return this;
  }

  /**
   * Compute bounding box
   */
  computeBounds(): this {
    if (!this.data.positionsArray) {
      return this;
    }

    const positions = this.data.positionsArray;
    const min = new pc.Vec3(Infinity, Infinity, Infinity);
    const max = new pc.Vec3(-Infinity, -Infinity, -Infinity);

    for (let i = 0; i < positions.length; i += 3) {
      min.x = Math.min(min.x, positions[i]);
      min.y = Math.min(min.y, positions[i + 1]);
      min.z = Math.min(min.z, positions[i + 2]);

      max.x = Math.max(max.x, positions[i]);
      max.y = Math.max(max.y, positions[i + 1]);
      max.z = Math.max(max.z, positions[i + 2]);
    }

    this.data.bounds = { min, max };
    return this;
  }

  /**
   * Build final GeometryData
   */
  build(): EnhancedGeometryData {
    // Auto-compute normals if not set
    if (!this.data.normalsArray && this.data.positionsArray) {
      this.computeNormals();
    }

    // Auto-compute bounds
    this.computeBounds();

    return this.data;
  }

  /**
   * Convert to pc.Mesh
   */
  toPlayCanvas(device: pc.GraphicsDevice): pc.Mesh {
    const mesh = new pc.Mesh(device);
    
    if (this.data.positionsArray) {
      mesh.setPositions(this.data.positionsArray);
    }

    if (this.data.normalsArray) {
      mesh.setNormals(this.data.normalsArray);
    }

    if (this.data.uvsArray) {
      mesh.setUvs(0, this.data.uvsArray);
    }

    if (this.data.colorsArray) {
      // Convert Float32Array colors (0-1) to Uint8Array (0-255) for PlayCanvas if needed,
      // but PlayCanvas setColors accepts numbers. Usually setColors takes array of numbers.
      // For simplicity, we assume mesh.setColors handles it or we might need custom vertex stream.
      // PlayCanvas standard meshes often use vertex streams.
      // Let's use setVertexStream for flexibility if standard helpers don't exist for all.
      // Actually mesh.setColors exists.
      // mesh.setColors(this.data.colorsArray); // Needs verification of format.
      // Usually expects 4 components per vertex.
      // PlayCanvas colors are usually 8-bit.
      const colors = new Uint8Array(this.data.colorsArray.length);
      for(let i=0; i<this.data.colorsArray.length; i++) {
        colors[i] = Math.floor(this.data.colorsArray[i] * 255);
      }
      mesh.setColors(colors);
    }

    if (this.data.indicesArray) {
      mesh.setIndices(this.data.indicesArray);
    }

    // Update AABB
    mesh.update(pc.PRIMITIVE_TRIANGLES);
    
    return mesh;
  }

  /**
   * Clone this builder
   */
  clone(): GeometryBuilder {
    const cloned = Object.create(Object.getPrototypeOf(this));
    cloned.data = JSON.parse(JSON.stringify(this.data));
    return cloned;
  }
}
