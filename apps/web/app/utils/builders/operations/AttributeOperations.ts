import * as pc from 'playcanvas';
import { EnhancedGeometryData } from '../GeometryBuilder';
import { AttributeData, AttributeUtils } from '../../../types/geometry';

/**
 * AttributeOperations - Contextual attribute manipulation
 */
export class AttributeOperations {
  /**
   * Create a selection attribute based on position
   */
  static selectByPosition(
    geometry: EnhancedGeometryData,
    predicate: (pos: pc.Vec3) => boolean
  ): EnhancedGeometryData {
    if (!geometry.positionsArray) {
      return geometry;
    }

    const positions = geometry.positionsArray;
    const selection = AttributeUtils.createAttribute('selection', 'bool', geometry.vertexCount, false);
    const pos = new pc.Vec3();

    for (let i = 0; i < geometry.vertexCount; i++) {
      pos.set(
        positions[i * 3],
        positions[i * 3 + 1],
        positions[i * 3 + 2]
      );

      if (predicate(pos)) {
        AttributeUtils.setAttributeValue(selection, i, true);
      }
    }

    const result = { ...geometry };
    result.attributes.vertex.set('selection', selection);

    return result;
  }

  /**
   * Color vertices by height (Y position)
   */
  static colorByHeight(
    geometry: EnhancedGeometryData,
    minColor: pc.Color,
    maxColor: pc.Color
  ): EnhancedGeometryData {
    if (!geometry.positionsArray) {
      return geometry;
    }

    const positions = geometry.positionsArray;

    // Find Y bounds
    let minY = Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < geometry.vertexCount; i++) {
      const y = positions[i * 3 + 1];
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }

    const range = maxY - minY;
    const colors = new Float32Array(geometry.vertexCount * 4);
    const tempColor = new pc.Color();

    for (let i = 0; i < geometry.vertexCount; i++) {
      const y = positions[i * 3 + 1];
      const t = range > 0 ? (y - minY) / range : 0;

      // Lerp: result = a + (b - a) * t
      tempColor.r = minColor.r + (maxColor.r - minColor.r) * t;
      tempColor.g = minColor.g + (maxColor.g - minColor.g) * t;
      tempColor.b = minColor.b + (maxColor.b - minColor.b) * t;
      tempColor.a = minColor.a + (maxColor.a - minColor.a) * t;

      colors[i * 4] = tempColor.r;
      colors[i * 4 + 1] = tempColor.g;
      colors[i * 4 + 2] = tempColor.b;
      colors[i * 4 + 3] = tempColor.a;
    }

    const result = { ...geometry };
    result.colorsArray = colors;

    return result;
  }

  /**
   * Color vertices by normal direction
   */
  static colorByNormal(geometry: EnhancedGeometryData): EnhancedGeometryData {
    if (!geometry.normalsArray) {
      return geometry;
    }

    const normals = geometry.normalsArray;
    const colors = new Float32Array(geometry.vertexCount * 4);

    for (let i = 0; i < geometry.vertexCount; i++) {
      const nx = normals[i * 3];
      const ny = normals[i * 3 + 1];
      const nz = normals[i * 3 + 2];

      // Map normal direction to RGB
      colors[i * 4] = (nx + 1) / 2;
      colors[i * 4 + 1] = (ny + 1) / 2;
      colors[i * 4 + 2] = (nz + 1) / 2;
      colors[i * 4 + 3] = 1.0;
    }

    const result = { ...geometry };
    result.colorsArray = colors;

    return result;
  }
  // ... other methods (scaleByAttribute, randomizeAttribute, etc.) converted similarly if needed
}
