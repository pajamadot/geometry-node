import { Node, Edge, getNodesBounds, getViewportForBounds } from 'reactflow';
import { GeometryNodeData } from '../types/nodes';

export interface ExportOptions {
  filename?: string;
  padding?: number;
  backgroundColor?: string;
  pixelRatio?: number;
  includeTimestamp?: boolean;
}

export interface GraphExportData {
  nodes: Node<GeometryNodeData>[];
  edges: Edge[];
  metadata: {
    exportDate: string;
    version: string;
    nodeCount: number;
    edgeCount: number;
  };
}

/**
 * Export graph as PNG image using html-to-image
 */
export async function exportGraphAsImage(
  nodes: Node<GeometryNodeData>[],
  getViewport: () => { x: number; y: number; zoom: number },
  setViewport: (viewport: { x: number; y: number; zoom: number }, options?: { duration?: number }) => void,
  fitView: (options?: { padding?: number; duration?: number }) => Promise<void>,
  options: ExportOptions = {}
): Promise<void> {
  const {
    filename = 'geometry-graph',
    padding = 100,
    backgroundColor = '#000000',
    pixelRatio = 2,
    includeTimestamp = true
  } = options;

  if (nodes.length === 0) {
    throw new Error('No nodes to export');
  }

  // Import html-to-image dynamically
  const { toPng } = await import('html-to-image');
  const reactFlowElement = document.querySelector('.react-flow') as HTMLElement;
  
  if (!reactFlowElement) {
    throw new Error('React Flow element not found');
  }

  // Store current viewport to restore later
  const originalViewport = getViewport();
  
  // Step 1: Show the user what will be exported with animated fit
  await fitView({ 
    padding,
    duration: 600 // Show smooth animation to user
  });
  
  // Step 2: Wait for user to see the framing
  await new Promise(resolve => setTimeout(resolve, 800));

  // Step 3: Now capture the same view instantly (no animation) 
  await fitView({ 
    padding,
    duration: 0 // No animation for capture
  });
  
  // Wait for instant fit to complete
  await new Promise(resolve => setTimeout(resolve, 100));

  try {
    // Step 4: Capture the image
    const dataUrl = await toPng(reactFlowElement, {
      backgroundColor,
      width: reactFlowElement.offsetWidth,
      height: reactFlowElement.offsetHeight,
      style: {
        width: reactFlowElement.offsetWidth + 'px',
        height: reactFlowElement.offsetHeight + 'px',
      },
      pixelRatio,
      filter: (node) => {
        // Hide controls, attribution, and other UI elements during export
        if (
          node?.classList?.contains('react-flow__controls') ||
          node?.classList?.contains('react-flow__attribution') ||
          node?.classList?.contains('react-flow__panel') ||
          node?.getAttribute?.('data-testid') === 'rf__controls'
        ) {
          return false;
        }
        return true;
      },
    });

    // Step 5: Restore original viewport
    setViewport(originalViewport, { duration: 0 });

    // Step 6: Download the image
    const finalFilename = includeTimestamp 
      ? `${filename}-${Date.now()}.png`
      : `${filename}.png`;
      
    downloadFile(dataUrl, finalFilename);
    
  } catch (error) {
    // Restore viewport even if export fails
    setViewport(originalViewport, { duration: 0 });
    throw error;
  }
}

/**
 * Export graph as JSON file
 */
export function exportGraphAsJSON(
  nodes: Node<GeometryNodeData>[],
  edges: Edge[],
  options: ExportOptions = {}
): void {
  const {
    filename = 'geometry-graph',
    includeTimestamp = true
  } = options;

  const graphData: GraphExportData = {
    nodes: nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data
    })),
    edges: edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle
    })),
    metadata: {
      exportDate: new Date().toISOString(),
      version: '1.0',
      nodeCount: nodes.length,
      edgeCount: edges.length
    }
  };

  const jsonString = JSON.stringify(graphData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const finalFilename = includeTimestamp 
    ? `${filename}-${Date.now()}.json`
    : `${filename}.json`;
    
  downloadFile(url, finalFilename);
  URL.revokeObjectURL(url);
}

/**
 * Import graph from JSON file
 */
export function importGraphFromJSON(): Promise<{ nodes: Node<GeometryNodeData>[]; edges: Edge[] }> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string);
          
          // Validate JSON structure
          if (!jsonData.nodes || !Array.isArray(jsonData.nodes)) {
            throw new Error('Invalid JSON format: missing nodes array');
          }

          if (!jsonData.edges || !Array.isArray(jsonData.edges)) {
            throw new Error('Invalid JSON format: missing edges array');
          }

          const importedNodes = jsonData.nodes as Node<GeometryNodeData>[];
          const importedEdges = jsonData.edges as Edge[];

          resolve({ nodes: importedNodes, edges: importedEdges });
        } catch (error) {
          reject(new Error(`JSON parsing failed: ${error}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  });
}

/**
 * Helper function to download a file
 */
function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Calculate image dimensions for export
 */
export function calculateExportDimensions(
  nodes: Node<GeometryNodeData>[],
  padding: number = 100
): { width: number; height: number } {
  if (nodes.length === 0) {
    return { width: 800, height: 600 }; // Default size
  }

  const nodesBounds = getNodesBounds(nodes);
  return {
    width: nodesBounds.width + (padding * 2),
    height: nodesBounds.height + (padding * 2)
  };
}

/**
 * Validate imported graph data
 */
export function validateImportedGraph(data: any): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check basic structure
  if (!data || typeof data !== 'object') {
    errors.push('Invalid JSON data');
    return { valid: false, errors, warnings };
  }

  // Check nodes
  if (!data.nodes) {
    errors.push('Missing nodes array');
  } else if (!Array.isArray(data.nodes)) {
    errors.push('Nodes must be an array');
  } else {
    data.nodes.forEach((node: any, index: number) => {
      if (!node.id) errors.push(`Node ${index} missing id`);
      if (!node.type) errors.push(`Node ${index} missing type`);
      if (!node.position) errors.push(`Node ${index} missing position`);
      if (!node.data) warnings.push(`Node ${index} missing data`);
    });
  }

  // Check edges
  if (!data.edges) {
    errors.push('Missing edges array');
  } else if (!Array.isArray(data.edges)) {
    errors.push('Edges must be an array');
  } else {
    data.edges.forEach((edge: any, index: number) => {
      if (!edge.id) errors.push(`Edge ${index} missing id`);
      if (!edge.source) errors.push(`Edge ${index} missing source`);
      if (!edge.target) errors.push(`Edge ${index} missing target`);
    });
  }

  // Check metadata (optional but recommended)
  if (!data.metadata) {
    warnings.push('Missing metadata - file may be from older version');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Export configuration for different use cases
 */
export const ExportPresets = {
  /**
   * High quality export for presentations
   */
  PRESENTATION: {
    padding: 120,
    backgroundColor: '#ffffff',
    pixelRatio: 3,
    includeTimestamp: true
  } as ExportOptions,

  /**
   * Standard export for general use
   */
  STANDARD: {
    padding: 80,
    backgroundColor: '#000000',
    pixelRatio: 2,
    includeTimestamp: true
  } as ExportOptions,

  /**
   * Quick export for testing
   */
  QUICK: {
    padding: 50,
    backgroundColor: '#000000',
    pixelRatio: 1,
    includeTimestamp: false
  } as ExportOptions,

  /**
   * Print-friendly export
   */
  PRINT: {
    padding: 100,
    backgroundColor: '#ffffff',
    pixelRatio: 3,
    includeTimestamp: false
  } as ExportOptions
} as const; 