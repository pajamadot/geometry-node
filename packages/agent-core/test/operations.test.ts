import { describe, it, expect } from 'vitest';
import { applyOp, applyOps, type EditorSnapshot } from '../src/operations';
const base: EditorSnapshot = { nodes: [], edges: [], version: 0 };
describe('applyOp', () => {
  it('adds a node and bumps version', () => {
    const s = applyOp(base, { op: 'add-node', opId: 'o1', payload: { node: { id: 'n1', type: 'cube', position: {x:0,y:0}, data: {} } } });
    expect(s.nodes).toHaveLength(1); expect(s.version).toBe(1);
  });
  it('update-node merges data and position', () => {
    let s = applyOp(base, { op: 'add-node', opId: 'a', payload: { node: { id: 'n1', type:'cube', position:{x:0,y:0}, data:{ w: 1 } } } });
    s = applyOp(s, { op: 'update-node', opId: 'b', payload: { id: 'n1', data: { w: 2 }, position: { x: 5, y: 6 } } });
    const n = s.nodes.find(n => n.id === 'n1')!;
    expect(n.data.w).toBe(2); expect(n.position).toEqual({ x: 5, y: 6 }); expect(s.version).toBe(2);
  });
  it('remove-node drops the node and its incident edges', () => {
    let s = applyOp(base, { op: 'add-node', opId: 'a', payload: { node: { id: 'n1', type:'cube', position:{x:0,y:0}, data:{} } } });
    s = applyOp(s, { op: 'add-node', opId: 'a2', payload: { node: { id: 'n2', type:'output', position:{x:0,y:0}, data:{} } } });
    s = applyOp(s, { op: 'add-edge', opId: 'b', payload: { edge: { id:'e1', source:'n1', target:'n2' } } });
    s = applyOp(s, { op: 'remove-node', opId: 'c', payload: { id: 'n1' } });
    expect(s.nodes.map(n=>n.id)).toEqual(['n2']); expect(s.edges).toHaveLength(0);
  });
  it('remove-edge removes by id', () => {
    let s = applyOp(base, { op: 'add-edge', opId: 'b', payload: { edge: { id:'e1', source:'a', target:'b' } } });
    s = applyOp(s, { op: 'remove-edge', opId: 'c', payload: { id: 'e1' } });
    expect(s.edges).toHaveLength(0);
  });
  it('replace-graph sets nodes/edges', () => {
    const s = applyOp(base, { op: 'replace-graph', opId: 'r', payload: { nodes: [{id:'x',type:'cube',position:{x:0,y:0},data:{}}], edges: [] } });
    expect(s.nodes).toHaveLength(1); expect(s.version).toBe(1);
  });
  it('applyOps folds multiple ops and is immutable on the input', () => {
    const s = applyOps(base, [
      { op:'add-node', opId:'1', payload:{ node:{id:'n1',type:'cube',position:{x:0,y:0},data:{}} } },
      { op:'add-node', opId:'2', payload:{ node:{id:'n2',type:'output',position:{x:0,y:0},data:{}} } },
    ]);
    expect(s.nodes).toHaveLength(2); expect(s.version).toBe(2); expect(base.nodes).toHaveLength(0);
  });
});
