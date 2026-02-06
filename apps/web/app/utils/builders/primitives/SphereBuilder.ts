import { GeometryBuilder, EnhancedGeometryData } from '../GeometryBuilder';

export interface SphereBuilderParams {
  radius?: number;
  widthSegments?: number;
  heightSegments?: number;
  phiStart?: number;
  phiLength?: number;
  thetaStart?: number;
  thetaLength?: number;
}

/**
 * SphereBuilder - Creates sphere geometries with UV mapping
 */
export class SphereBuilder extends GeometryBuilder {
  constructor(params: SphereBuilderParams = {}) {
    super();
    this.generateSphere(params);
  }

  private generateSphere(params: SphereBuilderParams): void {
    const {
      radius = 1,
      widthSegments = 32,
      heightSegments = 16,
      phiStart = 0,
      phiLength = Math.PI * 2,
      thetaStart = 0,
      thetaLength = Math.PI,
    } = params;

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    let index = 0;
    const grid: number[][] = [];

    // Generate vertices, normals, and uvs
    for (let iy = 0; iy <= heightSegments; iy++) {
      const verticesRow: number[] = [];
      const v = iy / heightSegments;

      // Special case for poles
      let uOffset = 0;
      if (iy === 0 && thetaStart === 0) {
        uOffset = 0.5 / widthSegments;
      } else if (iy === heightSegments && thetaStart + thetaLength === Math.PI) {
        uOffset = -0.5 / widthSegments;
      }

      for (let ix = 0; ix <= widthSegments; ix++) {
        const u = ix / widthSegments;

        // Position
        const px =
          -radius *
          Math.cos(phiStart + u * phiLength) *
          Math.sin(thetaStart + v * thetaLength);
        const py = radius * Math.cos(thetaStart + v * thetaLength);
        const pz =
          radius *
          Math.sin(phiStart + u * phiLength) *
          Math.sin(thetaStart + v * thetaLength);

        positions.push(px, py, pz);

        // Normal (normalized position for sphere)
        const length = Math.sqrt(px * px + py * py + pz * pz);
        normals.push(px / length, py / length, pz / length);

        // UV
        uvs.push(u + uOffset, 1 - v);

        verticesRow.push(index++);
      }

      grid.push(verticesRow);
    }

    // Generate indices
    for (let iy = 0; iy < heightSegments; iy++) {
      for (let ix = 0; ix < widthSegments; ix++) {
        const a = grid[iy][ix + 1];
        const b = grid[iy][ix];
        const c = grid[iy + 1][ix];
        const d = grid[iy + 1][ix + 1];

        if (iy !== 0 || thetaStart > 0) indices.push(a, b, d);
        if (iy !== heightSegments - 1 || thetaStart + thetaLength < Math.PI)
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
  static create(params: SphereBuilderParams = {}): EnhancedGeometryData {
    return new SphereBuilder(params).build();
  }
}
