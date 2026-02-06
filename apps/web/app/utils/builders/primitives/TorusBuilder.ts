import { GeometryBuilder, EnhancedGeometryData } from '../GeometryBuilder';

export interface TorusBuilderParams {
  radius?: number;
  tube?: number;
  radialSegments?: number;
  tubularSegments?: number;
  arc?: number;
}

/**
 * TorusBuilder - Creates torus (donut) geometries
 */
export class TorusBuilder extends GeometryBuilder {
  constructor(params: TorusBuilderParams = {}) {
    super();
    this.generateTorus(params);
  }

  private generateTorus(params: TorusBuilderParams): void {
    const {
      radius = 1,
      tube = 0.4,
      radialSegments = 12,
      tubularSegments = 48,
      arc = Math.PI * 2,
    } = params;

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let j = 0; j <= radialSegments; j++) {
      for (let i = 0; i <= tubularSegments; i++) {
        const u = (i / tubularSegments) * arc;
        const v = (j / radialSegments) * Math.PI * 2;

        // Position
        const x = (radius + tube * Math.cos(v)) * Math.cos(u);
        const y = (radius + tube * Math.cos(v)) * Math.sin(u);
        const z = tube * Math.sin(v);

        positions.push(x, y, z);

        // Normal
        const centerX = radius * Math.cos(u);
        const centerY = radius * Math.sin(u);
        const nx = x - centerX;
        const ny = y - centerY;
        const nz = z;
        const length = Math.sqrt(nx * nx + ny * ny + nz * nz);

        normals.push(nx / length, ny / length, nz / length);

        // UV
        uvs.push(i / tubularSegments, j / radialSegments);
      }
    }

    // Generate indices
    for (let j = 1; j <= radialSegments; j++) {
      for (let i = 1; i <= tubularSegments; i++) {
        const a = (tubularSegments + 1) * j + i - 1;
        const b = (tubularSegments + 1) * (j - 1) + i - 1;
        const c = (tubularSegments + 1) * (j - 1) + i;
        const d = (tubularSegments + 1) * j + i;

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
  static create(params: TorusBuilderParams = {}): EnhancedGeometryData {
    return new TorusBuilder(params).build();
  }
}
