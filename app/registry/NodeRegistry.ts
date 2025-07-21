// Central Node Registry - the brain of the data-driven system
import { NodeDefinition, NodeCategory, SOCKET_METADATA } from '../types/nodeSystem';
import { JsonNodeDefinition, JsonNodeCollection } from '../types/jsonNodes';
import { jsonToNodeDefinition, loadJsonNodes, parseJsonNodeCollection } from '../utils/jsonNodeLoader';
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
  genericBreakNodeDefinition,
  standardMaterialNodeDefinition,
  basicMaterialNodeDefinition,
  physicalMaterialNodeDefinition,
  emissiveMaterialNodeDefinition,
  setMaterialNodeDefinition,
  materialMixerNodeDefinition,
  waterMaterialNodeDefinition,
  hologramMaterialNodeDefinition
} from './nodes';

export class NodeRegistry {
  private static instance: NodeRegistry;
  private definitions = new Map<string, NodeDefinition>();
  private customNodes = new Map<string, JsonNodeDefinition>(); // Store original JSON definitions
  private updateCallbacks: (() => void)[] = []; // Callbacks for when registry updates
  private serverNodesLoadState: 'idle' | 'loading' | 'loaded' | 'error' = 'idle';
  private serverNodesLoadPromise: Promise<any> | null = null;

  private constructor() {
    this.registerDefaultNodes();
    
    // Load custom nodes from localStorage first
    if (typeof window !== 'undefined') {
      this.loadCustomNodesFromLocalStorage();
      
      // Fetch server nodes after initial setup
      setTimeout(() => {
        this.initializeServerNodes();
      }, 0);
    }
  }

  private async initializeServerNodes(): Promise<void> {
    if (this.serverNodesLoadState !== 'idle') return;
    
    this.serverNodesLoadState = 'loading';
    this.notifyUpdate();
    
    try {
      console.log('🌐 Fetching server nodes...');
      const result = await this.fetchNodesFromServer();
      
      if (result.success > 0) {
        this.serverNodesLoadState = 'loaded';
        console.log(`✅ Loaded ${result.success} server nodes`);
      } else {
        this.serverNodesLoadState = 'error';
        console.warn('⚠️ No server nodes could be loaded');
      }
      
      if (result.failed.length > 0) {
        console.warn(`⚠️ Failed to load ${result.failed.length} nodes:`, result.failed.map(f => f.error));
      }
    } catch (error) {
      this.serverNodesLoadState = 'error';
      console.warn('⚠️ Failed to fetch server nodes:', error);
    }
    
    this.notifyUpdate();
  }

  static getInstance(): NodeRegistry {
    if (!NodeRegistry.instance) {
      NodeRegistry.instance = new NodeRegistry();
    }
    return NodeRegistry.instance;
  }

  // Register all default nodes
  private registerDefaultNodes() {
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
    
    // Register material nodes
    this.register(standardMaterialNodeDefinition);
    this.register(basicMaterialNodeDefinition);
    this.register(physicalMaterialNodeDefinition);
    this.register(emissiveMaterialNodeDefinition);
    this.register(setMaterialNodeDefinition);
    this.register(materialMixerNodeDefinition);
    this.register(waterMaterialNodeDefinition);
    this.register(hologramMaterialNodeDefinition);
    // Note: lava-material is now provided by server nodes only
    
    // Register template-generated nodes
    const templateNodes = templateSystem.generateAllNodes();
    templateNodes.forEach(node => this.register(node));
    
    // Debug: Log all registered nodes
    // console.log('Registered nodes:', Array.from(this.definitions.keys()));
    // console.log('Total nodes registered:', this.definitions.size);
  }

  // Register a new node definition
  register(definition: NodeDefinition) {
    this.definitions.set(definition.type, definition);
    this.notifyUpdate();
  }

  // Subscribe to registry updates
  onUpdate(callback: () => void): () => void {
    this.updateCallbacks.push(callback);
    return () => {
      const index = this.updateCallbacks.indexOf(callback);
      if (index > -1) {
        this.updateCallbacks.splice(index, 1);
      }
    };
  }

