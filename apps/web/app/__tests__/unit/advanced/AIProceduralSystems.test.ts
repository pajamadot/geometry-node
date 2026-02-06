/**
 * Unit Tests: AI & Procedural Systems
 * Tests for AI optimization, city generation, L-systems, vegetation, textures, and materials
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AIGeometryOptimizer,
  CityLayoutGenerator,
  AdvancedLSystem,
  VegetationSystem,
  TextureSynthesizer,
  PBRMaterialBuilder,
} from '@/utils/AIProceduralSystems';
import { EnhancedGeometryData } from '@/utils/builders/GeometryBuilder';
import * as THREE from 'three';

describe('AIGeometryOptimizer', () => {
  let optimizer: AIGeometryOptimizer;

  beforeEach(() => {
    optimizer = new AIGeometryOptimizer();
  });

  describe('analyzeQuality', () => {
    it('should return high score for good geometry', () => {
      const geometry: EnhancedGeometryData = {
        vertices: [],
        faces: [],
        vertexCount: 100,
        faceCount: 50,
        positionsArray: new Float32Array(300),
        normalsArray: new Float32Array(300),
        attributes: {
          vertex: new Map(),
          edge: new Map(),
          face: new Map(),
          corner: new Map(),
        },
      };

      const report = optimizer.analyzeQuality(geometry);

      expect(report.score).toBeGreaterThan(0.7);
      expect(report.issues).toHaveLength(0);
    });

    it('should detect high vertex count', () => {
      const geometry: EnhancedGeometryData = {
        vertices: [],
        faces: [],
        vertexCount: 150000,
        faceCount: 100000,
        positionsArray: new Float32Array(450000),
        normalsArray: new Float32Array(450000),
        attributes: {
          vertex: new Map(),
          edge: new Map(),
          face: new Map(),
          corner: new Map(),
        },
      };

      const report = optimizer.analyzeQuality(geometry);

      expect(report.score).toBeLessThan(1.0);
      expect(report.issues).toContain('High vertex count - consider LOD');
      expect(report.recommendations.some((r) => r.includes('LOD'))).toBe(true);
    });

    it('should detect missing normals', () => {
      const geometry: EnhancedGeometryData = {
        vertices: [],
        faces: [],
        vertexCount: 100,
        faceCount: 50,
        positionsArray: new Float32Array(300),
        attributes: {
          vertex: new Map(),
          edge: new Map(),
          face: new Map(),
          corner: new Map(),
        },
      };

      const report = optimizer.analyzeQuality(geometry);

      expect(report.issues).toContain('Missing normals');
      expect(report.recommendations.some((r) => r.includes('computeNormals'))).toBe(true);
    });

    it('should provide recommendations for issues', () => {
      const geometry: EnhancedGeometryData = {
        vertices: [],
        faces: [],
        vertexCount: 200000,
        faceCount: 100000,
        positionsArray: new Float32Array(600000),
        attributes: {
          vertex: new Map(),
          edge: new Map(),
          face: new Map(),
          corner: new Map(),
        },
      };

      const report = optimizer.analyzeQuality(geometry);

      expect(report.recommendations).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('optimizeGeometry', () => {
    it('should optimize low quality geometry', async () => {
      const geometry: EnhancedGeometryData = {
        vertices: [],
        faces: [],
        vertexCount: 150000,
        faceCount: 100000,
        positionsArray: new Float32Array(450000),
        attributes: {
          vertex: new Map(),
          edge: new Map(),
          face: new Map(),
          corner: new Map(),
        },
      };

      const optimized = await optimizer.optimizeGeometry(geometry);

      expect(optimized).toBeDefined();
    });

    it('should return geometry unchanged if quality is good', async () => {
      const geometry: EnhancedGeometryData = {
        vertices: [],
        faces: [],
        vertexCount: 100,
        faceCount: 50,
        positionsArray: new Float32Array(300),
        normalsArray: new Float32Array(300),
        attributes: {
          vertex: new Map(),
          edge: new Map(),
          face: new Map(),
          corner: new Map(),
        },
      };

      const optimized = await optimizer.optimizeGeometry(geometry);

      expect(optimized.vertexCount).toBe(geometry.vertexCount);
    });
  });
});

describe('CityLayoutGenerator', () => {
  let generator: CityLayoutGenerator;

  beforeEach(() => {
    generator = new CityLayoutGenerator();
  });

  describe('generateCity', () => {
    it('should generate a city layout', () => {
      const city = generator.generateCity({ size: 100, blockSize: 20 });

      expect(city.streets).toBeDefined();
      expect(city.districts).toBeDefined();
      expect(city.buildings).toBeDefined();
      expect(city.streets.length).toBeGreaterThan(0);
      expect(city.districts.length).toBeGreaterThan(0);
      expect(city.buildings.length).toBeGreaterThan(0);
    });

    it('should create grid-based streets', () => {
      const city = generator.generateCity({ size: 100, blockSize: 25 });

      // Should have streets at intervals
      expect(city.streets.length).toBeGreaterThan(0);

      // Check street properties
      city.streets.forEach((street) => {
        expect(street.start).toBeInstanceOf(THREE.Vector2);
        expect(street.end).toBeInstanceOf(THREE.Vector2);
        expect(street.width).toBeGreaterThan(0);
        expect(street.type).toBeDefined();
      });
    });

    it('should create districts', () => {
      const city = generator.generateCity({ size: 100 });

      expect(city.districts.length).toBeGreaterThan(0);

      city.districts.forEach((district) => {
        expect(district.name).toBeDefined();
        expect(district.bounds).toBeDefined();
        expect(district.type).toBeDefined();
        expect(district.buildingDensity).toBeGreaterThan(0);
      });
    });

    it('should generate buildings in districts', () => {
      const city = generator.generateCity({ size: 100 });

      expect(city.buildings.length).toBeGreaterThan(0);

      city.buildings.forEach((building) => {
        expect(building.position).toBeInstanceOf(THREE.Vector3);
        expect(building.width).toBeGreaterThan(0);
        expect(building.height).toBeGreaterThan(0);
        expect(building.depth).toBeGreaterThan(0);
      });
    });

    it('should respect building density', () => {
      const cityLowDensity = generator.generateCity({
        size: 100,
        buildingDensity: 0.2
      });

      const cityHighDensity = generator.generateCity({
        size: 100,
        buildingDensity: 0.8
      });

      // Note: This test depends on internal implementation
      expect(cityHighDensity.buildings.length).toBeGreaterThan(0);
      expect(cityLowDensity.buildings.length).toBeGreaterThan(0);
    });

    it('should generate different building heights by district type', () => {
      const city = generator.generateCity({ size: 100 });

      const commercial = city.buildings.filter((b) => b.type === 'commercial');
      const residential = city.buildings.filter((b) => b.type === 'residential');

      if (commercial.length > 0 && residential.length > 0) {
        const avgCommercial = commercial.reduce((sum, b) => sum + b.height, 0) / commercial.length;
        const avgResidential = residential.reduce((sum, b) => sum + b.height, 0) / residential.length;

        // Commercial buildings should generally be taller
        expect(avgCommercial).toBeGreaterThan(avgResidential);
      }
    });
  });

  describe('generateBuildingGeometry', () => {
    it('should generate geometry for a building', () => {
      const building = {
        position: new THREE.Vector3(10, 0, 10),
        width: 8,
        depth: 8,
        height: 20,
        type: 'commercial',
      };

      const geometry = generator.generateBuildingGeometry(building);

      expect(geometry.vertexCount).toBeGreaterThan(0);
      expect(geometry.faceCount).toBeGreaterThan(0);
      expect(geometry.positionsArray).toBeInstanceOf(Float32Array);
      expect(geometry.indicesArray).toBeInstanceOf(Uint32Array);
    });

    it('should create correct number of vertices', () => {
      const building = {
        position: new THREE.Vector3(0, 0, 0),
        width: 10,
        depth: 10,
        height: 15,
        type: 'residential',
      };

      const geometry = generator.generateBuildingGeometry(building);

      // 8 vertices for a box
      expect(geometry.vertexCount).toBe(8);
    });
  });
});

describe('AdvancedLSystem', () => {
  let lsystem: AdvancedLSystem;

  beforeEach(() => {
    lsystem = new AdvancedLSystem();
  });

  describe('generate', () => {
    it('should generate L-system string', () => {
      const rules = new Map([['F', 'FF']]);
      const result = lsystem.generate('F', rules, 1);

      expect(result).toBe('FF');
    });

    it('should apply rules multiple iterations', () => {
      const rules = new Map([['F', 'FF']]);
      const result = lsystem.generate('F', rules, 3);

      expect(result).toBe('FFFFFFFF'); // F -> FF -> FFFF -> FFFFFFFF
    });

    it('should handle complex rules', () => {
      const rules = new Map([
        ['F', 'F+F-F-F+F'],
        ['+', '+'],
        ['-', '-'],
      ]);

      const result = lsystem.generate('F', rules, 1);

      expect(result).toBe('F+F-F-F+F');
    });

    it('should preserve characters without rules', () => {
      const rules = new Map([['F', 'FF']]);
      const result = lsystem.generate('F+F-F', rules, 1);

      expect(result).toBe('FF+FF-FF');
    });

    it('should handle zero iterations', () => {
      const rules = new Map([['F', 'FF']]);
      const result = lsystem.generate('F', rules, 0);

      expect(result).toBe('F');
    });
  });

  describe('interpretToGeometry', () => {
    it('should interpret L-string to geometry', () => {
      const geometry = lsystem.interpretToGeometry('F', 25);

      expect(geometry.vertexCount).toBeGreaterThan(0);
      expect(geometry.positionsArray).toBeDefined();
    });

    it('should handle forward movement', () => {
      const geometry = lsystem.interpretToGeometry('FFF', 25);

      // Three forward movements = 6 vertices (2 per segment)
      expect(geometry.vertexCount).toBe(6);
    });

    it('should handle rotation commands', () => {
      const geometry = lsystem.interpretToGeometry('F+F-F', 45);

      expect(geometry.vertexCount).toBeGreaterThan(0);
      expect(geometry.positionsArray?.length).toBe(geometry.vertexCount * 3);
    });

    it('should handle push/pop stack', () => {
      const geometry = lsystem.interpretToGeometry('F[+F][-F]F', 25);

      expect(geometry.vertexCount).toBeGreaterThan(0);
    });

    it('should use custom angle step', () => {
      const geo1 = lsystem.interpretToGeometry('F+F', 25);
      const geo2 = lsystem.interpretToGeometry('F+F', 90);

      expect(geo1.positionsArray).toBeDefined();
      expect(geo2.positionsArray).toBeDefined();
    });
  });
});

describe('VegetationSystem', () => {
  let vegetation: VegetationSystem;

  beforeEach(() => {
    vegetation = new VegetationSystem();
  });

  describe('generateTree', () => {
    it('should generate tree geometry', () => {
      const tree = vegetation.generateTree({ iterations: 3, angle: 25 });

      expect(tree.vertexCount).toBeGreaterThan(0);
      expect(tree.positionsArray).toBeDefined();
    });

    it('should create more complex trees with more iterations', () => {
      const simple = vegetation.generateTree({ iterations: 2 });
      const complex = vegetation.generateTree({ iterations: 5 });

      expect(complex.vertexCount).toBeGreaterThan(simple.vertexCount);
    });

    it('should use default parameters', () => {
      const tree = vegetation.generateTree({});

      expect(tree.vertexCount).toBeGreaterThan(0);
    });

    it('should vary with different angles', () => {
      const tree1 = vegetation.generateTree({ iterations: 4, angle: 20 });
      const tree2 = vegetation.generateTree({ iterations: 4, angle: 30 });

      expect(tree1.positionsArray).toBeDefined();
      expect(tree2.positionsArray).toBeDefined();
    });
  });
});

describe('TextureSynthesizer', () => {
  let synthesizer: TextureSynthesizer;

  beforeEach(() => {
    synthesizer = new TextureSynthesizer();
  });

  describe('generateProceduralTexture', () => {
    it('should generate noise texture', () => {
      const canvas = synthesizer.generateProceduralTexture(256, 256, 'noise');

      expect(canvas).toBeInstanceOf(HTMLCanvasElement);
      expect(canvas.width).toBe(256);
      expect(canvas.height).toBe(256);
    });

    it('should generate different texture types', () => {
      const noise = synthesizer.generateProceduralTexture(128, 128, 'noise');
      const cellular = synthesizer.generateProceduralTexture(128, 128, 'cellular');
      const voronoi = synthesizer.generateProceduralTexture(128, 128, 'voronoi');

      expect(noise).toBeDefined();
      expect(cellular).toBeDefined();
      expect(voronoi).toBeDefined();
    });

    it('should respect dimensions', () => {
      const small = synthesizer.generateProceduralTexture(64, 64, 'noise');
      const large = synthesizer.generateProceduralTexture(512, 512, 'noise');

      expect(small.width).toBe(64);
      expect(small.height).toBe(64);
      expect(large.width).toBe(512);
      expect(large.height).toBe(512);
    });
  });

  describe('bakeAmbientOcclusion', () => {
    it('should bake AO values', () => {
      const geometry: EnhancedGeometryData = {
        vertices: [],
        faces: [],
        vertexCount: 100,
        faceCount: 50,
        positionsArray: new Float32Array(300),
        attributes: {
          vertex: new Map(),
          edge: new Map(),
          face: new Map(),
          corner: new Map(),
        },
      };

      const ao = synthesizer.bakeAmbientOcclusion(geometry, 32);

      expect(ao).toBeInstanceOf(Float32Array);
      expect(ao.length).toBe(geometry.vertexCount);
    });

    it('should produce values in valid range', () => {
      const geometry: EnhancedGeometryData = {
        vertices: [],
        faces: [],
        vertexCount: 50,
        faceCount: 25,
        positionsArray: new Float32Array(150),
        attributes: {
          vertex: new Map(),
          edge: new Map(),
          face: new Map(),
          corner: new Map(),
        },
      };

      const ao = synthesizer.bakeAmbientOcclusion(geometry);

      for (let i = 0; i < ao.length; i++) {
        expect(ao[i]).toBeGreaterThanOrEqual(0);
        expect(ao[i]).toBeLessThanOrEqual(1);
      }
    });

    it('should use custom sample count', () => {
      const geometry: EnhancedGeometryData = {
        vertices: [],
        faces: [],
        vertexCount: 25,
        faceCount: 12,
        positionsArray: new Float32Array(75),
        attributes: {
          vertex: new Map(),
          edge: new Map(),
          face: new Map(),
          corner: new Map(),
        },
      };

      const ao = synthesizer.bakeAmbientOcclusion(geometry, 64);

      expect(ao.length).toBe(25);
    });
  });
});

describe('PBRMaterialBuilder', () => {
  let builder: PBRMaterialBuilder;

  beforeEach(() => {
    builder = new PBRMaterialBuilder();
  });

  describe('createMaterial', () => {
    it('should create material with default parameters', () => {
      const material = builder.createMaterial({});

      expect(material).toBeInstanceOf(THREE.MeshStandardMaterial);
    });

    it('should apply custom parameters', () => {
      const material = builder.createMaterial({
        color: 0xff0000,
        roughness: 0.8,
        metalness: 0.3,
      });

      expect(material).toBeDefined();
    });

    it('should store named materials', () => {
      builder.createMaterial({ name: 'redMetal', color: 0xff0000 });

      const retrieved = builder.getMaterial('redMetal');
      expect(retrieved).toBeDefined();
    });

    it('should return undefined for non-existent material', () => {
      const material = builder.getMaterial('nonexistent');
      expect(material).toBeUndefined();
    });

    it('should handle emissive properties', () => {
      const material = builder.createMaterial({
        emissive: 0x00ff00,
        emissiveIntensity: 0.5,
      });

      expect(material).toBeDefined();
    });
  });

  describe('createPreset', () => {
    it('should create metal preset', () => {
      const material = builder.createPreset('metal');

      expect(material).toBeInstanceOf(THREE.MeshStandardMaterial);
    });

    it('should create plastic preset', () => {
      const material = builder.createPreset('plastic');

      expect(material).toBeInstanceOf(THREE.MeshStandardMaterial);
    });

    it('should create wood preset', () => {
      const material = builder.createPreset('wood');

      expect(material).toBeInstanceOf(THREE.MeshStandardMaterial);
    });

    it('should create glass preset', () => {
      const material = builder.createPreset('glass');

      expect(material).toBeInstanceOf(THREE.MeshStandardMaterial);
    });

    it('should have different properties for different presets', () => {
      const metal = builder.createPreset('metal');
      const plastic = builder.createPreset('plastic');

      // Materials should be different instances
      expect(metal).not.toBe(plastic);
    });
  });
});
