// Central Node Registry - the brain of the data-driven system
import { NodeDefinition, NodeCategory, SOCKET_METADATA } from '../types/nodeSystem';
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
  lavaMaterialNodeDefinition
} from './nodes';

export class NodeRegistry {
  private static instance: NodeRegistry;
  private definitions = new Map<string, NodeDefinition>();

  private constructor() {
    this.registerDefaultNodes();
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
    this.register(lavaMaterialNodeDefinition);
    
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
}

// Export singleton instance
export const nodeRegistry = NodeRegistry.getInstance(); 