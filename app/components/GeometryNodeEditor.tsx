'use client';

import React, { useCallback, useState, useEffect } from 'react';
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
  getNodesBounds,
  getViewportForBounds,
} from 'reactflow';

import 'reactflow/dist/style.css';

import { GeometryNode, GeometryNodeData } from '../types/nodes';
import { nodeRegistry } from '../registry/NodeRegistry';
import GenericNode from './GenericNode';
import SystematicNodeLayout from './SystematicNodeLayout';

import { useGeometry } from './GeometryContext';
import { useTime } from './TimeContext';
import { NodeProvider } from './NodeContext';
import ContextMenu from './ContextMenu';
import NodeContextMenu from './NodeContextMenu';
import CustomNodeManager from './CustomNodeManager';
import { RefreshCw, Download, CheckCircle2, AlertCircle, Paintbrush, Save, Box, Flashlight, Camera, FileDown, FileUp, Maximize2, LayoutGrid } from 'lucide-react';
import Button from './ui/Button';
import Dropdown, { DropdownOption } from './ui/Dropdown';
import Tooltip from './ui/Tooltip';
import { areTypesCompatible, getParameterTypeFromHandle } from '../types/connections';
import { clearNodeCache, analyzeNodeGraphForCleanup, cleanupNodeGraph } from '../utils/nodeCompiler';
import { useModal } from './ModalContext';



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

// Scene configurations
const getDefaultScene = () => ({
  nodes: [
    {
      id: 'time-1',
      type: 'time',
      position: { x: 50, y: 150 },
      data: {
        id: 'time-1',
        type: 'time',
        label: 'Time',
        parameters: { speed: 1, outputType: 'sine', frequency: 1, amplitude: 1 },
        inputConnections: {},
        liveParameterValues: {}
      }
    },
    {
      id: 'math-1',
      type: 'math',
      position: { x: 400, y: 150 },
      data: {
        id: 'math-1',
        type: 'math',
        label: 'Math (× π)',
        parameters: { operation: 'multiply', valueB: 30 },
        inputConnections: {},
        liveParameterValues: {}
      }
    },
    {
      id: 'make-vector-1',
      type: 'make-vector',
      position: { x: 750, y: 150 },
      data: {
        id: 'make-vector-1',
        type: 'make-vector',
        label: 'Make Vector',
        parameters: { z: 0 },
        inputConnections: {},
        liveParameterValues: {}
      }
    },
    {
      id: 'cube-1',
    type: 'cube',
      position: { x: 50, y: 500 },
    data: {
        id: 'cube-1',
      type: 'cube',
      label: 'Cube',
      parameters: { width: 1, height: 1, depth: 1 },
      inputConnections: {},
      liveParameterValues: {}
    }
  },
  {
      id: 'math-normalize',
      type: 'math',
      position: { x: 750, y: 300 },
      data: {
        id: 'math-normalize',
        type: 'math',
        label: 'Math (×0.5)',
        parameters: { operation: 'multiply', valueB: 0.5 },
        inputConnections: {},
        liveParameterValues: {}
      }
    },
    {
      id: 'math-add',
      type: 'math',
      position: { x: 1100, y: 300 },
      data: {
        id: 'math-add',
        type: 'math',
        label: 'Math (+ 0.5)',
        parameters: { operation: 'add', valueB: 0.5 },
        inputConnections: {},
        liveParameterValues: {}
      }
    },
    {
      id: 'standard-material-1',
      type: 'standard-material',
      position: { x: 400, y: 500 },
      data: {
        id: 'standard-material-1',
        type: 'standard-material',
        label: 'Animated Material',
        parameters: { roughness: 0.3, metalness: 0.1 },
        inputConnections: {},
        liveParameterValues: {}
      }
    },
    {
      id: 'set-material-1',
      type: 'set-material',
      position: { x: 750, y: 600 },
      data: {
        id: 'set-material-1',
        type: 'set-material',
        label: 'Set Material',
        parameters: {},
        inputConnections: {},
        liveParameterValues: {}
      }
    },
    {
      id: 'transform-1', 
    type: 'transform',
      position: { x: 1100, y: 500 },
    data: {
        id: 'transform-1',
      type: 'transform',
      label: 'Transform',
      parameters: { 
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      },
      inputConnections: {},
      liveParameterValues: {}
    }
  },
  {
      id: 'output-1',
    type: 'output', 
      position: { x: 1450, y: 500 },
    data: {
        id: 'output-1',
      type: 'output',
      label: 'Output',
      parameters: {},
      inputConnections: {},
      liveParameterValues: {}
    }
  }
  ],
  edges: [
    {
      id: 'e-time-math',
      source: 'time-1',
      target: 'math-1',
      sourceHandle: 'time-out',
      targetHandle: 'valueA-in',
    },
    {
      id: 'e-math-makevector-x',
      source: 'math-1',
      target: 'make-vector-1',
      sourceHandle: 'result-out',
      targetHandle: 'x-in',
    },
    {
      id: 'e-math-makevector-y',
      source: 'math-1',
      target: 'make-vector-1',
      sourceHandle: 'result-out',
      targetHandle: 'y-in',
    },
    {
      id: 'e-makevector-transform',
      source: 'make-vector-1',
      target: 'transform-1',
      sourceHandle: 'result-out',
      targetHandle: 'rotation-in',
    },
    {
      id: 'e-math-normalize',
      source: 'math-1',
      target: 'math-normalize',
      sourceHandle: 'result-out',
      targetHandle: 'valueA-in',
    },
    {
      id: 'e-normalize-add',
      source: 'math-normalize',
      target: 'math-add',
      sourceHandle: 'result-out',
      targetHandle: 'valueA-in',
    },
    {
      id: 'e-add-material',
      source: 'math-add',
      target: 'standard-material-1',
      sourceHandle: 'result-out',
      targetHandle: 'redChannel-in',
    },
    {
      id: 'e-cube-setmaterial',
      source: 'cube-1',
      target: 'set-material-1',
      sourceHandle: 'geometry-out',
      targetHandle: 'geometry-in',
    },
    {
      id: 'e-material-setmaterial',
      source: 'standard-material-1',
      target: 'set-material-1',
      sourceHandle: 'material-out',
      targetHandle: 'material-in',
    },
    {
      id: 'e-setmaterial-transform',
      source: 'set-material-1',
      target: 'transform-1',
      sourceHandle: 'geometry-out',
      targetHandle: 'geometry-in',
    },
    {
      id: 'e-transform-output',
      source: 'transform-1',
      target: 'output-1',
      sourceHandle: 'geometry-out',
      targetHandle: 'geometry-in',
    },
  ]
});

