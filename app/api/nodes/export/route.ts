import { NextRequest, NextResponse } from 'next/server';
import { SerializableNodeDefinition } from '../../../types/nodeSystem';

// This would connect to the same data store as the main nodes API
// For simplicity, we'll use the same in-memory store concept
const nodeStore = new Map<string, SerializableNodeDefinition>();

// GET /api/nodes/export - Export user's nodes as JSON
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const format = searchParams.get('format') || 'json';

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    );
  }

  try {
    // Get all nodes for the user
    const userNodes = Array.from(nodeStore.values()).filter(node => node.author === userId);

    if (format === 'json') {
      const exportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        nodeCount: userNodes.length,
        nodes: userNodes
      };

      // Return as downloadable JSON file
      return new Response(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="nodes-export-${userId}-${Date.now()}.json"`
        }
      });
    }

    return NextResponse.json(
      { error: 'Unsupported export format' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Failed to export nodes:', error);
    return NextResponse.json(
      { error: 'Failed to export nodes' },
      { status: 500 }
    );
  }
}

// POST /api/nodes/export - Import nodes from JSON
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const importData = await request.json();
    
    // Validate import data structure
    if (!importData.nodes || !Array.isArray(importData.nodes)) {
      return NextResponse.json(
        { error: 'Invalid import format: missing nodes array' },
        { status: 400 }
      );
    }

    const nodes = importData.nodes as SerializableNodeDefinition[];
    let importedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const node of nodes) {
      try {
        // Validate node structure
        if (!node.type || !node.name || !node.execution) {
          errors.push(`Invalid node structure: ${node.name || 'unnamed'}`);
          errorCount++;
          continue;
        }

        // Generate new ID and update metadata
        const nodeId = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const importedNode: SerializableNodeDefinition = {
          ...node,
          id: nodeId,
          author: userId, // Set to importing user
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        nodeStore.set(nodeId, importedNode);
        importedCount++;
      } catch (error) {
        errors.push(`Failed to import node ${node.name}: ${error}`);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      importedCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully imported ${importedCount} nodes${errorCount > 0 ? ` with ${errorCount} errors` : ''}`
    });
  } catch (error) {
    console.error('Failed to import nodes:', error);
    return NextResponse.json(
      { error: 'Failed to import nodes' },
      { status: 500 }
    );
  }
} 