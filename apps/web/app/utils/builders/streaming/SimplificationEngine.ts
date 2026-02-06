import { EnhancedGeometryData } from '../GeometryBuilder';

/**
 * SimplificationEngine - Advanced mesh decimation algorithms
 * Reduces geometry complexity while preserving shape
 */
export class SimplificationEngine {
  /**
   * Simplify using edge collapse
   */
  static edgeCollapse(
    geometry: EnhancedGeometryData,
    targetRatio: number = 0.5
  ): EnhancedGeometryData {
    if (!geometry.positionsArray || !geometry.indicesArray) {
      return geometry;
    }

    const targetVertexCount = Math.max(
      Math.floor(geometry.vertexCount * targetRatio),
      100
    );

    // Build edge list with costs
    const edges = this.buildEdgeList(geometry);

    // Sort edges by collapse cost (shortest first)
    edges.sort((a, b) => a.cost - b.cost);

    const removedVertices = new Set<number>();
    const vertexMap = new Map<number, number>();

    // Initialize vertex map
    for (let i = 0; i < geometry.vertexCount; i++) {
      vertexMap.set(i, i);
    }

    // Collapse edges until target reached
    let collapsedCount = 0;
    const maxCollapses = geometry.vertexCount - targetVertexCount;

    for (const edge of edges) {
      if (collapsedCount >= maxCollapses) break;

      const v1 = edge.v1;
      const v2 = edge.v2;

      // Skip if already collapsed
      if (removedVertices.has(v1) || removedVertices.has(v2)) continue;

      // Collapse v2 into v1
      removedVertices.add(v2);
      vertexMap.set(v2, v1);

      collapsedCount++;
    }

    // Rebuild geometry
    return this.rebuildGeometry(geometry, vertexMap, removedVertices);
  }

  /**
   * Simplify using vertex clustering
   */
  static vertexClustering(
    geometry: EnhancedGeometryData,
    gridSize: number = 0.1
  ): EnhancedGeometryData {
    if (!geometry.positionsArray) {
      return geometry;
    }

    const positions = geometry.positionsArray;
    const clusters = new Map<string, number[]>();

    // Cluster vertices by grid cell
    for (let i = 0; i < positions.length / 3; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];

      const cellX = Math.floor(x / gridSize);
      const cellY = Math.floor(y / gridSize);
      const cellZ = Math.floor(z / gridSize);

      const key = `${cellX},${cellY},${cellZ}`;

      if (!clusters.has(key)) {
        clusters.set(key, []);
      }

      clusters.get(key)!.push(i);
    }

    // Create vertex map (all vertices in cluster map to first vertex)
    const vertexMap = new Map<number, number>();
    const removedVertices = new Set<number>();

    for (const cluster of clusters.values()) {
      const representative = cluster[0];

      for (let i = 1; i < cluster.length; i++) {
        const vertex = cluster[i];
        vertexMap.set(vertex, representative);
        removedVertices.add(vertex);
      }
    }

