import { EnhancedGeometryData } from '../GeometryBuilder';
import * as pc from 'playcanvas';
import { webGPUProcessor } from '../gpu/WebGPUGeometryProcessor';
import { webGPUCompute } from '../gpu/WebGPUComputeSystem';

/**
 * GeometryOperations - Advanced geometry manipulation utilities
 * For subdivision, simplification, and other complex operations
 */
export class GeometryOperations {
  /**
   * Initialize GPU system
   */
  static async initGPU(): Promise<boolean> {
    return webGPUCompute.initialize();
  }

  /**
   * Transform geometry (Async - prefers GPU)
   */
  static async transformAsync(
    geometry: EnhancedGeometryData,
    matrix: pc.Mat4
  ): Promise<EnhancedGeometryData> {
    if (webGPUCompute.isAvailable()) {
      return webGPUProcessor.transform(geometry, new Float32Array(matrix.data));
    }
    const { VertexDataUtils } = await import('../VertexDataUtils');
    return VertexDataUtils.transform(geometry, matrix);
  }

  /**
   * Apply displacement (Async - prefers GPU)
   */
  static async displaceAsync(
    geometry: EnhancedGeometryData,
    amplitude: number,
    frequency: number,
    seed: number = 0
  ): Promise<EnhancedGeometryData> {
    if (webGPUCompute.isAvailable()) {
      return webGPUProcessor.displace(geometry, amplitude, frequency, seed);
    }
    return this.displace(geometry, amplitude, frequency, seed);
  }

  /**
   * Subdivide geometry using simple edge midpoint subdivision
   */
  static subdivide(geometry: EnhancedGeometryData, iterations: number = 1): EnhancedGeometryData {
    if (!geometry.positionsArray || !geometry.indicesArray) {
      return geometry;
    }

    let positions = Array.from(geometry.positionsArray);
    let indices = Array.from(geometry.indicesArray);

    for (let iter = 0; iter < iterations; iter++) {
      const newPositions: number[] = [...positions];
      const newIndices: number[] = [];
      const edgeMap = new Map<string, number>();

      // Helper to get or create midpoint vertex
      const getMidpoint = (i1: number, i2: number): number => {
        const key = i1 < i2 ? `${i1}-${i2}` : `${i2}-${i1}`;

        if (edgeMap.has(key)) {
          return edgeMap.get(key)!;
        }

        const x1 = positions[i1 * 3];
        const y1 = positions[i1 * 3 + 1];
        const z1 = positions[i1 * 3 + 2];
        const x2 = positions[i2 * 3];
        const y2 = positions[i2 * 3 + 1];
        const z2 = positions[i2 * 3 + 2];

        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const mz = (z1 + z2) / 2;

        const newIndex = newPositions.length / 3;
        newPositions.push(mx, my, mz);
        edgeMap.set(key, newIndex);

        return newIndex;
      };

      // Subdivide each triangle
      for (let i = 0; i < indices.length; i += 3) {
        const v1 = indices[i];
        const v2 = indices[i + 1];
        const v3 = indices[i + 2];

        const m12 = getMidpoint(v1, v2);
        const m23 = getMidpoint(v2, v3);
        const m31 = getMidpoint(v3, v1);

        // Create 4 new triangles
        newIndices.push(v1, m12, m31);
        newIndices.push(v2, m23, m12);
        newIndices.push(v3, m31, m23);
        newIndices.push(m12, m23, m31);
      }

      positions = newPositions;
      indices = newIndices;
    }

    const result = { ...geometry };
    result.positionsArray = new Float32Array(positions);
    result.indicesArray = new Uint32Array(indices);
    result.vertexCount = positions.length / 3;
    result.faceCount = indices.length / 3;

    // Recompute normals
    result.normalsArray = undefined;

    return result;
  }

  /**
   * Extrude geometry along a direction
   */
  static extrude(
    geometry: EnhancedGeometryData,
    direction: pc.Vec3,
    depth: number
  ): EnhancedGeometryData {
    if (!geometry.positionsArray || !geometry.indicesArray) {
      return geometry;
    }

    const positions = Array.from(geometry.positionsArray);
    const indices = Array.from(geometry.indicesArray);
    const originalVertexCount = positions.length / 3;

    // Duplicate vertices at offset
    const offset = direction.clone().mulScalar(depth);
    for (let i = 0; i < originalVertexCount; i++) {
      positions.push(
        positions[i * 3] + offset.x,
        positions[i * 3 + 1] + offset.y,
        positions[i * 3 + 2] + offset.z
      );
    }

    // Add back faces
    for (let i = 0; i < geometry.faceCount; i++) {
      const i1 = indices[i * 3];
      const i2 = indices[i * 3 + 1];
      const i3 = indices[i * 3 + 2];

      // Add reversed face at offset
      indices.push(
        i1 + originalVertexCount,
        i3 + originalVertexCount,
        i2 + originalVertexCount
      );
    }

    // Add side faces along edges
    // This is simplified - a full implementation would need to identify boundary edges
    const edgeSet = new Set<string>();
    for (let i = 0; i < geometry.faceCount; i++) {
      const i1 = indices[i * 3];
      const i2 = indices[i * 3 + 1];
      const i3 = indices[i * 3 + 2];

      const edges = [
        [i1, i2],
        [i2, i3],
        [i3, i1],
      ];

      edges.forEach(([a, b]) => {
        const key = a < b ? `${a}-${b}` : `${b}-${a}`;
        if (!edgeSet.has(key)) {
          edgeSet.add(key);

          // Add quad as two triangles
          const v1 = a;
          const v2 = b;
          const v3 = b + originalVertexCount;
          const v4 = a + originalVertexCount;

          indices.push(v1, v2, v4);
          indices.push(v2, v3, v4);
        }
      });
    }

    const result = { ...geometry };
    result.positionsArray = new Float32Array(positions);
    result.indicesArray = new Uint32Array(indices);
    result.vertexCount = positions.length / 3;
    result.faceCount = indices.length / 3;

    return result;
  }

