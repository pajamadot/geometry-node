/**
 * Advanced Node System - Iterations 31-35
 * Custom nodes, templates, groups, dynamic sockets, and versioning
 */

import { NodeDefinition } from '../types/nodes';

/**
 * Iteration 31: Custom Node Framework
 * Visual node creation and code generation
 */
export class NodeBuilder {
  createCustomNode(config: CustomNodeConfig): NodeDefinition {
    return {
      type: config.type,
      name: config.name || config.label || config.type,
      description: config.description || '',
      category: 'custom',
      color: {
        primary: '#6366f1',
        secondary: '#4f46e5',
      },
      inputs: config.inputs || [],
      outputs: config.outputs || [],
      parameters: config.parameters || [],
      execute: this.generateExecuteFunction(config),
    };
  }

  private generateExecuteFunction(config: CustomNodeConfig): (inputs: Record<string, any>, parameters: Record<string, any>) => Record<string, any> {
    // Auto-generate execute function from configuration
    const fn = new Function('inputs', 'parameters', config.code || 'return {};');
    return fn as (inputs: Record<string, any>, parameters: Record<string, any>) => Record<string, any>;
  }

  validateNode(node: NodeDefinition): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!node.type) errors.push('Node type is required');
    if (!node.name) errors.push('Node name is required');
    if (!node.execute) errors.push('Execute function is required');

    // Validate sockets
    node.inputs?.forEach((input, i) => {
      if (!input.name) errors.push(`Input ${i} missing name`);
      if (!input.type) errors.push(`Input ${i} missing type`);
    });

    return { valid: errors.length === 0, errors, warnings };
  }
}

/**
 * Iteration 32: Node Templates & Presets
 * Reusable node configurations
 */
export class NodeTemplateLibrary {
  private templates: Map<string, NodeTemplate> = new Map();

  addTemplate(id: string, template: NodeTemplate): void {
    this.templates.set(id, template);
  }

  getTemplate(id: string): NodeTemplate | undefined {
    return this.templates.get(id);
  }

  getAllTemplates(): NodeTemplate[] {
    return Array.from(this.templates.values());
  }

  searchTemplates(query: string): NodeTemplate[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.templates.values()).filter(
      (t) =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.description?.toLowerCase().includes(lowerQuery) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }
}

export class PresetManager {
  savePreset(name: string, nodeConfig: any): void {
    const preset = {
      name,
      config: nodeConfig,
      timestamp: Date.now(),
    };
    localStorage.setItem(`preset_${name}`, JSON.stringify(preset));
  }

  loadPreset(name: string): any | null {
    const data = localStorage.getItem(`preset_${name}`);
    return data ? JSON.parse(data).config : null;
  }

  listPresets(): string[] {
    const presets: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('preset_')) {
        presets.push(key.replace('preset_', ''));
      }
    }
    return presets;
  }
}

/**
 * Iteration 33: Node Groups & Encapsulation
 * Combine multiple nodes into reusable groups
 */
export class NodeGroup {
  id: string;
  name: string;
  nodes: Map<string, NodeDefinition> = new Map();
  connections: Connection[] = [];
  inputs: GroupSocket[] = [];
  outputs: GroupSocket[] = [];

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  addNode(id: string, node: NodeDefinition): void {
    this.nodes.set(id, node);
  }

  addConnection(from: string, to: string, fromSocket: string, toSocket: string): void {
    this.connections.push({ from, to, fromSocket, toSocket });
  }

  exposeInput(nodeId: string, socketName: string, exposedName: string): void {
    this.inputs.push({ nodeId, socketName, exposedName });
  }

  exposeOutput(nodeId: string, socketName: string, exposedName: string): void {
    this.outputs.push({ nodeId, socketName, exposedName });
  }

  toNodeDefinition(): NodeDefinition {
    return {
      type: `group_${this.id}`,
      name: this.name,
      description: `Node group: ${this.name}`,
      category: 'groups',
      color: {
        primary: '#8b5cf6',
        secondary: '#7c3aed',
      },
      inputs: this.inputs.map((i) => ({
        id: i.exposedName,
        name: i.exposedName,
        type: 'any' as const,
      })),
      outputs: this.outputs.map((o) => ({
        id: o.exposedName,
        name: o.exposedName,
        type: 'any' as const,
      })),
      parameters: [],
      execute: this.createGroupExecutor(),
    };
  }

  private createGroupExecutor(): (inputs: Record<string, any>, parameters: Record<string, any>) => Record<string, any> {
    return (inputs: any, parameters: any) => {
      // Execute all nodes in the group
      const results = new Map();

      // Topological sort and execute
      const sorted = this.topologicalSort();
      for (const nodeId of sorted) {
        const node = this.nodes.get(nodeId);
        if (node) {
          const nodeInputs = this.gatherNodeInputs(nodeId, inputs, results);
          const result = node.execute(nodeInputs, parameters);
          results.set(nodeId, result);
        }
      }

      // Gather outputs
      const outputs: any = {};
      for (const output of this.outputs) {
        const nodeResult = results.get(output.nodeId);
        if (nodeResult) {
          outputs[output.exposedName] = nodeResult[output.socketName];
        }
      }

      return outputs;
    };
  }