const getLighthouseScene = () => ({
  nodes: [
    // Time node - top left
    {
      id: 'time-1',
      type: 'time',
      position: { x: 50, y: 100 },
      data: {
        id: 'time-1',
        type: 'time',
        label: 'Time',
        parameters: { speed: 1 },
        inputConnections: {},
        liveParameterValues: {}
      }
    },
    
    // Water row - top
    {
      id: 'gesner-wave-1',
      type: 'gesner-wave',
      position: { x: 500, y: 100 },
      data: {
        id: 'gesner-wave-1',
        type: 'gesner-wave',
        label: 'Gesner Wave',
        parameters: { 
          width: 100, 
          height: 100, 
          amplitude: 0.5, 
          segments: 8,
          waveType: 'multiple',
          waveCount: 4
        },
        inputConnections: {},
        liveParameterValues: {}
      }
    },
    {
      id: 'water-material-1',
      type: 'water-material',
      position: { x: 950, y: 50 },
      data: {
        id: 'water-material-1',
        type: 'water-material',
        label: 'Water Material',
        parameters: { shallowColor: '#40e0d0', deepColor: '#006994' },
        inputConnections: {},
        liveParameterValues: {}
      }
    },
    {
      id: 'set-material-1',
      type: 'set-material',
      position: { x: 1350, y: 100 },
      data: {
        id: 'set-material-1',
        type: 'set-material',
        label: 'Set Material (Water)',
        parameters: {},
        inputConnections: {},
        liveParameterValues: {}
      }
    },

    // Lighthouse row - middle
    {
      id: 'lighthouse-1',
      type: 'lighthouse',
      position: { x: 500, y: 450 },
      data: {
        id: 'lighthouse-1',
        type: 'lighthouse',
        label: 'Lighthouse',
        parameters: { towerHeight: 15, towerRadius: 2.5, baseRadius: 3.5 },
        inputConnections: {},
        liveParameterValues: {}
      }
    },
    {
      id: 'transform-lighthouse',
      type: 'transform',
      position: { x: 900, y: 450 },
      data: {
        id: 'transform-lighthouse',
        type: 'transform',
        label: 'Transform Lighthouse',
        parameters: { 
          position: { x: 0, y: 3.5, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 }
        },
        inputConnections: {},
        liveParameterValues: {}
      }
    },
    {
      id: 'standard-material-1',
      type: 'standard-material',
      position: { x: 950, y: 350 },
      data: {
        id: 'standard-material-1',
        type: 'standard-material',
        label: 'Standard Material (Yellow)',
        parameters: { color: '#ffeb3b', roughness: 0.7, metalness: 0.1 },
        inputConnections: {},
        liveParameterValues: {}
      }
    },
    {
      id: 'set-material-2',
      type: 'set-material',
      position: { x: 1350, y: 450 },
      data: {
        id: 'set-material-2',
        type: 'set-material',
        label: 'Set Material (Lighthouse)',
        parameters: {},
        inputConnections: {},
        liveParameterValues: {}
      }
    },

    // Rock row - bottom
    {
      id: 'rock-1',
      type: 'lowPolyRock',
      position: { x: 500, y: 800 },
      data: {
        id: 'rock-1',
        type: 'lowPolyRock',
        label: 'Low Poly Rock',
        parameters: { radius: 2, detail: 2, noise: 0.8 },
        inputConnections: {},
        liveParameterValues: {}
      }
    },
    {
      id: 'transform-rock',
      type: 'transform',
      position: { x: 900, y: 800 },
      data: {
        id: 'transform-rock',
        type: 'transform',
        label: 'Transform Rock',
        parameters: { 
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 5, y: 0.4, z: 3 }
        },
        inputConnections: {},
        liveParameterValues: {}
      }
    },
    {
      id: 'standard-material-2',
      type: 'standard-material',
      position: { x: 950, y: 700 },
      data: {
        id: 'standard-material-2',
        type: 'standard-material',
        label: 'Standard Material (Brown)',
        parameters: { color: '#8d5524', roughness: 0.9, metalness: 0.05 },
        inputConnections: {},
        liveParameterValues: {}
      }
    },
    {
      id: 'set-material-3',
      type: 'set-material',
      position: { x: 1350, y: 800 },
      data: {
        id: 'set-material-3',
        type: 'set-material',
        label: 'Set Material (Rock)',
        parameters: {},
        inputConnections: {},
        liveParameterValues: {}
      }
    },

    // Join nodes - right side
    {
      id: 'join-1',
      type: 'join',
      position: { x: 1700, y: 275 },
      data: {
        id: 'join-1',
        type: 'join',
        label: 'Join Water & Lighthouse',
        parameters: {},
        inputConnections: {},
        liveParameterValues: {}
      }
    },
    {
      id: 'join-2',
      type: 'join',
      position: { x: 2050, y: 525 },
      data: {
        id: 'join-2',
        type: 'join',
        label: 'Join All',
        parameters: {},
        inputConnections: {},
        liveParameterValues: {}
      }
    },
    {
      id: 'output-1',
      type: 'output',
      position: { x: 2400, y: 525 },
      data: {
        id: 'output-1',
        type: 'output',
        label: 'Output',
        parameters: {},
        inputConnections: {},
        liveParameterValues: {}
      }
    }
  ],
  edges: [
    // Time to gesner wave
    {
      id: 'e-time-wave',
      source: 'time-1',
      target: 'gesner-wave-1',
      sourceHandle: 'time-out',
      targetHandle: 'time-in',
    },
    
    // Water material setup
    {
      id: 'e-wave-setmat1',
      source: 'gesner-wave-1',
      target: 'set-material-1',
    sourceHandle: 'geometry-out',
    targetHandle: 'geometry-in',
  },
  {
      id: 'e-watermat-setmat1',
      source: 'water-material-1',
      target: 'set-material-1',
      sourceHandle: 'material-out',
      targetHandle: 'material-in',
    },
    
    // Lighthouse with transform and material setup
    {
      id: 'e-lighthouse-transform',
      source: 'lighthouse-1',
      target: 'transform-lighthouse',
    sourceHandle: 'geometry-out',
    targetHandle: 'geometry-in',
  },
    {
      id: 'e-transform-lighthouse-setmat2',
      source: 'transform-lighthouse',
      target: 'set-material-2',
      sourceHandle: 'geometry-out',
      targetHandle: 'geometry-in',
    },
    {
      id: 'e-yellowmat-setmat2',
      source: 'standard-material-1',
      target: 'set-material-2',
      sourceHandle: 'material-out',
      targetHandle: 'material-in',
    },
    
    // Rock with transform and material setup
    {
      id: 'e-rock-transform',
      source: 'rock-1',
      target: 'transform-rock',
      sourceHandle: 'geometry-out',
      targetHandle: 'geometry-in',
    },
    {
      id: 'e-transform-rock-setmat3',
      source: 'transform-rock',
      target: 'set-material-3',
      sourceHandle: 'geometry-out',
      targetHandle: 'geometry-in',
    },
    {
      id: 'e-brownmat-setmat3',
      source: 'standard-material-2',
      target: 'set-material-3',
      sourceHandle: 'material-out',
      targetHandle: 'material-in',
    },
    
    // Join everything
    {
      id: 'e-water-join1',
      source: 'set-material-1',
      target: 'join-1',
      sourceHandle: 'geometry-out',
      targetHandle: 'geometryA-in',
    },
    {
      id: 'e-lighthouse-join1',
      source: 'set-material-2',
      target: 'join-1',
      sourceHandle: 'geometry-out',
      targetHandle: 'geometryB-in',
    },
    {
      id: 'e-join1-join2',
      source: 'join-1',
      target: 'join-2',
      sourceHandle: 'geometry-out',
      targetHandle: 'geometryA-in',
    },
    {
      id: 'e-rock-join2',
      source: 'set-material-3',
      target: 'join-2',
      sourceHandle: 'geometry-out',
      targetHandle: 'geometryB-in',
    },
    {
      id: 'e-join2-output',
      source: 'join-2',
      target: 'output-1',
      sourceHandle: 'geometry-out',
      targetHandle: 'geometry-in',
    }
  ]
});

