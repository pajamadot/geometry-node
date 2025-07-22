import { Node, Edge } from 'reactflow';
import { GeometryNodeData } from '../types/nodes';
import { Box, Flashlight } from 'lucide-react';

export interface ScenePreset {
  value: string;
  label: string;
  icon: any;
  description: string;
}

export const scenePresets: ScenePreset[] = [
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

/**
 * Scene storage keys for localStorage
 */
const STORAGE_KEYS = {
  CURRENT_SCENE: 'geometry-script-current-scene',
  SCENE_PREFIX: 'geometry-script-scene-'
} as const;

/**
 * Scene data structure for storage
 */
export interface SceneData {
  nodes: Node<any>[];  // Use any to avoid strict typing issues with preset data
  edges: Edge[];
  metadata?: {
    name?: string;
    description?: string;
    createdAt?: string;
    modifiedAt?: string;
  };
}

/**
 * Save current scene to localStorage
 */
export function saveSceneToLocalStorage(
  nodes: Node<any>[], 
  edges: Edge[],
  sceneName: string = 'current'
): boolean {
  try {
    const sceneData: SceneData = {
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
        name: sceneName,
        modifiedAt: new Date().toISOString()
      }
    };

    const storageKey = sceneName === 'current' 
      ? STORAGE_KEYS.CURRENT_SCENE 
      : `${STORAGE_KEYS.SCENE_PREFIX}${sceneName}`;

    localStorage.setItem(storageKey, JSON.stringify(sceneData));
    return true;
  } catch (error) {
    console.error('Failed to save scene to localStorage:', error);
    return false;
  }
}

/**
 * Load scene from localStorage
 */
export function loadSceneFromLocalStorage(sceneName: string = 'current'): SceneData | null {
  try {
    const storageKey = sceneName === 'current' 
      ? STORAGE_KEYS.CURRENT_SCENE 
      : `${STORAGE_KEYS.SCENE_PREFIX}${sceneName}`;

    const storedData = localStorage.getItem(storageKey);
    if (!storedData) return null;

    return JSON.parse(storedData) as SceneData;
  } catch (error) {
    console.error('Failed to load scene from localStorage:', error);
    return null;
  }
}

/**
 * Get the default scene configuration
 */
export function getDefaultScene(): SceneData {
  return {
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
        position: { x: 300, y: 150 },
        data: {
          id: 'math-1',
          type: 'math',
          label: 'Math',
          parameters: { operation: 'multiply', valueB: 90 },
          inputConnections: {},
          liveParameterValues: {}
        }
      },
                    {
        id: 'make-vector-1',
        type: 'make-vector',
        position: { x: 550, y: 100 },
        data: {
          id: 'make-vector-1',
          type: 'make-vector',
          label: 'Make Vector',
          parameters: { x: 0, y: 0, z: 0 },
          inputConnections: {},
          liveParameterValues: {}
        }
      },
      {
        id: 'cube-1',
        type: 'cube',
        position: { x: 550, y: 250 },
        data: {
          id: 'cube-1',
          type: 'cube', 
          label: 'Cube',
          parameters: { size: { x: 1, y: 1, z: 1 } },
          inputConnections: {},
          liveParameterValues: {}
        }
      },
      {
        id: 'transform-1',
        type: 'transform',
        position: { x: 800, y: 200 },
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
        position: { x: 1050, y: 200 },
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
        id: 'e-makevector-transform-rotation',
        source: 'make-vector-1',
        target: 'transform-1',
        sourceHandle: 'vector-out',
        targetHandle: 'rotation-in',
      },
      {
        id: 'e-cube-transform-geometry',
        source: 'cube-1',
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
      }
    ],
    metadata: {
      name: 'Default Scene',
      description: 'Basic scene with time input controlling cube rotation',
      createdAt: new Date().toISOString()
    }
  };
}

/**
 * Get the lighthouse scene configuration
 */
