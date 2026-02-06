/**
 * Runtime Geometry Processor
 *
 * Provides mesh-level operations that nodes can use in their execute
 * functions. Handles vertex manipulation, normal computation, UV
 * generation, and mesh merging without depending on PlayCanvas at
 * import time (lazy-loads when needed).
 */

// ============================================
// Types
// ============================================

export interface MeshData {
  vertices: Float32Array;
  indices: Uint32Array;
  normals?: Float32Array;
  uvs?: Float32Array;
  colors?: Float32Array;
}

export interface BoundingBox {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
  center: { x: number; y: number; z: number };
  size: { x: number; y: number; z: number };
}

export interface TransformMatrix {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
}

// ============================================
// Runtime Geometry Processor
// ============================================

export class RuntimeGeometryProcessor {

  /**
   * Compute flat normals for a triangle mesh.
   */
  computeNormals(mesh: MeshData): Float32Array {
    const { vertices, indices } = mesh;
    const normals = new Float32Array(vertices.length);

    for (let i = 0; i < indices.length; i += 3) {
      const ia = indices[i] * 3;
      const ib = indices[i + 1] * 3;
      const ic = indices[i + 2] * 3;

      // Triangle edges
      const abx = vertices[ib] - vertices[ia];
      const aby = vertices[ib + 1] - vertices[ia + 1];
      const abz = vertices[ib + 2] - vertices[ia + 2];
      const acx = vertices[ic] - vertices[ia];
      const acy = vertices[ic + 1] - vertices[ia + 1];
      const acz = vertices[ic + 2] - vertices[ia + 2];

      // Cross product
      const nx = aby * acz - abz * acy;
      const ny = abz * acx - abx * acz;
      const nz = abx * acy - aby * acx;

      // Accumulate on each vertex
      for (const idx of [ia, ib, ic]) {
        normals[idx] += nx;
        normals[idx + 1] += ny;
        normals[idx + 2] += nz;
      }
    }

    // Normalize
    for (let i = 0; i < normals.length; i += 3) {
      const len = Math.sqrt(normals[i] ** 2 + normals[i + 1] ** 2 + normals[i + 2] ** 2);
      if (len > 0) {
        normals[i] /= len;
        normals[i + 1] /= len;
        normals[i + 2] /= len;
      }
    }

    return normals;
  }

  /**
   * Generate UV coordinates using box projection.
   */
  generateUVs(mesh: MeshData): Float32Array {
    const { vertices, normals } = mesh;
    const computedNormals = normals ?? this.computeNormals(mesh);
    const vertexCount = vertices.length / 3;
    const uvs = new Float32Array(vertexCount * 2);
    const bounds = this.computeBoundingBox(mesh);

    const sizeX = bounds.size.x || 1;
    const sizeY = bounds.size.y || 1;
    const sizeZ = bounds.size.z || 1;

    for (let i = 0; i < vertexCount; i++) {
      const vx = vertices[i * 3];
      const vy = vertices[i * 3 + 1];
      const vz = vertices[i * 3 + 2];
      const nx = Math.abs(computedNormals[i * 3]);
      const ny = Math.abs(computedNormals[i * 3 + 1]);
      const nz = Math.abs(computedNormals[i * 3 + 2]);

      // Choose projection axis based on dominant normal
      if (nx >= ny && nx >= nz) {
        // Project onto YZ plane
        uvs[i * 2] = (vz - bounds.min.z) / sizeZ;
        uvs[i * 2 + 1] = (vy - bounds.min.y) / sizeY;
      } else if (ny >= nx && ny >= nz) {
        // Project onto XZ plane
        uvs[i * 2] = (vx - bounds.min.x) / sizeX;
        uvs[i * 2 + 1] = (vz - bounds.min.z) / sizeZ;
      } else {
        // Project onto XY plane
        uvs[i * 2] = (vx - bounds.min.x) / sizeX;
        uvs[i * 2 + 1] = (vy - bounds.min.y) / sizeY;
      }
    }

    return uvs;
  }

  /**
   * Compute the axis-aligned bounding box of a mesh.
   */
  computeBoundingBox(mesh: MeshData): BoundingBox {
    const { vertices } = mesh;
    const min = { x: Infinity, y: Infinity, z: Infinity };
    const max = { x: -Infinity, y: -Infinity, z: -Infinity };

    for (let i = 0; i < vertices.length; i += 3) {
      min.x = Math.min(min.x, vertices[i]);
      min.y = Math.min(min.y, vertices[i + 1]);
      min.z = Math.min(min.z, vertices[i + 2]);
      max.x = Math.max(max.x, vertices[i]);
      max.y = Math.max(max.y, vertices[i + 1]);
      max.z = Math.max(max.z, vertices[i + 2]);
    }

    if (!isFinite(min.x)) {
      min.x = min.y = min.z = 0;
      max.x = max.y = max.z = 0;
    }

    return {
      min,
      max,
      center: {
        x: (min.x + max.x) / 2,
        y: (min.y + max.y) / 2,
        z: (min.z + max.z) / 2,
      },
      size: {
        x: max.x - min.x,
        y: max.y - min.y,
        z: max.z - min.z,
      },
    };
  }

