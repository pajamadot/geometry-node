import { Node, Edge } from 'reactflow';
import { GeometryNodeData } from '../types/nodes';

export interface LayoutOptions {
  baseNodeWidth?: number;
  baseNodeHeight?: number;
  minNodeSpacingX?: number;
  minNodeSpacingY?: number;
  startX?: number;
  startY?: number;
  maxIterations?: number;
}

export interface LayoutResult {
  nodes: Node<GeometryNodeData>[];
  stats: {
    layerCount: number;
    totalCrossings: number;
    iterationsUsed: number;
  };
}

/**
 * Advanced graph layout using hierarchical positioning and barycenter heuristic
 * Inspired by the Sugiyama framework used in professional node editors
 */
export class GraphLayoutEngine {
  private nodes: Node<GeometryNodeData>[];
  private edges: Edge[];
  private options: Required<LayoutOptions>;

  constructor(nodes: Node<GeometryNodeData>[], edges: Edge[], options: LayoutOptions = {}) {
    this.nodes = nodes;
    this.edges = edges;
    this.options = {
      baseNodeWidth: 200,
      baseNodeHeight: 100,
      minNodeSpacingX: 400,
      minNodeSpacingY: 150,
      startX: 100,
      startY: 100,
      maxIterations: 8,
      ...options
    };
  }

  /**
   * Main layout function - returns positioned nodes
   */
  public layout(): LayoutResult {
    if (this.nodes.length === 0) {
      return {
        nodes: [],
        stats: { layerCount: 0, totalCrossings: 0, iterationsUsed: 0 }
      };
    }

    // Step 1: Build edge maps for efficient lookups
    const { incomingEdges, outgoingEdges, nodeMap } = this.buildEdgeMaps();

    // Step 2: Determine node layers using topological sort
    const { layers, nodeDepths } = this.calculateNodeLayers(incomingEdges);

    // Step 3: Advanced crossing minimization using barycenter heuristic
    const { optimizedLayers, crossings, iterations } = this.optimizeCrossings(
      layers, 
      incomingEdges, 
      outgoingEdges, 
      nodeMap
    );

    // Step 4: Calculate final positions
    const positionedNodes = this.calculatePositions(optimizedLayers, nodeDepths, nodeMap);

    return {
      nodes: positionedNodes,
      stats: {
        layerCount: optimizedLayers.length,
        totalCrossings: crossings,
        iterationsUsed: iterations
      }
    };
  }

  private buildEdgeMaps() {
    const nodeMap = new Map(this.nodes.map(node => [node.id, node]));
    const incomingEdges = new Map<string, Edge[]>();
    const outgoingEdges = new Map<string, Edge[]>();

    this.edges.forEach(edge => {
      if (!incomingEdges.has(edge.target)) incomingEdges.set(edge.target, []);
      if (!outgoingEdges.has(edge.source)) outgoingEdges.set(edge.source, []);
      incomingEdges.get(edge.target)!.push(edge);
      outgoingEdges.get(edge.source)!.push(edge);
    });

    return { incomingEdges, outgoingEdges, nodeMap };
  }

  private calculateNodeLayers(incomingEdges: Map<string, Edge[]>) {
    const nodeDepths = new Map<string, number>();
    const visiting = new Set<string>();

    const calculateDepth = (nodeId: string): number => {
      if (visiting.has(nodeId)) return 0; // Cycle detection
      if (nodeDepths.has(nodeId)) return nodeDepths.get(nodeId)!;

      visiting.add(nodeId);
      
      const incoming = incomingEdges.get(nodeId) || [];
      const maxParentDepth = incoming.length > 0 
        ? Math.max(...incoming.map(edge => calculateDepth(edge.source)))
        : -1;
      
      const depth = maxParentDepth + 1;
      nodeDepths.set(nodeId, depth);
      visiting.delete(nodeId);
      
      return depth;
    };

    // Calculate depths for all nodes
    this.nodes.forEach(node => calculateDepth(node.id));

    // Group nodes by depth
    const maxDepth = Math.max(...Array.from(nodeDepths.values()));
    const layers: string[][] = [];
    for (let i = 0; i <= maxDepth; i++) {
      layers[i] = [];
    }

    nodeDepths.forEach((depth, nodeId) => {
      layers[depth].push(nodeId);
    });

    return { layers, nodeDepths };
  }