// Scene management functions
const saveSceneToLocalStorage = (nodes: Node<GeometryNodeData>[], edges: Edge[]) => {
  // Check if we're running in the browser
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    console.warn('localStorage not available (running on server)');
    return;
  }
  
  const sceneData = {
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
    timestamp: Date.now()
  };
  localStorage.setItem('geometry-script-scene', JSON.stringify(sceneData));
  console.log('Scene saved to localStorage');
};

const loadSceneFromLocalStorage = () => {
  // Check if we're running in the browser
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }
  
  try {
    const sceneData = localStorage.getItem('geometry-script-scene');
    if (sceneData) {
      const parsed = JSON.parse(sceneData);
      return {
        nodes: parsed.nodes || [],
        edges: parsed.edges || []
      };
    }
  } catch (error) {
    console.error('Error loading scene from localStorage:', error);
  }
  return null;
};

// Helper function to enhance edges (needed for initial scene setup)
const enhanceEdgesWithMetadataStatic = (edges: Edge[], nodes: Node<GeometryNodeData>[]): Edge[] => {
  return edges.map((edge: Edge) => {
    // Determine connection type based on socket types
    let connectionType = 'geometry';
    
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    if (sourceNode && targetNode) {
      const sourceDef = nodeRegistry.getDefinition(sourceNode.data.type);
      const targetDef = nodeRegistry.getDefinition(targetNode.data.type);
      
      if (sourceDef && targetDef && edge.sourceHandle && edge.targetHandle) {
        const sourceSocketName = edge.sourceHandle.replace('-out', '');
        const targetSocketName = edge.targetHandle.replace('-in', '');
        
        const sourceSocket = sourceDef.outputs.find(s => s.id === sourceSocketName);
        const targetSocket = targetDef.inputs.find(s => s.id === targetSocketName);
        
        if (sourceSocket && targetSocket) {
          connectionType = sourceSocket.type;
          // Normalize numeric types
          if (connectionType === 'numeric') {
            connectionType = 'number';
          }
        } else {
          // Fallback: Try to determine type from handle names for common patterns
          if (edge.sourceHandle.includes('time') || edge.targetHandle.includes('time')) {
            connectionType = 'time';
          } else if (edge.sourceHandle.includes('vector') || edge.targetHandle.includes('rotation') || edge.targetHandle.includes('position') || edge.targetHandle.includes('scale')) {
            connectionType = 'vector';
          } else if (edge.sourceHandle.includes('number') || edge.sourceHandle.includes('result') || edge.targetHandle.includes('valueA') || edge.targetHandle.includes('valueB')) {
            connectionType = 'number';
          } else if (edge.sourceHandle.includes('material') || edge.targetHandle.includes('material')) {
            connectionType = 'material';
          }
        }
        

      }
    }
    
    // Get edge style based on connection type
    const getEdgeStyle = (connectionType: string) => {
      switch (connectionType) {
        case 'geometry':
          return {
            stroke: '#eab308',
            strokeWidth: 3,
            filter: 'drop-shadow(0 0 4px rgba(234, 179, 8, 0.4))'
          };
        case 'time':
          return {
            stroke: '#ec4899',
            strokeWidth: 2,
            filter: 'drop-shadow(0 0 4px rgba(236, 72, 153, 0.4))'
          };
        case 'number':
        case 'numeric':
          return {
            stroke: '#22c55e',
            strokeWidth: 2,
            filter: 'drop-shadow(0 0 4px rgba(34, 197, 94, 0.4))'
          };
        case 'vector':
          return {
            stroke: '#06b6d4',
            strokeWidth: 2,
            filter: 'drop-shadow(0 0 4px rgba(6, 182, 212, 0.4))'
          };
        case 'material':
          return {
            stroke: '#8b5cf6',
            strokeWidth: 2,
            filter: 'drop-shadow(0 0 4px rgba(139, 92, 246, 0.4))'
          };
        default:
          return {
            stroke: '#6b7280',
            strokeWidth: 2,
            filter: 'drop-shadow(0 0 4px rgba(107, 114, 128, 0.4))'
          };
      }
    };
    
    // Return enhanced edge with same metadata as manual connections
    return {
      ...edge,
      animated: true,
      data: { connectionType },
      style: getEdgeStyle(connectionType),
      className: `connection-${connectionType}`,
      'data-connection-type': connectionType,
      'data-target-handle': edge.targetHandle,
      'data-source-handle': edge.sourceHandle
    };
  });
};

// Initial nodes for testing - using new registry system
const getInitialScene = () => {
  // Try to load from localStorage first, fallback to default scene
  const savedScene = loadSceneFromLocalStorage();
  if (savedScene && savedScene.nodes.length > 0) {
    // Enhance saved edges if they don't have proper metadata
    const nodes = savedScene.nodes as Node<GeometryNodeData>[];
    const edges = savedScene.edges;
    
    // Check if edges need enhancement (missing data property)
    const needsEnhancement = edges.some((edge: Edge) => !edge.data?.connectionType);
    if (needsEnhancement) {
      return {
        nodes,
        edges: enhanceEdgesWithMetadataStatic(edges, nodes)
      };
    }
    
    return savedScene;
  }
  
  const defaultScene = getDefaultScene();
  const nodes = defaultScene.nodes as Node<GeometryNodeData>[];
  const enhancedEdges = enhanceEdgesWithMetadataStatic(defaultScene.edges, nodes);
  
  return {
    nodes,
    edges: enhancedEdges
  };
};

const initialSceneData = getInitialScene();
const initialNodes: Node<GeometryNodeData>[] = initialSceneData.nodes as Node<GeometryNodeData>[];
const initialEdges: Edge[] = initialSceneData.edges;

