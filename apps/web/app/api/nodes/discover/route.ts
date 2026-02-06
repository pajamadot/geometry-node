import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const GEOMETRY_API_URL = process.env.GEOMETRY_API_URL || 'https://geometry-api.pajamadot.com';

/**
 * GET /api/nodes/discover
 * Discover public node definitions from the community
 */
export async function GET(request: NextRequest) {
  try {
    const { getToken } = await auth();
    const token = await getToken();

    // Build query params
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const category = searchParams.get('category');
    const sort = searchParams.get('sort');
    const limit = searchParams.get('limit');

    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (category) params.append('category', category);
    if (sort) params.append('sort', sort);
    if (limit) params.append('limit', limit);

    const queryString = params.toString();
    const url = `${GEOMETRY_API_URL}/v1/definitions/discover${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      // Cache for 1 minute
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch community nodes' },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.success || !data.data?.definitions) {
      return NextResponse.json({
        nodes: [],
        total: 0,
      });
    }

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
      _id: def.id,
      _isPublic: def.is_public,
      _isVerified: def.is_verified,
      _isFeatured: def.is_featured,
      _downloads: def.downloads,
      _likes: def.likes,
    }));

    return NextResponse.json({
      nodes,
      total: data.data.total,
    });
  } catch (error) {
    console.error('Error discovering nodes:', error);
    return NextResponse.json(
      { error: 'Failed to discover nodes' },
      { status: 500 }
    );
  }
}
