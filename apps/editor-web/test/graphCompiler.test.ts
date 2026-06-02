import { describe, it, expect } from 'vitest';
import { GraphCompiler } from '@/utils/graphCompiler';

/**
 * Regression test for the pure topological-sort logic in GraphCompiler.
 *
 * We instantiate GraphCompiler directly (not the singleton) to avoid any
 * side-effects from the global instance's cache state.
 *
 * compileGraph() is pure graph-topology — it does NOT invoke THREE or any
 * browser API, so the node environment is sufficient.
 *
 * Real API (verified from source):
 *   new GraphCompiler().compileGraph(nodes, edges) → CompiledGraph
 *   CompiledGraph.executionOrder  — Node<GeometryNodeData>[] in dependency order
 *   CompiledGraph.outputNodeId    — id of the output node (or null)
 *   CompiledGraph.dependencyMap   — Map<nodeId, depIds[]>
 */

const makeNode = (id: string, type: string) => ({
  id,
  type,
  position: { x: 0, y: 0 },
  data: {
    id,
    type,
    label: type,
    parameters: {},
    inputConnections: {},
    liveParameterValues: {},
  },
});

const makeEdge = (id: string, source: string, target: string) => ({
  id,
  source,
  target,
  sourceHandle: 'geometry-out',
  targetHandle: 'geometry-in',
});

describe('GraphCompiler.compileGraph — topological ordering', () => {
  it('places a source node before its dependent in a two-node chain', () => {
    const compiler = new GraphCompiler();
    const nodes = [makeNode('cube-1', 'cube'), makeNode('out-1', 'output')] as any;
    const edges = [makeEdge('e1', 'cube-1', 'out-1')] as any;

    const compiled = compiler.compileGraph(nodes, edges);

    const order = compiled.executionOrder.map((n: any) => n.id);
    expect(order.indexOf('cube-1')).toBeLessThan(order.indexOf('out-1'));
  });

  it('places all sources before the sink in a three-node diamond-ish chain', () => {
    // cube-1 → transform-1 → out-1
    const compiler = new GraphCompiler();
    const nodes = [
      makeNode('cube-1', 'cube'),
      makeNode('transform-1', 'transform'),
      makeNode('out-1', 'output'),
    ] as any;
    const edges = [
      makeEdge('e1', 'cube-1', 'transform-1'),
      makeEdge('e2', 'transform-1', 'out-1'),
    ] as any;

    const compiled = compiler.compileGraph(nodes, edges);

    const order = compiled.executionOrder.map((n: any) => n.id);
    expect(order.indexOf('cube-1')).toBeLessThan(order.indexOf('transform-1'));
    expect(order.indexOf('transform-1')).toBeLessThan(order.indexOf('out-1'));
  });

  it('identifies the output node correctly', () => {
    const compiler = new GraphCompiler();
    const nodes = [makeNode('cube-1', 'cube'), makeNode('out-1', 'output')] as any;
    const edges = [makeEdge('e1', 'cube-1', 'out-1')] as any;

    const compiled = compiler.compileGraph(nodes, edges);

    expect(compiled.outputNodeId).toBe('out-1');
  });

  it('builds the dependency map correctly — output depends on cube', () => {
    const compiler = new GraphCompiler();
    const nodes = [makeNode('cube-1', 'cube'), makeNode('out-1', 'output')] as any;
    const edges = [makeEdge('e1', 'cube-1', 'out-1')] as any;

    const compiled = compiler.compileGraph(nodes, edges);

    // out-1 depends on cube-1; cube-1 has no dependencies
    expect(compiled.dependencyMap.get('out-1')).toContain('cube-1');
    expect(compiled.dependencyMap.get('cube-1')).toHaveLength(0);
  });

  it('detects a circular dependency and throws', () => {
    const compiler = new GraphCompiler();
    // a → b → a  (cycle)
    const nodes = [makeNode('a', 'cube'), makeNode('b', 'transform')] as any;
    const edges = [makeEdge('e1', 'a', 'b'), makeEdge('e2', 'b', 'a')] as any;

    expect(() => compiler.compileGraph(nodes, edges)).toThrow(/[Cc]ircular/);
  });

  it('returns a cached result for the same graph structure (compiledAt is stable)', () => {
    const compiler = new GraphCompiler();
    const nodes = [makeNode('cube-1', 'cube'), makeNode('out-1', 'output')] as any;
    const edges = [makeEdge('e1', 'cube-1', 'out-1')] as any;

    const first = compiler.compileGraph(nodes, edges);
    const second = compiler.compileGraph(nodes, edges);

    // Same object reference from cache
    expect(first).toBe(second);
  });
});
