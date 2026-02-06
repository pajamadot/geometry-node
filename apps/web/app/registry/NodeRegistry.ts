// Central Node Registry - the brain of the data-driven system
import { NodeDefinition, NodeCategory, SOCKET_METADATA } from '../types/nodes';
import { JsonNodeDefinition, JsonNodeCollection } from '../types/jsonNodes';
import { jsonToNodeDefinition, parseJsonNodeCollection } from '../utils/jsonNodeLoader';
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
  hologramMaterialNodeDefinition,
  noiseDisplaceNodeDefinition,
  twistNodeDefinition,
  bendNodeDefinition,
  taperNodeDefinition,
  colorByHeightNodeDefinition,
  colorByNormalNodeDefinition,
  selectByPositionNodeDefinition,
  enhancedSubdivideNodeDefinition,
  instanceOnFacesNodeDefinition,
  instanceGridNodeDefinition,
  extrudeNodeDefinition
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

    // Register modifier nodes
    this.register(noiseDisplaceNodeDefinition);
    this.register(twistNodeDefinition);
    this.register(bendNodeDefinition);
    this.register(taperNodeDefinition);
    this.register(colorByHeightNodeDefinition);
    this.register(colorByNormalNodeDefinition);
    this.register(selectByPositionNodeDefinition);
    this.register(enhancedSubdivideNodeDefinition);
    this.register(instanceOnFacesNodeDefinition);
    this.register(instanceGridNodeDefinition);
    this.register(extrudeNodeDefinition);
    
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
      const category = def.category as NodeCategory;
      if (!result[category]) {
        result[category] = [];
      }
      result[category]!.push(def);
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
      console.warn('localStorage not available (server-side or unsupported browser)');
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
      
      const jsonString = JSON.stringify(collection);
      localStorage.setItem('geometry-script-custom-nodes', jsonString);
      console.log(`💾 Saved ${customNodesArray.length} custom nodes to localStorage (${Math.round(jsonString.length / 1024)}KB)`);
      
      // Verify the save worked
      const verification = localStorage.getItem('geometry-script-custom-nodes');
      if (!verification) {
        console.error('❌ localStorage save verification failed - item not found after save');
      } else if (verification !== jsonString) {
        console.error('❌ localStorage save verification failed - content mismatch');
      } else {
        console.log('✅ localStorage save verified successfully');
      }
    } catch (error) {
      console.error('❌ Failed to save custom nodes to localStorage:', error);
      
      // Try to provide more specific error information
      if (error instanceof Error) {
        if (error.name === 'QuotaExceededError') {
          console.error('💾 localStorage quota exceeded - try clearing some data');
        } else if (error.name === 'SecurityError') {
          console.error('🔒 localStorage access denied - check browser privacy settings');
        }
      }
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

      // Check for valid conversion
      if (!nodeDefinition) {
        return { success: false, error: `Failed to convert JSON node '${jsonNode.type}' to definition` };
      }

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
    let successCount = 0;
    const failed: { node: JsonNodeDefinition; error: string }[] = [];

    // Process each node in the collection
    for (const jsonNode of collection.nodes) {
      const result = this.registerJsonNode(jsonNode);
      if (result.success) {
        successCount++;
      } else {
        failed.push({ node: jsonNode, error: result.error || 'Unknown error' });
      }
    }

    if (successCount > 0) {
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

  // Public method to manually force localStorage save (for debugging)
  public forceSaveToLocalStorage(): boolean {
    try {
      this.saveCustomNodesToLocalStorage();
      return true;
    } catch (error) {
      console.error('Force save to localStorage failed:', error);
      return false;
    }
  }

  // Get current localStorage status
  public getLocalStorageStatus(): {
    available: boolean;
    customNodesCount: number;
    storageSize: number;
    lastSaved?: string;
  } {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return { available: false, customNodesCount: 0, storageSize: 0 };
    }

    try {
      const stored = localStorage.getItem('geometry-script-custom-nodes');
      if (!stored) {
        return { available: true, customNodesCount: 0, storageSize: 0 };
      }

      const collection: JsonNodeCollection = JSON.parse(stored);
      return {
        available: true,
        customNodesCount: collection.nodes.length,
        storageSize: stored.length,
        lastSaved: collection.modified
      };
    } catch (error) {
      console.error('Failed to check localStorage status:', error);
      return { available: true, customNodesCount: 0, storageSize: 0 };
    }
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

      // Check for valid conversion
      if (!nodeDefinition) {
        return { success: false, error: `Failed to convert JSON node '${jsonNode.type}' to definition` };
      }

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

  // =============================================
  // Community Features (Backend Integration)
  // =============================================

  // Track community node metadata (id, likes, downloads, etc.)
  private nodeMetadata = new Map<string, {
    _id: string;
    _isPublic: boolean;
    _isVerified: boolean;
    _downloads: number;
    _likes: number;
    _forkedFrom?: string;
  }>();

  // Get node metadata (community info)
  getNodeMetadata(nodeType: string) {
    return this.nodeMetadata.get(nodeType);
  }

  // Save a node to the server (create or update)
  async saveNodeToServer(nodeType: string): Promise<{ success: boolean; error?: string }> {
    const jsonNode = this.customNodes.get(nodeType);
    if (!jsonNode) {
      return { success: false, error: 'Node not found' };
    }

    try {
      const metadata = this.nodeMetadata.get(nodeType);

      if (metadata?._id) {
        // Update existing node
        const response = await fetch(`/api/nodes/${metadata._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(jsonNode),
        });

        const data = await response.json();
        if (!response.ok) {
          return { success: false, error: data.error || 'Failed to update node' };
        }

        return { success: true };
      } else {
        // Create new node
        const response = await fetch('/api/nodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(jsonNode),
        });

        const data = await response.json();
        if (!response.ok) {
          return { success: false, error: data.error || 'Failed to create node' };
        }

        // Store the returned ID
        if (data.node?._id) {
          this.nodeMetadata.set(nodeType, {
            _id: data.node._id,
            _isPublic: false,
            _isVerified: false,
            _downloads: 0,
            _likes: 0,
          });
        }

        return { success: true };
      }
    } catch (error) {
      return { success: false, error: `Failed to save node: ${error}` };
    }
  }

  // Publish a node (make it public in the community)
  async publishNode(nodeType: string): Promise<{ success: boolean; error?: string }> {
    const metadata = this.nodeMetadata.get(nodeType);
    if (!metadata?._id) {
      // Need to save first
      const saveResult = await this.saveNodeToServer(nodeType);
      if (!saveResult.success) {
        return saveResult;
      }
    }

    const id = this.nodeMetadata.get(nodeType)?._id;
    if (!id) {
      return { success: false, error: 'Node ID not found' };
    }

    try {
      const response = await fetch(`/api/nodes/${id}/publish`, {
        method: 'POST',
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to publish node' };
      }

      // Update metadata
      const meta = this.nodeMetadata.get(nodeType);
      if (meta) {
        meta._isPublic = true;
        this.nodeMetadata.set(nodeType, meta);
      }

      console.log(`📢 Published node: ${nodeType}`);
      this.notifyUpdate();
      return { success: true };
    } catch (error) {
      return { success: false, error: `Failed to publish node: ${error}` };
    }
  }

  // Unpublish a node (make it private)
  async unpublishNode(nodeType: string): Promise<{ success: boolean; error?: string }> {
    const metadata = this.nodeMetadata.get(nodeType);
    if (!metadata?._id) {
      return { success: false, error: 'Node not saved to server' };
    }

    try {
      const response = await fetch(`/api/nodes/${metadata._id}/publish`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to unpublish node' };
      }

      // Update metadata
      metadata._isPublic = false;
      this.nodeMetadata.set(nodeType, metadata);

      console.log(`🔒 Unpublished node: ${nodeType}`);
      this.notifyUpdate();
      return { success: true };
    } catch (error) {
      return { success: false, error: `Failed to unpublish node: ${error}` };
    }
  }

  // Like a community node
  async likeNode(nodeId: string): Promise<{ success: boolean; likes?: number; error?: string }> {
    try {
      const response = await fetch(`/api/nodes/${nodeId}/like`, {
        method: 'POST',
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to like node' };
      }

      return { success: true, likes: data.likes };
    } catch (error) {
      return { success: false, error: `Failed to like node: ${error}` };
    }
  }

  // Unlike a community node
  async unlikeNode(nodeId: string): Promise<{ success: boolean; likes?: number; error?: string }> {
    try {
      const response = await fetch(`/api/nodes/${nodeId}/like`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to unlike node' };
      }

      return { success: true, likes: data.likes };
    } catch (error) {
      return { success: false, error: `Failed to unlike node: ${error}` };
    }
  }

  // Fork a community node to create your own copy
  async forkNode(nodeId: string, newType?: string): Promise<{
    success: boolean;
    node?: JsonNodeDefinition;
    error?: string
  }> {
    try {
      const response = await fetch(`/api/nodes/${nodeId}/fork`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newType ? { newType } : {}),
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to fork node' };
      }

      // Register the forked node
      if (data.node) {
        const result = this.registerJsonNode(data.node);
        if (result.success) {
          // Store metadata
          this.nodeMetadata.set(data.node.type, {
            _id: data.node._id,
            _isPublic: false,
            _isVerified: false,
            _downloads: 0,
            _likes: 0,
            _forkedFrom: data.node._forkedFrom,
          });
        }
        return { success: true, node: data.node };
      }

      return { success: false, error: 'No node returned from fork' };
    } catch (error) {
      return { success: false, error: `Failed to fork node: ${error}` };
    }
  }

  // Discover community nodes
  async discoverNodes(options?: {
    query?: string;
    category?: string;
    sort?: 'downloads' | 'likes' | 'newest';
    limit?: number;
  }): Promise<{
    nodes: Array<JsonNodeDefinition & {
      _id: string;
      _likes: number;
      _downloads: number;
      _isVerified: boolean;
      _isFeatured: boolean;
    }>;
    total: number;
  }> {
    try {
      const params = new URLSearchParams();
      if (options?.query) params.append('query', options.query);
      if (options?.category) params.append('category', options.category);
      if (options?.sort) params.append('sort', options.sort);
      if (options?.limit) params.append('limit', options.limit.toString());

      const query = params.toString();
      const response = await fetch(`/api/nodes/discover${query ? `?${query}` : ''}`);

      if (!response.ok) {
        return { nodes: [], total: 0 };
      }

      const data = await response.json();
      return {
        nodes: data.nodes || [],
        total: data.total || 0,
      };
    } catch (error) {
      console.error('Failed to discover nodes:', error);
      return { nodes: [], total: 0 };
    }
  }

  // Install a community node (add it to your local registry)
  async installCommunityNode(node: JsonNodeDefinition & { _id?: string }): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const result = this.registerJsonNode(node);

      if (result.success && node._id) {
        // Store metadata
        this.nodeMetadata.set(node.type, {
          _id: node._id,
          _isPublic: true,
          _isVerified: (node as any)._isVerified || false,
          _downloads: (node as any)._downloads || 0,
          _likes: (node as any)._likes || 0,
        });
      }

      return result;
    } catch (error) {
      return { success: false, error: `Failed to install node: ${error}` };
    }
  }

  // Check if a node is published
  isNodePublished(nodeType: string): boolean {
    return this.nodeMetadata.get(nodeType)?._isPublic || false;
  }

  // Check if a node is saved to server
  isNodeSavedToServer(nodeType: string): boolean {
    return !!this.nodeMetadata.get(nodeType)?._id;
  }

  // Delete a node from server
  async deleteNodeFromServer(nodeType: string): Promise<{ success: boolean; error?: string }> {
    const metadata = this.nodeMetadata.get(nodeType);
    if (!metadata?._id) {
      return { success: false, error: 'Node not saved to server' };
    }

    try {
      const response = await fetch(`/api/nodes/${metadata._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        return { success: false, error: data.error || 'Failed to delete node' };
      }

      // Remove metadata
      this.nodeMetadata.delete(nodeType);

      console.log(`🗑️ Deleted node from server: ${nodeType}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: `Failed to delete node: ${error}` };
    }
  }
}

// Export singleton instance
export const nodeRegistry = NodeRegistry.getInstance(); 