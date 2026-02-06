/**
 * Integration Tests: Geometry Pipeline
 * End-to-end tests for complete geometry workflows
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BoxBuilder } from '@/utils/builders/primitives/BoxBuilder';
import { SphereBuilder } from '@/utils/builders/primitives/SphereBuilder';
import { GeometryOperations } from '@/utils/builders/operations/GeometryOperations';
import { AttributeOperations } from '@/utils/builders/operations/AttributeOperations';
import { VertexDataUtils } from '@/utils/builders/VertexDataUtils';
import * as THREE from 'three';

describe('Geometry Pipeline - End-to-End', () => {
  describe('Box Creation → Subdivision → Displacement', () => {
    it('should create, subdivide, and displace a box', () => {
      // Step 1: Create a box
      const box = BoxBuilder.create({ width: 2, height: 2, depth: 2 });
      expect(box.vertexCount).toBe(24);

      // Step 2: Subdivide for more detail
      const subdivided = GeometryOperations.subdivide(box, 1);
      expect(subdivided.vertexCount).toBeGreaterThan(box.vertexCount);

      // Step 3: Apply displacement
      const displaced = GeometryOperations.displace(subdivided, 0.5, 0.1, 42);
      expect(displaced.vertexCount).toBe(subdivided.vertexCount);
      expect(displaced.positionsArray).toBeDefined();
    });
  });

  describe('Multiple Geometry Merge → Transform', () => {
    it('should merge multiple geometries and transform them', () => {
      // Step 1: Create multiple geometries
      const box1 = BoxBuilder.create({ width: 1 });
      const box2 = BoxBuilder.create({ width: 1 });
      const sphere = SphereBuilder.create({ radius: 0.5 });

      // Step 2: Merge them
      const merged = VertexDataUtils.merge([box1, box2, sphere]);
      expect(merged.vertexCount).toBe(
        box1.vertexCount + box2.vertexCount + sphere.vertexCount
      );

      // Step 3: Transform the merged geometry
      const matrix = new THREE.Matrix4();
      const transformed = VertexDataUtils.transform(merged, matrix);
      expect(transformed.vertexCount).toBe(merged.vertexCount);
    });
  });

  describe('Sphere → Subdivide → Color → Optimize', () => {
    it('should create detailed, colored sphere and optimize it', () => {
      // Step 1: Create sphere
      const sphere = SphereBuilder.create({ radius: 1, widthSegments: 8, heightSegments: 6 });

      // Step 2: Subdivide for more detail
      const subdivided = GeometryOperations.subdivide(sphere, 1);
      expect(subdivided.vertexCount).toBeGreaterThan(sphere.vertexCount);

      // Step 3: Add colors based on height
      const colored = AttributeOperations.colorByHeight(
        subdivided,
        new THREE.Color(0x0000ff),
        new THREE.Color(0xff0000)
      );
      expect(colored.colorsArray).toBeDefined();
      expect(colored.colorsArray?.length).toBe(colored.vertexCount * 4);

      // Step 4: Optimize
      const optimized = VertexDataUtils.optimize(colored);
      expect(optimized.vertexCount).toBeLessThanOrEqual(colored.vertexCount);
    });
  });

  describe('Box → Twist → Taper → Scale', () => {
    it('should apply multiple deformation operations', () => {
      // Step 1: Create tall box
      const box = BoxBuilder.create({ width: 1, height: 4, depth: 1 });

      // Step 2: Twist it
      const twisted = GeometryOperations.twist(box, Math.PI / 4, 'y');
      expect(twisted.vertexCount).toBe(box.vertexCount);

      // Step 3: Taper it
      const tapered = GeometryOperations.taper(twisted, 0.5, 'y');
      expect(tapered.vertexCount).toBe(twisted.vertexCount);

      // Step 4: Scale it
      const scaled = VertexDataUtils.scale(tapered, 2, 2, 2);
      expect(scaled.vertexCount).toBe(tapered.vertexCount);
      expect(scaled.positionsArray).toBeDefined();
    });
  });

  describe('Clone → Modify → Verify Original Unchanged', () => {
    it('should not affect original geometry when cloning', () => {
      // Step 1: Create original
      const original = BoxBuilder.create({ width: 1 });
      const originalVertexCount = original.vertexCount;
      const originalPositions = original.positionsArray
        ? new Float32Array(original.positionsArray)
        : null;

      // Step 2: Clone
      const cloned = VertexDataUtils.clone(original);

      // Step 3: Modify clone
      const displaced = GeometryOperations.displace(cloned, 1.0, 0.2, 123);

      // Step 4: Verify original unchanged
      expect(original.vertexCount).toBe(originalVertexCount);
      if (originalPositions && original.positionsArray) {
        expect(original.positionsArray).toEqual(originalPositions);
      }

      // Step 5: Verify clone changed
      expect(displaced.vertexCount).toBe(originalVertexCount);
      if (displaced.positionsArray && originalPositions) {
        let hasChanged = false;
        for (let i = 0; i < displaced.positionsArray.length; i++) {
          if (Math.abs(displaced.positionsArray[i] - originalPositions[i]) > 0.0001) {
            hasChanged = true;
            break;
          }
        }
        expect(hasChanged).toBe(true);
      }
    });
  });

  describe('Extrude → Bend → Color by Normal', () => {
    it('should create complex extruded and bent geometry', () => {
      // Step 1: Create base geometry
      const box = BoxBuilder.create({ width: 2, height: 0.5, depth: 2 });

      // Step 2: Extrude upward
      const extruded = GeometryOperations.extrude(box, new THREE.Vector3(0, 2, 0));
      expect(extruded.vertexCount).toBeGreaterThanOrEqual(box.vertexCount);

      // Step 3: Bend it
      const bent = GeometryOperations.bend(extruded, Math.PI / 6, 'y');
      expect(bent.vertexCount).toBe(extruded.vertexCount);

      // Step 4: Color by normal direction
      // Recompute normals after bending
      const bentWithNormals = VertexDataUtils.computeNormals(bent);
      const colored = AttributeOperations.colorByNormal(bentWithNormals);
      expect(colored.colorsArray).toBeDefined();
    });
  });

  describe('Multiple Transforms Composition', () => {
    it('should apply multiple transformations in sequence', () => {
      // Step 1: Create geometry
      const sphere = SphereBuilder.create({ radius: 1 });

      // Step 2: Translate
      const translated = VertexDataUtils.translate(sphere, 5, 0, 0);

      // Step 3: Scale
      const scaled = VertexDataUtils.scale(translated, 2, 2, 2);

      // Step 4: Translate again
      const final = VertexDataUtils.translate(scaled, 0, 10, 0);

      expect(final.vertexCount).toBe(sphere.vertexCount);
      expect(final.positionsArray).toBeDefined();
    });
  });

  describe('Complex Pipeline: Build → Process → Optimize → Export Ready', () => {
    it('should complete full production pipeline', () => {
      // Step 1: Create base geometry
      const base = BoxBuilder.create({ width: 2, height: 2, depth: 2, segments: 2 });

      // Step 2: Subdivide for detail
      const detailed = GeometryOperations.subdivide(base, 2);

      // Step 3: Apply artistic deformation
      const twisted = GeometryOperations.twist(detailed, Math.PI / 2, 'y');
      const displaced = GeometryOperations.displace(twisted, 0.3, 0.15, 42);

      // Step 4: Add attributes
      const colored = AttributeOperations.colorByHeight(
        displaced,
        new THREE.Color(0x1a1a1a),
        new THREE.Color(0xffffff)
      );

      // Step 5: Optimize for export
      const optimized = VertexDataUtils.optimize(colored);
      const withNormals = VertexDataUtils.computeNormals(optimized);

      // Verify final result
      expect(withNormals.vertexCount).toBeGreaterThan(0);
      expect(withNormals.positionsArray).toBeDefined();
      expect(withNormals.normalsArray).toBeDefined();
      expect(withNormals.colorsArray).toBeDefined();
      expect(withNormals.indicesArray).toBeDefined();

      // Verify geometry is valid for export
      expect(withNormals.positionsArray?.length).toBe(withNormals.vertexCount * 3);
      expect(withNormals.colorsArray?.length).toBe(withNormals.vertexCount * 4);
      expect(withNormals.indicesArray?.length).toBe(withNormals.faceCount * 3);
    });
  });

  describe('Performance: Large Geometry Processing', () => {
    it('should handle large geometries efficiently', () => {
      // Create high-poly sphere
      const sphere = SphereBuilder.create({
        radius: 2,
        widthSegments: 32,
        heightSegments: 24,
      });

      expect(sphere.vertexCount).toBeGreaterThan(500);

      // Apply operations
      const displaced = GeometryOperations.displace(sphere, 0.2, 0.1, 42);
      const colored = AttributeOperations.colorByHeight(
        displaced,
        new THREE.Color(0x0000ff),
        new THREE.Color(0xff0000)
      );
      const optimized = VertexDataUtils.optimize(colored);

      // Verify all operations completed
      expect(optimized.vertexCount).toBeGreaterThan(0);
      expect(optimized.positionsArray).toBeDefined();
      expect(optimized.colorsArray).toBeDefined();
    });
  });

  describe('Edge Cases: Empty and Invalid Operations', () => {
    it('should handle degenerate cases gracefully', () => {
      // Very small geometry
      const tiny = BoxBuilder.create({ width: 0.001, height: 0.001, depth: 0.001 });
      expect(tiny.vertexCount).toBeGreaterThan(0);

      // Clone tiny geometry
      const cloned = VertexDataUtils.clone(tiny);
      expect(cloned.vertexCount).toBe(tiny.vertexCount);

      // Transform tiny geometry
      const scaled = VertexDataUtils.scale(cloned, 1000, 1000, 1000);
      expect(scaled.vertexCount).toBe(cloned.vertexCount);
    });
  });
});

describe('Advanced Integration Tests', () => {
  describe('Node-like Workflow Simulation', () => {
    it('should simulate a node graph execution', () => {
      // Simulate: Box -> Subdivide -> Sphere -> Merge -> Transform
      const boxNode = BoxBuilder.create({ width: 1 });
      const subdivideNode = GeometryOperations.subdivide(boxNode, 1);

      const sphereNode = SphereBuilder.create({ radius: 0.5 });

      const mergeNode = VertexDataUtils.merge([subdivideNode, sphereNode]);

      const matrix = new THREE.Matrix4();
      const transformNode = VertexDataUtils.transform(mergeNode, matrix);

      const colorNode = AttributeOperations.colorByHeight(
        transformNode,
        new THREE.Color(0x00ff00),
        new THREE.Color(0xff00ff)
      );

      // Verify final result
      expect(colorNode.vertexCount).toBeGreaterThan(0);
      expect(colorNode.colorsArray).toBeDefined();
    });
  });

  describe('Procedural Generation Workflow', () => {
    it('should create procedural geometry from primitives', () => {
      // Create a procedural structure (e.g., simple building)
      const base = BoxBuilder.create({ width: 4, height: 0.5, depth: 4 });
      const walls = BoxBuilder.create({ width: 4, height: 3, depth: 4 });
      const roof = BoxBuilder.create({ width: 5, height: 1, depth: 5 });

      // Translate parts
      const wallsTranslated = VertexDataUtils.translate(walls, 0, 1.75, 0);
      const roofTranslated = VertexDataUtils.translate(roof, 0, 3.5, 0);

      // Merge into single structure
      const building = VertexDataUtils.merge([base, wallsTranslated, roofTranslated]);

      // Add details
      const detailed = GeometryOperations.subdivide(building, 1);
      const colored = AttributeOperations.colorByHeight(
        detailed,
        new THREE.Color(0x8b4513),
        new THREE.Color(0xdcdcdc)
      );

      // Verify result
      expect(colored.vertexCount).toBeGreaterThan(base.vertexCount * 2);
      expect(colored.colorsArray).toBeDefined();
    });
  });
});
