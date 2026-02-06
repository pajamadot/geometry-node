import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const GEOMETRY_API_URL = process.env.GEOMETRY_API_URL || 'https://geometry-api.pajamadot.com';

/**
 * GET /api/nodes/[id]
 * Get a specific node definition
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { getToken } = await auth();
    const token = await getToken();

    const response = await fetch(
      `${GEOMETRY_API_URL}/v1/definitions/${encodeURIComponent(id)}`,
      {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Node not found' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const def = data.data;

    return NextResponse.json({
      type: def.type,
      name: def.name,
      description: def.description,
      category: def.category,
      color: def.color,
      inputs: def.inputs,
      outputs: def.outputs,
      parameters: def.parameters,
      executeCode: def.execute_code,
      ui: def.ui_config,
      version: def.version,
      author: def.author_name,
      created: def.created_at,
      modified: def.updated_at,
      tags: def.tags,
      _id: def.id,
      _isPublic: def.is_public,
      _isVerified: def.is_verified,
      _downloads: def.downloads,
      _likes: def.likes,
    });
  } catch (error) {
    console.error('Error fetching node:', error);
    return NextResponse.json(
      { error: 'Failed to fetch node' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/nodes/[id]
 * Update a node definition
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { getToken, userId } = await auth();
    const token = await getToken();

    if (!token || !userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Transform to backend format
    const updates: Record<string, any> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.inputs !== undefined) updates.inputs = body.inputs;
    if (body.outputs !== undefined) updates.outputs = body.outputs;
    if (body.parameters !== undefined) updates.parameters = body.parameters;
    if (body.executeCode !== undefined) updates.execute_code = body.executeCode;
    if (body.color !== undefined) updates.color = body.color;
    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.ui !== undefined) updates.ui_config = body.ui;

    const response = await fetch(
      `${GEOMETRY_API_URL}/v1/definitions/${id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || 'Failed to update node' },
        { status: response.status }
      );
    }

    const def = data.data;
    return NextResponse.json({
      success: true,
      node: {
        type: def.type,
        name: def.name,
        description: def.description,
        category: def.category,
        color: def.color,
        inputs: def.inputs,
        outputs: def.outputs,
        parameters: def.parameters,
        executeCode: def.execute_code,
        ui: def.ui_config,
        version: def.version,
        author: def.author_name,
        created: def.created_at,
        modified: def.updated_at,
        tags: def.tags,
        _id: def.id,
      },
    });
  } catch (error) {
    console.error('Error updating node:', error);
    return NextResponse.json(
      { error: 'Failed to update node' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/nodes/[id]
 * Delete a node definition
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { getToken, userId } = await auth();
    const token = await getToken();

    if (!token || !userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const response = await fetch(
      `${GEOMETRY_API_URL}/v1/definitions/${id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(
        { error: data.error?.message || 'Failed to delete node' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting node:', error);
    return NextResponse.json(
      { error: 'Failed to delete node' },
      { status: 500 }
    );
  }
}