  private optimizeCrossings(
    initialLayers: string[][], 
    incomingEdges: Map<string, Edge[]>,
    outgoingEdges: Map<string, Edge[]>,
    nodeMap: Map<string, Node<GeometryNodeData>>
  ) {
    let layers = initialLayers.map(layer => [...layer]);

    // Helper function for node type ordering
    const getNodeTypeOrder = (node: Node<GeometryNodeData>) => {
      const type = node.data.type;
      if (type === 'time') return 0;
      if (type.includes('input') || type.includes('Input')) return 2;
      if (type === 'math' || type.includes('vector-math')) return 5;
      if (type.includes('vector') || type.includes('Vector')) return 6;
      if (type === 'transform') return 7;
      if (type.includes('primitive') || type.includes('geometry')) return 8;
      if (type.includes('material')) return 9;
      if (type === 'output') return 10;
      return 4; // Default
    };

    const calculateBarycenter = (nodeId: string, fixedLayerIndex: number, isDownward: boolean): number => {
      const targetEdges = isDownward 
        ? incomingEdges.get(nodeId) || []
        : outgoingEdges.get(nodeId) || [];
      
      const relevantEdges = targetEdges.filter(edge => {
        const sourceNode = isDownward ? edge.source : edge.target;
        return layers[fixedLayerIndex].includes(sourceNode);
      });

      if (relevantEdges.length === 0) return -1;

      const sum = relevantEdges.reduce((acc, edge) => {
        const sourceNode = isDownward ? edge.source : edge.target;
        return acc + layers[fixedLayerIndex].indexOf(sourceNode);
      }, 0);

      return sum / relevantEdges.length;
    };

    // Helper function to calculate total crossings
    const calculateTotalCrossings = (layerArrangement: string[][]): number => {
      let totalCrossings = 0;
      for (let i = 0; i < layerArrangement.length - 1; i++) {
        const upperLayer = layerArrangement[i];
        const lowerLayer = layerArrangement[i + 1];
        
        // Get all edges between these layers
        const layerEdges: Array<{sourceIndex: number, targetIndex: number}> = [];
        this.edges.forEach(edge => {
          const sourceIndex = upperLayer.indexOf(edge.source);
          const targetIndex = lowerLayer.indexOf(edge.target);
          if (sourceIndex !== -1 && targetIndex !== -1) {
            layerEdges.push({ sourceIndex, targetIndex });
          }
        });

        // Count crossings between edge pairs
        for (let j = 0; j < layerEdges.length; j++) {
          for (let k = j + 1; k < layerEdges.length; k++) {
            const edge1 = layerEdges[j];
            const edge2 = layerEdges[k];
            if ((edge1.sourceIndex < edge2.sourceIndex && edge1.targetIndex > edge2.targetIndex) ||
                (edge1.sourceIndex > edge2.sourceIndex && edge1.targetIndex < edge2.targetIndex)) {
              totalCrossings++;
            }
          }
        }
      }
      return totalCrossings;
    };

    // Multi-pass crossing reduction (adapted from Unreal's approach)
    const maxIterations = Math.min(this.options.maxIterations, layers.length * 2);
    let bestLayout = layers.map(layer => [...layer]);
    let bestCrossings = calculateTotalCrossings(bestLayout);

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const isDownward = iteration % 2 === 0;
      const startLayer = isDownward ? 1 : layers.length - 2;
      const endLayer = isDownward ? layers.length : -1;
      const step = isDownward ? 1 : -1;

      for (let i = startLayer; i !== endLayer; i += step) {
        const fixedLayerIndex = i - step;
        const currentLayer = [...layers[i]];

        // Calculate barycenter for each node
        const nodeBaryCenters = currentLayer.map(nodeId => ({
          nodeId,
          barycenter: calculateBarycenter(nodeId, fixedLayerIndex, isDownward)
        }));

        // Sort by barycenter, keeping nodes with no connections at the end
        nodeBaryCenters.sort((a, b) => {
          if (a.barycenter === -1 && b.barycenter === -1) {
            // For nodes with no connections, use type order as tiebreaker
            const nodeA = nodeMap.get(a.nodeId)!;
            const nodeB = nodeMap.get(b.nodeId)!;
            return getNodeTypeOrder(nodeA) - getNodeTypeOrder(nodeB);
          }
          if (a.barycenter === -1) return 1;
          if (b.barycenter === -1) return -1;
          return a.barycenter - b.barycenter;
        });

        layers[i] = nodeBaryCenters.map(item => item.nodeId);
      }

      // Check if this iteration improved the layout
      const currentCrossings = calculateTotalCrossings(layers);
      if (currentCrossings < bestCrossings) {
        bestLayout = layers.map(layer => [...layer]);
        bestCrossings = currentCrossings;
      }
    }

