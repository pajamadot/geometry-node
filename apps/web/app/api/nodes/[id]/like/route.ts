import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const GEOMETRY_API_URL = process.env.GEOMETRY_API_URL || 'https://geometry-api.pajamadot.com';

/**
 * POST /api/nodes/[id]/like
 * Like a node definition
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
      `${GEOMETRY_API_URL}/v1/definitions/${id}/like`,
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
        { error: data.error?.message || 'Failed to like node' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      liked: data.data.liked,
      likes: data.data.likes,
    });
  } catch (error) {
    console.error('Error liking node:', error);
    return NextResponse.json(
      { error: 'Failed to like node' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/nodes/[id]/like
 * Unlike a node definition
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
      `${GEOMETRY_API_URL}/v1/definitions/${id}/like`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || 'Failed to unlike node' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      liked: data.data.liked,
      likes: data.data.likes,
    });
  } catch (error) {
    console.error('Error unliking node:', error);
    return NextResponse.json(
      { error: 'Failed to unlike node' },
      { status: 500 }
    );
  }
}
