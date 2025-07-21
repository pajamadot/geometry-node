import { SerializableNodeDefinition, NodeDefinition, NodeCategory } from '../types/nodeSystem';
import { ExecutionEngine } from './ExecutionEngine';
import { getIconComponent } from './IconRegistry';

// Database/API interface for node definitions
export interface NodeDatabase {
  // Load all public nodes
  loadPublicNodes(): Promise<SerializableNodeDefinition[]>;
  
  // Load user's private nodes
  loadUserNodes(userId: string): Promise<SerializableNodeDefinition[]>;
  
  // Save/update a node definition
  saveNode(node: SerializableNodeDefinition): Promise<SerializableNodeDefinition>;
  
  // Delete a node definition
  deleteNode(nodeId: string): Promise<boolean>;
  
  // Search nodes
  searchNodes(query: string, category?: NodeCategory): Promise<SerializableNodeDefinition[]>;
}

// In-memory implementation (can be replaced with actual database)
class InMemoryNodeDatabase implements NodeDatabase {
  private nodes: Map<string, SerializableNodeDefinition> = new Map();
  
  async loadPublicNodes(): Promise<SerializableNodeDefinition[]> {
    return Array.from(this.nodes.values()).filter(node => node.isPublic !== false);
  }
  
  async loadUserNodes(userId: string): Promise<SerializableNodeDefinition[]> {
    return Array.from(this.nodes.values()).filter(node => node.author === userId);
  }
  
