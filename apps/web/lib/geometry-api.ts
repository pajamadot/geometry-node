/**
 * Geometry API Client
 * Connects to geometry-api.pajamadot.com for node definitions
 */

import { JsonNodeDefinition, JsonNodeCollection } from '../app/types/jsonNodes';

// API configuration
const GEOMETRY_API_URL = process.env.NEXT_PUBLIC_GEOMETRY_API_URL || 'https://geometry-api.pajamadot.com';

// Type for backend node definition (snake_case)
interface BackendNodeDefinition {
  id: string;
  tenant_id: string;
  created_by: string;
  type: string;
  name: string;
  description: string;
  category: string;
  color: {
    primary: string;
    secondary: string;
  };
  inputs: Array<{
    id: string;
    name: string;
    type: string;
    required?: boolean;
    defaultValue?: any;
    description?: string;
    min?: number;
    max?: number;
    step?: number;
    options?: string[];
  }>;
  outputs: Array<{
    id: string;
    name: string;
    type: string;
    description?: string;
  }>;
  parameters: Array<{
    id: string;
    name: string;
    type: string;
    defaultValue: any;
    min?: number;
    max?: number;
    step?: number;
    options?: string[];
    description?: string;
    category?: string;
  }>;
  execute_code: string;
  ui_config?: {
    width?: number;
    height?: number;
    icon?: string;
    advanced?: string[];
  };
  version: string;
  tags: string[];
  author_name?: string;
  is_public: boolean;
  is_verified: boolean;
  is_featured: boolean;
  downloads: number;
  likes: number;
  forked_from?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

// API response types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    request_id: string;
  };
}

interface ListDefinitionsResponse {
  definitions: BackendNodeDefinition[];
}

interface DiscoverDefinitionsResponse {
  definitions: BackendNodeDefinition[];
  total: number;
}

interface LikeResponse {
  liked: boolean;
  likes: number;
}

// Convert backend format to frontend format
function backendToFrontend(backend: BackendNodeDefinition): JsonNodeDefinition {
  return {
    type: backend.type,
    name: backend.name,
    description: backend.description,
    category: backend.category as any,
    color: backend.color,
    inputs: backend.inputs as any,
    outputs: backend.outputs as any,
    parameters: backend.parameters as any,
    executeCode: backend.execute_code,
    ui: backend.ui_config ? {
      width: backend.ui_config.width,
      height: backend.ui_config.height,
      icon: backend.ui_config.icon,
      advanced: backend.ui_config.advanced,
    } : undefined,
    version: backend.version,
    author: backend.author_name,
    created: backend.created_at,
    modified: backend.updated_at,
    tags: backend.tags,
  };
}

// Convert frontend format to backend format
function frontendToBackend(frontend: JsonNodeDefinition): Partial<BackendNodeDefinition> {
  return {
    type: frontend.type,
    name: frontend.name,
    description: frontend.description,
    category: frontend.category,
    color: frontend.color,
    inputs: frontend.inputs as any,
    outputs: frontend.outputs as any,
    parameters: frontend.parameters as any,
    execute_code: frontend.executeCode,
    ui_config: frontend.ui ? {
      width: frontend.ui.width,
      height: frontend.ui.height,
      icon: frontend.ui.icon,
      advanced: frontend.ui.advanced,
    } : undefined,
    version: frontend.version || '1.0.0',
    tags: frontend.tags || [],
    author_name: frontend.author,
  };
}