    return this.rebuildGeometry(geometry, vertexMap, removedVertices);
  }

  /**
   * Simplify using quadric error metrics
   * Simplified version - full implementation would use error quadrics
   */
  static quadricSimplification(
    geometry: EnhancedGeometryData,
    targetRatio: number = 0.5
  ): EnhancedGeometryData {
    // For now, fall back to edge collapse
    // Full implementation would compute quadric error matrices
    return this.edgeCollapse(geometry, targetRatio);
  }

  /**
   * Build edge list with collapse costs
   */
  private static buildEdgeList(geometry: EnhancedGeometryData): Edge[] {
    const edges: Edge[] = [];
    const edgeSet = new Set<string>();
    const positions = geometry.positionsArray!;
    const indices = geometry.indicesArray!;

    for (let i = 0; i < indices.length; i += 3) {
      const i1 = indices[i];
      const i2 = indices[i + 1];
      const i3 = indices[i + 2];

      // Add three edges
      this.addEdge(edges, edgeSet, i1, i2, positions);
      this.addEdge(edges, edgeSet, i2, i3, positions);
      this.addEdge(edges, edgeSet, i3, i1, positions);
    }

    return edges;
  }

  /**
   * Add edge to list if not duplicate
   */
  private static addEdge(
    edges: Edge[],
    edgeSet: Set<string>,
    v1: number,
    v2: number,
    positions: Float32Array
  ): void {
    const key = v1 < v2 ? `${v1}-${v2}` : `${v2}-${v1}`;

    if (edgeSet.has(key)) return;

    edgeSet.add(key);

    // Calculate edge length (collapse cost)
    const x1 = positions[v1 * 3];
    const y1 = positions[v1 * 3 + 1];
    const z1 = positions[v1 * 3 + 2];

    const x2 = positions[v2 * 3];
    const y2 = positions[v2 * 3 + 1];
    const z2 = positions[v2 * 3 + 2];

    const dx = x2 - x1;
    const dy = y2 - y1;
    const dz = z2 - z1;

    const cost = Math.sqrt(dx * dx + dy * dy + dz * dz);

    edges.push({ v1, v2, cost });
  }

  /**
   * Rebuild geometry after simplification
   */
  private static rebuildGeometry(
    geometry: EnhancedGeometryData,
    vertexMap: Map<number, number>,
    removedVertices: Set<number>
  ): EnhancedGeometryData {
    const positions = geometry.positionsArray!;
    const indices = geometry.indicesArray!;

    const newPositions: number[] = [];
    const newIndices: number[] = [];
    const oldToNew = new Map<number, number>();

    // Build new vertex array
    for (let i = 0; i < positions.length / 3; i++) {
      if (removedVertices.has(i)) continue;

      const newIndex = newPositions.length / 3;
      oldToNew.set(i, newIndex);

      newPositions.push(
        positions[i * 3],
        positions[i * 3 + 1],
        positions[i * 3 + 2]
      );
    }

    // Rebuild faces
    for (let i = 0; i < indices.length; i += 3) {
      let i1 = indices[i];
      let i2 = indices[i + 1];
      let i3 = indices[i + 2];

      // Remap collapsed vertices
      i1 = vertexMap.get(i1) ?? i1;
      i2 = vertexMap.get(i2) ?? i2;
      i3 = vertexMap.get(i3) ?? i3;

      // Skip degenerate triangles
      if (i1 === i2 || i2 === i3 || i1 === i3) continue;

      // Map to new indices
      const ni1 = oldToNew.get(i1);
      const ni2 = oldToNew.get(i2);
      const ni3 = oldToNew.get(i3);

      if (ni1 === undefined || ni2 === undefined || ni3 === undefined) continue;

      newIndices.push(ni1, ni2, ni3);
    }

    return {
      vertices: [],
      faces: [],
      vertexCount: newPositions.length / 3,
      faceCount: newIndices.length / 3,
      positionsArray: new Float32Array(newPositions),
      indicesArray: new Uint32Array(newIndices),
      attributes: {
        vertex: new Map(),
        edge: new Map(),
        face: new Map(),
        corner: new Map(),
      },
    };
  }

  /**
   * Analyze simplification quality
   */
  static analyzeQuality(
    original: EnhancedGeometryData,
    simplified: EnhancedGeometryData
  ): SimplificationQuality {
    const vertexReduction =
      1 - simplified.vertexCount / original.vertexCount;
    const faceReduction = 1 - simplified.faceCount / original.faceCount;

    // Calculate memory savings
    const originalMemory = this.estimateMemory(original);
    const simplifiedMemory = this.estimateMemory(simplified);
    const memorySavings = 1 - simplifiedMemory / originalMemory;

    return {
      originalVertices: original.vertexCount,
      simplifiedVertices: simplified.vertexCount,
      vertexReduction,
      originalFaces: original.faceCount,
      simplifiedFaces: simplified.faceCount,
      faceReduction,
      memorySavings,
    };
  }

  /**
   * Estimate geometry memory usage
   */
  private static estimateMemory(geometry: EnhancedGeometryData): number {
    let size = 0;
    if (geometry.positionsArray) size += geometry.positionsArray.byteLength;
    if (geometry.normalsArray) size += geometry.normalsArray.byteLength;
    if (geometry.uvsArray) size += geometry.uvsArray.byteLength;
    if (geometry.colorsArray) size += geometry.colorsArray.byteLength;
    if (geometry.indicesArray) size += geometry.indicesArray.byteLength;
    return size;
  }
}

interface Edge {
  v1: number;
  v2: number;
  cost: number;
}

export interface SimplificationQuality {
  originalVertices: number;
  simplifiedVertices: number;
  vertexReduction: number;
  originalFaces: number;
  simplifiedFaces: number;
  faceReduction: number;
  memorySavings: number;
}
