import * as THREE from 'three';
import { Node, Edge } from 'reactflow';
import { GeometryNodeData, NodeExecutionResult } from '../types/nodes';
import { executeNodeWithCaching } from './nodeCompiler';

// Compiled graph structure that can be executed efficiently
export interface CompiledGraph {
  id: string; // Hash of the graph structure
  nodes: Node<GeometryNodeData>[];
  edges: Edge[];
  executionOrder: Node<GeometryNodeData>[];
  dependencyMap: Map<string, string[]>; // nodeId -> dependencies
  reverseDependencyMap: Map<string, string[]>; // nodeId -> dependents
  timeDependentNodes: Set<string>; // nodes that depend on time
  staticNodes: Set<string>; // nodes that never change (can be cached permanently)
  outputNodeId: string | null;
  compiledAt: number;
}

// Result of graph execution
export interface GraphExecutionResult {
  success: boolean;
  finalGeometry?: THREE.BufferGeometry;
  error?: string;
  executionStats: {
    totalNodes: number;
    executedNodes: number;
    cachedNodes: number;
    executionTime: number;
  };
  liveParameterValues: Record<string, Record<string, any>>;
}

// Cache for static node results (nodes that never change)
interface StaticNodeCache {
  result: NodeExecutionResult;
  inputsHash: string;
  timestamp: number;
}

export class GraphCompiler {
  private compiledGraphCache = new Map<string, CompiledGraph>();
  private staticNodeCache = new Map<string, StaticNodeCache>();
  private maxCacheSize = 10; // Keep last 10 compiled graphs
  private maxStaticCacheSize = 200; // Cache more static nodes

  /**
   * Compile a node graph into an optimized execution plan
   * This is the expensive operation that should only happen when graph structure changes
   */
  compileGraph(
    nodes: Node<GeometryNodeData>[],
    edges: Edge[]
  ): CompiledGraph {
    const graphId = this.generateGraphId(nodes, edges);
    
    // Check if we already have this graph compiled
    const cached = this.compiledGraphCache.get(graphId);
    if (cached) {
      return cached;
    }

    // Build dependency maps
    const dependencyMap = this.buildDependencyGraph(nodes, edges);
    const reverseDependencyMap = this.buildReverseDependencyGraph(nodes, edges);
    
    // Get execution order via topological sort
    const executionOrder = this.getExecutionOrder(nodes, edges, dependencyMap);
    
    // Identify time-dependent nodes
    const timeDependentNodes = this.identifyTimeDependentNodes(nodes, reverseDependencyMap);
    
    // Identify static nodes (never change)
    const staticNodes = this.identifyStaticNodes(nodes, timeDependentNodes, reverseDependencyMap);
    
    // Find output node
    const outputNode = nodes.find(n => n.data.type === 'output');
    
    const compiled: CompiledGraph = {
      id: graphId,
      nodes,
      edges,
      executionOrder,
      dependencyMap,
      reverseDependencyMap,
      timeDependentNodes,
      staticNodes,
      outputNodeId: outputNode?.id || null,
      compiledAt: Date.now()
    };

    // Cache the compiled graph
    this.compiledGraphCache.set(graphId, compiled);
    this.cleanupCompiledGraphCache();

    console.log(`📦 Compiled graph ${graphId.substring(0, 8)}...`, {
      totalNodes: nodes.length,
      timeDependentNodes: timeDependentNodes.size,
      staticNodes: staticNodes.size,
      executionOrder: executionOrder.length
    });

    return compiled;
  }

