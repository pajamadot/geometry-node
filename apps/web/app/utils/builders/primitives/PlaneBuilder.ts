import { GeometryBuilder, EnhancedGeometryData } from '../GeometryBuilder';

export interface PlaneBuilderParams {
  width?: number;
  height?: number;
  widthSegments?: number;
  heightSegments?: number;
}

/**
 * PlaneBuilder - Creates subdivided plane geometries
 */
export class PlaneBuilder extends GeometryBuilder {
  constructor(params: PlaneBuilderParams = {}) {
    super();
    this.generatePlane(params);
  }

  private generatePlane(params: PlaneBuilderParams): void {
    const {
      width = 1,
      height = 1,
      widthSegments = 1,
      heightSegments = 1,
    } = params;

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const widthHalf = width / 2;
    const heightHalf = height / 2;

    const gridX = widthSegments;
    const gridY = heightSegments;

    const gridX1 = gridX + 1;
    const gridY1 = gridY + 1;

    const segmentWidth = width / gridX;
    const segmentHeight = height / gridY;

    // Generate vertices, normals, and uvs
    for (let iy = 0; iy < gridY1; iy++) {
      const y = iy * segmentHeight - heightHalf;

      for (let ix = 0; ix < gridX1; ix++) {
        const x = ix * segmentWidth - widthHalf;

        positions.push(x, 0, -y);
        normals.push(0, 1, 0);
        uvs.push(ix / gridX, iy / gridY);
      }
    }

    // Generate indices
    for (let iy = 0; iy < gridY; iy++) {
      for (let ix = 0; ix < gridX; ix++) {
        const a = ix + gridX1 * iy;
        const b = ix + gridX1 * (iy + 1);
        const c = ix + 1 + gridX1 * (iy + 1);
        const d = ix + 1 + gridX1 * iy;

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    this.setPositions(positions);
    this.setNormals(normals);
    this.setUVs(uvs);
    this.setIndices(indices);
  }

  /**
   * Static factory method
   */
  static create(params: PlaneBuilderParams = {}): EnhancedGeometryData {
    return new PlaneBuilder(params).build();
  }
}
