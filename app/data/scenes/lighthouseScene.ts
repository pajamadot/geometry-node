export const getLighthouseScene = () => ({
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