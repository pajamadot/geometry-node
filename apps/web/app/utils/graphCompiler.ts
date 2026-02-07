import { NodeDefinition, GraphCompilationResult } from '../types/nodes';
import { EnhancedGeometryData } from './builders/GeometryBuilder';
import { NodeRegistry } from '../registry/NodeRegistry';

export interface CompiledNode {
  id: string;
  type: string;
  inputs: Record<string, any>;
  parameters: Record<string, any>;
  dependencies: string[]; // node IDs this node depends on
}

export interface CompiledGraph {
  nodes: CompiledNode[];
  executionOrder: string[]; // topologically sorted node IDs
  outputNodeId: string | null;
  edgeMap: Map<string, { sourceNodeId: string; sourceSocket: string }>;
}

export const graphCompiler = {
  /**
   * Compile a node graph into an execution plan.
   * Performs topological sort and resolves edge connections.
   */
  compileGraph: (nodes: any[], edges: any[]): CompiledGraph => {
    if (!nodes || nodes.length === 0) {
      return { nodes: [], executionOrder: [], outputNodeId: null, edgeMap: new Map() };
    }

    // Build adjacency lists from edges
    const incomingEdges = new Map<string, Set<string>>(); // targetNodeId -> set of sourceNodeIds
    const edgeMap = new Map<string, { sourceNodeId: string; sourceSocket: string }>();

    for (const node of nodes) {
      const nodeId = node.id || node.nodeId;
      incomingEdges.set(nodeId, new Set());
    }

    for (const edge of (edges || [])) {
      const sourceId = edge.source || edge.sourceNodeId;
      const targetId = edge.target || edge.targetNodeId;
      const sourceSocket = edge.sourceHandle || edge.sourceSocket || 'geometry';
      const targetSocket = edge.targetHandle || edge.targetSocket || 'geometry';

      if (incomingEdges.has(targetId)) {
        incomingEdges.get(targetId)!.add(sourceId);
      }

      // Map: "targetNodeId:targetSocket" -> source info
      edgeMap.set(`${targetId}:${targetSocket}`, { sourceNodeId: sourceId, sourceSocket });
    }

    // Topological sort (Kahn's algorithm)
    const inDegree = new Map<string, number>();
    const outgoing = new Map<string, string[]>();

    for (const node of nodes) {
      const nodeId = node.id || node.nodeId;
      inDegree.set(nodeId, 0);
      outgoing.set(nodeId, []);
    }

    for (const edge of (edges || [])) {
      const sourceId = edge.source || edge.sourceNodeId;
      const targetId = edge.target || edge.targetNodeId;
      inDegree.set(targetId, (inDegree.get(targetId) || 0) + 1);
      outgoing.get(sourceId)?.push(targetId);
    }

    const queue: string[] = [];
    for (const [nodeId, degree] of inDegree) {
      if (degree === 0) queue.push(nodeId);
    }

    const executionOrder: string[] = [];
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      executionOrder.push(nodeId);

      for (const neighbor of (outgoing.get(nodeId) || [])) {
        const newDegree = (inDegree.get(neighbor) || 1) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) queue.push(neighbor);
      }
    }

    // Find output node
    let outputNodeId: string | null = null;
    for (const node of nodes) {
      const nodeId = node.id || node.nodeId;
      const nodeType = node.type || node.data?.type;
      if (nodeType === 'output') {
        outputNodeId = nodeId;
        break;
      }
    }
    // If no output node, use the last node in execution order
    if (!outputNodeId && executionOrder.length > 0) {
      outputNodeId = executionOrder[executionOrder.length - 1];
    }

    // Compile nodes
    const compiledNodes: CompiledNode[] = nodes.map(node => {
      const nodeId = node.id || node.nodeId;
      return {
        id: nodeId,
        type: node.type || node.data?.type || 'unknown',
        inputs: node.data?.inputs || {},
        parameters: node.data?.parameters || node.parameters || {},
        dependencies: Array.from(incomingEdges.get(nodeId) || []),
      };
    });

    return {
      nodes: compiledNodes,
      executionOrder,
      outputNodeId,
      edgeMap,
    };
  },

  /**
   * Execute a compiled graph and return the final geometry.
   */
  executeGraph: (compiledGraph: CompiledGraph, currentTime: number = 0, frameRate: number = 60, isTimeUpdate: boolean = false): {
    success: boolean;
    finalGeometry: EnhancedGeometryData | null;
    liveParameterValues: Record<string, any>;
    error?: string;
    nodeOutputs?: Map<string, Record<string, any>>;
  } => {
    if (!compiledGraph || !compiledGraph.executionOrder || compiledGraph.executionOrder.length === 0) {
      return { success: true, finalGeometry: null, liveParameterValues: {} };
    }

    const registry = NodeRegistry.getInstance();
    const nodeOutputs = new Map<string, Record<string, any>>();
    const nodeMap = new Map<string, CompiledNode>();
    const liveParameterValues: Record<string, any> = {};

    for (const node of compiledGraph.nodes) {
      nodeMap.set(node.id, node);
    }

    try {
      for (const nodeId of compiledGraph.executionOrder) {
        const node = nodeMap.get(nodeId);
        if (!node) continue;

        // Resolve inputs from connected edges
        const resolvedInputs: Record<string, any> = { ...node.inputs };
        const definition = registry.getDefinition(node.type);

        if (definition) {
          // For each input socket, check if there's an edge providing data
          for (const input of definition.inputs) {
            const edgeKey = `${nodeId}:${input.id}`;
            const edge = compiledGraph.edgeMap.get(edgeKey);
            if (edge) {
              const sourceOutputs = nodeOutputs.get(edge.sourceNodeId);
              if (sourceOutputs && edge.sourceSocket in sourceOutputs) {
                resolvedInputs[input.id] = sourceOutputs[edge.sourceSocket];
              }
            }
          }

          // Inject time if needed
          if (node.type === 'time') {
            resolvedInputs.currentTime = currentTime;
            resolvedInputs.frameRate = frameRate;
          }

          // Execute the node
          const outputs = definition.execute(resolvedInputs, node.parameters);
          nodeOutputs.set(nodeId, outputs);

          // Track live parameter values
          liveParameterValues[nodeId] = node.parameters;
        }
      }

      // Get final geometry from output node
      let finalGeometry: EnhancedGeometryData | null = null;
      if (compiledGraph.outputNodeId) {
        const outputData = nodeOutputs.get(compiledGraph.outputNodeId);
        if (outputData) {
          finalGeometry = outputData.geometry || outputData['geometry-out'] || null;
        }
      }

      return {
        success: true,
        finalGeometry,
        liveParameterValues,
        nodeOutputs,
      };
    } catch (e: any) {
      return {
        success: false,
        finalGeometry: null,
        liveParameterValues,
        error: e.message || String(e),
      };
    }
  },
};

export type { CompiledGraph as CompiledGraphType };
