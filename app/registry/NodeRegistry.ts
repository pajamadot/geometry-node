// Central Node Registry - upgraded to support serializable nodes
import { NodeDefinition, NodeCategory, SOCKET_METADATA } from '../types/nodeSystem';
import { serializableNodeRegistry } from './SerializableNodeRegistry';
import { NodeDefinitionConverter } from './NodeDefinitionConverter';
import { templateSystem } from './TemplateSystem';
import { 
  timeNodeDefinition, 
  cubeNodeDefinition, 
  mathNodeDefinition, 
  transformNodeDefinition,
  outputNodeDefinition,
  sphereNodeDefinition,
  cylinderNodeDefinition,
  vectorMathNodeDefinition,
  joinNodeDefinition,
  subdivideMeshNodeDefinition,
  distributePointsNodeDefinition,
  instanceOnPointsNodeDefinition,
  createVerticesNodeDefinition,
  createFacesNodeDefinition,
  mergeGeometryNodeDefinition,
  parametricSurfaceNodeDefinition,
  gesnerWaveNodeDefinition,
  lighthouseNodeDefinition,
  seagullNodeDefinition,
  lowPolyRockNodeDefinition,
  spiralStairNodeDefinition,
  meshBooleanNodeDefinition,
  makeVectorNodeDefinition,
  breakVectorNodeDefinition,
  makeTransformNodeDefinition,
  breakTransformNodeDefinition,
  genericMakeNodeDefinition,
  genericBreakNodeDefinition
} from './nodes';

export class NodeRegistry {
  private static instance: NodeRegistry;
  private definitions = new Map<string, NodeDefinition>();
  private migrationCompleted = false;

  private constructor() {
    this.initializeRegistry();
  }

  static getInstance(): NodeRegistry {
    if (!NodeRegistry.instance) {
      NodeRegistry.instance = new NodeRegistry();
    }
    return NodeRegistry.instance;
  }

  // Initialize with hybrid approach - legacy + serializable
  private async initializeRegistry() {
    console.log('🔄 Initializing hybrid node registry...');
    
    // Step 1: Register legacy nodes for immediate use
    this.registerLegacyNodes();
    
    // Step 2: Start migration to serializable system in background
    this.migrateToSerializableSystem();
  }

  // Register legacy nodes (for immediate use)
  private registerLegacyNodes() {
    console.log('📦 Loading legacy nodes...');
    
    this.register(timeNodeDefinition);
    this.register(cubeNodeDefinition);
    this.register(sphereNodeDefinition);
    this.register(cylinderNodeDefinition);
    this.register(mathNodeDefinition);
    this.register(vectorMathNodeDefinition);
    this.register(transformNodeDefinition);
    this.register(joinNodeDefinition);
    this.register(subdivideMeshNodeDefinition);
    this.register(distributePointsNodeDefinition);
    this.register(instanceOnPointsNodeDefinition);
    this.register(createVerticesNodeDefinition);
    this.register(createFacesNodeDefinition);
    this.register(mergeGeometryNodeDefinition);
    this.register(parametricSurfaceNodeDefinition);
    this.register(gesnerWaveNodeDefinition);
    this.register(lighthouseNodeDefinition);
    this.register(seagullNodeDefinition);
    this.register(lowPolyRockNodeDefinition);
    this.register(spiralStairNodeDefinition);
    this.register(meshBooleanNodeDefinition);
    this.register(outputNodeDefinition);
    
    // Register Make/Break nodes for compound data structures
    this.register(makeVectorNodeDefinition);
    this.register(breakVectorNodeDefinition);
    this.register(makeTransformNodeDefinition);
    this.register(breakTransformNodeDefinition);
    
    // Register generic Make/Break nodes
    this.register(genericMakeNodeDefinition);
    this.register(genericBreakNodeDefinition);
    
    // Register template-generated nodes
    const templateNodes = templateSystem.generateAllNodes();
    templateNodes.forEach(node => this.register(node));
    
    console.log('✅ Legacy nodes loaded:', this.definitions.size);
  }

  // Migrate to serializable system
  private async migrateToSerializableSystem() {
    try {
      console.log('🔄 Starting migration to serializable system...');
      
      // Convert existing nodes to serializable format
      const existingNodes = Array.from(this.definitions.values());
      const serializableNodes = NodeDefinitionConverter.convertExistingNodes(existingNodes, {
        author: 'system',
        isPublic: true
      });
      
      console.log(`📦 Converting ${serializableNodes.length} nodes to serializable format...`);
      
      // Register serializable nodes
      for (const node of serializableNodes) {
        try {
          await serializableNodeRegistry.registerSerializable(node);
        } catch (error) {
          console.warn(`⚠️ Failed to register serializable node ${node.name}:`, error);
        }
      }
      
      // Load any nodes from database
      await serializableNodeRegistry.loadFromDatabase();
      
      // Update this registry to use serializable definitions
      this.syncWithSerializableRegistry();
      
      this.migrationCompleted = true;
      console.log('✅ Migration to serializable system completed!');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      console.log('⚠️ Continuing with legacy system...');
    }
  }

