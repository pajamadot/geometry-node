import { NextRequest, NextResponse } from 'next/server';
import { SerializableNodeDefinition, NodeCategory } from '../../types/nodeSystem';

// In a real application, you would use a proper database
// For now, we'll use a simple in-memory store
const nodeStore = new Map<string, SerializableNodeDefinition>();

// Seed with some example nodes
const seedNodes: SerializableNodeDefinition[] = [
  {
    id: 'builtin-cube',
    type: 'cube',
    name: 'Cube',
    description: 'Creates a cube geometry',
    category: 'geometry',
    version: '1.0.0',
    color: { primary: '#ea580c', secondary: '#c2410c' },
    inputs: [
      { id: 'width', name: 'Width', type: 'number', defaultValue: 1, description: 'Cube width' },
      { id: 'height', name: 'Height', type: 'number', defaultValue: 1, description: 'Cube height' },
      { id: 'depth', name: 'Depth', type: 'number', defaultValue: 1, description: 'Cube depth' }
    ],
    outputs: [
      { id: 'geometry', name: 'Geometry', type: 'geometry', description: 'Generated cube geometry' }
    ],
    parameters: [],
    ui: { icon: 'box' },
    execution: { type: 'builtin', functionName: 'cube' },
    tags: ['geometry', 'primitive'],
    author: 'system',
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'builtin-sphere',
    type: 'sphere',
    name: 'Sphere',
    description: 'Creates a sphere geometry',
    category: 'geometry',
    version: '1.0.0',
    color: { primary: '#ea580c', secondary: '#c2410c' },
    inputs: [
      { id: 'radius', name: 'Radius', type: 'number', defaultValue: 1, description: 'Sphere radius' },
      { id: 'widthSegments', name: 'Width Segments', type: 'integer', defaultValue: 32, description: 'Horizontal segments' },
      { id: 'heightSegments', name: 'Height Segments', type: 'integer', defaultValue: 16, description: 'Vertical segments' }
    ],
    outputs: [
      { id: 'geometry', name: 'Geometry', type: 'geometry', description: 'Generated sphere geometry' }
    ],
    parameters: [],
    ui: { icon: 'sphere' },
    execution: { type: 'builtin', functionName: 'sphere' },
    tags: ['geometry', 'primitive'],
    author: 'system',
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'builtin-math',
    type: 'math',
    name: 'Math',
    description: 'Mathematical operations',
    category: 'math',
    version: '1.0.0',
    color: { primary: '#16a34a', secondary: '#15803d' },
    inputs: [
      { id: 'valueA', name: 'X', type: 'number', defaultValue: 0, description: 'First operand' },
      { id: 'valueB', name: 'Y', type: 'number', defaultValue: 0, description: 'Second operand' },
      { id: 'operation', name: 'Operation', type: 'select', defaultValue: 'add', options: ['add', 'subtract', 'multiply', 'divide', 'power', 'sin', 'cos', 'sqrt', 'abs'], description: 'Mathematical operation' }
    ],
    outputs: [
      { id: 'result', name: 'Result', type: 'number', description: 'Mathematical result' }
    ],
    parameters: [],
    ui: { icon: 'calculator' },
    execution: { type: 'builtin', functionName: 'math_basic' },
    tags: ['math', 'operations'],
    author: 'system',
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'builtin-time',
    type: 'time',
    name: 'Time',
    description: 'Generates time-based values and waveforms',
    category: 'animation',
    version: '1.0.0',
    color: { primary: '#ec4899', secondary: '#be185d' },
    inputs: [
      { id: 'timeMode', name: 'Mode', type: 'select', defaultValue: 'seconds', options: ['seconds', 'frames'], description: 'Time measurement mode' },
      { id: 'outputType', name: 'Output', type: 'select', defaultValue: 'raw', options: ['raw', 'sine', 'cosine', 'sawtooth', 'triangle', 'square'], description: 'Output waveform type' },
      { id: 'frequency', name: 'Frequency', type: 'number', defaultValue: 1, description: 'Wave frequency' },
      { id: 'amplitude', name: 'Amplitude', type: 'number', defaultValue: 1, description: 'Wave amplitude' },
      { id: 'offset', name: 'Offset', type: 'number', defaultValue: 0, description: 'Value offset' },
      { id: 'phase', name: 'Phase', type: 'number', defaultValue: 0, description: 'Wave phase shift' }
    ],
    outputs: [
      { id: 'result', name: 'Time', type: 'number', description: 'Time value' }
    ],
    parameters: [],
    ui: { icon: 'clock' },
    execution: { type: 'builtin', functionName: 'time' },
    tags: ['animation', 'time'],
    author: 'system',
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Initialize store with seed data
seedNodes.forEach(node => {
  if (node.id) {
    nodeStore.set(node.id, node);
  }
});

// GET /api/nodes - Get all nodes or search
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const category = searchParams.get('category') as NodeCategory | null;
  const userId = searchParams.get('userId');
  const publicOnly = searchParams.get('public') === 'true';

  try {
    let nodes = Array.from(nodeStore.values());

    // Filter by public/user
    if (publicOnly) {
      nodes = nodes.filter(node => node.isPublic !== false);
    } else if (userId) {
      nodes = nodes.filter(node => node.author === userId || node.isPublic !== false);
    }

    // Filter by category
    if (category) {
      nodes = nodes.filter(node => node.category === category);
    }

    // Filter by search query
    if (query) {
      const lowercaseQuery = query.toLowerCase();
      nodes = nodes.filter(node =>
        node.name.toLowerCase().includes(lowercaseQuery) ||
        node.description.toLowerCase().includes(lowercaseQuery) ||
        node.type.toLowerCase().includes(lowercaseQuery) ||
        (node.tags && node.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)))
      );
    }

    return NextResponse.json({ nodes, count: nodes.length });
  } catch (error) {
    console.error('Failed to get nodes:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve nodes' },
      { status: 500 }
    );
  }
}