  /**
   * Execute a compiled graph efficiently
   * This is the fast operation that runs every frame
   */
  executeGraph(
    compiled: CompiledGraph,
    currentTime: number = 0,
    frameRate: number = 30,
    isTimeUpdate: boolean = false,
    addLog?: (level: 'error' | 'warning' | 'info' | 'debug' | 'success', message: string, details?: any, category?: string) => void
  ): GraphExecutionResult {
    const startTime = performance.now();
    const liveParameterTracker = new Map<string, Record<string, any>>();
    const nodeOutputs = new Map<string, Record<string, any>>();
    const cache = new Map<string, any>();
    
    let executedNodes = 0;
    let cachedNodes = 0;

    try {
      // Determine which nodes need execution
      const nodesToExecute = isTimeUpdate 
        ? this.getNodesForTimeUpdate(compiled)
        : new Set(compiled.executionOrder.map(n => n.id));

      // Execute nodes in dependency order
      for (const node of compiled.executionOrder) {
        // Skip nodes that don't need execution for time updates
        if (isTimeUpdate && !nodesToExecute.has(node.id)) {
          // Try to get cached result for static nodes
          const staticResult = this.getStaticNodeResult(node.id);
          if (staticResult) {
            nodeOutputs.set(node.id, staticResult.outputs);
            cachedNodes++;
            continue;
          }
        }

        // Get node inputs
        const inputs = this.getNodeInputs(
          node.id, 
          compiled.edges, 
          nodeOutputs, 
          liveParameterTracker,
          node.data,
          compiled.nodes
        );

        // Execute the node
        const result = executeNodeWithCaching(
          node, 
          inputs, 
          cache, 
          currentTime, 
          frameRate, 
          addLog
        );

        if (!result.success) {
          return {
            success: false,
            error: `Node ${node.id} (${node.data.label}): ${result.error}`,
            executionStats: {
              totalNodes: compiled.nodes.length,
              executedNodes,
              cachedNodes,
              executionTime: performance.now() - startTime
            },
            liveParameterValues: {}
          };
        }

        nodeOutputs.set(node.id, result.outputs);
        executedNodes++;

        // Cache static node results
        if (compiled.staticNodes.has(node.id)) {
          this.cacheStaticNodeResult(node.id, inputs, result);
        }
      }

      // Get final geometry from output node
      if (!compiled.outputNodeId) {
        return {
          success: false,
          error: 'No output node found in compiled graph',
          executionStats: {
            totalNodes: compiled.nodes.length,
            executedNodes,
            cachedNodes,
            executionTime: performance.now() - startTime
          },
          liveParameterValues: {}
        };
      }

      const outputResult = nodeOutputs.get(compiled.outputNodeId);
      const finalGeometry = outputResult?.['result'] || 
                           outputResult?.['result-out'] ||
                           outputResult?.['geometry-out'] || 
                           outputResult?.['geometry'] as THREE.BufferGeometry;

      if (!finalGeometry) {
        return {
          success: false,
          error: `No geometry produced by output node. Available outputs: ${Object.keys(outputResult || {}).join(', ')}`,
          executionStats: {
            totalNodes: compiled.nodes.length,
            executedNodes,
            cachedNodes,
            executionTime: performance.now() - startTime
          },
          liveParameterValues: {}
        };
      }

      // Convert live parameter tracker to plain object
      const liveParameterValues: Record<string, any> = {};
      liveParameterTracker.forEach((params, nodeId) => {
        liveParameterValues[nodeId] = params;
      });

      const executionTime = performance.now() - startTime;

      return {
        success: true,
        finalGeometry,
        executionStats: {
          totalNodes: compiled.nodes.length,
          executedNodes,
          cachedNodes,
          executionTime
        },
        liveParameterValues
      };

    } catch (error) {
      return {
        success: false,
        error: `Graph execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        executionStats: {
          totalNodes: compiled.nodes.length,
          executedNodes,
          cachedNodes,
          executionTime: performance.now() - startTime
        },
        liveParameterValues: {}
      };
    }
  }

  /**
   * Check if a graph needs recompilation
   */
  needsRecompilation(nodes: Node<GeometryNodeData>[], edges: Edge[]): boolean {
    const graphId = this.generateGraphId(nodes, edges);
    return !this.compiledGraphCache.has(graphId);
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.compiledGraphCache.clear();
    this.staticNodeCache.clear();
  }

  // Private helper methods

  private generateGraphId(nodes: Node<GeometryNodeData>[], edges: Edge[]): string {
    // Create a hash of the graph structure (nodes, edges, and their configurations)
    const nodeData = nodes.map(n => ({
      id: n.id,
      type: n.data.type,
      parameters: n.data.parameters,
      position: n.position
    }));
    
    const edgeData = edges.map(e => ({
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle
    }));

    const combined = JSON.stringify({ nodes: nodeData, edges: edgeData });
    
    // Simple hash function (in production, use a proper hash library)
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  private buildDependencyGraph(nodes: Node<GeometryNodeData>[], edges: Edge[]): Map<string, string[]> {
    const dependencies = new Map<string, string[]>();
    
    // Initialize all nodes
    nodes.forEach(node => {
      dependencies.set(node.id, []);
    });
    
    // Add dependencies based on edges
    edges.forEach(edge => {
      const deps = dependencies.get(edge.target) || [];
      deps.push(edge.source);
      dependencies.set(edge.target, deps);
    });
    
    return dependencies;
  }

  private buildReverseDependencyGraph(nodes: Node<GeometryNodeData>[], edges: Edge[]): Map<string, string[]> {
    const reverseDeps = new Map<string, string[]>();
    
    // Initialize all nodes
    nodes.forEach(node => {
      reverseDeps.set(node.id, []);
    });
    
    // Add reverse dependencies based on edges
    edges.forEach(edge => {
      const deps = reverseDeps.get(edge.source) || [];
      deps.push(edge.target);
      reverseDeps.set(edge.source, deps);
    });
    
    return reverseDeps;
  }

  private getExecutionOrder(
    nodes: Node<GeometryNodeData>[], 
    edges: Edge[], 
    dependencies: Map<string, string[]>
  ): Node<GeometryNodeData>[] {
    const executed = new Set<string>();
    const result: Node<GeometryNodeData>[] = [];
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    function canExecute(nodeId: string): boolean {
      const deps = dependencies.get(nodeId) || [];
      return deps.every(dep => executed.has(dep));
    }
    
    while (result.length < nodes.length) {
      const readyNodes = nodes.filter(node => 
        !executed.has(node.id) && canExecute(node.id)
      );
      
      if (readyNodes.length === 0) {
        throw new Error('Circular dependency detected in node graph');
      }
      
      readyNodes.forEach(node => {
        executed.add(node.id);
        result.push(node);
      });
    }
    
    return result;
  }

  private identifyTimeDependentNodes(
    nodes: Node<GeometryNodeData>[],
    reverseDependencyMap: Map<string, string[]>
  ): Set<string> {
    const timeDependentNodes = new Set<string>();
    
    // Find all time nodes
    const timeNodes = nodes.filter(n => n.data.type === 'time');
    
    // Add time nodes themselves
    timeNodes.forEach(node => {
      timeDependentNodes.add(node.id);
    });
    
    // Propagate time dependency through the graph using BFS
    const queue = [...timeNodes.map(n => n.id)];
    const visited = new Set<string>();
    
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);
      
      timeDependentNodes.add(nodeId);
      
      // Add all nodes that depend on this node
      const dependents = reverseDependencyMap.get(nodeId) || [];
      dependents.forEach(dependentId => {
        if (!visited.has(dependentId)) {
          queue.push(dependentId);
        }
      });
    }
    
    return timeDependentNodes;
  }

  private identifyStaticNodes(
    nodes: Node<GeometryNodeData>[],
    timeDependentNodes: Set<string>,
    reverseDependencyMap: Map<string, string[]>
  ): Set<string> {
    const staticNodes = new Set<string>();
    
    // A node is static if:
    // 1. It's not time-dependent
    // 2. It doesn't have parameters that can change
    // 3. It's not a transform node (can have dynamic inputs)
    
    nodes.forEach(node => {
      if (timeDependentNodes.has(node.id)) {
        return; // Time-dependent nodes are not static
      }
      
      if (node.data.type === 'transform') {
        return; // Transform nodes can have dynamic inputs
      }
      
      if (node.data.type === 'output') {
        return; // Output nodes depend on their inputs
      }
      
      // Primitive nodes with no parameters are static
      if (node.data.type === 'primitive') {
        const hasParameters = 'parameters' in node.data && 
                            node.data.parameters && 
                            Object.keys(node.data.parameters).length > 0;
        
        if (!hasParameters) {
          staticNodes.add(node.id);
        }
      }
      
      // Other nodes types can be evaluated for staticness
      // For now, be conservative and only cache primitive nodes
    });
    
    return staticNodes;
  }

  private getNodesForTimeUpdate(compiled: CompiledGraph): Set<string> {
    // For time updates, only execute time-dependent nodes
    return new Set(compiled.timeDependentNodes);
  }

  private getNodeInputs(
    nodeId: string,
    edges: Edge[],
    nodeOutputs: Map<string, Record<string, any>>,
    liveParameterTracker: Map<string, Record<string, any>>,
    nodeData: any,
    allNodes: Node<GeometryNodeData>[]
  ): Record<string, any> {
    // This is the same logic as in nodeCompiler.ts - we could extract it to a shared utility
    const inputs: Record<string, any> = {};
    const connectedInputs = new Set<string>();
    
    edges.forEach(edge => {
      if (edge.target === nodeId) {
        const sourceOutputs = nodeOutputs.get(edge.source);
        
        if (sourceOutputs && edge.sourceHandle && edge.targetHandle) {
          const outputValue = sourceOutputs[edge.sourceHandle];
          connectedInputs.add(edge.targetHandle);
          
          const targetSocketName = edge.targetHandle.replace('-in', '');
          inputs[targetSocketName] = outputValue;
          
          if (liveParameterTracker) {
            if (!liveParameterTracker.has(nodeId)) {
              liveParameterTracker.set(nodeId, {});
            }
            const nodeParams = liveParameterTracker.get(nodeId)!;
            nodeParams[targetSocketName] = outputValue;
          }
        }
      }
    });
    
    // Add default values for unconnected inputs from node parameters
    if (nodeData?.parameters) {
      Object.entries(nodeData.parameters).forEach(([paramId, value]) => {
        if (!connectedInputs.has(`${paramId}-in`)) {
          inputs[paramId] = value;
        }
      });
    }
    
    return inputs;
  }

  private cacheStaticNodeResult(nodeId: string, inputs: Record<string, any>, result: NodeExecutionResult): void {
    const inputsHash = this.generateInputsHash(inputs);
    
    this.staticNodeCache.set(nodeId, {
      result: this.cloneNodeResult(result),
      inputsHash,
      timestamp: Date.now()
    });
    
    this.cleanupStaticNodeCache();
  }

  private getStaticNodeResult(nodeId: string): NodeExecutionResult | null {
    const cached = this.staticNodeCache.get(nodeId);
    if (!cached) return null;
    
    return this.cloneNodeResult(cached.result);
  }

  private generateInputsHash(inputs: Record<string, any>): string {
    return JSON.stringify(inputs, (key, value) => {
      if (value && value.isBufferGeometry) {
        return `BufferGeometry:${value.uuid}:${value.attributes.position?.count || 0}`;
      }
      if (value && value.isVector3) {
        return `Vector3:${value.x},${value.y},${value.z}`;
      }
      return value;
    });
  }

  private cloneNodeResult(result: NodeExecutionResult): NodeExecutionResult {
    return {
      success: result.success,
      outputs: this.cloneOutputs(result.outputs),
      error: result.error
    };
  }

  private cloneOutputs(outputs: Record<string, any>): Record<string, any> {
    const cloned: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(outputs)) {
      if (value && value.isBufferGeometry) {
        cloned[key] = value.clone();
      } else if (value && value.isVector3) {
        cloned[key] = value.clone();
      } else if (Array.isArray(value)) {
        cloned[key] = [...value];
      } else if (typeof value === 'object' && value !== null) {
        cloned[key] = JSON.parse(JSON.stringify(value)); // Deep clone
      } else {
        cloned[key] = value;
      }
    }
    
    return cloned;
  }

  private cleanupCompiledGraphCache(): void {
    if (this.compiledGraphCache.size > this.maxCacheSize) {
      const entries = Array.from(this.compiledGraphCache.entries());
      entries.sort((a, b) => a[1].compiledAt - b[1].compiledAt);
      
      const toRemove = entries.slice(0, this.compiledGraphCache.size - this.maxCacheSize);
      toRemove.forEach(([key]) => {
        this.compiledGraphCache.delete(key);
      });
    }
  }

  private cleanupStaticNodeCache(): void {
    if (this.staticNodeCache.size > this.maxStaticCacheSize) {
      const entries = Array.from(this.staticNodeCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, this.staticNodeCache.size - this.maxStaticCacheSize);
      toRemove.forEach(([key, entry]) => {
        // Dispose geometries in cache
        Object.values(entry.result.outputs).forEach(output => {
          if (output && output.dispose && typeof output.dispose === 'function') {
            output.dispose();
          }
        });
        this.staticNodeCache.delete(key);
      });
    }
  }
}

// Global instance for the application
export const graphCompiler = new GraphCompiler(); 