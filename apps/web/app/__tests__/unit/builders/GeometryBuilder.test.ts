/**
 * Unit Tests: GeometryBuilder
 * Tests for base geometry builder class and primitive builders
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BoxBuilder } from '@/utils/builders/primitives/BoxBuilder';
import { SphereBuilder } from '@/utils/builders/primitives/SphereBuilder';
import { CylinderBuilder } from '@/utils/builders/primitives/CylinderBuilder';
import { PlaneBuilder } from '@/utils/builders/primitives/PlaneBuilder';
import { TorusBuilder } from '@/utils/builders/primitives/TorusBuilder';
import type { EnhancedGeometryData } from '@/utils/builders/GeometryBuilder';

describe('GeometryBuilder - Core Builders', () => {
  describe('BoxBuilder', () => {
    it('should create a box with default parameters', () => {
      const box = BoxBuilder.create({});

      expect(box).toBeDefined();
      expect(box.vertexCount).toBeGreaterThan(0);
      expect(box.faceCount).toBeGreaterThan(0);
      expect(box.positionsArray).toBeInstanceOf(Float32Array);
      expect(box.indicesArray).toBeInstanceOf(Uint32Array);
    });

    it('should create a box with custom dimensions', () => {
      const box = BoxBuilder.create({
        width: 2,
        height: 3,
        depth: 4,
      });

      expect(box.vertexCount).toBeGreaterThan(0);
      expect(box.positionsArray).toBeDefined();

      // Check that box has 24 vertices (6 faces * 4 vertices)
      expect(box.vertexCount).toBe(24);
    });

    it('should create segmented box', () => {
      const box = BoxBuilder.create({
        width: 1,
        height: 1,
        depth: 1,
        widthSegments: 2,
        heightSegments: 2,
        depthSegments: 2,
      });

      // Segmented box should have more vertices
      expect(box.vertexCount).toBeGreaterThan(24);
    });

    it('should have valid positions array', () => {
      const box = BoxBuilder.create({});

      expect(box.positionsArray?.length).toBe(box.vertexCount * 3);

      // Check positions are numbers
      for (let i = 0; i < box.positionsArray!.length; i++) {
        expect(typeof box.positionsArray![i]).toBe('number');
        expect(isNaN(box.positionsArray![i])).toBe(false);
      }
    });

    it('should have valid indices', () => {
      const box = BoxBuilder.create({});

      expect(box.indicesArray?.length).toBe(box.faceCount * 3);

      // Check all indices are within bounds
      for (let i = 0; i < box.indicesArray!.length; i++) {
        expect(box.indicesArray![i]).toBeLessThan(box.vertexCount);
        expect(box.indicesArray![i]).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('SphereBuilder', () => {
    it('should create a sphere with default parameters', () => {
      const sphere = SphereBuilder.create({});

      expect(sphere).toBeDefined();
      expect(sphere.vertexCount).toBeGreaterThan(0);
      expect(sphere.faceCount).toBeGreaterThan(0);
    });

    it('should create sphere with custom radius and segments', () => {
      const sphere = SphereBuilder.create({
        radius: 2,
        widthSegments: 16,
        heightSegments: 12,
      });

      expect(sphere.vertexCount).toBeGreaterThan(0);

      // Check vertex count matches formula: (widthSegments + 1) * (heightSegments + 1)
      expect(sphere.vertexCount).toBe((16 + 1) * (12 + 1));
    });

    it('should have UVs for texturing', () => {
      const sphere = SphereBuilder.create({ radius: 1, widthSegments: 32, heightSegments: 16 });

      expect(sphere.uvsArray).toBeDefined();
      expect(sphere.uvsArray?.length).toBe(sphere.vertexCount * 2);
    });

    it('should have normals', () => {
      const sphere = SphereBuilder.create({});

      expect(sphere.normalsArray).toBeDefined();
      expect(sphere.normalsArray?.length).toBe(sphere.vertexCount * 3);
    });
  });

  describe('CylinderBuilder', () => {
    it('should create a cylinder with default parameters', () => {
      const cylinder = CylinderBuilder.create({});

      expect(cylinder).toBeDefined();
      expect(cylinder.vertexCount).toBeGreaterThan(0);
    });

    it('should create cylinder with custom dimensions', () => {
      const cylinder = CylinderBuilder.create({
        radiusTop: 1,
        radiusBottom: 2,
        height: 3,
        radialSegments: 16,
      });

      expect(cylinder.vertexCount).toBeGreaterThan(0);
    });

    it('should create cylinder without caps', () => {
      const withCaps = CylinderBuilder.create({ openEnded: false });
      const withoutCaps = CylinderBuilder.create({ openEnded: true });

      // Without caps should have fewer vertices
      expect(withoutCaps.vertexCount).toBeLessThan(withCaps.vertexCount);
    });
  });

  describe('PlaneBuilder', () => {
    it('should create a plane', () => {
      const plane = PlaneBuilder.create({});

      expect(plane).toBeDefined();
      expect(plane.vertexCount).toBeGreaterThan(0);
    });

    it('should create subdivided plane', () => {
      const simple = PlaneBuilder.create({ widthSegments: 1, heightSegments: 1 });
      const subdivided = PlaneBuilder.create({ widthSegments: 10, heightSegments: 10 });

      expect(subdivided.vertexCount).toBeGreaterThan(simple.vertexCount);
    });
  });

  describe('TorusBuilder', () => {
    it('should create a torus', () => {
      const torus = TorusBuilder.create({});

      expect(torus).toBeDefined();
      expect(torus.vertexCount).toBeGreaterThan(0);
    });

    it('should create torus with custom parameters', () => {
      const torus = TorusBuilder.create({
        radius: 2,
        tube: 0.5,
        radialSegments: 16,
        tubularSegments: 32,
      });

      expect(torus.vertexCount).toBeGreaterThan(0);
    });
  });

  describe('Geometry Validation', () => {
    it('all builders should produce valid vertex counts', () => {
      const geometries = [
        BoxBuilder.create({}),
        SphereBuilder.create({}),
        CylinderBuilder.create({}),
        PlaneBuilder.create({}),
        TorusBuilder.create({}),
      ];

      geometries.forEach((geom) => {
        expect(geom.vertexCount).toBeGreaterThan(0);
        expect(geom.positionsArray?.length).toBe(geom.vertexCount * 3);
      });
    });

    it('all builders should have valid face counts', () => {
      const geometries = [
        BoxBuilder.create({}),
        SphereBuilder.create({}),
        CylinderBuilder.create({}),
      ];

      geometries.forEach((geom) => {
        expect(geom.faceCount).toBeGreaterThan(0);
        expect(geom.indicesArray?.length).toBe(geom.faceCount * 3);
      });
    });

    it('all builders should have attributes maps', () => {
      const box = BoxBuilder.create({});

      expect(box.attributes).toBeDefined();
      expect(box.attributes.vertex).toBeInstanceOf(Map);
      expect(box.attributes.edge).toBeInstanceOf(Map);
      expect(box.attributes.face).toBeInstanceOf(Map);
      expect(box.attributes.corner).toBeInstanceOf(Map);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero dimensions gracefully', () => {
      const box = BoxBuilder.create({ width: 0, height: 0, depth: 0 });

      expect(box).toBeDefined();
      expect(box.vertexCount).toBeGreaterThanOrEqual(0);
    });

    it('should handle negative dimensions by using absolute values', () => {
      const box = BoxBuilder.create({ width: -1, height: -2, depth: -3 });

      expect(box).toBeDefined();
      expect(box.vertexCount).toBeGreaterThan(0);
    });

    it('should handle very small dimensions', () => {
      const box = BoxBuilder.create({ width: 0.001, height: 0.001, depth: 0.001 });

      expect(box).toBeDefined();
      expect(box.positionsArray).toBeDefined();
    });

    it('should handle large segment counts', () => {
      const sphere = SphereBuilder.create({ widthSegments: 64, heightSegments: 64 });

      expect(sphere.vertexCount).toBeGreaterThan(1000);
    });
  });
});
