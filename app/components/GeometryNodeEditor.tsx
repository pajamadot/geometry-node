'use client';

import React, { useCallback, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  useReactFlow,
} from 'reactflow';

import 'reactflow/dist/style.css';

import { GeometryNode, GeometryNodeData } from '../types/nodes';
import PrimitiveNode from '../nodes/PrimitiveNode';
import TransformNode from '../nodes/TransformNode';
import OutputNode from '../nodes/OutputNode';
import JoinNode from '../nodes/JoinNode';
import ParametricSurfaceNode from '../nodes/ParametricSurfaceNode';
import TimeNode from '../nodes/TimeNode';
import DistributePointsNode from '../nodes/DistributePointsNode';
import InstanceOnPointsNode from '../nodes/InstanceOnPointsNode';
import SubdivideMeshNode from '../nodes/SubdivideMeshNode';
import CreateVerticesNode from '../nodes/CreateVerticesNode';
import CreateFacesNode from '../nodes/CreateFacesNode';
import MergeGeometryNode from '../nodes/MergeGeometryNode';
import MathNode from '../nodes/MathNode';
import VectorMathNode from '../nodes/VectorMathNode';
import { useGeometry } from './GeometryContext';
import { useTime } from './TimeContext';
import { NodeProvider } from './NodeContext';
import ContextMenu from './ContextMenu';
import NodeContextMenu from './NodeContextMenu';
import { areTypesCompatible, getSocketTypeFromHandle } from '../types/connections';
import { clearNodeCache } from '../utils/nodeCompiler';

// Define node types outside component to avoid re-creation
const nodeTypes = {
  primitive: PrimitiveNode,
  transform: TransformNode,
  output: OutputNode,
  join: JoinNode,
  parametric: ParametricSurfaceNode,
  time: TimeNode,
  'distribute-points': DistributePointsNode,
  'instance-on-points': InstanceOnPointsNode,
  'subdivide-mesh': SubdivideMeshNode,
  'create-vertices': CreateVerticesNode,
  'create-faces': CreateFacesNode,
  'merge-geometry': MergeGeometryNode,
  math: MathNode,
  'vector-math': VectorMathNode,
};

// Define default edge options outside component
const defaultEdgeOptions = {
  animated: true,
  style: { 
    stroke: '#eab308', 
    strokeWidth: 3,
    filter: 'drop-shadow(0 0 4px rgba(234, 179, 8, 0.4))',
    cursor: 'pointer' as const,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const
  },
  interactionWidth: 24
};



// Define Background props outside component
const backgroundProps = {
  variant: BackgroundVariant.Dots as any,
  gap: 20,
  size: 0.8,
  color: "#1f2937",
};

// Initial nodes for testing
const initialNodes: Node<GeometryNodeData>[] = [
  {
    id: '1',
    type: 'primitive',
    position: { x: 100, y: 100 },
    data: {
      id: '1',
      type: 'primitive',
      label: 'Cube',
      primitiveType: 'cube',
      parameters: {
        width: 1,
        height: 1,
        depth: 1,
      },
    } as any,
  },
  {
    id: '2',
    type: 'transform',
    position: { x: 400, y: 100 },
    data: {
      id: '2',
      type: 'transform',
      label: 'Transform',
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
    } as any,
  },
  {
    id: '3',
    type: 'output',
    position: { x: 700, y: 100 },
    data: {
      id: '3',
      type: 'output',
      label: 'Output',
    } as any,
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    sourceHandle: 'geometry-out',
    targetHandle: 'geometry-in',
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    sourceHandle: 'geometry-out',
    targetHandle: 'geometry-in',
  },
];