// POST /api/nodes - Create a new node
export async function POST(request: NextRequest) {
  try {
    const nodeData = await request.json() as SerializableNodeDefinition;

    // Generate ID if not provided
    const nodeId = nodeData.id || `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newNode: SerializableNodeDefinition = {
      ...nodeData,
      id: nodeId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    nodeStore.set(nodeId, newNode);

    return NextResponse.json({ node: newNode }, { status: 201 });
  } catch (error) {
    console.error('Failed to create node:', error);
    return NextResponse.json(
      { error: 'Failed to create node' },
      { status: 500 }
    );
  }
}

// PUT /api/nodes - Update an existing node
export async function PUT(request: NextRequest) {
  try {
    const nodeData = await request.json() as SerializableNodeDefinition;

    if (!nodeData.id) {
      return NextResponse.json(
        { error: 'Node ID is required for updates' },
        { status: 400 }
      );
    }

    const existingNode = nodeStore.get(nodeData.id);
    if (!existingNode) {
      return NextResponse.json(
        { error: 'Node not found' },
        { status: 404 }
      );
    }

    const updatedNode: SerializableNodeDefinition = {
      ...nodeData,
      createdAt: existingNode.createdAt, // Preserve creation date
      updatedAt: new Date().toISOString()
    };

    nodeStore.set(nodeData.id, updatedNode);

    return NextResponse.json({ node: updatedNode });
  } catch (error) {
    console.error('Failed to update node:', error);
    return NextResponse.json(
      { error: 'Failed to update node' },
      { status: 500 }
    );
  }
}

// DELETE /api/nodes - Delete a node
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const nodeId = searchParams.get('id');

  if (!nodeId) {
    return NextResponse.json(
      { error: 'Node ID is required' },
      { status: 400 }
    );
  }

  try {
    const success = nodeStore.delete(nodeId);

    if (!success) {
      return NextResponse.json(
        { error: 'Node not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete node:', error);
    return NextResponse.json(
      { error: 'Failed to delete node' },
      { status: 500 }
    );
  }
} 