import { GeometryBuilder, EnhancedGeometryData } from '../GeometryBuilder';

export interface GridBuilderParams {
  width?: number;
  height?: number;
  widthDivisions?: number;
  heightDivisions?: number;
}

/**
 * GridBuilder - Creates subdivided grid geometries for terrain/meshes
 */
export class GridBuilder extends GeometryBuilder {
  constructor(params: GridBuilderParams = {}) {
    super();
    this.generateGrid(params);
  }

  private generateGrid(params: GridBuilderParams): void {
    const {
      width = 10,
      height = 10,
      widthDivisions = 10,
      heightDivisions = 10,
    } = params;

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const widthHalf = width / 2;
    const heightHalf = height / 2;

    const gridX = widthDivisions;
    const gridY = heightDivisions;

    const gridX1 = gridX + 1;
    const gridY1 = gridY + 1;

    const segmentWidth = width / gridX;
    const segmentHeight = height / gridY;

    // Generate vertices
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
  static create(params: GridBuilderParams = {}): EnhancedGeometryData {
    return new GridBuilder(params).build();
  }
}