export default function GeometryNodeEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { compileNodes, isCompiling, error } = useGeometry();
  const { currentTime, frameRate } = useTime();
  const { screenToFlowPosition } = useReactFlow();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [nodeContextMenu, setNodeContextMenu] = useState<{ 
    x: number; 
    y: number; 
    nodeId: string; 
    nodeData: GeometryNodeData 
  } | null>(null);
  const [disabledNodes, setDisabledNodes] = useState<Set<string>>(new Set());
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());

  // Connection validation with type checking
  const isValidConnection = useCallback((connection: Connection) => {
    const { source, target, sourceHandle, targetHandle } = connection;
    
    if (!source || !target || !sourceHandle || !targetHandle) return false;
    
    const sourceNode = nodes.find(n => n.id === source);
    const targetNode = nodes.find(n => n.id === target);
    if (!sourceNode || !targetNode) return false;

    // Get socket types from handle IDs
    const sourceType = getSocketTypeFromHandle(sourceHandle);
    const targetType = getSocketTypeFromHandle(targetHandle);
    
    // Check type compatibility
    if (!areTypesCompatible(sourceType, targetType)) {
      console.log(`Type mismatch: ${sourceType} -> ${targetType}`);
      return false;
    }

    // Check if target already has a connection on this handle
    const existingConnection = edges.find(e => 
      e.target === target && e.targetHandle === targetHandle
    );

    // Only allow multiple connections to join nodes and some specific input types
    if (existingConnection && targetNode.data.type !== 'join') {
      return false;
    }

    // Transform nodes can only accept one geometry input
    if (targetNode.data.type === 'transform' && targetHandle === 'geometry-in') {
      const existingGeometryConnection = edges.find(e => 
        e.target === target && e.targetHandle === 'geometry-in'
      );
      return !existingGeometryConnection;
    }

    return true;
  }, [nodes, edges]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (isValidConnection(params)) {
        // Determine connection type based on handle IDs (Blender-inspired)
        let connectionType = 'geometry';
        if (params.sourceHandle?.includes('time') || params.targetHandle?.includes('time')) {
          connectionType = 'time';
        } else if (params.sourceHandle?.includes('points') || params.targetHandle?.includes('points')) {
          connectionType = 'points';
        } else if (params.sourceHandle?.includes('instances') || params.targetHandle?.includes('instances')) {
          connectionType = 'instances';
        } else if (params.sourceHandle?.includes('vertices') || params.targetHandle?.includes('vertices')) {
          connectionType = 'vertices';
        } else if (params.sourceHandle?.includes('faces') || params.targetHandle?.includes('faces')) {
          connectionType = 'faces';
        } else if (params.sourceHandle?.includes('number') || params.targetHandle?.includes('number')) {
          connectionType = 'number';
        }
        
        const newEdge = {
          ...params,
          animated: true,
          data: { connectionType },
          style: getEdgeStyle(connectionType),
          // Add data attributes for CSS styling
          className: `connection-${connectionType}`,
          'data-connection-type': connectionType,
          'data-target-handle': params.targetHandle,
          'data-source-handle': params.sourceHandle
        };
        
        setEdges((eds) => addEdge(newEdge, eds));
      }
    },
    [setEdges, isValidConnection]
  );

  // Function to get edge style based on connection type (Blender-inspired)
  const getEdgeStyle = (connectionType: string) => {
    switch (connectionType) {
      case 'geometry':
        return {
          stroke: '#eab308', // Yellow - Blender geometry socket color
          strokeWidth: 3,
          filter: 'drop-shadow(0 0 4px rgba(234, 179, 8, 0.4))'
        };
      case 'points':
        return {
          stroke: '#06b6d4', // Cyan - Points/vertex data
          strokeWidth: 2,
          filter: 'drop-shadow(0 0 4px rgba(6, 182, 212, 0.4))'
        };
      case 'time':
        return {
          stroke: '#ec4899', // Pink - Animation/time data
          strokeWidth: 2,
          filter: 'drop-shadow(0 0 4px rgba(236, 72, 153, 0.4))'
        };
      case 'number':
        return {
          stroke: '#22c55e', // Green - Numeric values (like Blender)
          strokeWidth: 2,
          filter: 'drop-shadow(0 0 4px rgba(34, 197, 94, 0.4))'
        };
      case 'instances':
        return {
          stroke: '#10b981', // Emerald - Instance data
          strokeWidth: 3,
          filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.4))'
        };
      case 'vertices':
        return {
          stroke: '#ef4444', // Red - Raw vertex data
          strokeWidth: 2,
          filter: 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.4))'
        };
      case 'faces':
        return {
          stroke: '#6366f1', // Indigo - Face topology data
          strokeWidth: 2,
          filter: 'drop-shadow(0 0 4px rgba(99, 102, 241, 0.4))'
        };
      default:
        return {
          stroke: '#6b7280', // Gray - Unknown/generic
          strokeWidth: 2,
          filter: 'drop-shadow(0 0 4px rgba(107, 114, 128, 0.4))'
        };
    }
  };

  const closeContextMenu = useCallback(() => setContextMenu(null), []);
  const closeNodeContextMenu = useCallback(() => setNodeContextMenu(null), []);

  // Handle edge click for deletion with Alt key
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: any) => {
    if (event.altKey) {
      event.preventDefault();
      event.stopPropagation();
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    }
  }, [setEdges]);

  // Handle edge mouse enter/leave for visual feedback
  const onEdgeMouseEnter = useCallback((event: React.MouseEvent, edge: any) => {
    // Add visual feedback when hovering over edges
    const edgeElement = event.target as HTMLElement;
    if (edgeElement) {
      edgeElement.style.filter = 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8))';
      edgeElement.style.strokeWidth = '3';
    }
  }, []);

  const onEdgeMouseLeave = useCallback((event: React.MouseEvent, edge: any) => {
    // Remove visual feedback when leaving edges
    const edgeElement = event.target as HTMLElement;
    if (edgeElement) {
      edgeElement.style.filter = 'drop-shadow(0 0 4px rgba(6, 182, 212, 0.4))';
      edgeElement.style.strokeWidth = '2';
    }
  }, []);

  // Function to update node data
  const updateNodeData = useCallback((nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const updatedNode = { ...node, data: { ...node.data, ...newData } as GeometryNodeData };
          return updatedNode;
        }
        return node;
      })
    );
  }, [setNodes]);

  // Handle right-click for context menu
  const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY });
  }, []);

  // Handle node right-click for node context menu
  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: any) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu(null); // Close pane context menu if open
    setNodeContextMenu({ 
      x: event.clientX, 
      y: event.clientY, 
      nodeId: node.id,
      nodeData: node.data
    });
  }, []);

  // Node operations
  // Handle node selection changes
  const onSelectionChange = useCallback((params: { nodes: Node[]; edges: Edge[] }) => {
    const selectedNodeIds = new Set(params.nodes.map(node => node.id));
    setSelectedNodes(selectedNodeIds);
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    // Clear cache for deleted node
    clearNodeCache(nodeId);
    
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setDisabledNodes((disabled) => {
      const newDisabled = new Set(disabled);
      newDisabled.delete(nodeId);
      return newDisabled;
    });
    setSelectedNodes((selected) => {
      const newSelected = new Set(selected);
      newSelected.delete(nodeId);
      return newSelected;
    });
  }, [setNodes, setEdges]);

  // Delete selected nodes
  const deleteSelectedNodes = useCallback(() => {
    if (selectedNodes.size === 0) return;
    
    selectedNodes.forEach(nodeId => {
      deleteNode(nodeId);
    });
    setSelectedNodes(new Set());
  }, [selectedNodes, deleteNode]);

  const duplicateNode = useCallback((nodeId: string) => {
    const nodeToDuplicate = nodes.find(n => n.id === nodeId);
    if (!nodeToDuplicate) return;

    const newId = `${Date.now()}`;
    const newNode = {
      ...nodeToDuplicate,
      id: newId,
      position: {
        x: nodeToDuplicate.position.x + 40,
        y: nodeToDuplicate.position.y + 40
      },
      data: {
        ...nodeToDuplicate.data,
        id: newId
      }
    };

    setNodes((nds) => [...nds, newNode]);
  }, [nodes, setNodes]);

  const copyNode = useCallback((nodeId: string) => {
    const nodeToCopy = nodes.find(n => n.id === nodeId);
    if (!nodeToCopy) return;

    // Copy to clipboard as JSON
    const nodeData = {
      type: nodeToCopy.type,
      data: nodeToCopy.data,
      position: nodeToCopy.position
    };
    
    navigator.clipboard.writeText(JSON.stringify(nodeData, null, 2)).then(() => {
      console.log('Node copied to clipboard');
    }).catch(() => {
      console.log('Failed to copy node to clipboard');
    });
  }, [nodes]);

  const toggleNodeDisabled = useCallback((nodeId: string) => {
    setDisabledNodes((disabled) => {
      const newDisabled = new Set(disabled);
      if (newDisabled.has(nodeId)) {
        newDisabled.delete(nodeId);
      } else {
        newDisabled.add(nodeId);
        // Clear cache when disabling node
        clearNodeCache(nodeId);
      }
      return newDisabled;
    });
  }, []);

  // Add new node
  const addNode = useCallback((type: any, screenPosition: { x: number; y: number }, primitiveType?: string) => {
    const newId = `${Date.now()}`;
    
    // Convert screen coordinates to flow coordinates
    const flowPosition = screenToFlowPosition({
      x: screenPosition.x,
      y: screenPosition.y,
    });
    
    let newNodeData;

    switch (type) {
      case 'primitive':
        const pType = primitiveType || 'cube';
        let parameters;
        
        if (pType === 'cube') {
          parameters = { width: 1, height: 1, depth: 1 };
        } else if (pType === 'sphere') {
          parameters = { radius: 1, widthSegments: 32, heightSegments: 16 };
        } else if (pType === 'cylinder') {
          parameters = { radiusTop: 1, radiusBottom: 1, height: 1, radialSegments: 32 };
        } else {
          parameters = { width: 1, height: 1, depth: 1 };
        }

        newNodeData = {
          id: newId,
          type: 'primitive',
          label: pType.charAt(0).toUpperCase() + pType.slice(1),
          primitiveType: pType,
          parameters
        };
        break;
      case 'transform':
        newNodeData = {
          id: newId,
          type: 'transform',
          label: 'Transform',
          transform: {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 }
          }
        };
        break;
      case 'join':
        newNodeData = {
          id: newId,
          type: 'join',
          label: 'Join',
          operation: 'merge'
        };
        break;
      case 'output':
        newNodeData = {
          id: newId,
          type: 'output',
          label: 'Output'
        };
        break;
      case 'parametric':
        newNodeData = {
          id: newId,
          type: 'parametric',
          label: 'Parametric Surface',
          uFunction: 'Math.cos(u) * Math.sin(v)',
          vFunction: 'Math.sin(u) * Math.sin(v)',
          zFunction: 'Math.cos(v)',
          uMin: 0,
          uMax: Math.PI * 2,
          vMin: 0,
          vMax: Math.PI,
          uSegments: 32,
          vSegments: 16
        };
        break;
      case 'time':
        newNodeData = {
          id: newId,
          type: 'time',
          label: 'Time',
          timeMode: 'seconds',
          outputType: 'raw',
          frequency: 1,
          amplitude: 1,
          offset: 0,
          phase: 0
        };
        break;
      case 'distribute-points':
        newNodeData = {
          id: newId,
          type: 'distribute-points',
          label: 'Distribute Points',
          distributeMethod: 'random',
          density: 100,
          seed: 0,
          distanceMin: 0.1
        };
        break;
      case 'instance-on-points':
        newNodeData = {
          id: newId,
          type: 'instance-on-points',
          label: 'Instance on Points',
          pickInstance: false,
          instanceIndex: 0,
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 }
        };
        break;
      case 'subdivide-mesh':
        newNodeData = {
          id: newId,
          type: 'subdivide-mesh',
          label: 'Subdivide Mesh',
          level: 1
        };
        break;
      case 'create-vertices':
        newNodeData = {
          id: newId,
          type: 'create-vertices',
          label: 'Create Vertices',
          vertices: [
            { x: 0, y: 1, z: 0 },
            { x: -1, y: -1, z: 0 },
            { x: 1, y: -1, z: 0 }
          ],
          vertexCount: 3
        };
        break;
      case 'create-faces':
        newNodeData = {
          id: newId,
          type: 'create-faces',
          label: 'Create Faces',
          faces: [{ a: 0, b: 1, c: 2 }],
          faceCount: 1
        };
        break;
      case 'merge-geometry':
        newNodeData = {
          id: newId,
          type: 'merge-geometry',
          label: 'Merge Geometry',
          computeNormals: true,
          generateUVs: false
        };
        break;
      case 'math':
        newNodeData = {
          id: newId,
          type: 'math',
          label: 'Math',
          operation: 'add',
          valueA: 0,
          valueB: 0
        };
        break;
      case 'vector-math':
        newNodeData = {
          id: newId,
          type: 'vector-math',
          label: 'Vector Math',
          operation: 'add',
          vectorA: { x: 0, y: 0, z: 0 },
          vectorB: { x: 0, y: 0, z: 0 },
          scale: 1
        };
        break;
      default:
        return;
    }

    const newNode: Node = {
      id: newId,
      type: type,
      position: { x: flowPosition.x - 75, y: flowPosition.y - 25 }, // Small offset so node doesn't cover cursor
      data: newNodeData as any,
    };

    setNodes((nds) => [...nds, newNode]);
  }, [setNodes, screenToFlowPosition]);

  // Track input connections for each node
  const getInputConnections = React.useMemo(() => {
    const connections: Record<string, Record<string, boolean>> = {};
    
    edges.forEach(edge => {
      if (edge.target && edge.targetHandle && edge.targetHandle.endsWith('-in')) {
        if (!connections[edge.target]) {
          connections[edge.target] = {};
        }
        const paramName = edge.targetHandle.replace('-in', '');
        connections[edge.target][paramName] = true;
      }
    });
    
    return connections;
  }, [edges]);

  // Update nodes with input connection information
  const nodesWithConnections = React.useMemo(() => {
    return nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        inputConnections: getInputConnections[node.id] || {}
      }
    }));
  }, [nodes, getInputConnections]);

  // Memoize active nodes to prevent unnecessary recompilation
  const activeNodes = React.useMemo(() => {
    return nodesWithConnections.filter(node => !disabledNodes.has(node.id));
  }, [nodesWithConnections, disabledNodes]);

  // Create stable node data for compilation (excluding positions)
  const nodeDataForCompilation = React.useMemo(() => {
    return nodes.map(n => ({ id: n.id, data: n.data }));
  }, [nodes.map(n => `${n.id}:${JSON.stringify(n.data)}`).join('|')]);

  // Create compilation hash that only depends on actual node data, not positions
  const compilationHash = React.useMemo(() => {
    // Only include data that affects compilation, not position
    const nodeDataHash = nodeDataForCompilation
      .filter(node => !disabledNodes.has(node.id))
      .map(n => `${n.id}:${JSON.stringify(n.data)}`)
      .join('|');
    const edgeHash = edges.map(e => `${e.source}-${e.target}:${e.sourceHandle}-${e.targetHandle}`).join('|');
    return `${nodeDataHash}::${edgeHash}`;
  }, [nodeDataForCompilation, edges, disabledNodes]);

  // Compile when graph structure changes
  React.useEffect(() => {
    compileNodes(activeNodes, edges, currentTime, frameRate, false);
  }, [compilationHash, compileNodes, activeNodes, edges, currentTime, frameRate]);

  // Compile when time changes (with shorter debounce for real-time animation)
  React.useEffect(() => {
    compileNodes(activeNodes, edges, currentTime, frameRate, true);
  }, [currentTime, compileNodes, activeNodes, edges, frameRate]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle shortcuts if user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (nodeContextMenu) {
        // If node context menu is open, handle shortcuts for that node
        if (event.key === 'Delete') {
          event.preventDefault();
          deleteNode(nodeContextMenu.nodeId);
          closeNodeContextMenu();
        }
        if (event.ctrlKey || event.metaKey) {
          if (event.key === 'd') {
            event.preventDefault();
            duplicateNode(nodeContextMenu.nodeId);
            closeNodeContextMenu();
          }
          if (event.key === 'c') {
            event.preventDefault();
            copyNode(nodeContextMenu.nodeId);
            closeNodeContextMenu();
          }
        }
      }
      
      // Global shortcuts (when no menu is open)
      if (!contextMenu && !nodeContextMenu) {
        if (event.key === 'Delete') {
          // Delete selected nodes
          event.preventDefault();
          deleteSelectedNodes();
        }
        if (event.key === 'Escape') {
          // Clear selection or close any open menus
          setSelectedNodes(new Set());
          closeContextMenu();
          closeNodeContextMenu();
        }
        if (event.ctrlKey || event.metaKey) {
          if (event.key === 'a') {
            // Select all nodes
            event.preventDefault();
            setSelectedNodes(new Set(nodes.map(node => node.id)));
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [nodeContextMenu, contextMenu, deleteNode, duplicateNode, copyNode, closeContextMenu, closeNodeContextMenu, deleteSelectedNodes, nodes, selectedNodes]);

  return (
    <div className="h-full w-full relative">
      {/* Status indicator */}
      <div className="absolute top-3 right-3 z-20">
        {isCompiling && (
          <div className="bg-black/80 backdrop-blur-sm text-cyan-300 px-3 py-2 rounded-lg text-xs border border-cyan-500/30 shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-cyan-400/50 shadow-lg"></div>
              <span className="font-medium">COMPILING</span>
            </div>
          </div>
        )}
        {error && (
          <div className="bg-black/80 backdrop-blur-sm text-red-300 px-3 py-2 rounded-lg text-xs border border-red-500/30 shadow-lg max-w-xs">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-400 rounded-full shadow-red-400/50 shadow-lg"></div>
              <span className="font-medium">ERROR</span>
            </div>
          </div>
        )}
        {!isCompiling && !error && (
          <div className="bg-black/80 backdrop-blur-sm text-green-300 px-3 py-2 rounded-lg text-xs border border-green-500/30 shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-green-400/50 shadow-lg"></div>
              <span className="font-medium">READY</span>
            </div>
          </div>
        )}
      </div>

      {/* Selection status and shortcuts */}
      {selectedNodes.size > 0 && (
        <div className="absolute top-16 right-3 z-20 bg-cyan-900/80 backdrop-blur-sm border border-cyan-700 rounded-lg px-3 py-2 text-sm text-white">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <span className="text-cyan-400">📋</span>
              <span>{selectedNodes.size} selected</span>
            </div>
            <div className="text-xs text-gray-300 border-l border-gray-600 pl-3">
              <div>⌫ Delete • Esc Clear</div>
              <div>⌘A Select All</div>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard shortcuts hint (when no selection) */}
      {selectedNodes.size === 0 && !isCompiling && !error && (
        <div className="absolute bottom-4 right-4 z-10 bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-lg px-3 py-2 text-xs text-gray-400">
          <div className="space-y-1">
            <div>Right-click: Add nodes</div>
            <div>⌫ Delete selected • ⌘A Select all</div>
            <div>Shift + click: Multi-select</div>
          </div>
        </div>
      )}

      <NodeProvider updateNodeData={updateNodeData}>
        <ReactFlow
          key="geometry-flow"
          nodes={React.useMemo(() => 
            nodesWithConnections.map(node => {
              const isSelected = selectedNodes.has(node.id);
              const isDisabled = disabledNodes.has(node.id);
              const isMultiSelect = selectedNodes.size > 1;
              
              let className = '';
              if (isSelected) {
                className = isMultiSelect ? 'selected multi-select' : 'selected';
              }
              if (isDisabled) {
                className += ' node-disabled';
              }
              
              return {
                ...node,
                className: className.trim(),
                selected: isSelected,
                data: {
                  ...node.data,
                  disabled: isDisabled,
                  selected: isSelected
                }
              };
            }), [nodesWithConnections, selectedNodes, disabledNodes]
          )}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeClick={onEdgeClick}
          onEdgeMouseEnter={onEdgeMouseEnter}
          onEdgeMouseLeave={onEdgeMouseLeave}
          onPaneContextMenu={onPaneContextMenu}
          onNodeContextMenu={onNodeContextMenu}
          onSelectionChange={onSelectionChange}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          attributionPosition="bottom-left"
          className="bg-black"
          multiSelectionKeyCode="Shift"
          selectNodesOnDrag={false}
        >
        <Controls 
          className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 shadow-lg"
        />
        <Background {...backgroundProps} />
      </ReactFlow>
      </NodeProvider>

      {/* Context Menu */}
      <ContextMenu
        position={contextMenu}
        onClose={closeContextMenu}
        onAddNode={addNode}
      />

      {/* Node Context Menu */}
      <NodeContextMenu
        position={nodeContextMenu ? { x: nodeContextMenu.x, y: nodeContextMenu.y } : null}
        nodeData={nodeContextMenu?.nodeData || null}
        isDisabled={nodeContextMenu ? disabledNodes.has(nodeContextMenu.nodeId) : false}
        onClose={closeNodeContextMenu}
        onDelete={() => nodeContextMenu && deleteNode(nodeContextMenu.nodeId)}
        onDuplicate={() => nodeContextMenu && duplicateNode(nodeContextMenu.nodeId)}
        onCopy={() => nodeContextMenu && copyNode(nodeContextMenu.nodeId)}
        onDisable={() => nodeContextMenu && toggleNodeDisabled(nodeContextMenu.nodeId)}
      />
    </div>
  );
} 