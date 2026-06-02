// Scene configurations
export const getDefaultScene = () => ({
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