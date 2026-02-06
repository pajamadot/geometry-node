import * as pc from 'playcanvas';
import { EnhancedGeometryData, GeometryBuilder } from '../GeometryBuilder';

export interface TubeBuilderParams {
  path?: pc.Vec3[];
  radius?: number;
  segments?: number;
  radiusSegments?: number;
}

export class TubeBuilder extends GeometryBuilder {
  constructor(params: TubeBuilderParams = {}) {
    super();
    // Placeholder logic
  }
  
  static create(params: TubeBuilderParams = {}): EnhancedGeometryData {
    return new TubeBuilder(params).build();
  }
}
