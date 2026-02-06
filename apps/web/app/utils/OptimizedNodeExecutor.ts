/**
 * Optimized Node Executor
 *
 * Executes the node graph with:
 * - Topological sort for correct execution order
 * - Result caching with hash-based invalidation
 * - Performance monitoring integration
 * - Dirty-flag propagation for incremental re-execution
 */

import { NodeDefinition } from '../types/nodes';
import { NodeRegistry } from '../registry/NodeRegistry';
import { PerformanceMonitor, getPerformanceMonitor } from './PerformanceMonitor';

// ============================================
// Types
// ============================================

export interface GraphNode {
  id: string;
  type: string;
  parameters: Record<string, any>;
}

export interface GraphEdge {
  sourceNodeId: string;
  sourceSocket: string;
  targetNodeId: string;
  targetSocket: string;
}

export interface ExecutionGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ExecutionResult {
  outputs: Map<string, Record<string, any>>;
  executionOrder: string[];
  totalTimeMs: number;
  cachedNodes: number;
  executedNodes: number;
}

interface CacheEntry {
  hash: string;
  outputs: Record<string, any>;
  timestamp: number;
}

// ============================================
// Optimized Executor
// ============================================

export class OptimizedNodeExecutor {
  private registry: NodeRegistry;
  private monitor: PerformanceMonitor;
  private cache = new Map<string, CacheEntry>();
  private dirtyNodes = new Set<string>();
  private maxCacheSize: number;

  constructor(maxCacheSize = 200) {
    this.registry = NodeRegistry.getInstance();
    this.monitor = getPerformanceMonitor();
    this.maxCacheSize = maxCacheSize;
  }

  /**
   * Execute the full graph and return all node outputs.
   */
  execute(graph: ExecutionGraph): ExecutionResult {
    this.monitor.beginFrame();

    const order = this.topologicalSort(graph);
    const outputs = new Map<string, Record<string, any>>();
    let cachedCount = 0;
    let executedCount = 0;

    // Build adjacency for quick input lookup
    const incomingEdges = new Map<string, GraphEdge[]>();
    for (const edge of graph.edges) {
      const existing = incomingEdges.get(edge.targetNodeId) ?? [];
      existing.push(edge);
      incomingEdges.set(edge.targetNodeId, existing);
    }

    for (const nodeId of order) {
      const node = graph.nodes.find(n => n.id === nodeId);
      if (!node) continue;

      // Gather inputs from upstream nodes
      const inputs: Record<string, any> = {};
      const edges = incomingEdges.get(nodeId) ?? [];
      for (const edge of edges) {
        const sourceOutputs = outputs.get(edge.sourceNodeId);
        if (sourceOutputs) {
          inputs[edge.targetSocket] = sourceOutputs[edge.sourceSocket];
        }
      }

      // Check cache
      const cacheKey = this.computeHash(node, inputs);
      const cached = this.cache.get(nodeId);

      if (cached && cached.hash === cacheKey && !this.dirtyNodes.has(nodeId)) {
        outputs.set(nodeId, cached.outputs);
        cachedCount++;
        continue;
      }

      // Execute node
      const definition = this.registry.getDefinition(node.type);
      if (!definition) {
        outputs.set(nodeId, {});
        continue;
      }

      const result = this.monitor.measure(nodeId, node.type, () => {
        try {
          return definition.execute(inputs, node.parameters);
        } catch (error) {
          console.warn(`Node ${nodeId} (${node.type}) execution failed:`, error);
          return {};
        }
      });

      outputs.set(nodeId, result);
      executedCount++;

      // Update cache
      this.cache.set(nodeId, {
        hash: cacheKey,
        outputs: result,
        timestamp: Date.now(),
      });

      // Evict old cache entries if over limit
      if (this.cache.size > this.maxCacheSize) {
        this.evictOldest();
      }
    }

    this.dirtyNodes.clear();
    const frameMetrics = this.monitor.endFrame();

    return {
      outputs,
      executionOrder: order,
      totalTimeMs: frameMetrics.totalExecutionMs,
      cachedNodes: cachedCount,
      executedNodes: executedCount,
    };
  }

  /**
   * Mark a node as dirty (needs re-execution).
   * Propagates to all downstream nodes.
   */
  markDirty(nodeId: string, graph: ExecutionGraph): void {
    if (this.dirtyNodes.has(nodeId)) return;
    this.dirtyNodes.add(nodeId);

    // Propagate downstream
    for (const edge of graph.edges) {
      if (edge.sourceNodeId === nodeId) {
        this.markDirty(edge.targetNodeId, graph);
      }
    }
  }

  /**
   * Mark a parameter change on a node.
   */
  onParameterChange(nodeId: string, graph: ExecutionGraph): void {
    this.markDirty(nodeId, graph);
  }

  /**
   * Clear the execution cache.
   */
  clearCache(): void {
    this.cache.clear();
    this.dirtyNodes.clear();
  }

  /**
   * Get cache statistics.
   */
  getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate: 0, // Would need a counter for a real hit rate
    };
  }

  // ---- Internal ----

  /**
   * Topological sort using Kahn's algorithm.
   * Returns node IDs in execution order (sources first).
   */
  private topologicalSort(graph: ExecutionGraph): string[] {
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    // Initialize
    for (const node of graph.nodes) {
      inDegree.set(node.id, 0);
      adjacency.set(node.id, []);
    }

    // Build in-degree counts and adjacency list
    for (const edge of graph.edges) {
      const current = inDegree.get(edge.targetNodeId) ?? 0;
      inDegree.set(edge.targetNodeId, current + 1);

      const adj = adjacency.get(edge.sourceNodeId) ?? [];
      adj.push(edge.targetNodeId);
      adjacency.set(edge.sourceNodeId, adj);
    }

    // Start with nodes that have no incoming edges
    const queue: string[] = [];
    for (const [nodeId, degree] of inDegree) {
      if (degree === 0) queue.push(nodeId);
    }

    const order: string[] = [];

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      order.push(nodeId);

      const neighbors = adjacency.get(nodeId) ?? [];
      for (const neighbor of neighbors) {
        const deg = (inDegree.get(neighbor) ?? 1) - 1;
        inDegree.set(neighbor, deg);
        if (deg === 0) queue.push(neighbor);
      }
    }

    // If we didn't visit all nodes, there's a cycle - add remaining in original order
    if (order.length < graph.nodes.length) {
      for (const node of graph.nodes) {
        if (!order.includes(node.id)) {
          order.push(node.id);
        }
      }
    }

    return order;
  }

  /**
   * Compute a hash of a node's parameters and inputs for cache keying.
   */
  private computeHash(node: GraphNode, inputs: Record<string, any>): string {
    try {
      return JSON.stringify({ type: node.type, params: node.parameters, inputKeys: Object.keys(inputs) });
    } catch {
      return `${node.id}-${Date.now()}`;
    }
  }

  /**
   * Evict the oldest cache entry.
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

// Singleton
let executorInstance: OptimizedNodeExecutor | null = null;

export function getOptimizedExecutor(): OptimizedNodeExecutor {
  if (!executorInstance) {
    executorInstance = new OptimizedNodeExecutor();
  }
  return executorInstance;
}