  /**
   * Merge multiple meshes into one.
   */
  mergeMeshes(meshes: MeshData[]): MeshData {
    if (meshes.length === 0) {
      return { vertices: new Float32Array(0), indices: new Uint32Array(0) };
    }
    if (meshes.length === 1) return meshes[0];

    let totalVertices = 0;
    let totalIndices = 0;

    for (const mesh of meshes) {
      totalVertices += mesh.vertices.length;
      totalIndices += mesh.indices.length;
    }

    const vertices = new Float32Array(totalVertices);
    const indices = new Uint32Array(totalIndices);
    const hasNormals = meshes.every(m => m.normals);
    const hasUVs = meshes.every(m => m.uvs);
    const hasColors = meshes.every(m => m.colors);

    const normals = hasNormals ? new Float32Array(totalVertices) : undefined;
    const uvs = hasUVs ? new Float32Array((totalVertices / 3) * 2) : undefined;
    const colors = hasColors ? new Float32Array(totalVertices) : undefined;

    let vertexOffset = 0;
    let indexOffset = 0;
    let uvOffset = 0;

    for (const mesh of meshes) {
      const vertCount = mesh.vertices.length / 3;

      vertices.set(mesh.vertices, vertexOffset);

      // Offset indices
      for (let i = 0; i < mesh.indices.length; i++) {
        indices[indexOffset + i] = mesh.indices[i] + vertexOffset / 3;
      }

      if (normals && mesh.normals) {
        normals.set(mesh.normals, vertexOffset);
      }

      if (uvs && mesh.uvs) {
        uvs.set(mesh.uvs, uvOffset);
        uvOffset += vertCount * 2;
      }

      if (colors && mesh.colors) {
        colors.set(mesh.colors, vertexOffset);
      }

      vertexOffset += mesh.vertices.length;
      indexOffset += mesh.indices.length;
    }

    return { vertices, indices, normals, uvs, colors };
  }

  /**
   * Apply a transform to a mesh (mutates in place for performance).
   */
  applyTransform(mesh: MeshData, transform: TransformMatrix): MeshData {
    const { vertices } = mesh;
    const { position, rotation, scale } = transform;

    // Pre-compute rotation matrix from euler angles (radians)
    const cx = Math.cos(rotation.x), sx = Math.sin(rotation.x);
    const cy = Math.cos(rotation.y), sy = Math.sin(rotation.y);
    const cz = Math.cos(rotation.z), sz = Math.sin(rotation.z);

    // Combined rotation matrix (ZYX order)
    const r00 = cy * cz * scale.x;
    const r01 = (sx * sy * cz - cx * sz) * scale.y;
    const r02 = (cx * sy * cz + sx * sz) * scale.z;
    const r10 = cy * sz * scale.x;
    const r11 = (sx * sy * sz + cx * cz) * scale.y;
    const r12 = (cx * sy * sz - sx * cz) * scale.z;
    const r20 = -sy * scale.x;
    const r21 = sx * cy * scale.y;
    const r22 = cx * cy * scale.z;

    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const y = vertices[i + 1];
      const z = vertices[i + 2];

      vertices[i] = r00 * x + r01 * y + r02 * z + position.x;
      vertices[i + 1] = r10 * x + r11 * y + r12 * z + position.y;
      vertices[i + 2] = r20 * x + r21 * y + r22 * z + position.z;
    }

    // Recompute normals after transform
    if (mesh.normals) {
      mesh.normals = this.computeNormals(mesh);
    }

    return mesh;
  }

  /**
   * Subdivide a mesh by splitting each triangle into 4.
   */
  subdivide(mesh: MeshData, levels = 1): MeshData {
    let current = mesh;

    for (let level = 0; level < levels; level++) {
      const { vertices: verts, indices: idxs } = current;
      const vertCount = verts.length / 3;
      const triCount = idxs.length / 3;

      // Midpoint cache to avoid duplicate vertices
      const midpointCache = new Map<string, number>();
      const newVerts: number[] = Array.from(verts);
      const newIdxs: number[] = [];

      const getMidpoint = (a: number, b: number): number => {
        const key = a < b ? `${a}_${b}` : `${b}_${a}`;
        const cached = midpointCache.get(key);
        if (cached !== undefined) return cached;

        const ax = verts[a * 3], ay = verts[a * 3 + 1], az = verts[a * 3 + 2];
        const bx = verts[b * 3], by = verts[b * 3 + 1], bz = verts[b * 3 + 2];

        const idx = newVerts.length / 3;
        newVerts.push((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2);
        midpointCache.set(key, idx);
        return idx;
      };

      for (let i = 0; i < triCount; i++) {
        const a = idxs[i * 3];
        const b = idxs[i * 3 + 1];
        const c = idxs[i * 3 + 2];

        const ab = getMidpoint(a, b);
        const bc = getMidpoint(b, c);
        const ca = getMidpoint(c, a);

        // 4 new triangles
        newIdxs.push(a, ab, ca);
        newIdxs.push(ab, b, bc);
        newIdxs.push(ca, bc, c);
        newIdxs.push(ab, bc, ca);
      }

      current = {
        vertices: new Float32Array(newVerts),
        indices: new Uint32Array(newIdxs),
      };
    }

    // Recompute normals
    current.normals = this.computeNormals(current);
    return current;
  }

  /**
   * Get vertex count from mesh data.
   */
  getVertexCount(mesh: MeshData): number {
    return mesh.vertices.length / 3;
  }

  /**
   * Get triangle count from mesh data.
   */
  getTriangleCount(mesh: MeshData): number {
    return mesh.indices.length / 3;
  }
}

// Singleton
let processorInstance: RuntimeGeometryProcessor | null = null;

export function getRuntimeGeometryProcessor(): RuntimeGeometryProcessor {
  if (!processorInstance) {
    processorInstance = new RuntimeGeometryProcessor();
  }
  return processorInstance;
}
