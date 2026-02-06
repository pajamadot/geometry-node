import { CylinderBuilder, CylinderBuilderParams } from './CylinderBuilder';
import { EnhancedGeometryData } from '../GeometryBuilder';

export interface ConeBuilderParams {
  radius?: number;
  height?: number;
  radialSegments?: number;
  heightSegments?: number;
  openEnded?: boolean;
  thetaStart?: number;
  thetaLength?: number;
}

/**
 * ConeBuilder - Creates cone geometries (cylinder with radiusTop = 0)
 */
export class ConeBuilder extends CylinderBuilder {
  constructor(params: ConeBuilderParams = {}) {
    const {
      radius = 1,
      height = 2,
      radialSegments = 32,
      heightSegments = 1,
      openEnded = false,
      thetaStart = 0,
      thetaLength = Math.PI * 2,
    } = params;

    // Cone is a cylinder with radiusTop = 0
    super({
      radiusTop: 0,
      radiusBottom: radius,
      height,
      radialSegments,
      heightSegments,
      openEnded,
      thetaStart,
      thetaLength,
    });
  }

  /**
   * Static factory method
   */
  static create(params: ConeBuilderParams = {}): EnhancedGeometryData {
    return new ConeBuilder(params).build();
  }
}
