import { EnhancedGeometryData } from '../GeometryBuilder';

/**
 * GeometryStreamer - Progressive geometry loading
 * Streams geometry data in chunks for large datasets
 */
export class GeometryStreamer {
  private chunkSize: number;
  private currentChunk: number = 0;
  private totalChunks: number = 0;
  private sourceGeometry?: EnhancedGeometryData;

  constructor(chunkSize: number = 10000) {
    this.chunkSize = chunkSize;
  }

  /**
   * Initialize streaming from geometry
   */
  initializeFromGeometry(geometry: EnhancedGeometryData): void {
    this.sourceGeometry = geometry;
    this.currentChunk = 0;
    this.totalChunks = Math.ceil(geometry.vertexCount / this.chunkSize);
  }

  /**
   * Get next chunk of geometry
   */
  getNextChunk(): GeometryChunk | null {
    if (!this.sourceGeometry || this.currentChunk >= this.totalChunks) {
      return null;
    }

    const startVertex = this.currentChunk * this.chunkSize;
    const endVertex = Math.min(
      startVertex + this.chunkSize,
      this.sourceGeometry.vertexCount
    );

    const chunk = this.extractChunk(startVertex, endVertex);

    this.currentChunk++;

    return {
      chunkIndex: this.currentChunk - 1,
      totalChunks: this.totalChunks,
      vertexRange: [startVertex, endVertex],
      geometry: chunk,
      progress: this.currentChunk / this.totalChunks,
    };
  }

  /**
   * Extract chunk from geometry
   */
  private extractChunk(startVertex: number, endVertex: number): EnhancedGeometryData {
    if (!this.sourceGeometry?.positionsArray) {
      return this.createEmptyGeometry();
    }

    const positions = this.sourceGeometry.positionsArray;
    const chunkPositions = positions.slice(startVertex * 3, endVertex * 3);

    // Extract relevant faces
    const chunkIndices: number[] = [];
    if (this.sourceGeometry.indicesArray) {
      const indices = this.sourceGeometry.indicesArray;

      for (let i = 0; i < indices.length; i += 3) {
        const i1 = indices[i];
        const i2 = indices[i + 1];
        const i3 = indices[i + 2];

        // Include face if all vertices are in chunk
        if (
          i1 >= startVertex &&
          i1 < endVertex &&
          i2 >= startVertex &&
          i2 < endVertex &&
          i3 >= startVertex &&
          i3 < endVertex
        ) {
          chunkIndices.push(
            i1 - startVertex,
            i2 - startVertex,
            i3 - startVertex
          );
        }
      }
    }

    return {
      vertices: [],
      faces: [],
      vertexCount: (endVertex - startVertex),
      faceCount: chunkIndices.length / 3,
      positionsArray: chunkPositions,
      indicesArray: chunkIndices.length > 0 ? new Uint32Array(chunkIndices) : undefined,
      attributes: {
        vertex: new Map(),
        edge: new Map(),
        face: new Map(),
        corner: new Map(),
      },
    };
  }

  /**
   * Stream all chunks with callback
   */
  async streamAll(
    onChunk: (chunk: GeometryChunk) => void | Promise<void>,
    delayMs: number = 16
  ): Promise<void> {
    while (true) {
      const chunk = this.getNextChunk();
      if (!chunk) break;

      await onChunk(chunk);

      // Yield to browser for rendering
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  /**
   * Reset stream
   */
  reset(): void {
    this.currentChunk = 0;
  }

  /**
   * Get streaming progress
   */
  getProgress(): number {
    return this.totalChunks > 0 ? this.currentChunk / this.totalChunks : 0;
  }

  /**
   * Check if streaming is complete
   */
  isComplete(): boolean {
    return this.currentChunk >= this.totalChunks;
  }

  /**
   * Create empty geometry
   */
  private createEmptyGeometry(): EnhancedGeometryData {
    return {
      vertices: [],
      faces: [],
      vertexCount: 0,
      faceCount: 0,
      attributes: {
        vertex: new Map(),
        edge: new Map(),
        face: new Map(),
        corner: new Map(),
      },
    };
  }
}

/**
 * GeometryStreamLoader - Load geometry from URL in chunks
 */
export class GeometryStreamLoader {
  /**
   * Load geometry from URL with streaming
   */
  static async loadFromURL(
    url: string,
    onProgress: (progress: number) => void
  ): Promise<EnhancedGeometryData> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to load geometry: ${response.statusText}`);
    }

    const contentLength = response.headers.get('Content-Length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const chunks: Uint8Array[] = [];
    let receivedLength = 0;

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      chunks.push(value);
      receivedLength += value.length;

      if (total > 0) {
        onProgress(receivedLength / total);
      }
    }

    // Combine chunks
    const allChunks = new Uint8Array(receivedLength);
    let position = 0;
    for (const chunk of chunks) {
      allChunks.set(chunk, position);
      position += chunk.length;
    }

    // Parse JSON
    const jsonString = new TextDecoder().decode(allChunks);
    const data = JSON.parse(jsonString);

    // Reconstruct geometry
    return {
      vertices: [],
      faces: [],
      vertexCount: data.vertexCount,
      faceCount: data.faceCount,
      positionsArray: data.positions ? new Float32Array(data.positions) : undefined,
      normalsArray: data.normals ? new Float32Array(data.normals) : undefined,
      uvsArray: data.uvs ? new Float32Array(data.uvs) : undefined,
      colorsArray: data.colors ? new Float32Array(data.colors) : undefined,
      indicesArray: data.indices ? new Uint32Array(data.indices) : undefined,
      attributes: {
        vertex: new Map(data.attributes?.vertex || []),
        edge: new Map(data.attributes?.edge || []),
        face: new Map(data.attributes?.face || []),
        corner: new Map(data.attributes?.corner || []),
      },
    };
  }
}

/**
 * Geometry chunk definition
 */
export interface GeometryChunk {
  chunkIndex: number;
  totalChunks: number;
  vertexRange: [number, number];
  geometry: EnhancedGeometryData;
  progress: number;
}
