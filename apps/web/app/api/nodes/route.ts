import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Backend URL - use environment variable in production
const GEOMETRY_API_URL = process.env.GEOMETRY_API_URL || 'https://geometry-api.pajamadot.com';

// Fallback to static nodes if backend is unavailable
import { SERVER_NODE_DEFINITIONS } from '../../data/serverNodes';

/**
 * GET /api/nodes
 * List all available node definitions from the geometry backend
 * Falls back to static nodes if backend is unavailable
 */
export async function GET(request: NextRequest) {
  try {
    // Get auth token from Clerk
    const { getToken } = await auth();
    const token = await getToken();

    // Build query params
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const includePublic = searchParams.get('include_public');

    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (includePublic === 'false') params.append('include_public', 'false');

    const query = params.toString();
    const url = `${GEOMETRY_API_URL}/v1/definitions${query ? `?${query}` : ''}`;

    // Call backend API
    const response = await fetch(url, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      // Cache for 5 minutes
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.warn(`Geometry API returned ${response.status}, falling back to static nodes`);
      return NextResponse.json(SERVER_NODE_DEFINITIONS);
    }

    const data = await response.json();

    // Transform backend response to frontend format
    if (data.success && data.data?.definitions) {
      const nodes = data.data.definitions.map((def: any) => ({
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
        // Additional metadata for community features
        _id: def.id,
        _isPublic: def.is_public,
        _isVerified: def.is_verified,
        _downloads: def.downloads,
        _likes: def.likes,
      }));

      return NextResponse.json({
        version: '1.0.0',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        nodes,
      });
    }

    // Fallback to static nodes
    return NextResponse.json(SERVER_NODE_DEFINITIONS);
  } catch (error) {
    console.error('Error fetching nodes from backend:', error);
    // Fallback to static nodes on error
    return NextResponse.json(SERVER_NODE_DEFINITIONS);
  }
}

/**
 * POST /api/nodes
 * Create a new node definition on the backend
 */
export async function POST(request: NextRequest) {
  try {
    const { getToken, userId } = await auth();
    const token = await getToken();

    if (!token || !userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Transform frontend format to backend format
    const backendNode = {
      type: body.type,
      name: body.name,
      description: body.description,
      category: body.category,
      color: body.color,
      inputs: body.inputs,
      outputs: body.outputs,
      parameters: body.parameters,
      execute_code: body.executeCode,
      ui_config: body.ui,
      version: body.version || '1.0.0',
      tags: body.tags || [],
      author_name: body.author,
    };

    const response = await fetch(`${GEOMETRY_API_URL}/v1/definitions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(backendNode),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || 'Failed to create node' },
        { status: response.status }
      );
    }

    // Transform response back to frontend format
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
    console.error('Error creating node:', error);
    return NextResponse.json(
      { error: 'Failed to create node definition' },
      { status: 500 }
    );
  }
}