  private gatherNodeInputs(nodeId: string, groupInputs: any, results: Map<string, any>): any {
    const inputs: any = {};

    // Map group inputs
    for (const input of this.inputs) {
      if (input.nodeId === nodeId) {
        inputs[input.socketName] = groupInputs[input.exposedName];
      }
    }

    // Map connections
    for (const conn of this.connections) {
      if (conn.to === nodeId) {
        const sourceResult = results.get(conn.from);
        if (sourceResult) {
          inputs[conn.toSocket] = sourceResult[conn.fromSocket];
        }
      }
    }

    return inputs;
  }

  private topologicalSort(): string[] {
    const visited = new Set<string>();
    const result: string[] = [];

    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      // Visit dependencies first
      for (const conn of this.connections) {
        if (conn.to === nodeId) {
          visit(conn.from);
        }
      }

      result.push(nodeId);
    };

    for (const nodeId of this.nodes.keys()) {
      visit(nodeId);
    }

    return result;
  }
}

/**
 * Iteration 34: Dynamic Socket System
 * Runtime socket creation and type conversion
 */
export class DynamicSocketSystem {
  private typeConverters: Map<string, TypeConverter> = new Map();

  registerConverter(fromType: string, toType: string, converter: (value: any) => any): void {
    const key = `${fromType}->${toType}`;
    this.typeConverters.set(key, { fromType, toType, convert: converter });
  }

  canConvert(fromType: string, toType: string): boolean {
    return this.typeConverters.has(`${fromType}->${toType}`);
  }

  convert(value: any, fromType: string, toType: string): any {
    const converter = this.typeConverters.get(`${fromType}->${toType}`);
    return converter ? converter.convert(value) : value;
  }

  // Built-in converters
  initializeDefaultConverters(): void {
    // Number to String
    this.registerConverter('number', 'string', (v) => String(v));

    // String to Number
    this.registerConverter('string', 'number', (v) => Number(v));

    // Vector3 to Array
    this.registerConverter('vector3', 'array', (v) => [v.x, v.y, v.z]);

    // Array to Vector3
    this.registerConverter('array', 'vector3', (v) => ({ x: v[0], y: v[1], z: v[2] }));
  }
}

/**
 * Iteration 35: Node Versioning & Migration
 * Track and upgrade node versions
 */
export class NodeVersionManager {
  private migrations: Map<string, Migration[]> = new Map();

  registerMigration(nodeType: string, migration: Migration): void {
    if (!this.migrations.has(nodeType)) {
      this.migrations.set(nodeType, []);
    }
    this.migrations.get(nodeType)!.push(migration);
  }

  migrateNode(node: any, targetVersion: number): any {
    const migrations = this.migrations.get(node.type) || [];

    // Sort by fromVersion
    migrations.sort((a, b) => a.fromVersion - b.fromVersion);

    let migratedNode = { ...node };
    let currentVersion = migratedNode.version || 1;

    // Apply migrations sequentially
    while (currentVersion < targetVersion) {
      const migration = migrations.find((m) => m.fromVersion === currentVersion);
      
      if (!migration) {
        // No migration found for this version, but we haven't reached target.
        // Break to avoid infinite loop, essentially returning best effort.
        break;
      }

      migratedNode = migration.migrate(migratedNode);
      currentVersion = migration.toVersion;
      migratedNode.version = currentVersion;
    }

    return migratedNode;
  }

  getLatestVersion(nodeType: string): number {
    const migrations = this.migrations.get(nodeType) || [];
    return migrations.length > 0
      ? Math.max(...migrations.map((m) => m.toVersion))
      : 1;
  }
}

// Types and Interfaces

interface CustomNodeConfig {
  type: string;
  name?: string;
  label?: string;  // Deprecated, use name
  description?: string;
  inputs?: any[];
  outputs?: any[];
  parameters?: any[];
  code?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface NodeTemplate {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  nodeDefinition: NodeDefinition;
  thumbnail?: string;
}

interface Connection {
  from: string;
  to: string;
  fromSocket: string;
  toSocket: string;
}

interface GroupSocket {
  nodeId: string;
  socketName: string;
  exposedName: string;
}

interface TypeConverter {
  fromType: string;
  toType: string;
  convert: (value: any) => any;
}

interface Migration {
  fromVersion: number;
  toVersion: number;
  migrate: (node: any) => any;
  description: string;
}

// Global instances
export const nodeBuilder = new NodeBuilder();
export const templateLibrary = new NodeTemplateLibrary();
export const presetManager = new PresetManager();
export const dynamicSockets = new DynamicSocketSystem();
export const versionManager = new NodeVersionManager();

// Initialize default type converters
dynamicSockets.initializeDefaultConverters();