    return {
      optimizedLayers: bestLayout,
      crossings: bestCrossings,
      iterations: maxIterations
    };
  }

  private calculatePositions(
    layers: string[][], 
    nodeDepths: Map<string, number>,
    nodeMap: Map<string, Node<GeometryNodeData>>
  ): Node<GeometryNodeData>[] {
    // Estimate node dimensions based on type and content
    const getNodeDimensions = (node: Node<GeometryNodeData>) => {
      const type = node.data.type;
      let width = this.options.baseNodeWidth;
      let height = this.options.baseNodeHeight;
      
      // Adjust for complex nodes
      if (type.includes('material') || type.includes('parametric')) {
        height += 50; // Taller for complex parameter nodes
      }
      if (node.data.label && node.data.label.length > 12) {
        width += 20; // Wider for long labels
      }
      
      return { width, height };
    };

    // Calculate better vertical spacing for each layer
    const layerSpacing = layers.map(layer => {
      const layerNodes = layer.map(nodeId => nodeMap.get(nodeId)!);
      const maxHeight = Math.max(...layerNodes.map(node => getNodeDimensions(node).height));
      return maxHeight + this.options.minNodeSpacingY;
    });

    // Calculate horizontal positions with variable spacing
    const layerXPositions: number[] = [];
    let currentX = this.options.startX;
    
    for (let i = 0; i < layers.length; i++) {
      layerXPositions[i] = currentX;
      
      // Calculate width needed for this layer
      const layerNodes = layers[i].map(nodeId => nodeMap.get(nodeId)!);
      const maxWidth = Math.max(...layerNodes.map(node => getNodeDimensions(node).width));
      
      // Next layer starts after this layer's width + spacing
      currentX += maxWidth + this.options.minNodeSpacingX;
    }

    return this.nodes.map(node => {
      const depth = nodeDepths.get(node.id) || 0;
      const layerIndex = layers[depth].indexOf(node.id);
      const layerSize = layers[depth].length;
      
      // Calculate Y position with better centering
      const spacing = layerSpacing[depth] || this.options.minNodeSpacingY;
      const totalLayerHeight = (layerSize - 1) * spacing;
      const layerStartY = this.options.startY - totalLayerHeight / 2;
      const nodeY = layerStartY + layerIndex * spacing;
      
      return {
        ...node,
        position: {
          x: layerXPositions[depth] || (this.options.startX + depth * this.options.minNodeSpacingX),
          y: Math.max(50, nodeY) // Ensure minimum Y position
        }
      };
    });
  }
}

/**
 * Convenience function for quick layout
 */
export function autoLayoutNodes(
  nodes: Node<GeometryNodeData>[], 
  edges: Edge[], 
  options?: LayoutOptions
): LayoutResult {
  const engine = new GraphLayoutEngine(nodes, edges, options);
  return engine.layout();
} 