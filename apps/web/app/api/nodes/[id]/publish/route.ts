import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const GEOMETRY_API_URL = process.env.GEOMETRY_API_URL || 'https://geometry-api.pajamadot.com';

/**
 * POST /api/nodes/[id]/publish
 * Publish a node definition (make it public)
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

    const response = await fetch(
      `${GEOMETRY_API_URL}/v1/definitions/${id}/publish`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || 'Failed to publish node' },
        { status: response.status }
      );
    }

    const def = data.data;
    return NextResponse.json({
      success: true,
      message: `Node '${def.name}' is now public!`,
      node: {
        type: def.type,
        name: def.name,
        _id: def.id,
        _isPublic: def.is_public,
      },
    });
  } catch (error) {
    console.error('Error publishing node:', error);
    return NextResponse.json(
      { error: 'Failed to publish node' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/nodes/[id]/publish
 * Unpublish a node definition (make it private)
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
      `${GEOMETRY_API_URL}/v1/definitions/${id}/unpublish`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || 'Failed to unpublish node' },
        { status: response.status }
      );
    }

    const def = data.data;
    return NextResponse.json({
      success: true,
      message: `Node '${def.name}' is now private.`,
      node: {
        type: def.type,
        name: def.name,
        _id: def.id,
        _isPublic: def.is_public,
      },
    });
  } catch (error) {
    console.error('Error unpublishing node:', error);
    return NextResponse.json(
      { error: 'Failed to unpublish node' },
      { status: 500 }
    );
  }
}
