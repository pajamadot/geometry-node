/**
 * Incremental Computation System
 * Only recomputes changed subgraphs for optimal performance
 */

/**
 * DependencyGraph - Track node dependencies for incremental updates
 */
export class DependencyGraph {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, Set<string>> = new Map();

  addNode(id: string, compute: () => any): void {
    this.nodes.set(id, {
      id,
      compute,
      dirty: true,
      result: null,
      dependencies: new Set(),
    });
  }

  addDependency(from: string, to: string): void {
    if (!this.edges.has(from)) {
      this.edges.set(from, new Set());
    }
    this.edges.get(from)!.add(to);

    const node = this.nodes.get(to);
    if (node) {
      node.dependencies.add(from);
    }
  }

  markDirty(id: string): void {
    const node = this.nodes.get(id);
    if (!node || node.dirty) return;

    node.dirty = true;

    const dependents = this.edges.get(id);
    if (dependents) {
      for (const dep of dependents) {
        this.markDirty(dep);
      }
    }
  }

  compute(id: string): any {
    const node = this.nodes.get(id);
    if (!node) return null;

    if (!node.dirty && node.result !== null) {
      return node.result;
    }

    for (const depId of node.dependencies) {
      this.compute(depId);
    }

    node.result = node.compute();
    node.dirty = false;

    return node.result;
  }

  clear(): void {
    this.nodes.clear();
    this.edges.clear();
  }
}

/**
 * IncrementalCompiler - Only recompute changed subgraphs
 */
export class IncrementalCompiler {
  private dependencyGraph = new DependencyGraph();

  registerNode(id: string, compute: () => any, dependencies: string[]): void {
    this.dependencyGraph.addNode(id, compute);
    for (const dep of dependencies) {
      this.dependencyGraph.addDependency(dep, id);
    }
  }

  invalidate(id: string): void {
    this.dependencyGraph.markDirty(id);
  }

  compute(id: string): any {
    return this.dependencyGraph.compute(id);
  }

  clear(): void {
    this.dependencyGraph.clear();
  }
}

/**
 * RuntimeOptimizer - Dynamic execution plan optimization
 */
export class RuntimeOptimizer {
  private executionTimes = new Map<string, number[]>();
  private strategies = new Map<string, 'default' | 'cache' | 'worker'>();

  recordExecution(nodeId: string, duration: number): void {
    if (!this.executionTimes.has(nodeId)) {
      this.executionTimes.set(nodeId, []);
    }

    const times = this.executionTimes.get(nodeId)!;
    times.push(duration);

    if (times.length > 100) times.shift();

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;

    if (avgTime > 100) {
      this.strategies.set(nodeId, 'worker');
    } else if (avgTime > 50) {
      this.strategies.set(nodeId, 'cache');
    } else {
      this.strategies.set(nodeId, 'default');
    }
  }

  getStrategy(nodeId: string): string {
    return this.strategies.get(nodeId) || 'default';
  }
}

interface GraphNode {
  id: string;
  compute: () => any;
  dirty: boolean;
  result: any;
  dependencies: Set<string>;
}

export const incrementalCompiler = new IncrementalCompiler();
export const runtimeOptimizer = new RuntimeOptimizer();
