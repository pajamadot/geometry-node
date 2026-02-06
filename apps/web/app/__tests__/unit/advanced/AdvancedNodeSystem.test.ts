/**
 * Unit Tests: Advanced Node System
 * Tests for custom nodes, templates, groups, dynamic sockets, and versioning
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  NodeBuilder,
  NodeTemplateLibrary,
  PresetManager,
  NodeGroup,
  DynamicSocketSystem,
  NodeVersionManager,
} from '@/utils/AdvancedNodeSystem';
import type { NodeDefinition } from '@/types/NodeTypes';

describe('NodeBuilder', () => {
  let builder: NodeBuilder;

  beforeEach(() => {
    builder = new NodeBuilder();
  });

  describe('createCustomNode', () => {
    it('should create a custom node from config', () => {
      const config = {
        type: 'custom_add',
        label: 'Add Numbers',
        description: 'Adds two numbers',
        inputs: [
          { name: 'a', type: 'number', label: 'A' },
          { name: 'b', type: 'number', label: 'B' },
        ],
        outputs: [{ name: 'result', type: 'number', label: 'Result' }],
        code: 'return { result: inputs.a + inputs.b };',
      };

      const node = builder.createCustomNode(config);

      expect(node.type).toBe('custom_add');
      expect(node.label).toBe('Add Numbers');
      expect(node.inputs).toHaveLength(2);
      expect(node.outputs).toHaveLength(1);
      expect(node.execute).toBeDefined();
    });

    it('should handle minimal config', () => {
      const config = {
        type: 'minimal',
        label: 'Minimal Node',
      };

      const node = builder.createCustomNode(config);

      expect(node.type).toBe('minimal');
      expect(node.inputs).toEqual([]);
      expect(node.outputs).toEqual([]);
      expect(node.parameters).toEqual([]);
    });

    it('should generate execute function from code', () => {
      const config = {
        type: 'multiply',
        label: 'Multiply',
        code: 'return { result: inputs.x * inputs.y };',
      };

      const node = builder.createCustomNode(config);
      const result = node.execute({ x: 3, y: 4 }, {});

      expect(result.result).toBe(12);
    });
  });

  describe('validateNode', () => {
    it('should validate a complete node', () => {
      const validNode: NodeDefinition = {
        type: 'test_node',
        label: 'Test Node',
        description: 'A test node',
        inputs: [{ name: 'input', type: 'number', label: 'Input' }],
        outputs: [{ name: 'output', type: 'number', label: 'Output' }],
        parameters: [],
        execute: () => ({}),
      };

      const result = builder.validateNode(validNode);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing type', () => {
      const invalidNode = {
        label: 'Test',
        execute: () => ({}),
      } as any;

      const result = builder.validateNode(invalidNode);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Node type is required');
    });

    it('should detect missing execute function', () => {
      const invalidNode = {
        type: 'test',
        label: 'Test',
      } as any;

      const result = builder.validateNode(invalidNode);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Execute function is required');
    });

    it('should validate input sockets', () => {
      const nodeWithInvalidInputs: NodeDefinition = {
        type: 'test',
        label: 'Test',
        inputs: [
          { name: 'valid', type: 'number', label: 'Valid' },
          { name: '', type: 'number', label: 'Invalid' }, // Missing name
        ],
        outputs: [],
        parameters: [],
        execute: () => ({}),
      };

      const result = builder.validateNode(nodeWithInvalidInputs);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Input 1 missing name'))).toBe(true);
    });
  });
});

describe('NodeTemplateLibrary', () => {
  let library: NodeTemplateLibrary;

  beforeEach(() => {
    library = new NodeTemplateLibrary();
  });

  describe('template management', () => {
    it('should add and retrieve templates', () => {
      const template = {
        id: 'template1',
        name: 'Box Generator',
        description: 'Creates a box geometry',
        tags: ['primitive', 'geometry'],
        nodeDefinition: {
          type: 'box',
          label: 'Box',
          inputs: [],
          outputs: [],
          parameters: [],
          execute: () => ({}),
        },
      };

      library.addTemplate('template1', template);
      const retrieved = library.getTemplate('template1');

      expect(retrieved).toEqual(template);
    });

    it('should return undefined for non-existent template', () => {
      const retrieved = library.getTemplate('nonexistent');
      expect(retrieved).toBeUndefined();
    });

    it('should get all templates', () => {
      const template1 = {
        id: 'template1',
        name: 'Template 1',
        nodeDefinition: {} as NodeDefinition,
      };
      const template2 = {
        id: 'template2',
        name: 'Template 2',
        nodeDefinition: {} as NodeDefinition,
      };

      library.addTemplate('template1', template1);
      library.addTemplate('template2', template2);

      const all = library.getAllTemplates();
      expect(all).toHaveLength(2);
    });
  });

  describe('searchTemplates', () => {
    beforeEach(() => {
      library.addTemplate('box', {
        id: 'box',
        name: 'Box Generator',
        description: 'Creates a box geometry',
        tags: ['primitive', 'geometry'],
        nodeDefinition: {} as NodeDefinition,
      });

      library.addTemplate('sphere', {
        id: 'sphere',
        name: 'Sphere Generator',
        description: 'Creates a sphere geometry',
        tags: ['primitive', 'round'],
        nodeDefinition: {} as NodeDefinition,
      });

      library.addTemplate('extrude', {
        id: 'extrude',
        name: 'Extrude',
        description: 'Extrudes geometry',
        tags: ['modifier', 'geometry'],
        nodeDefinition: {} as NodeDefinition,
      });
    });

    it('should search by name', () => {
      const results = library.searchTemplates('box');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Box Generator');
    });

    it('should search by description', () => {
      const results = library.searchTemplates('extrudes');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Extrude');
    });

    it('should search by tags', () => {
      const results = library.searchTemplates('primitive');
      expect(results).toHaveLength(2);
    });

    it('should be case insensitive', () => {
      const results = library.searchTemplates('SPHERE');
      expect(results).toHaveLength(1);
    });

    it('should return empty array for no matches', () => {
      const results = library.searchTemplates('nonexistent');
      expect(results).toHaveLength(0);
    });
  });
});

describe('PresetManager', () => {
  let manager: PresetManager;

  beforeEach(() => {
    manager = new PresetManager();
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should save and load presets', () => {
    const config = {
      width: 2,
      height: 3,
      depth: 4,
    };

    manager.savePreset('myBox', config);
    const loaded = manager.loadPreset('myBox');

    expect(loaded).toEqual(config);
  });

  it('should return null for non-existent preset', () => {
    const loaded = manager.loadPreset('nonexistent');
    expect(loaded).toBeNull();
  });

  it('should list all presets', () => {
    manager.savePreset('preset1', { a: 1 });
    manager.savePreset('preset2', { b: 2 });
    manager.savePreset('preset3', { c: 3 });

    const list = manager.listPresets();
    expect(list).toHaveLength(3);
    expect(list).toContain('preset1');
    expect(list).toContain('preset2');
    expect(list).toContain('preset3');
  });

  it('should include timestamp when saving', () => {
    manager.savePreset('test', { value: 42 });
    const stored = JSON.parse(localStorage.getItem('preset_test')!);

    expect(stored.timestamp).toBeDefined();
    expect(typeof stored.timestamp).toBe('number');
  });
});

describe('NodeGroup', () => {
  let group: NodeGroup;

  beforeEach(() => {
    group = new NodeGroup('group1', 'Test Group');
  });

  describe('basic operations', () => {
    it('should create a node group', () => {
      expect(group.id).toBe('group1');
      expect(group.name).toBe('Test Group');
    });

    it('should add nodes to group', () => {
      const node: NodeDefinition = {
        type: 'test',
        label: 'Test',
        inputs: [],
        outputs: [],
        parameters: [],
        execute: () => ({}),
      };

      group.addNode('node1', node);
      expect(group.nodes.size).toBe(1);
      expect(group.nodes.get('node1')).toEqual(node);
    });

    it('should add connections', () => {
      group.addConnection('node1', 'node2', 'output', 'input');
      expect(group.connections).toHaveLength(1);
      expect(group.connections[0]).toEqual({
        from: 'node1',
        to: 'node2',
        fromSocket: 'output',
        toSocket: 'input',
      });
    });

    it('should expose inputs', () => {
      group.exposeInput('node1', 'value', 'groupInput');
      expect(group.inputs).toHaveLength(1);
      expect(group.inputs[0].exposedName).toBe('groupInput');
    });

    it('should expose outputs', () => {
      group.exposeOutput('node2', 'result', 'groupOutput');
      expect(group.outputs).toHaveLength(1);
      expect(group.outputs[0].exposedName).toBe('groupOutput');
    });
  });

  describe('toNodeDefinition', () => {
    it('should convert group to node definition', () => {
      group.exposeInput('node1', 'input', 'x');
      group.exposeOutput('node2', 'output', 'result');

      const nodeDef = group.toNodeDefinition();

      expect(nodeDef.type).toBe('group_group1');
      expect(nodeDef.label).toBe('Test Group');
      expect(nodeDef.inputs).toHaveLength(1);
      expect(nodeDef.outputs).toHaveLength(1);
      expect(nodeDef.execute).toBeDefined();
    });
  });

  describe('execution', () => {
    it('should execute simple group', () => {
      const addNode: NodeDefinition = {
        type: 'add',
        label: 'Add',
        inputs: [
          { name: 'a', type: 'number', label: 'A' },
          { name: 'b', type: 'number', label: 'B' },
        ],
        outputs: [{ name: 'result', type: 'number', label: 'Result' }],
        parameters: [],
        execute: (inputs: any) => ({ result: inputs.a + inputs.b }),
      };

      const multiplyNode: NodeDefinition = {
        type: 'multiply',
        label: 'Multiply',
        inputs: [
          { name: 'x', type: 'number', label: 'X' },
          { name: 'y', type: 'number', label: 'Y' },
        ],
        outputs: [{ name: 'result', type: 'number', label: 'Result' }],
        parameters: [],
        execute: (inputs: any) => ({ result: inputs.x * inputs.y }),
      };

      group.addNode('add', addNode);
      group.addNode('multiply', multiplyNode);
      group.addConnection('add', 'multiply', 'result', 'x');
      group.exposeInput('add', 'a', 'inputA');
      group.exposeInput('add', 'b', 'inputB');
      group.exposeInput('multiply', 'y', 'multiplier');
      group.exposeOutput('multiply', 'result', 'finalResult');

      const nodeDef = group.toNodeDefinition();
      const result = nodeDef.execute(
        { inputA: 3, inputB: 4, multiplier: 2 },
        {}
      );

      // (3 + 4) * 2 = 14
      expect(result.finalResult).toBe(14);
    });
  });
});

describe('DynamicSocketSystem', () => {
  let system: DynamicSocketSystem;

  beforeEach(() => {
    system = new DynamicSocketSystem();
  });

  describe('type converters', () => {
    it('should register custom converter', () => {
      system.registerConverter('color', 'rgb', (color) => ({
        r: color.r * 255,
        g: color.g * 255,
        b: color.b * 255,
      }));

      expect(system.canConvert('color', 'rgb')).toBe(true);
    });

    it('should convert values', () => {
      system.registerConverter('celsius', 'fahrenheit', (c) => c * 1.8 + 32);

      const result = system.convert(100, 'celsius', 'fahrenheit');
      expect(result).toBe(212);
    });

    it('should return original value if no converter', () => {
      const result = system.convert(42, 'unknown', 'type');
      expect(result).toBe(42);
    });
  });

  describe('default converters', () => {
    beforeEach(() => {
      system.initializeDefaultConverters();
    });

    it('should convert number to string', () => {
      const result = system.convert(42, 'number', 'string');
      expect(result).toBe('42');
    });

    it('should convert string to number', () => {
      const result = system.convert('123', 'string', 'number');
      expect(result).toBe(123);
    });

    it('should convert vector3 to array', () => {
      const vector = { x: 1, y: 2, z: 3 };
      const result = system.convert(vector, 'vector3', 'array');
      expect(result).toEqual([1, 2, 3]);
    });

    it('should convert array to vector3', () => {
      const result = system.convert([5, 6, 7], 'array', 'vector3');
      expect(result).toEqual({ x: 5, y: 6, z: 7 });
    });
  });
});

describe('NodeVersionManager', () => {
  let manager: NodeVersionManager;

  beforeEach(() => {
    manager = new NodeVersionManager();
  });

  describe('migration registration', () => {
    it('should register migration', () => {
      const migration = {
        fromVersion: 1,
        toVersion: 2,
        description: 'Add new parameter',
        migrate: (node: any) => ({ ...node, newParam: 0 }),
      };

      manager.registerMigration('box', migration);
      expect(manager.getLatestVersion('box')).toBe(2);
    });

    it('should handle multiple migrations', () => {
      manager.registerMigration('box', {
        fromVersion: 1,
        toVersion: 2,
        description: 'Version 2',
        migrate: (node: any) => node,
      });

      manager.registerMigration('box', {
        fromVersion: 2,
        toVersion: 3,
        description: 'Version 3',
        migrate: (node: any) => node,
      });

      expect(manager.getLatestVersion('box')).toBe(3);
    });
  });

  describe('node migration', () => {
    it('should migrate node to target version', () => {
      manager.registerMigration('box', {
        fromVersion: 1,
        toVersion: 2,
        description: 'Add subdivisions',
        migrate: (node: any) => ({ ...node, subdivisions: 1 }),
      });

      const oldNode = {
        type: 'box',
        version: 1,
        width: 1,
      };

      const migrated = manager.migrateNode(oldNode, 2);
      expect(migrated.subdivisions).toBe(1);
      expect(migrated.width).toBe(1);
    });

    it('should apply migrations in order', () => {
      manager.registerMigration('box', {
        fromVersion: 1,
        toVersion: 2,
        description: 'Step 1',
        migrate: (node: any) => ({ ...node, step: 2 }),
      });

      manager.registerMigration('box', {
        fromVersion: 2,
        toVersion: 3,
        description: 'Step 2',
        migrate: (node: any) => ({ ...node, step: node.step * 2 }),
      });

      const oldNode = { type: 'box', version: 1, step: 1 };
      const migrated = manager.migrateNode(oldNode, 3);

      // Step should be 2 after first migration, then 4 after second
      expect(migrated.step).toBe(4);
    });

    it('should skip migrations already applied', () => {
      manager.registerMigration('box', {
        fromVersion: 1,
        toVersion: 2,
        description: 'V2',
        migrate: (node: any) => ({ ...node, v2: true }),
      });

      const node = { type: 'box', version: 2 };
      const migrated = manager.migrateNode(node, 2);

      expect(migrated.v2).toBeUndefined(); // Should not apply migration
    });

    it('should return latest version 1 for unknown types', () => {
      expect(manager.getLatestVersion('unknown')).toBe(1);
    });
  });
});
