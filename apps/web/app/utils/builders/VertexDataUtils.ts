import * as pc from 'playcanvas';
import { EnhancedGeometryData } from './GeometryBuilder';

/**
 * VertexDataUtils - Utility functions for geometry manipulation
 */
export class VertexDataUtils {
  /**
   * Merge multiple geometry data objects into one
   */
  static merge(geometries: EnhancedGeometryData[]): EnhancedGeometryData {
    if (geometries.length === 0) {
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

    if (geometries.length === 1) {
      return geometries[0];
    }

    const merged: EnhancedGeometryData = {
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

    const allPositions: number[] = [];
    const allNormals: number[] = [];
    const allUVs: number[] = [];
    const allColors: number[] = [];
    const allIndices: number[] = [];

    let vertexOffset = 0;
    let indexOffset = 0;

    geometries.forEach((geom) => {
      // Merge positions
      if (geom.positionsArray) {
        allPositions.push(...Array.from(geom.positionsArray));
      }

      // Merge normals
      if (geom.normalsArray) {
        allNormals.push(...Array.from(geom.normalsArray));
      }

      // Merge UVs
      if (geom.uvsArray) {
        allUVs.push(...Array.from(geom.uvsArray));
      }

      // Merge colors
      if (geom.colorsArray) {
        allColors.push(...Array.from(geom.colorsArray));
      }

      // Merge indices with offset
      if (geom.indicesArray) {
        const offsetIndices = Array.from(geom.indicesArray).map(
          (idx) => idx + vertexOffset
        );
        allIndices.push(...offsetIndices);
      }

      // Merge materials and groups (simplification: flattening)
      if (geom.materials && geom.materials.length > 0) {
          // Logic for material merging is complex, simplified here
          // Just push all materials and remap indices if possible or use first one
      }

      vertexOffset += geom.vertexCount;
      indexOffset += geom.indicesArray ? geom.indicesArray.length : 0;
    });

    merged.positionsArray = new Float32Array(allPositions);
    if (allNormals.length > 0) merged.normalsArray = new Float32Array(allNormals);
    if (allUVs.length > 0) merged.uvsArray = new Float32Array(allUVs);
    if (allColors.length > 0) merged.colorsArray = new Float32Array(allColors);
    if (allIndices.length > 0) merged.indicesArray = new Uint32Array(allIndices);

    merged.vertexCount = vertexOffset;
    merged.faceCount = Math.floor(allIndices.length / 3);

    return merged;
  }

  /**
   * Transform geometry by matrix
   */
  static transform(
    geometry: EnhancedGeometryData,
    matrix: pc.Mat4
  ): EnhancedGeometryData {
    if (!geometry.positionsArray) {
      return geometry;
    }

    const transformed = { ...geometry };
    const positions = new Float32Array(geometry.positionsArray);
    const normals = geometry.normalsArray
      ? new Float32Array(geometry.normalsArray)
      : null;

    const vec = new pc.Vec3();

    // Transform positions
    for (let i = 0; i < positions.length; i += 3) {
      vec.set(positions[i], positions[i + 1], positions[i + 2]);
      matrix.transformPoint(vec, vec);
      positions[i] = vec.x;
      positions[i + 1] = vec.y;
      positions[i + 2] = vec.z;
    }

    transformed.positionsArray = positions;

    // Transform normals
    if (normals) {
      const normalMatrix = matrix.clone().invert().transpose();
      for (let i = 0; i < normals.length; i += 3) {
        vec.set(normals[i], normals[i + 1], normals[i + 2]);
        normalMatrix.transformVector(vec, vec);
        vec.normalize();
        normals[i] = vec.x;
        normals[i + 1] = vec.y;
        normals[i + 2] = vec.z;
      }
      transformed.normalsArray = normals;
    }

    return transformed;
  }

  /**
   * Apply translation to geometry
   */
  static translate(
    geometry: EnhancedGeometryData,
    x: number,
    y: number,
    z: number
  ): EnhancedGeometryData {
    const matrix = new pc.Mat4().setTranslate(x, y, z);
    return this.transform(geometry, matrix);
  }

  /**
   * Create a deep copy of geometry data
   */
  static clone(geometry: EnhancedGeometryData): EnhancedGeometryData {
    const cloned: EnhancedGeometryData = {
      vertices: [],
      faces: [],
      attributes: {
        vertex: new Map(),
        edge: new Map(),
        face: new Map(),
        corner: new Map(),
      },
      vertexCount: geometry.vertexCount,
      faceCount: geometry.faceCount,
    };

    if (geometry.positionsArray) cloned.positionsArray = new Float32Array(geometry.positionsArray);
    if (geometry.normalsArray) cloned.normalsArray = new Float32Array(geometry.normalsArray);
    if (geometry.uvsArray) cloned.uvsArray = new Float32Array(geometry.uvsArray);
    if (geometry.colorsArray) cloned.colorsArray = new Float32Array(geometry.colorsArray);
    if (geometry.indicesArray) cloned.indicesArray = new Uint32Array(geometry.indicesArray);
    
    return cloned;
  }

  /**
   * Compute vertex normals (smooth shading)
   */
  static computeNormals(
    geometry: EnhancedGeometryData
  ): EnhancedGeometryData {
    if (!geometry.positionsArray || !geometry.indicesArray) {
      return geometry;
    }

    const positions = geometry.positionsArray;
    const indices = geometry.indicesArray;
    const normals = new Float32Array(positions.length);

    const vec1 = new pc.Vec3();
    const vec2 = new pc.Vec3();
    const vec3 = new pc.Vec3();
    const edge1 = new pc.Vec3();
    const edge2 = new pc.Vec3();
    const normal = new pc.Vec3();

    // Accumulate face normals
    for (let i = 0; i < indices.length; i += 3) {
      const i0 = indices[i] * 3;
      const i1 = indices[i + 1] * 3;
      const i2 = indices[i + 2] * 3;

      vec1.set(positions[i0], positions[i0 + 1], positions[i0 + 2]);
      vec2.set(positions[i1], positions[i1 + 1], positions[i1 + 2]);
      vec3.set(positions[i2], positions[i2 + 1], positions[i2 + 2]);

      edge1.sub2(vec2, vec1);
      edge2.sub2(vec3, vec1);
      normal.cross(edge1, edge2);

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

    const result = { ...geometry };
    result.normalsArray = normals;
    return result;
  }
}