export default function GeometryNodeEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { compileNodes, isCompiling, error, liveParameterValues } = useGeometry();
  const { currentTime, frameRate } = useTime();
  const { screenToFlowPosition, getViewport, setViewport, fitView } = useReactFlow();
  const { showConfirm, showAlert } = useModal();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [nodeContextMenu, setNodeContextMenu] = useState<{ 
    x: number; 
    y: number; 
    nodeId: string; 
    nodeData: GeometryNodeData 
  } | null>(null);
  const [disabledNodes, setDisabledNodes] = useState<Set<string>>(new Set());
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [customNodeManagerOpen, setCustomNodeManagerOpen] = useState(false);
  const [isRefreshingNodes, setIsRefreshingNodes] = useState(false);
  const [serverNodesStatus, setServerNodesStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [registryUpdateKey, setRegistryUpdateKey] = useState(0);
  const [selectedScenePreset, setSelectedScenePreset] = useState<string>('');
  const [isLoadingScene, setIsLoadingScene] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  }>>([]);

  // Scene preset options
  const scenePresets: DropdownOption[] = [
    {
      value: 'default',
      label: 'Default Scene',
      icon: Box,
      description: 'Basic scene with time input controlling cube rotation'
    },
    {
      value: 'lighthouse',
      label: 'Lighthouse Scene', 
      icon: Flashlight,
      description: 'Animated water, lighthouse, and rock'
    }
  ];

  // Toast notification system
  const showToast = useCallback((type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000); // Show for 4 seconds
  }, []);

  // Function to fit all nodes in view with padding
  const fitAllNodes = useCallback(async () => {
    if (nodes.length === 0) return;
    
    // Use React Flow's fitView to show all nodes with padding
    await fitView({ 
      padding: 100, // 100px padding around all nodes
      duration: 300 // Smooth animation
    });
  }, [nodes, fitView]);

  // Auto-layout nodes using hierarchical flow algorithm
  const autoLayoutNodes = useCallback(async () => {
    if (nodes.length === 0) {
      showToast('warning', 'No nodes to layout');
      return;
    }

    showToast('info', 'Organizing nodes...');

    // Step 1: Analyze the graph structure
    const nodeMap = new Map(nodes.map(node => [node.id, node]));
    const incomingEdges = new Map<string, Edge[]>();
    const outgoingEdges = new Map<string, Edge[]>();

    // Build edge maps
    edges.forEach(edge => {
      if (!incomingEdges.has(edge.target)) incomingEdges.set(edge.target, []);
      if (!outgoingEdges.has(edge.source)) outgoingEdges.set(edge.source, []);
      incomingEdges.get(edge.target)!.push(edge);
      outgoingEdges.get(edge.source)!.push(edge);
    });

    // Step 2: Determine node layers using topological sort
    const layers: string[][] = [];
    const nodeDepths = new Map<string, number>();
    const visited = new Set<string>();
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
    nodes.forEach(node => calculateDepth(node.id));

    // Group nodes by depth
    const maxDepth = Math.max(...Array.from(nodeDepths.values()));
    for (let i = 0; i <= maxDepth; i++) {
      layers[i] = [];
    }

    nodeDepths.forEach((depth, nodeId) => {
      layers[depth].push(nodeId);
    });

    // Step 3: Sort nodes within each layer by type and connections
    const getNodeTypeOrder = (node: Node<GeometryNodeData>) => {
      const type = node.data.type;
      if (type === 'time') return 0;
      if (type.includes('input') || type.includes('Input')) return 2;
      if (type === 'math' || type === 'vector-math') return 5;
      if (type.includes('vector') || type.includes('Vector')) return 6;
      if (type === 'transform') return 7;
      if (type.includes('primitive') || type.includes('geometry')) return 8;
      if (type.includes('material')) return 9;
      if (type === 'output') return 10;
      return 4; // Default
    };

    layers.forEach(layer => {
      layer.sort((a, b) => {
        const nodeA = nodeMap.get(a)!;
        const nodeB = nodeMap.get(b)!;
        const orderA = getNodeTypeOrder(nodeA);
        const orderB = getNodeTypeOrder(nodeB);
        if (orderA !== orderB) return orderA - orderB;
        return nodeA.data.label.localeCompare(nodeB.data.label);
      });
    });

    // Step 4: Calculate positions with proper vertical spacing
    const LAYER_WIDTH = 350; // Horizontal spacing between layers
    const NODE_SPACING_Y = 180; // Vertical spacing between nodes (increased)
    const NODE_SPACING_X = 350; // Horizontal spacing between layers
    const START_X = 150;
    const BASE_Y = 50; // Base Y position

    // Calculate total height needed and find the largest layer
    const maxLayerSize = Math.max(...layers.map(layer => layer.length));
    const totalHeight = maxLayerSize * NODE_SPACING_Y;

    const newNodes = nodes.map(node => {
      const depth = nodeDepths.get(node.id) || 0;
      const layerIndex = layers[depth].indexOf(node.id);
      const layerSize = layers[depth].length;
      
      // Center each layer vertically within the total space
      const layerCenterOffset = (maxLayerSize - layerSize) * NODE_SPACING_Y / 2;
      const nodeY = BASE_Y + layerCenterOffset + (layerIndex * NODE_SPACING_Y);
      
      return {
        ...node,
        position: {
          x: START_X + depth * NODE_SPACING_X,
          y: nodeY
        }
      };
    });

    // Step 5: Apply the new layout
    setNodes(newNodes);

    // Step 6: Fit view to show the new layout
    setTimeout(async () => {
      await fitView({ 
        padding: 100,
        duration: 600
      });
      showToast('success', `Organized ${nodes.length} nodes in ${layers.length} layers! ✨`);
    }, 100);

  }, [nodes, edges, setNodes, fitView, showToast]);

  // Auto-save scene to localStorage when nodes or edges change
  useEffect(() => {
    const timer = setTimeout(() => {
      saveSceneToLocalStorage(nodes, edges);
    }, 1000); // Debounce saves to avoid excessive localStorage writes

    return () => clearTimeout(timer);
  }, [nodes, edges]);

  // Subscribe to registry updates
  useEffect(() => {
    const unsubscribe = nodeRegistry.onUpdate(() => {
      setRegistryUpdateKey(prev => prev + 1);
      
      // Sync server nodes status from registry
      const newStatus = nodeRegistry.getServerNodesState();
      setServerNodesStatus(newStatus);
    });
    
    // Initialize with current state
    setServerNodesStatus(nodeRegistry.getServerNodesState());
    
    return unsubscribe;
  }, []);

  // Auto-hide notifications after success/error
  useEffect(() => {
    if (serverNodesStatus === 'loaded' || serverNodesStatus === 'error') {
      const timer = setTimeout(() => {
        setServerNodesStatus('idle');
      }, serverNodesStatus === 'loaded' ? 3000 : 5000);
      
      return () => clearTimeout(timer);
    }
  }, [serverNodesStatus]);

    // Helper function to enhance programmatic edges with proper metadata
  const enhanceEdgesWithMetadata = useCallback((edges: Edge[], nodes: Node<GeometryNodeData>[]): Edge[] => {
    // Get edge style based on connection type
    const getEdgeStyleLocal = (connectionType: string) => {
      switch (connectionType) {
        case 'geometry':
          return {
            stroke: '#eab308',
            strokeWidth: 3,
            filter: 'drop-shadow(0 0 4px rgba(234, 179, 8, 0.4))'
          };
        case 'time':
          return {
            stroke: '#ec4899',
            strokeWidth: 2,
            filter: 'drop-shadow(0 0 4px rgba(236, 72, 153, 0.4))'
          };
        case 'number':
        case 'numeric':
          return {
            stroke: '#22c55e',
            strokeWidth: 2,
            filter: 'drop-shadow(0 0 4px rgba(34, 197, 94, 0.4))'
          };
        case 'vector':
          return {
            stroke: '#06b6d4',
            strokeWidth: 2,
            filter: 'drop-shadow(0 0 4px rgba(6, 182, 212, 0.4))'
          };
        case 'material':
          return {
            stroke: '#8b5cf6',
            strokeWidth: 2,
            filter: 'drop-shadow(0 0 4px rgba(139, 92, 246, 0.4))'
          };
        default:
          return {
            stroke: '#6b7280',
            strokeWidth: 2,
            filter: 'drop-shadow(0 0 4px rgba(107, 114, 128, 0.4))'
          };
      }
    };

    return edges.map((edge: Edge) => {
      // Determine connection type based on socket types
      let connectionType = 'geometry';
      
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        const sourceDef = nodeRegistry.getDefinition(sourceNode.data.type);
        const targetDef = nodeRegistry.getDefinition(targetNode.data.type);
        
        if (sourceDef && targetDef && edge.sourceHandle && edge.targetHandle) {
          const sourceSocketName = edge.sourceHandle.replace('-out', '');
          const targetSocketName = edge.targetHandle.replace('-in', '');
          
          const sourceSocket = sourceDef.outputs.find(s => s.id === sourceSocketName);
          const targetSocket = targetDef.inputs.find(s => s.id === targetSocketName);
          
          if (sourceSocket && targetSocket) {
            connectionType = sourceSocket.type;
            // Normalize numeric types
            if (connectionType === 'numeric') {
              connectionType = 'number';
            }
          } else {
            // Fallback: Try to determine type from handle names for common patterns
            if (edge.sourceHandle.includes('time') || edge.targetHandle.includes('time')) {
              connectionType = 'time';
            } else if (edge.sourceHandle.includes('vector') || edge.targetHandle.includes('rotation') || edge.targetHandle.includes('position') || edge.targetHandle.includes('scale')) {
              connectionType = 'vector';
            } else if (edge.sourceHandle.includes('number') || edge.sourceHandle.includes('result') || edge.targetHandle.includes('valueA') || edge.targetHandle.includes('valueB')) {
              connectionType = 'number';
            } else if (edge.sourceHandle.includes('material') || edge.targetHandle.includes('material')) {
              connectionType = 'material';
            }
          }
        }
      }
      
      // Return enhanced edge with same metadata as manual connections
      return {
        ...edge,
        animated: true,
        data: { connectionType },
        style: getEdgeStyleLocal(connectionType),
        className: `connection-${connectionType}`,
        'data-connection-type': connectionType,
        'data-target-handle': edge.targetHandle,
        'data-source-handle': edge.sourceHandle
      };
    });
  }, []);

  // Scene switching functions
  const loadDefaultScene = useCallback(() => {
    const scene = getDefaultScene();
    const sceneNodes = scene.nodes as Node<GeometryNodeData>[];
    const enhancedEdges = enhanceEdgesWithMetadata(scene.edges, sceneNodes);
    
    setNodes(sceneNodes);
    setEdges(enhancedEdges);
    saveSceneToLocalStorage(sceneNodes, enhancedEdges);
  }, [setNodes, setEdges, enhanceEdgesWithMetadata]);

  const loadLighthouseScene = useCallback(() => {
    const scene = getLighthouseScene();
    const sceneNodes = scene.nodes as Node<GeometryNodeData>[];
    const enhancedEdges = enhanceEdgesWithMetadata(scene.edges, sceneNodes);
    
    setNodes(sceneNodes);
    setEdges(enhancedEdges);
    saveSceneToLocalStorage(sceneNodes, enhancedEdges);
  }, [setNodes, setEdges, enhanceEdgesWithMetadata]);

  const saveCurrentScene = useCallback(() => {
    saveSceneToLocalStorage(nodes, edges);
    showToast('success', 'Scene saved to local storage! 💾');
  }, [nodes, edges, showToast]);

    // Export current graph as image
  const exportCurrentGraph = useCallback(async () => {
    try {
      await exportGraphAsImage('geometry-graph');
    } catch (error) {
      console.error('Export failed:', error);
      showToast('error', `Export failed: ${error}`);
    }
  }, [showToast]);

  // Export current graph as image with visible fit animation first
  const exportGraphAsImage = useCallback(async (filename: string = 'node-graph') => {
    try {
      const { toPng } = await import('html-to-image');
      const reactFlowElement = document.querySelector('.react-flow') as HTMLElement;
      
      if (!reactFlowElement) {
        throw new Error('React Flow element not found');
      }

      if (nodes.length === 0) {
        showToast('warning', 'No nodes to export');
        return;
      }

      // Store current viewport to restore later
      const originalViewport = getViewport();
      
      // Step 1: Show the user what will be exported with animated fit
      showToast('info', 'Framing all nodes for export...');
      await fitView({ 
        padding: 100, // 100px padding around all nodes
        duration: 600 // Show smooth animation to user
      });
      
      // Step 2: Wait for user to see the framing
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 3: Now capture the same view instantly (no animation) 
      await fitView({ 
        padding: 100, // Same padding as above
        duration: 0 // No animation for capture
      });
      
      // Wait for instant fit to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Step 4: Capture the image
      const dataUrl = await toPng(reactFlowElement, {
        backgroundColor: '#000000',
        width: reactFlowElement.offsetWidth,
        height: reactFlowElement.offsetHeight,
        style: {
          width: reactFlowElement.offsetWidth + 'px',
          height: reactFlowElement.offsetHeight + 'px',
        },
        pixelRatio: 2, // Higher resolution
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
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('success', 'Graph image downloaded successfully! 📷');

    } catch (error) {
      console.error('Export failed:', error);
      showToast('error', `Export failed: ${error}`);
    }
  }, [nodes, getViewport, setViewport, fitView, showToast]);

  // Export graph as JSON
  const exportToJSON = useCallback(() => {
    try {
      const graphData = {
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
          version: '1.0'
        }
      };

      const jsonString = JSON.stringify(graphData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `geometry-graph-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

              showToast('success', 'Graph exported as JSON successfully! 📄');
          } catch (error) {
        console.error('JSON export failed:', error);
        showToast('error', `JSON export failed: ${error}`);
      }
    }, [nodes, edges, showToast]);

  // Import graph from JSON
  const importFromJSON = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string);
          
          if (!jsonData.nodes || !Array.isArray(jsonData.nodes)) {
            throw new Error('Invalid JSON format: missing nodes array');
          }

          if (!jsonData.edges || !Array.isArray(jsonData.edges)) {
            throw new Error('Invalid JSON format: missing edges array');
          }

          // Validate and set nodes
          const importedNodes = jsonData.nodes as Node<GeometryNodeData>[];
          const importedEdges = jsonData.edges as Edge[];

          setNodes(importedNodes);
          setEdges(importedEdges);
          
                      // Save to localStorage
            saveSceneToLocalStorage(importedNodes, importedEdges);

            showToast('success', 'Graph imported successfully! 📥');
                  } catch (error) {
            console.error('JSON import failed:', error);
            showToast('error', `JSON import failed: ${error}`);
          }
        };
        reader.readAsText(file);
      };
      input.click();
    }, [setNodes, setEdges, showToast]);

  // Handle scene preset selection
  const handleScenePresetChange = useCallback(async (presetValue: string) => {
    setSelectedScenePreset(presetValue);
    setIsLoadingScene(true);
    
    try {
      // Add small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      switch (presetValue) {
        case 'default':
          loadDefaultScene();
          break;
        case 'lighthouse':
          loadLighthouseScene();
          break;
        default:
          break;
      }
      
      // Show success feedback
      showToast('success', `${presetValue === 'default' ? 'Default' : 'Lighthouse'} scene loaded! 🎬`);
      
    } catch (error) {
      showToast('error', `Failed to load ${presetValue} scene: ${error}`);
    } finally {
      setIsLoadingScene(false);
      // Auto-clear selection after loading to show it's been applied
      setTimeout(() => {
        setSelectedScenePreset('');
      }, 1000);
    }
  }, [loadDefaultScene, loadLighthouseScene, showAlert]);
  
  // Track connection drag state for Blender-style disconnect
  const [connectionDragState, setConnectionDragState] = useState<{
    nodeId: string;
    handleId: string;
    handleType: 'source' | 'target';
  } | null>(null);
  const [connectionWasMade, setConnectionWasMade] = useState(false);

  // Type-based connection validation (NEW SYSTEM)
  const validateTypeBasedConnection = useCallback((params: Connection): boolean => {
    const sourceNode = nodes.find(n => n.id === params.source);
    const targetNode = nodes.find(n => n.id === params.target);
    
    if (!sourceNode || !targetNode) return false;
    
    // Get node definitions
    const sourceDef = nodeRegistry.getDefinition(sourceNode.data.type);
    const targetDef = nodeRegistry.getDefinition(targetNode.data.type);
    
    if (!sourceDef || !targetDef) return false;
    
    // Extract socket names from handle IDs
    const sourceSocketName = params.sourceHandle?.replace('-out', '');
    const targetSocketName = params.targetHandle?.replace('-in', '');
    
    // console.log('Connection validation:', {
    //   sourceNode: sourceNode.data.type,
    //   targetNode: targetNode.data.type,
    //   sourceHandle: params.sourceHandle,
    //   targetHandle: params.targetHandle,
    //   sourceSocketName,
    //   targetSocketName
    // });
    
    // Find socket definitions
    const sourceSocket = sourceDef.outputs.find(s => s.id === sourceSocketName);
    const targetSocket = targetDef.inputs.find(s => s.id === targetSocketName);
    
    // console.log('Socket definitions:', {
    //   sourceSocket: sourceSocket?.type,
    //   targetSocket: targetSocket?.type,
    //   sourceDefOutputs: sourceDef.outputs.map(s => ({ id: s.id, type: s.type })),
    //   targetDefInputs: targetDef.inputs.map(s => ({ id: s.id, type: s.type }))
    // });
    
    if (!sourceSocket || !targetSocket) return false;
    
    // Check type compatibility
    const isCompatible = nodeRegistry.areSocketsCompatible(sourceSocket.type, targetSocket.type);
    // console.log('Type compatibility:', {
    //   sourceType: sourceSocket.type,
    //   targetType: targetSocket.type,
    //   isCompatible
    // });
    
    return isCompatible;
  }, [nodes]);

  // Legacy name-based validation (for backward compatibility)
  const isValidConnection = useCallback((params: Connection) => {
    const { source, target, sourceHandle, targetHandle } = params;
    
    if (!source || !target || !sourceHandle || !targetHandle) return false;
    
    // Prevent self-connections
    if (source === target) return false;
    
    const sourceNode = nodes.find(n => n.id === source);
    const targetNode = nodes.find(n => n.id === target);
    if (!sourceNode || !targetNode) return false;

    // Get socket types from handle IDs
    const sourceType = getParameterTypeFromHandle(sourceHandle);
    const targetType = getParameterTypeFromHandle(targetHandle);
    
    // Check type compatibility
    if (!areTypesCompatible(sourceType, targetType)) {
      // console.log(`Type mismatch: ${sourceType} -> ${targetType}`);
      return false;
    }

    // BLENDER BEHAVIOR: Allow connections to occupied inputs (they'll be auto-replaced)
    // Only join nodes can have multiple connections to the same input type
    if (targetNode.data.type === 'join') {
      // Join nodes can accept multiple geometry inputs
      return true;
    }

    // All other connections are valid (existing ones will be replaced automatically)
    return true;
  }, [nodes]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (validateTypeBasedConnection(params)) {
        // Mark that a connection was successfully made
        setConnectionWasMade(true);
        
        // BLENDER BEHAVIOR: Auto-replace existing connection on target input
        setEdges((eds) => {
          // Remove existing connection to the same target handle (Blender-style auto-replace)
          const filteredEdges = eds.filter(edge => 
            !(edge.target === params.target && edge.targetHandle === params.targetHandle)
          );
          
          // Determine connection type based on socket types (NEW SYSTEM)
          const sourceNode = nodes.find(n => n.id === params.source);
          const targetNode = nodes.find(n => n.id === params.target);
          
          let connectionType = 'geometry';
          if (sourceNode && targetNode) {
            const sourceDef = nodeRegistry.getDefinition(sourceNode.data.type);
            const targetDef = nodeRegistry.getDefinition(targetNode.data.type);
            
            if (sourceDef && targetDef) {
              const sourceSocketName = params.sourceHandle?.replace('-out', '');
              const targetSocketName = params.targetHandle?.replace('-in', '');
              
              const sourceSocket = sourceDef.outputs.find(s => s.id === sourceSocketName);
              const targetSocket = targetDef.inputs.find(s => s.id === targetSocketName);
              
              if (sourceSocket && targetSocket) {
                // Use the source socket type for connection type
                connectionType = sourceSocket.type;
              }
            }
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
          
          return addEdge(newEdge, filteredEdges);
        });
      }
    },
    [setEdges, isValidConnection]
  );

  // BLENDER BEHAVIOR: Track connection drag start for disconnect functionality
  const onConnectStart = useCallback((event: any, { nodeId, handleId, handleType }: any) => {
    // Reset connection flag at start of each drag
    setConnectionWasMade(false);
    
    // Only track TARGET handles (inputs) for drag-to-disconnect
    // SOURCE handles (outputs) can connect to multiple targets, so don't track them
    if (handleType === 'target') {
      const isConnected = edges.some(edge => 
        edge.target === nodeId && edge.targetHandle === handleId
      );
      
      if (isConnected) {
        setConnectionDragState({ nodeId, handleId, handleType });
      } else {
        setConnectionDragState(null);
      }
    } else {
      // For source handles, clear any drag state
      setConnectionDragState(null);
    }
  }, [edges]);

  // BLENDER BEHAVIOR: Handle drag-to-disconnect
  const onConnectEnd = useCallback((event: any) => {
    // If we were dragging from a connected handle and didn't make a new connection, disconnect
    if (connectionDragState && !connectionWasMade) {
      const { nodeId, handleId, handleType } = connectionDragState;
      
      // Remove the connection from this handle
      setEdges((eds) => eds.filter(edge => {
        if (handleType === 'source') {
          return !(edge.source === nodeId && edge.sourceHandle === handleId);
        } else {
          return !(edge.target === nodeId && edge.targetHandle === handleId);
        }
      }));
    }
    
    setConnectionDragState(null);
    setConnectionWasMade(false);
  }, [connectionDragState, connectionWasMade, setEdges]);

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

  // Handle refreshing nodes from server
  const handleRefreshNodes = useCallback(async () => {
    setIsRefreshingNodes(true);
    try {
      const result = await nodeRegistry.refreshNodeSystem();
      
      if (result.success > 0) {
        console.log(`✅ Refreshed ${result.success} nodes from server`);
        console.log('Registry now has definitions:', nodeRegistry.getAllDefinitions().map(d => d.type));
        // Registry update callback will automatically trigger nodeTypes re-creation
      }
      
      if (result.failed.length > 0) {
        console.warn(`⚠️ ${result.failed.length} nodes failed to load:`, result.failed);
      }
    } catch (error) {
      console.error('❌ Failed to refresh nodes:', error);
    } finally {
      setIsRefreshingNodes(false);
    }
  }, []);

  // Handle edge click for deletion with Alt key
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: any) => {
    if (event.altKey) {
      event.preventDefault();
      event.stopPropagation();
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    }
  }, [setEdges]);

  // BLENDER BEHAVIOR: Right-click context menu for edges
  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: any) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Create a simple context menu for edge deletion
    const deleteEdge = () => {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    };
    
    // Show a simple context menu
    const contextMenuElement = document.createElement('div');
    contextMenuElement.className = 'fixed bg-gray-800 border border-gray-600 rounded shadow-lg p-1 z-50';
    contextMenuElement.style.left = `${event.clientX}px`;
    contextMenuElement.style.top = `${event.clientY}px`;
    
    const deleteOption = document.createElement('div');
    deleteOption.className = 'px-3 py-1 text-sm text-white hover:bg-gray-700 cursor-pointer rounded';
    deleteOption.textContent = 'Delete Connection';
    deleteOption.onclick = () => {
      deleteEdge();
      document.body.removeChild(contextMenuElement);
    };
    
    contextMenuElement.appendChild(deleteOption);
    document.body.appendChild(contextMenuElement);
    
    // Remove context menu when clicking elsewhere
    const removeContextMenu = (e: MouseEvent) => {
      if (!contextMenuElement.contains(e.target as HTMLElement)) {
        document.body.removeChild(contextMenuElement);
        document.removeEventListener('click', removeContextMenu);
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', removeContextMenu);
    }, 0);
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

  // Enhanced nodeTypes with parameter updating capability
  const nodeTypesWithContext = React.useMemo(() => {
    const types: Record<string, any> = {};
    
    const definitions = nodeRegistry.getAllDefinitions();
    console.log('Creating nodeTypes for definitions:', definitions.map(d => d.type));
    
    definitions.forEach(definition => {
      types[definition.type] = ({ id, data, selected }: any) => {
        // Use systematic layout for all nodes (auto-generated layouts)
        return (
          <SystematicNodeLayout
            id={id}
            definition={definition}
            parameters={data.parameters || {}}
            inputConnections={data.inputConnections || {}}
            liveParameterValues={(liveParameterValues as Record<string, Record<string, any>>)[id] || {}}
            socketValues={data.socketValues || {}}
            selected={selected}
            disabled={data.disabled}
            onParameterChange={(parameterId: string, value: any) => {
              updateNodeData(id, { 
                parameters: { 
                  ...data.parameters, 
                  [parameterId]: value 
                } 
              });
            }}
            onSocketValueChange={(socketId: string, value: any) => {
              updateNodeData(id, { 
                socketValues: { 
                  ...data.socketValues, 
                  [socketId]: value 
                } 
              });
            }}
          />
        );
      };
    });
    
    console.log('Created nodeTypes:', Object.keys(types));
    return types;
  }, [updateNodeData, registryUpdateKey]); // Add registryUpdateKey as dependency

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
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      navigator.clipboard.writeText(JSON.stringify(node.data)).then(() => {
        // console.log('Node copied to clipboard');
      }).catch(() => {
        // console.log('Failed to copy node to clipboard');
      });
    }
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

  // Cleanup unused nodes
  const cleanupUnusedNodes = useCallback(async () => {
    const analysis = analyzeNodeGraphForCleanup(nodes, edges);
    
    if (!analysis.canCleanup) {
      // Show info toast that there are no unused nodes to clean up
      showToast('info', 'All nodes contribute to the final output. No cleanup needed! ✨');
      return;
    }
    
    // Show confirmation dialog with statistics
    const message = `This will remove ${analysis.unusedCount} unused node${analysis.unusedCount === 1 ? '' : 's'} that don't contribute to the output.`;
    const details = `Nodes to be removed:\n${analysis.unusedNodes.map(n => `• ${n.data.label || n.data.type} (${n.id})`).join('\n')}`;
    
    const confirmed = await showConfirm(
      'Cleanup Unused Nodes',
      message,
      details
    );
    
    if (!confirmed) {
      return;
    }
    
    // Perform the cleanup
    const cleanupResult = cleanupNodeGraph(nodes, edges);
    
    // Update the graph with cleaned nodes and edges
    setNodes(cleanupResult.cleanedNodes);
    setEdges(cleanupResult.cleanedEdges);
    
    // Clear any disabled nodes that were removed
    setDisabledNodes((disabled) => {
      const newDisabled = new Set(disabled);
      cleanupResult.removedNodes.forEach(node => {
        newDisabled.delete(node.id);
        // Clear cache for removed nodes
        clearNodeCache(node.id);
      });
      return newDisabled;
    });
    
    // Clear selection of removed nodes
    setSelectedNodes((selected) => {
      const newSelected = new Set(selected);
      cleanupResult.removedNodes.forEach(node => {
        newSelected.delete(node.id);
      });
      return newSelected;
    });
    
    // Show success message
    showToast('success', `Cleaned up ${cleanupResult.stats.nodesRemoved} node${cleanupResult.stats.nodesRemoved === 1 ? '' : 's'} and ${cleanupResult.stats.edgesRemoved} edge${cleanupResult.stats.edgesRemoved === 1 ? '' : 's'}! 🧹`);
    
    console.log(`🧹 Cleanup complete: Removed ${cleanupResult.stats.nodesRemoved} nodes and ${cleanupResult.stats.edgesRemoved} edges`);
  }, [nodes, edges, setNodes, setEdges, showConfirm, showToast]);

  // Add new node using registry system
  const addNode = useCallback((type: any, screenPosition: { x: number; y: number }, primitiveType?: string) => {
    const newId = `${Date.now()}`;
    
    // Convert screen coordinates to flow coordinates
    const flowPosition = screenToFlowPosition({
      x: screenPosition.x,
      y: screenPosition.y,
    });
    
    try {
      // Use registry to create node instance
      const newNode = nodeRegistry.createNodeInstance(
        type, 
        newId, 
        { x: flowPosition.x - 75, y: flowPosition.y - 25 }
      );
      
      setNodes((nds) => [...nds, newNode as any]);
    } catch (error) {
      console.warn(`Failed to create node of type "${type}" using registry, creating fallback`, error);
      
      // Fallback for nodes not yet in registry
      const fallbackNode: Node = {
        id: newId,
        type: type,
        position: { x: flowPosition.x - 75, y: flowPosition.y - 25 },
        data: {
          type: type,
          parameters: {},
          inputConnections: {},
          liveParameterValues: {}
        } as any,
      };
      
      setNodes((nds) => [...nds, fallbackNode]);
    }
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

  // Update nodes with input connection information and live parameter values
  const nodesWithConnections = React.useMemo(() => {
    return nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        inputConnections: getInputConnections[node.id] || {},
        liveParameterValues: liveParameterValues[node.id] || {}
      }
    }));
  }, [nodes, getInputConnections, liveParameterValues]);

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

  // BLENDER BEHAVIOR: Listen for Alt+click handle disconnect events
  React.useEffect(() => {
    const handleRemoveConnection = (event: any) => {
      const { nodeId, handleId, handleType } = event.detail;
      
      setEdges((eds) => eds.filter(edge => {
        if (handleType === 'target') {
          return !(edge.target === nodeId && edge.targetHandle === handleId);
        } else if (handleType === 'source') {
          return !(edge.source === nodeId && edge.sourceHandle === handleId);
        }
        return true;
      }));
    };

    window.addEventListener('removeHandleConnection', handleRemoveConnection);
    
    return () => {
      window.removeEventListener('removeHandleConnection', handleRemoveConnection);
    };
  }, [setEdges]);

  // BLENDER BEHAVIOR: Alt key detection for visual feedback
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey) {
        document.body.setAttribute('data-alt-pressed', 'true');
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!event.altKey) {
        document.body.removeAttribute('data-alt-pressed');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.body.removeAttribute('data-alt-pressed');
    };
  }, []);

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
      {/* Scene Control Panel */}
      <div className="absolute top-3 left-3 z-20 flex gap-2 items-start">
        {/* Scene Preset Dropdown */}
        <Dropdown
          options={scenePresets}
          value={selectedScenePreset}
          onChange={handleScenePresetChange}
          placeholder="Load Scene Preset"
          size="sm"
          variant="secondary"
          loading={isLoadingScene}
          disabled={isLoadingScene}
          className="h-[32px]"
        />
        
        <Tooltip content="Fit all nodes in view" placement="bottom">
          <Button
            variant="secondary"
            size="sm"
            icon={Maximize2}
            onClick={fitAllNodes}
            className="h-[32px] w-[32px] !px-0"
          />
        </Tooltip>

        <Tooltip content="Auto-layout nodes by data flow" placement="bottom">
          <Button
            variant="secondary"
            size="sm"
            icon={LayoutGrid}
            onClick={autoLayoutNodes}
            className="h-[32px] w-[32px] !px-0"
          />
        </Tooltip>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Tooltip content="Save current scene to local storage" placement="bottom">
            <Button
              variant="secondary"
              size="sm"
              icon={Save}
              onClick={saveCurrentScene}
              className="h-[32px] w-[32px] !px-0"
            />
          </Tooltip>
          
          <Tooltip content="Remove nodes that don't contribute to the final output" placement="bottom">
            <Button
              variant="secondary"
              size="sm"
              icon={Paintbrush}
              onClick={cleanupUnusedNodes}
              className="h-[32px] w-[32px] !px-0"
            />
          </Tooltip>
          
          <Tooltip content="Export current graph as image" placement="bottom">
            <Button
              variant="secondary"
              size="sm"
              icon={Camera}
              onClick={exportCurrentGraph}
              className="h-[32px] w-[32px] !px-0"
            />
          </Tooltip>
          
          <Tooltip content="Export graph as JSON file" placement="bottom">
            <Button
              variant="secondary"
              size="sm"
              icon={FileDown}
              onClick={exportToJSON}
              className="h-[32px] w-[32px] !px-0"
            />
          </Tooltip>
          
          <Tooltip content="Import graph from JSON file" placement="bottom">
            <Button
              variant="secondary"
              size="sm"
              icon={FileUp}
              onClick={importFromJSON}
              className="h-[32px] w-[32px] !px-0"
            />
          </Tooltip>
        </div>
      </div>

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
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          onEdgeClick={onEdgeClick}
          onEdgeContextMenu={onEdgeContextMenu}
          onEdgeMouseEnter={onEdgeMouseEnter}
          onEdgeMouseLeave={onEdgeMouseLeave}
          onPaneContextMenu={onPaneContextMenu}
          onNodeContextMenu={onNodeContextMenu}
          onSelectionChange={onSelectionChange}
          nodeTypes={nodeTypesWithContext}
          defaultEdgeOptions={defaultEdgeOptions}
          connectionLineStyle={{
            stroke: '#eab308',
            strokeWidth: 2,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            strokeDasharray: '5, 5',
            opacity: 0.5,
            filter: 'drop-shadow(0 0 4px rgba(234, 179, 8, 0.2))',
            zIndex: -1
          }}
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
        onOpenCustomNodeManager={() => setCustomNodeManagerOpen(true)}
        onRefreshNodes={handleRefreshNodes}
      />

      {/* Refresh indicator */}
      {isRefreshingNodes && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-900/90 backdrop-blur-sm border border-blue-700 rounded-lg px-4 py-2 text-sm text-white">
          <div className="flex items-center gap-2">
            <RefreshCw size={16} className="animate-spin text-blue-400" />
            <span>Refreshing nodes from server...</span>
          </div>
        </div>
      )}

      {/* Server nodes loading status */}
      {serverNodesStatus === 'loading' && (
        <div className="fixed top-4 right-4 z-50 bg-purple-900/90 backdrop-blur-sm border border-purple-700 rounded-lg px-4 py-2 text-sm text-white">
          <div className="flex items-center gap-2">
            <Download size={16} className="animate-pulse text-purple-400" />
            <span>Loading server nodes...</span>
          </div>
        </div>
      )}

      {serverNodesStatus === 'loaded' && (
        <div className="fixed top-4 right-4 z-50 bg-green-900/90 backdrop-blur-sm border border-green-700 rounded-lg px-4 py-2 text-sm text-white">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-400" />
            <span>Server nodes loaded successfully!</span>
          </div>
        </div>
      )}

      {serverNodesStatus === 'error' && (
        <div className="fixed top-4 right-4 z-50 bg-red-900/90 backdrop-blur-sm border border-red-700 rounded-lg px-4 py-2 text-sm text-white">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-400" />
            <span>Failed to load server nodes</span>
          </div>
        </div>
      )}

      {/* Custom Node Manager */}
      <CustomNodeManager
        isOpen={customNodeManagerOpen}
        onClose={() => setCustomNodeManagerOpen(false)}
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

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm border transition-all duration-300 ${
              notification.type === 'success' ? 'bg-green-900/90 text-green-300 border-green-700' :
              notification.type === 'error' ? 'bg-red-900/90 text-red-300 border-red-700' :
              notification.type === 'warning' ? 'bg-yellow-900/90 text-yellow-300 border-yellow-700' :
              'bg-blue-900/90 text-blue-300 border-blue-700'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle2 size={16} /> :
             notification.type === 'error' ? <AlertCircle size={16} /> :
             notification.type === 'warning' ? <AlertCircle size={16} /> :
             <RefreshCw size={16} />}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
} 