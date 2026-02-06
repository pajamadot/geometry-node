import { GeometryBuilder, EnhancedGeometryData } from '../GeometryBuilder';

export interface CylinderBuilderParams {
  radiusTop?: number;
  radiusBottom?: number;
  height?: number;
  radialSegments?: number;
  heightSegments?: number;
  openEnded?: boolean;
  thetaStart?: number;
  thetaLength?: number;
}

/**
 * CylinderBuilder - Creates cylinder/cone geometries with caps
 */
export class CylinderBuilder extends GeometryBuilder {
  constructor(params: CylinderBuilderParams = {}) {
    super();
    this.generateCylinder(params);
  }

  private generateCylinder(params: CylinderBuilderParams): void {
    const {
      radiusTop = 1,
      radiusBottom = 1,
      height = 2,
      radialSegments = 32,
      heightSegments = 1,
      openEnded = false,
      thetaStart = 0,
      thetaLength = Math.PI * 2,
    } = params;

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    let index = 0;
    const indexArray: number[][] = [];
    const halfHeight = height / 2;

    // Generate torso
    for (let y = 0; y <= heightSegments; y++) {
      const indexRow: number[] = [];
      const v = y / heightSegments;
      const radius = v * (radiusBottom - radiusTop) + radiusTop;

      for (let x = 0; x <= radialSegments; x++) {
        const u = x / radialSegments;
        const theta = u * thetaLength + thetaStart;

        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        // Position
        const px = radius * sinTheta;
        const py = -v * height + halfHeight;
        const pz = radius * cosTheta;

        positions.push(px, py, pz);

        // Normal
        const slope = (radiusBottom - radiusTop) / height;
        const normal = new Float32Array([
          sinTheta,
          slope,
          cosTheta,
        ]);
        const normalLength = Math.sqrt(
          normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]
        );
        normals.push(
          normal[0] / normalLength,
          normal[1] / normalLength,
          normal[2] / normalLength
        );

        // UV
        uvs.push(u, 1 - v);

        indexRow.push(index++);
      }

      indexArray.push(indexRow);
    }

    // Generate torso indices
    for (let y = 0; y < heightSegments; y++) {
      for (let x = 0; x < radialSegments; x++) {
        const a = indexArray[y][x];
        const b = indexArray[y + 1][x];
        const c = indexArray[y + 1][x + 1];
        const d = indexArray[y][x + 1];

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    // Generate caps
    if (!openEnded) {
      // Top cap
      if (radiusTop > 0) {
        this.generateCap(
          true,
          radiusTop,
          halfHeight,
          radialSegments,
          thetaStart,
          thetaLength,
          positions,
          normals,
          uvs,
          indices,
          index
        );
        index += radialSegments + 2;
      }

      // Bottom cap
      if (radiusBottom > 0) {
        this.generateCap(
          false,
          radiusBottom,
          -halfHeight,
          radialSegments,
          thetaStart,
          thetaLength,
          positions,
          normals,
          uvs,
          indices,
          index
        );
      }
    }

    this.setPositions(positions);
    this.setNormals(normals);
    this.setUVs(uvs);
    this.setIndices(indices);
  }

  private generateCap(
    top: boolean,
    radius: number,
    y: number,
    radialSegments: number,
    thetaStart: number,
    thetaLength: number,
    positions: number[],
    normals: number[],
    uvs: number[],
    indices: number[],
    indexStart: number
  ): void {
    const centerIndex = indexStart;
    const sign = top ? 1 : -1;

    // Center vertex
    positions.push(0, y, 0);
    normals.push(0, sign, 0);
    uvs.push(0.5, 0.5);
    indexStart++;

    // Ring vertices
    for (let x = 0; x <= radialSegments; x++) {
      const u = x / radialSegments;
      const theta = u * thetaLength + thetaStart;

      const cosTheta = Math.cos(theta);
      const sinTheta = Math.sin(theta);

      const px = radius * sinTheta;
      const pz = radius * cosTheta;

      positions.push(px, y, pz);
      normals.push(0, sign, 0);

      uvs.push(cosTheta * 0.5 + 0.5, sinTheta * 0.5 * sign + 0.5);
    }

    // Generate indices
    for (let x = 0; x < radialSegments; x++) {
      const c = centerIndex;
      const i = indexStart + x;
      const j = indexStart + x + 1;

      if (top) {
        indices.push(i, c, j);
      } else {
        indices.push(c, i, j);
      }
    }
  }

  /**
   * Static factory method
   */
  static create(params: CylinderBuilderParams = {}): EnhancedGeometryData {
    return new CylinderBuilder(params).build();
  }
}
