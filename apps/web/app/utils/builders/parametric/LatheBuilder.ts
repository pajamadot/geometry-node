import * as pc from 'playcanvas';
import { EnhancedGeometryData, GeometryBuilder } from '../GeometryBuilder';

export interface LatheBuilderParams {
  points?: pc.Vec2[];
  segments?: number;
}

export class LatheBuilder extends GeometryBuilder {
  constructor(params: LatheBuilderParams = {}) {
    super();
    // Placeholder logic
  }
  
  static create(params: LatheBuilderParams = {}): EnhancedGeometryData {
    return new LatheBuilder(params).build();
  }
}
