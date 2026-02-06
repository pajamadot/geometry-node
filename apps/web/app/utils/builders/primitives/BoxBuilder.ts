import { GeometryBuilder, EnhancedGeometryData } from '../GeometryBuilder';

export interface BoxBuilderParams {
  width?: number;
  height?: number;
  depth?: number;
  widthSegments?: number;
  heightSegments?: number;
  depthSegments?: number;
}

/**
 * BoxBuilder - Creates box/cube geometries with optional segmentation
 */
export class BoxBuilder extends GeometryBuilder {
  constructor(params: BoxBuilderParams = {}) {
    super();
    this.generateBox(params);
  }

  private generateBox(params: BoxBuilderParams): void {
    const {
      width = 1,
      height = 1,
      depth = 1,
      widthSegments = 1,
      heightSegments = 1,
      depthSegments = 1,
    } = params;

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    let vertexCount = 0;

    // Helper to add a plane
    const addPlane = (
      corner: [number, number, number],
      uDir: [number, number, number],
      vDir: [number, number, number],
      normal: [number, number, number],
      uSegments: number,
      vSegments: number,
      uSize: number,
      vSize: number
    ) => {
      const startVertex = vertexCount;

      for (let v = 0; v <= vSegments; v++) {
        for (let u = 0; u <= uSegments; u++) {
          const uRatio = u / uSegments;
          const vRatio = v / vSegments;

          // Position
          positions.push(
            corner[0] + uDir[0] * uRatio * uSize + vDir[0] * vRatio * vSize,
            corner[1] + uDir[1] * uRatio * uSize + vDir[1] * vRatio * vSize,
            corner[2] + uDir[2] * uRatio * uSize + vDir[2] * vRatio * vSize
          );

          // Normal
          normals.push(normal[0], normal[1], normal[2]);

          // UV
          uvs.push(uRatio, 1 - vRatio);

          vertexCount++;
        }
      }

      // Indices
      for (let v = 0; v < vSegments; v++) {
        for (let u = 0; u < uSegments; u++) {
          const a = startVertex + v * (uSegments + 1) + u;
          const b = a + 1;
          const c = a + (uSegments + 1);
          const d = c + 1;

          indices.push(a, b, d);
          indices.push(a, d, c);
        }
      }
    };

    const w2 = width / 2;
    const h2 = height / 2;
    const d2 = depth / 2;

    // Front face (+Z)
    addPlane(
      [-w2, -h2, d2],
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
      widthSegments,
      heightSegments,
      width,
      height
    );

    // Back face (-Z)
    addPlane(
      [w2, -h2, -d2],
      [-1, 0, 0],
      [0, 1, 0],
      [0, 0, -1],
      widthSegments,
      heightSegments,
      width,
      height
    );

    // Right face (+X)
    addPlane(
      [w2, -h2, d2],
      [0, 0, -1],
      [0, 1, 0],
      [1, 0, 0],
      depthSegments,
      heightSegments,
      depth,
      height
    );

    // Left face (-X)
    addPlane(
      [-w2, -h2, -d2],
      [0, 0, 1],
      [0, 1, 0],
      [-1, 0, 0],
      depthSegments,
      heightSegments,
      depth,
      height
    );

    // Top face (+Y)
    addPlane(
      [-w2, h2, d2],
      [1, 0, 0],
      [0, 0, -1],
      [0, 1, 0],
      widthSegments,
      depthSegments,
      width,
      depth
    );

    // Bottom face (-Y)
    addPlane(
      [-w2, -h2, -d2],
      [1, 0, 0],
      [0, 0, 1],
      [0, -1, 0],
      widthSegments,
      depthSegments,
      width,
      depth
    );

    this.setPositions(positions);
    this.setNormals(normals);
    this.setUVs(uvs);
    this.setIndices(indices);
  }

  /**
   * Static factory method
   */
  static create(params: BoxBuilderParams = {}): EnhancedGeometryData {
    return new BoxBuilder(params).build();
  }
}