  // Notify all subscribers of registry updates
  private notifyUpdate() {
    this.updateCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in registry update callback:', error);
      }
    });
  }

  // Get node definition by type
  getDefinition(type: string): NodeDefinition | undefined {
    return this.definitions.get(type);
  }

  // Get all node definitions
  getAllDefinitions(): NodeDefinition[] {
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

  // JSON Node Management Methods

  // Save custom nodes to localStorage
  private saveCustomNodesToLocalStorage(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return; // Skip if not in browser
    }
    
    try {
      const customNodesArray = Array.from(this.customNodes.values());
      const collection: JsonNodeCollection = {
        version: '1.0.0',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        nodes: customNodesArray
      };
      
      localStorage.setItem('geometry-script-custom-nodes', JSON.stringify(collection));
      console.log(`💾 Saved ${customNodesArray.length} custom nodes to localStorage`);
    } catch (error) {
      console.error('Failed to save custom nodes to localStorage:', error);
    }
  }

  // Load custom nodes from localStorage
  private loadCustomNodesFromLocalStorage(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return; // Skip if not in browser
    }
    
    try {
      const stored = localStorage.getItem('geometry-script-custom-nodes');
      if (!stored) return;
      
      const collection: JsonNodeCollection = JSON.parse(stored);
      const result = this.loadJsonNodeCollection(collection);
      
      if (result.success > 0) {
        console.log(`📂 Loaded ${result.success} custom nodes from localStorage`);
      }
      if (result.failed.length > 0) {
        console.warn(`⚠️ Failed to load ${result.failed.length} custom nodes from localStorage`);
      }
    } catch (error) {
      console.error('Failed to load custom nodes from localStorage:', error);
    }
  }

  // Clear custom nodes from localStorage
  private clearCustomNodesFromLocalStorage(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    
    try {
      localStorage.removeItem('geometry-script-custom-nodes');
      console.log('🗑️ Cleared custom nodes from localStorage');
    } catch (error) {
      console.error('Failed to clear custom nodes from localStorage:', error);
    }
  }

  // Register a JSON node definition
  registerJsonNode(jsonNode: JsonNodeDefinition): { success: boolean; error?: string } {
    try {
      const nodeDefinition = jsonToNodeDefinition(jsonNode);
      
      // Check for conflicts with existing nodes
      if (this.definitions.has(jsonNode.type)) {
        return { success: false, error: `Node type '${jsonNode.type}' already exists` };
      }
      
      // Register the node
      this.register(nodeDefinition);
      this.customNodes.set(jsonNode.type, jsonNode);
      
      // Save to localStorage
      this.saveCustomNodesToLocalStorage();
      
      console.log(`Registered custom node: ${jsonNode.type}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: `Failed to register node: ${error}` };
    }
  }

  // Load multiple JSON nodes from a collection
  loadJsonNodeCollection(collection: JsonNodeCollection): {
    success: number;
    failed: { node: JsonNodeDefinition; error: string }[];
  } {
    const result = loadJsonNodes(collection.nodes);
    let successCount = 0;
    const failed: { node: JsonNodeDefinition; error: string }[] = [];

    // Register valid nodes
    result.valid.forEach(nodeDefinition => {
      try {
        this.register(nodeDefinition);
        const jsonNode = collection.nodes.find(n => n.type === nodeDefinition.type);
        if (jsonNode) {
          this.customNodes.set(nodeDefinition.type, jsonNode);
          successCount++;
        }
      } catch (error) {
        const jsonNode = collection.nodes.find(n => n.type === nodeDefinition.type);
        if (jsonNode) {
          failed.push({ node: jsonNode, error: `Registration failed: ${error}` });
        }
      }
    });

    // Add invalid nodes to failed list
    result.invalid.forEach(({ node, validation }) => {
      failed.push({ 
        node, 
        error: validation.errors.join(', ') 
      });
    });

    if (successCount > 0) {
      // Save to localStorage
      this.saveCustomNodesToLocalStorage();
      this.notifyUpdate();
    }

    return { success: successCount, failed };
  }

  // Load nodes from JSON string
  loadJsonNodesFromString(jsonString: string): {
    success: number;
    failed: { node: JsonNodeDefinition; error: string }[];
  } {
    try {
      const collection = parseJsonNodeCollection(jsonString);
      return this.loadJsonNodeCollection(collection);
    } catch (error) {
      return {
        success: 0,
        failed: [{ 
          node: {} as JsonNodeDefinition, 
          error: `Failed to parse JSON: ${error}` 
        }]
      };
    }
  }

  // Remove a custom node
  removeCustomNode(nodeType: string): boolean {
    if (this.customNodes.has(nodeType)) {
      this.definitions.delete(nodeType);
      this.customNodes.delete(nodeType);
      
      // Save to localStorage
      this.saveCustomNodesToLocalStorage();
      
      console.log(`Removed custom node: ${nodeType}`);
      this.notifyUpdate();
      return true;
    }
    return false;
  }

  // Get all custom nodes as JSON
  getCustomNodesAsJson(): string {
    const collection: JsonNodeCollection = {
      version: '1.0.0',
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      nodes: Array.from(this.customNodes.values())
    };
    
    return JSON.stringify(collection, null, 2);
  }

  // Get custom node definitions
  getCustomNodes(): JsonNodeDefinition[] {
    return Array.from(this.customNodes.values());
  }

  // Check if a node is custom (vs built-in)
  isCustomNode(nodeType: string): boolean {
    return this.customNodes.has(nodeType);
  }

  // Update a custom node
  updateCustomNode(nodeType: string, jsonNode: JsonNodeDefinition): { success: boolean; error?: string } {
    if (!this.customNodes.has(nodeType)) {
      return { success: false, error: 'Node does not exist' };
    }

    try {
      const nodeDefinition = jsonToNodeDefinition(jsonNode);
      
      // Update registration
      this.register(nodeDefinition);
      this.customNodes.set(nodeType, jsonNode);
      
      // Save to localStorage
      this.saveCustomNodesToLocalStorage();
      
      console.log(`Updated custom node: ${nodeType}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: `Failed to update node: ${error}` };
    }
  }

  // Fetch nodes from server API
  async fetchNodesFromServer(): Promise<{
    success: number;
    failed: { node: JsonNodeDefinition; error: string }[];
  }> {
    try {
      const response = await fetch('/api/nodes');
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const collection = await response.json() as JsonNodeCollection;
      return this.loadJsonNodeCollection(collection);
    } catch (error) {
      return {
        success: 0,
        failed: [{
          node: {} as JsonNodeDefinition,
          error: `Failed to fetch from server: ${error}`
        }]
      };
    }
  }

  // Clear all custom nodes (for refresh)
  clearCustomNodes(): void {
    // Remove custom nodes from registry
    this.customNodes.forEach((_, nodeType) => {
      this.definitions.delete(nodeType);
    });
    
    // Clear custom nodes map
    this.customNodes.clear();
    
    // Clear from localStorage
    this.clearCustomNodesFromLocalStorage();
    
    this.notifyUpdate();
  }

  // Get server nodes loading state
  getServerNodesState(): 'idle' | 'loading' | 'loaded' | 'error' {
    return this.serverNodesLoadState;
  }

  // Get server nodes loading promise (for waiting)
  getServerNodesPromise(): Promise<any> | null {
    return this.serverNodesLoadPromise;
  }

  // Check if any server nodes are loaded
  hasServerNodes(): boolean {
    return Array.from(this.customNodes.keys()).some(type => 
      this.isServerNode(type)
    );
  }

  // Check if a node type comes from server (vs local custom nodes)
  private isServerNode(nodeType: string): boolean {
    // Server nodes are identified by having specific naming patterns or categories
    const definition = this.definitions.get(nodeType);
    return definition?.name.includes('Surface') || 
           definition?.name.includes('Material') || 
           definition?.name.includes('Deform') ||
           definition?.category === 'materials';
  }

  // Refresh entire node system (reload server nodes)
  async refreshNodeSystem(): Promise<{
    success: number;
    failed: { node: JsonNodeDefinition; error: string }[];
  }> {
    // Clear existing custom nodes (server nodes)
    this.clearCustomNodes();
    
    // Reset server state and reload
    this.serverNodesLoadState = 'idle';
    await this.initializeServerNodes();
    
    // Return the result based on current state
    return {
      success: this.hasServerNodes() ? Array.from(this.customNodes.keys()).filter(type => this.isServerNode(type)).length : 0,
      failed: []
    };
  }
}

// Export singleton instance
export const nodeRegistry = NodeRegistry.getInstance(); 