import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const GEOMETRY_API_URL = process.env.GEOMETRY_API_URL || 'https://geometry-api.pajamadot.com';

/**
 * POST /api/nodes/[id]/fork
 * Fork a node definition to create your own copy
 */
export async function POST(
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

    // Optional new type name
    let newType: string | undefined;
    try {
      const body = await request.json();
      newType = body.newType;
    } catch {
      // No body provided, use default
    }

    const response = await fetch(
      `${GEOMETRY_API_URL}/v1/definitions/${id}/fork`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newType ? { new_type: newType } : {}),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || 'Failed to fork node' },
        { status: response.status }
      );
    }

    const def = data.data;
    return NextResponse.json({
      success: true,
      message: `Forked successfully! Your copy is '${def.name}' (type: ${def.type}).`,
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
        _forkedFrom: def.forked_from,
      },
    });
  } catch (error) {
    console.error('Error forking node:', error);
    return NextResponse.json(
      { error: 'Failed to fork node' },
      { status: 500 }
    );
  }
}