  // Sync with serializable registry
  private syncWithSerializableRegistry() {
    const serializableDefinitions = serializableNodeRegistry.getAllDefinitions();
    
    // Replace legacy definitions with serializable ones
    serializableDefinitions.forEach(definition => {
      this.definitions.set(definition.type, definition);
    });
    
    console.log(`🔄 Synced ${serializableDefinitions.length} definitions from serializable registry`);
  }

  // Register a new node definition (legacy method)
  register(definition: NodeDefinition) {
    this.definitions.set(definition.type, definition);
  }

  // Register a serializable node (new method)
  async registerSerializable(definition: any) {
    if (this.migrationCompleted) {
      return await serializableNodeRegistry.registerSerializable(definition);
    } else {
      console.warn('⚠️ Serializable registration attempted before migration completion');
    }
  }

  // Get node definition by type
  getDefinition(type: string): NodeDefinition | undefined {
    // First check local definitions
    let definition = this.definitions.get(type);
    
    // If not found and migration is complete, check serializable registry
    if (!definition && this.migrationCompleted) {
      definition = serializableNodeRegistry.getDefinition(type);
      if (definition) {
        // Cache it locally for faster access
        this.definitions.set(type, definition);
      }
    }
    
    return definition;
  }

  // Get all node definitions
  getAllDefinitions(): NodeDefinition[] {
    if (this.migrationCompleted) {
      // Get latest from serializable registry
      return serializableNodeRegistry.getAllDefinitions();
    }
    return Array.from(this.definitions.values());
  }

  // Get nodes by category
  getNodesByCategory(category: NodeCategory): NodeDefinition[] {
    return this.getAllDefinitions().filter(def => def.category === category);
  }

  // Get all categories with their nodes
  getNodesByCategories(): Record<NodeCategory, NodeDefinition[]> {
    const result: Partial<Record<NodeCategory, NodeDefinition[]>> = {};
    
    this.getAllDefinitions().forEach(def => {
      if (!result[def.category]) {
        result[def.category] = [];
      }
      result[def.category]!.push(def);
    });
    
    return result as Record<NodeCategory, NodeDefinition[]>;
  }

  // Check if two socket types are compatible
  areSocketsCompatible(sourceType: string, targetType: string): boolean {
    const sourceMeta = SOCKET_METADATA[sourceType as keyof typeof SOCKET_METADATA];
    const targetMeta = SOCKET_METADATA[targetType as keyof typeof SOCKET_METADATA];
    
    if (!sourceMeta || !targetMeta) return false;
    
    return sourceMeta.compatibleWith.includes(targetType as any) ||
           targetMeta.compatibleWith.includes(sourceType as any);
  }

  // Create a new node instance with default parameters
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
      type: definition.type, // This is the ReactFlow node type
      position,
      data: {
        type: definition.type, // This is the actual node type for execution
        definition,
        parameters,
        inputConnections: {},
        liveParameterValues: {}
      }
    };
  }

  // Execute a node with given inputs
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

  // Validate node connections
  validateConnection(sourceNodeType: string, sourceSocket: string, targetNodeType: string, targetSocket: string): boolean {
    const sourceDef = this.getDefinition(sourceNodeType);
    const targetDef = this.getDefinition(targetNodeType);
    
    if (!sourceDef || !targetDef) return false;
    
    const sourceSocketDef = sourceDef.outputs.find(s => s.id === sourceSocket);
    const targetSocketDef = targetDef.inputs.find(s => s.id === targetSocket);
    
    if (!sourceSocketDef || !targetSocketDef) return false;
    
    return this.areSocketsCompatible(sourceSocketDef.type, targetSocketDef.type);
  }

  // Search nodes by name or description
  searchNodes(query: string): NodeDefinition[] {
    const lowercaseQuery = query.toLowerCase();
    return this.getAllDefinitions().filter(def => 
      def.name.toLowerCase().includes(lowercaseQuery) ||
      def.description.toLowerCase().includes(lowercaseQuery) ||
      def.type.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Database operations (delegate to serializable registry)
  async saveNodeToDatabase(node: any) {
    if (this.migrationCompleted) {
      return await serializableNodeRegistry.saveNode(node);
    } else {
      throw new Error('Database operations not available before migration completion');
    }
  }

  async loadNodesFromDatabase(userId?: string) {
    if (this.migrationCompleted) {
      await serializableNodeRegistry.loadFromDatabase(userId);
      this.syncWithSerializableRegistry();
    } else {
      throw new Error('Database operations not available before migration completion');
    }
  }

  async exportUserNodes(userId: string) {
    if (this.migrationCompleted) {
      return await serializableNodeRegistry.exportUserNodes(userId);
    } else {
      throw new Error('Export not available before migration completion');
    }
  }

  async importNodes(jsonData: string) {
    if (this.migrationCompleted) {
      const result = await serializableNodeRegistry.importNodes(jsonData);
      this.syncWithSerializableRegistry();
      return result;
    } else {
      throw new Error('Import not available before migration completion');
    }
  }

  // Get migration status
  isMigrationCompleted(): boolean {
    return this.migrationCompleted;
  }

  // Force sync with serializable registry (useful for real-time updates)
  async forceSync() {
    if (this.migrationCompleted) {
      this.syncWithSerializableRegistry();
    }
  }
}

// Export singleton instance
export const nodeRegistry = NodeRegistry.getInstance(); 