export function getLighthouseScene(): SceneData {
  return {
    nodes: [
      {
        id: 'time-1',
        type: 'time',
        position: { x: 50, y: 200 },
        data: {
          id: 'time-1',
          type: 'time',
          label: 'Time',
          parameters: { speed: 0.5, outputType: 'linear', frequency: 1, amplitude: 1 },
          inputConnections: {},
          liveParameterValues: {}
        }
      },
      {
        id: 'cylinder-1',
        type: 'cylinder',
        position: { x: 300, y: 100 },
        data: {
          id: 'cylinder-1',
          type: 'cylinder',
          label: 'Lighthouse Base',
          parameters: { 
            radius: 0.8,
            height: 3.0,
            segments: 16
          },
          inputConnections: {},
          liveParameterValues: {}
        }
      },
      {
        id: 'cylinder-2',
        type: 'cylinder',
        position: { x: 300, y: 300 },
        data: {
          id: 'cylinder-2',
          type: 'cylinder',
          label: 'Lighthouse Top',
          parameters: { 
            radius: 0.6,
            height: 1.5,
            segments: 8
          },
          inputConnections: {},
          liveParameterValues: {}
        }
      },
      {
        id: 'water-material-1',
        type: 'water-material',
        position: { x: 300, y: 500 },
        data: {
          id: 'water-material-1',
          type: 'water-material',
          label: 'Water',
          parameters: {
            color: '#1e40af',
            opacity: 0.8,
            waveSpeed: 2.0,
            waveHeight: 0.1
          },
          inputConnections: {},
          liveParameterValues: {}
        }
      },
      {
        id: 'plane-1',
        type: 'parametric-surface',
        position: { x: 550, y: 450 },
        data: {
          id: 'plane-1',
          type: 'parametric-surface',
          label: 'Water Surface',
          parameters: {
            surfaceType: 'plane',
            width: 20,
            height: 20,
            widthSegments: 50,
            heightSegments: 50
          },
          inputConnections: {},
          liveParameterValues: {}
        }
      },
      {
        id: 'merge-1',
        type: 'merge-geometry',
        position: { x: 800, y: 250 },
        data: {
          id: 'merge-1',
          type: 'merge-geometry',
          label: 'Merge Lighthouse',
          parameters: {},
          inputConnections: {},
          liveParameterValues: {}
        }
      },
      {
        id: 'set-material-1',
        type: 'set-material',
        position: { x: 800, y: 450 },
        data: {
          id: 'set-material-1',
          type: 'set-material',
          label: 'Apply Water Material',
          parameters: {},
          inputConnections: {},
          liveParameterValues: {}
        }
      },
      {
        id: 'final-merge-1',
        type: 'merge-geometry',
        position: { x: 1050, y: 350 },
        data: {
          id: 'final-merge-1',
          type: 'merge-geometry',
          label: 'Final Scene',
          parameters: {},
          inputConnections: {},
          liveParameterValues: {}
        }
      },
      {
        id: 'output-1',
        type: 'output',
        position: { x: 1300, y: 350 },
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
      // Lighthouse structure
      {
        id: 'e-cylinder1-merge',
        source: 'cylinder-1',
        target: 'merge-1',
        sourceHandle: 'geometry-out',
        targetHandle: 'geometry1-in',
      },
      {
        id: 'e-cylinder2-merge',
        source: 'cylinder-2',
        target: 'merge-1',
        sourceHandle: 'geometry-out',
        targetHandle: 'geometry2-in',
      },
      // Water surface
      {
        id: 'e-plane-setmaterial',
        source: 'plane-1',
        target: 'set-material-1',
        sourceHandle: 'geometry-out',
        targetHandle: 'geometry-in',
      },
      {
        id: 'e-watermaterial-setmaterial',
        source: 'water-material-1',
        target: 'set-material-1',
        sourceHandle: 'material-out',
        targetHandle: 'material-in',
      },
      // Time connection for water animation
      {
        id: 'e-time-watermaterial',
        source: 'time-1',
        target: 'water-material-1',
        sourceHandle: 'time-out',
        targetHandle: 'time-in',
      },
      // Final assembly
      {
        id: 'e-lighthouse-finalmerge',
        source: 'merge-1',
        target: 'final-merge-1',
        sourceHandle: 'geometry-out',
        targetHandle: 'geometry1-in',
      },
      {
        id: 'e-water-finalmerge',
        source: 'set-material-1',
        target: 'final-merge-1',
        sourceHandle: 'geometry-out',
        targetHandle: 'geometry2-in',
      },
      {
        id: 'e-finalmerge-output',
        source: 'final-merge-1',
        target: 'output-1',
        sourceHandle: 'geometry-out',
        targetHandle: 'geometry-in',
      }
    ],
    metadata: {
      name: 'Lighthouse Scene',
      description: 'Animated water, lighthouse, and rock',
      createdAt: new Date().toISOString()
    }
  };
}

/**
 * Load a preset scene by name
 */
export function loadPresetScene(presetName: string): SceneData | null {
  switch (presetName) {
    case 'default':
      return getDefaultScene();
    case 'lighthouse':
      return getLighthouseScene();
    default:
      console.warn(`Unknown preset scene: ${presetName}`);
      return null;
  }
}

/**
 * List all saved scenes in localStorage
 */
export function listSavedScenes(): string[] {
  const savedScenes: string[] = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEYS.SCENE_PREFIX)) {
        const sceneName = key.replace(STORAGE_KEYS.SCENE_PREFIX, '');
        savedScenes.push(sceneName);
      }
    }
  } catch (error) {
    console.error('Failed to list saved scenes:', error);
  }
  
  return savedScenes;
}

/**
 * Delete a saved scene from localStorage
 */
export function deleteSavedScene(sceneName: string): boolean {
  try {
    const storageKey = `${STORAGE_KEYS.SCENE_PREFIX}${sceneName}`;
    localStorage.removeItem(storageKey);
    return true;
  } catch (error) {
    console.error('Failed to delete saved scene:', error);
    return false;
  }
} 