  async saveNode(node: SerializableNodeDefinition): Promise<SerializableNodeDefinition> {
    const nodeWithId = {
      ...node,
      id: node.id || `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      updatedAt: new Date().toISOString()
    };
    
    if (!nodeWithId.createdAt) {
      nodeWithId.createdAt = nodeWithId.updatedAt;
    }
    
    this.nodes.set(nodeWithId.id, nodeWithId);
    return nodeWithId;
  }
  
  async deleteNode(nodeId: string): Promise<boolean> {
    return this.nodes.delete(nodeId);
  }
  
  async searchNodes(query: string, category?: NodeCategory): Promise<SerializableNodeDefinition[]> {
    const allNodes = Array.from(this.nodes.values());
    const lowercaseQuery = query.toLowerCase();
    
    return allNodes.filter(node => {
      const matchesQuery = 
        node.name.toLowerCase().includes(lowercaseQuery) ||
        node.description.toLowerCase().includes(lowercaseQuery) ||
        node.type.toLowerCase().includes(lowercaseQuery) ||
        (node.tags && node.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)));
      
      const matchesCategory = !category || node.category === category;
      
      return matchesQuery && matchesCategory;
    });
  }
}

// Serializable Node Registry that can load from database
export class SerializableNodeRegistry {
  private static instance: SerializableNodeRegistry;
  private definitions = new Map<string, NodeDefinition>();
  private serializableDefinitions = new Map<string, SerializableNodeDefinition>();
  private database: NodeDatabase;
  
  private constructor(database?: NodeDatabase) {
    this.database = database || new InMemoryNodeDatabase();
  }
  
  static getInstance(database?: NodeDatabase): SerializableNodeRegistry {
    if (!SerializableNodeRegistry.instance) {
      SerializableNodeRegistry.instance = new SerializableNodeRegistry(database);
    }
    return SerializableNodeRegistry.instance;
  }
  
  // Convert serializable definition to runtime definition
  private compileNodeDefinition(serializable: SerializableNodeDefinition): NodeDefinition {
    const executeFunction = ExecutionEngine.compileExecution(serializable.execution);
    
    return {
      ...serializable,
      execute: executeFunction,
      ui: serializable.ui ? {
        ...serializable.ui,
        icon: serializable.ui.icon ? getIconComponent(serializable.ui.icon) : undefined
      } : undefined
    };
  }
  
  // Register a serializable node definition
  async registerSerializable(serializable: SerializableNodeDefinition): Promise<void> {
    // Save to database
    const savedNode = await this.database.saveNode(serializable);
    
    // Store both versions
    this.serializableDefinitions.set(savedNode.type, savedNode);
    
    // Compile and store runtime version
    const compiled = this.compileNodeDefinition(savedNode);
    this.definitions.set(savedNode.type, compiled);
    
    console.log(`Registered serializable node: ${savedNode.name} (${savedNode.type})`);
  }
  
  // Register a runtime node definition (legacy support)
  register(definition: NodeDefinition): void {
    this.definitions.set(definition.type, definition);
    console.log(`Registered runtime node: ${definition.name} (${definition.type})`);
  }
  
  // Load nodes from database
  async loadFromDatabase(userId?: string): Promise<void> {
    console.log('Loading nodes from database...');
    
    try {
      // Load public nodes
      const publicNodes = await this.database.loadPublicNodes();
      console.log(`Loaded ${publicNodes.length} public nodes`);
      
      // Load user's private nodes if userId provided
      let userNodes: SerializableNodeDefinition[] = [];
      if (userId) {
        userNodes = await this.database.loadUserNodes(userId);
        console.log(`Loaded ${userNodes.length} user nodes`);
      }
      
      // Combine and register all nodes
      const allNodes = [...publicNodes, ...userNodes];
      
      for (const node of allNodes) {
        this.serializableDefinitions.set(node.type, node);
        
        try {
          const compiled = this.compileNodeDefinition(node);
          this.definitions.set(node.type, compiled);
          console.log(`✓ Compiled and registered: ${node.name}`);
        } catch (error) {
          console.error(`✗ Failed to compile node ${node.name}:`, error);
        }
      }
      
      console.log(`Total nodes registered: ${this.definitions.size}`);
    } catch (error) {
      console.error('Failed to load nodes from database:', error);
    }
  }
  
  // Save a node to database
  async saveNode(node: SerializableNodeDefinition): Promise<SerializableNodeDefinition> {
    return await this.database.saveNode(node);
  }
  
  // Get node definition by type
  getDefinition(type: string): NodeDefinition | undefined {
    return this.definitions.get(type);
  }
  
  // Get serializable definition by type
  getSerializableDefinition(type: string): SerializableNodeDefinition | undefined {
    return this.serializableDefinitions.get(type);
  }
  
  // Get all node definitions
  getAllDefinitions(): NodeDefinition[] {
    return Array.from(this.definitions.values());
  }
  
  // Get all serializable definitions
  getAllSerializableDefinitions(): SerializableNodeDefinition[] {
    return Array.from(this.serializableDefinitions.values());
  }
  
  // Search nodes
  async searchNodes(query: string, category?: NodeCategory): Promise<SerializableNodeDefinition[]> {
    return await this.database.searchNodes(query, category);
  }
  
  // Delete node
  async deleteNode(nodeId: string): Promise<boolean> {
    const success = await this.database.deleteNode(nodeId);
    if (success) {
      // Remove from local registries
      for (const [type, def] of this.serializableDefinitions.entries()) {
        if (def.id === nodeId) {
          this.serializableDefinitions.delete(type);
          this.definitions.delete(type);
          break;
        }
      }
    }
    return success;
  }
  
  // Export all user nodes as JSON
  async exportUserNodes(userId: string): Promise<string> {
    const userNodes = await this.database.loadUserNodes(userId);
    return JSON.stringify(userNodes, null, 2);
  }
  
  // Import nodes from JSON
  async importNodes(jsonData: string): Promise<number> {
    try {
      const nodes = JSON.parse(jsonData) as SerializableNodeDefinition[];
      let importedCount = 0;
      
      for (const node of nodes) {
        try {
          await this.registerSerializable(node);
          importedCount++;
        } catch (error) {
          console.error(`Failed to import node ${node.name}:`, error);
        }
      }
      
      return importedCount;
    } catch (error) {
      console.error('Failed to parse JSON:', error);
      throw new Error('Invalid JSON format');
    }
  }
  
  // Create node instance (same as original registry)
  createNodeInstance(type: string, id: string, position: { x: number; y: number }) {
    const definition = this.getDefinition(type);
    if (!definition) {
      throw new Error(`Unknown node type: ${type}`);
    }

    // Initialize parameters with default values
    const parameters: Record<string, any> = {};
    definition.parameters.forEach(param => {
      parameters[param.id] = param.defaultValue;
    });

    return {
      id,
      type: definition.type,
      position,
      data: {
        type: definition.type,
        definition,
        parameters,
        inputConnections: {},
        liveParameterValues: {}
      }
    };
  }
  
  // Execute node (same as original registry)
  executeNode(type: string, inputs: Record<string, any>, parameters: Record<string, any>): Record<string, any> {
    const definition = this.getDefinition(type);
    if (!definition) {
      throw new Error(`Unknown node type: ${type}`);
    }

    try {
      return definition.execute(inputs, parameters);
    } catch (error) {
      console.error(`Error executing node ${type}:`, error);
      return {};
    }
  }
}

// Export singleton instance
export const serializableNodeRegistry = SerializableNodeRegistry.getInstance(); 