  /**
   * Apply noise displacement to geometry
   */
  static displace(
    geometry: EnhancedGeometryData,
    amplitude: number,
    frequency: number,
    seed: number = 0
  ): EnhancedGeometryData {
    if (!geometry.positionsArray || !geometry.normalsArray) {
      return geometry;
    }

    const positions = new Float32Array(geometry.positionsArray);
    const normals = geometry.normalsArray;

    // Simple Perlin-like noise using sine waves
    const noise3D = (x: number, y: number, z: number): number => {
      return (
        Math.sin(x * frequency + seed) * Math.cos(y * frequency + seed) * Math.sin(z * frequency + seed) +
        Math.sin(x * frequency * 2 + seed * 2) * 0.5 +
        Math.cos(z * frequency * 2 + seed * 3) * 0.5
      ) / 2;
    };

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];

      const noiseValue = noise3D(x, y, z);
      const displacement = noiseValue * amplitude;

      positions[i] += normals[i] * displacement;
      positions[i + 1] += normals[i + 1] * displacement;
      positions[i + 2] += normals[i + 2] * displacement;
    }

    const result = { ...geometry };
    result.positionsArray = positions;

    return result;
  }

  /**
   * Twist geometry around an axis
   */
  static twist(
    geometry: EnhancedGeometryData,
    axis: pc.Vec3,
    angle: number,
    offset: number = 0
  ): EnhancedGeometryData {
    if (!geometry.positionsArray) {
      return geometry;
    }

    const positions = new Float32Array(geometry.positionsArray);
    
    // Ensure axis is a Vector3 and normalized
    const twistAxis = axis.clone().normalize();

    const pos = new pc.Vec3();
    const projection = new pc.Vec3();
    const rotationMatrix = new pc.Mat4();

    for (let i = 0; i < positions.length; i += 3) {
      pos.set(positions[i], positions[i + 1], positions[i + 2]);

      // Project position onto axis
      const dot = pos.dot(twistAxis);
      projection.copy(twistAxis).mulScalar(dot);
      const distanceAlongAxis = projection.length();

      // Calculate twist angle based on distance
      const twistAngle = (distanceAlongAxis + offset) * angle;

      // Rotate around axis
      rotationMatrix.setFromAxisAngle(twistAxis, twistAngle * pc.math.RAD_TO_DEG);
      rotationMatrix.transformPoint(pos, pos);

      positions[i] = pos.x;
      positions[i + 1] = pos.y;
      positions[i + 2] = pos.z;
    }

    const result = { ...geometry };
    result.positionsArray = positions;
    result.normalsArray = undefined; // Recompute normals

    return result;
  }

  /**
   * Bend geometry along an axis
   */
  static bend(
    geometry: EnhancedGeometryData,
    axis: 'x' | 'y' | 'z',
    angle: number,
    radius: number = 1
  ): EnhancedGeometryData {
    if (!geometry.positionsArray) {
      return geometry;
    }

    const positions = new Float32Array(geometry.positionsArray);

    for (let i = 0; i < positions.length; i += 3) {
      let x = positions[i];
      let y = positions[i + 1];
      let z = positions[i + 2];

      if (axis === 'x') {
        const bendAngle = (x / radius) * angle;
        const newY = y * Math.cos(bendAngle) - z * Math.sin(bendAngle);
        const newZ = y * Math.sin(bendAngle) + z * Math.cos(bendAngle);
        positions[i + 1] = newY;
        positions[i + 2] = newZ;
      } else if (axis === 'y') {
        const bendAngle = (y / radius) * angle;
        const newX = x * Math.cos(bendAngle) + z * Math.sin(bendAngle);
        const newZ = -x * Math.sin(bendAngle) + z * Math.cos(bendAngle);
        positions[i] = newX;
        positions[i + 2] = newZ;
      } else if (axis === 'z') {
        const bendAngle = (z / radius) * angle;
        const newX = x * Math.cos(bendAngle) - y * Math.sin(bendAngle);
        const newY = x * Math.sin(bendAngle) + y * Math.cos(bendAngle);
        positions[i] = newX;
        positions[i + 1] = newY;
      }
    }

    const result = { ...geometry };
    result.positionsArray = positions;
    result.normalsArray = undefined; // Recompute normals

    return result;
  }

  /**
   * Taper geometry along an axis
   */
  static taper(
    geometry: EnhancedGeometryData,
    axis: 'x' | 'y' | 'z',
    amount: number
  ): EnhancedGeometryData {
    if (!geometry.positionsArray) {
      return geometry;
    }

    const positions = new Float32Array(geometry.positionsArray);

    // Find bounds along taper axis
    let min = Infinity;
    let max = -Infinity;
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;

    for (let i = axisIndex; i < positions.length; i += 3) {
      min = Math.min(min, positions[i]);
      max = Math.max(max, positions[i]);
    }

    const range = max - min;

    // Apply taper
    for (let i = 0; i < positions.length; i += 3) {
      const axisValue = positions[i + axisIndex];
      const t = (axisValue - min) / range; // 0 to 1
      const scale = 1 + t * amount;

      // Scale perpendicular axes
      if (axis === 'x') {
        positions[i + 1] *= scale;
        positions[i + 2] *= scale;
      } else if (axis === 'y') {
        positions[i] *= scale;
        positions[i + 2] *= scale;
      } else {
        positions[i] *= scale;
        positions[i + 1] *= scale;
      }
    }

    const result = { ...geometry };
    result.positionsArray = positions;

    return result;
  }
}