export class GeometryApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = GEOMETRY_API_URL) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers,
      });

      const data = await response.json() as ApiResponse<T>;

      if (!response.ok) {
        throw new Error(data.error?.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Geometry API request failed:', error);
      throw error;
    }
  }

  /**
   * List all available node definitions (own + public)
   */
  async listDefinitions(options?: {
    category?: string;
    includePublic?: boolean;
  }): Promise<JsonNodeDefinition[]> {
    const params = new URLSearchParams();
    if (options?.category) params.append('category', options.category);
    if (options?.includePublic === false) params.append('include_public', 'false');

    const query = params.toString();
    const path = `/v1/definitions${query ? `?${query}` : ''}`;

    const response = await this.request<ListDefinitionsResponse>(path);

    if (!response.success || !response.data) {
      return [];
    }

    return response.data.definitions.map(backendToFrontend);
  }

  /**
   * Get a specific node definition by type
   */
  async getDefinition(type: string): Promise<JsonNodeDefinition | null> {
    try {
      const response = await this.request<BackendNodeDefinition>(
        `/v1/definitions/${encodeURIComponent(type)}`
      );

      if (!response.success || !response.data) {
        return null;
      }

      return backendToFrontend(response.data);
    } catch {
      return null;
    }
  }

  /**
   * Create a new node definition
   */
  async createDefinition(node: JsonNodeDefinition): Promise<JsonNodeDefinition> {
    const response = await this.request<BackendNodeDefinition>('/v1/definitions', {
      method: 'POST',
      body: JSON.stringify(frontendToBackend(node)),
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to create node definition');
    }

    return backendToFrontend(response.data);
  }

  /**
   * Update an existing node definition
   */
  async updateDefinition(id: string, updates: Partial<JsonNodeDefinition>): Promise<JsonNodeDefinition> {
    const backendUpdates: Record<string, any> = {};

    if (updates.name !== undefined) backendUpdates.name = updates.name;
    if (updates.description !== undefined) backendUpdates.description = updates.description;
    if (updates.inputs !== undefined) backendUpdates.inputs = updates.inputs;
    if (updates.outputs !== undefined) backendUpdates.outputs = updates.outputs;
    if (updates.parameters !== undefined) backendUpdates.parameters = updates.parameters;
    if (updates.executeCode !== undefined) backendUpdates.execute_code = updates.executeCode;
    if (updates.color !== undefined) backendUpdates.color = updates.color;
    if (updates.tags !== undefined) backendUpdates.tags = updates.tags;
    if (updates.ui !== undefined) backendUpdates.ui_config = updates.ui;

    const response = await this.request<BackendNodeDefinition>(`/v1/definitions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(backendUpdates),
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to update node definition');
    }

    return backendToFrontend(response.data);
  }

  /**
   * Delete a node definition
   */
  async deleteDefinition(id: string): Promise<void> {
    await this.request(`/v1/definitions/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Publish a node definition (make it public)
   */
  async publishDefinition(id: string): Promise<JsonNodeDefinition> {
    const response = await this.request<BackendNodeDefinition>(
      `/v1/definitions/${id}/publish`,
      { method: 'POST' }
    );

    if (!response.success || !response.data) {
      throw new Error('Failed to publish node definition');
    }

    return backendToFrontend(response.data);
  }

  /**
   * Unpublish a node definition (make it private)
   */
  async unpublishDefinition(id: string): Promise<JsonNodeDefinition> {
    const response = await this.request<BackendNodeDefinition>(
      `/v1/definitions/${id}/unpublish`,
      { method: 'POST' }
    );

    if (!response.success || !response.data) {
      throw new Error('Failed to unpublish node definition');
    }

    return backendToFrontend(response.data);
  }

  /**
   * Discover public node definitions
   */
  async discoverDefinitions(options?: {
    query?: string;
    category?: string;
    sort?: 'downloads' | 'likes' | 'newest';
    limit?: number;
  }): Promise<{ definitions: JsonNodeDefinition[]; total: number }> {
    const params = new URLSearchParams();
    if (options?.query) params.append('query', options.query);
    if (options?.category) params.append('category', options.category);
    if (options?.sort) params.append('sort', options.sort);
    if (options?.limit) params.append('limit', options.limit.toString());

    const query = params.toString();
    const path = `/v1/definitions/discover${query ? `?${query}` : ''}`;

    const response = await this.request<DiscoverDefinitionsResponse>(path);

    if (!response.success || !response.data) {
      return { definitions: [], total: 0 };
    }

    return {
      definitions: response.data.definitions.map(backendToFrontend),
      total: response.data.total,
    };
  }

  /**
   * Fork a node definition
   */
  async forkDefinition(id: string, newType?: string): Promise<JsonNodeDefinition> {
    const body: Record<string, any> = {};
    if (newType) body.new_type = newType;

    const response = await this.request<BackendNodeDefinition>(
      `/v1/definitions/${id}/fork`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );

    if (!response.success || !response.data) {
      throw new Error('Failed to fork node definition');
    }

    return backendToFrontend(response.data);
  }

  /**
   * Like or unlike a node definition
   */
  async likeDefinition(id: string, like: boolean = true): Promise<LikeResponse> {
    const response = await this.request<LikeResponse>(
      `/v1/definitions/${id}/like`,
      { method: like ? 'POST' : 'DELETE' }
    );

    if (!response.success || !response.data) {
      throw new Error('Failed to like/unlike node definition');
    }

    return response.data;
  }

  /**
   * Get all definitions as a JsonNodeCollection (for compatibility with existing code)
   */
  async getDefinitionsAsCollection(): Promise<JsonNodeCollection> {
    const definitions = await this.listDefinitions();

    return {
      version: '1.0.0',
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      nodes: definitions,
    };
  }
}

// Singleton instance for convenience
export const geometryApi = new GeometryApiClient();
