import { useState, useCallback, useEffect } from 'react';
import { SerializableNodeDefinition, NodeCategory } from '../types/nodeSystem';

// API response types
interface NodesResponse {
  nodes: SerializableNodeDefinition[];
  count: number;
}

interface NodeResponse {
  node: SerializableNodeDefinition;
}

interface ExportResponse {
  success: boolean;
  importedCount: number;
  errorCount: number;
  errors?: string[];
  message: string;
}

// Hook for managing node database operations
export function useNodeDatabase(userId?: string) {
  const [nodes, setNodes] = useState<SerializableNodeDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load nodes from API
  const loadNodes = useCallback(async (options?: {
    query?: string;
    category?: NodeCategory;
    publicOnly?: boolean;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (options?.query) params.append('q', options.query);
      if (options?.category) params.append('category', options.category);
      if (options?.publicOnly) params.append('public', 'true');
      if (userId && !options?.publicOnly) params.append('userId', userId);

      const response = await fetch(`/api/nodes?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load nodes: ${response.statusText}`);
      }

      const data: NodesResponse = await response.json();
      setNodes(data.nodes);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load nodes';
      setError(errorMessage);
      console.error('Failed to load nodes:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Save a node (create or update)
  const saveNode = useCallback(async (node: SerializableNodeDefinition): Promise<SerializableNodeDefinition | null> => {
    setError(null);

    try {
      const isUpdate = !!node.id;
      const response = await fetch('/api/nodes', {
        method: isUpdate ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...node,
          author: userId || node.author,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save node: ${response.statusText}`);
      }

      const data: NodeResponse = await response.json();
      
      // Update local state
      setNodes(prev => {
        if (isUpdate) {
          return prev.map(n => n.id === data.node.id ? data.node : n);
        } else {
          return [...prev, data.node];
        }
      });

      return data.node;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save node';
      setError(errorMessage);
      console.error('Failed to save node:', err);
      return null;
    }
  }, [userId]);

  // Delete a node
  const deleteNode = useCallback(async (nodeId: string): Promise<boolean> => {
    setError(null);

    try {
      const response = await fetch(`/api/nodes?id=${nodeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete node: ${response.statusText}`);
      }

      // Update local state
      setNodes(prev => prev.filter(n => n.id !== nodeId));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete node';
      setError(errorMessage);
      console.error('Failed to delete node:', err);
      return false;
    }
  }, []);

  // Export user nodes
  const exportNodes = useCallback(async (): Promise<boolean> => {
    if (!userId) {
      setError('User ID required for export');
      return false;
    }

    setError(null);

    try {
      const response = await fetch(`/api/nodes/export?userId=${userId}&format=json`);
      
      if (!response.ok) {
        throw new Error(`Failed to export nodes: ${response.statusText}`);
      }

      // Trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nodes-export-${userId}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export nodes';
      setError(errorMessage);
      console.error('Failed to export nodes:', err);
      return false;
    }
  }, [userId]);

  // Import nodes from JSON
  const importNodes = useCallback(async (jsonData: string): Promise<ExportResponse | null> => {
    if (!userId) {
      setError('User ID required for import');
      return null;
    }

    setError(null);

    try {
      const importData = JSON.parse(jsonData);
      
      const response = await fetch(`/api/nodes/export?userId=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(importData),
      });

      if (!response.ok) {
        throw new Error(`Failed to import nodes: ${response.statusText}`);
      }

      const result: ExportResponse = await response.json();
      
      // Reload nodes to show imported ones
      if (result.importedCount > 0) {
        await loadNodes();
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import nodes';
      setError(errorMessage);
      console.error('Failed to import nodes:', err);
      return null;
    }
  }, [userId, loadNodes]);

  // Search nodes
  const searchNodes = useCallback(async (query: string, category?: NodeCategory): Promise<SerializableNodeDefinition[]> => {
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('q', query);
      if (category) params.append('category', category);
      params.append('public', 'true'); // Search public nodes only

      const response = await fetch(`/api/nodes?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to search nodes: ${response.statusText}`);
      }

      const data: NodesResponse = await response.json();
      return data.nodes;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search nodes';
      setError(errorMessage);
      console.error('Failed to search nodes:', err);
      return [];
    }
  }, []);

  // Load nodes on mount
  useEffect(() => {
    loadNodes();
  }, [loadNodes]);

  return {
    nodes,
    loading,
    error,
    loadNodes,
    saveNode,
    deleteNode,
    exportNodes,
    importNodes,
    searchNodes,
    clearError: () => setError(null),
  };
}

// Hook for managing a single node
export function useNode(nodeId?: string) {
  const [node, setNode] = useState<SerializableNodeDefinition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNode = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      // For now, we'll search by type since our API doesn't have a single node endpoint
      const response = await fetch(`/api/nodes?public=true`);
      
      if (!response.ok) {
        throw new Error(`Failed to load node: ${response.statusText}`);
      }

      const data: NodesResponse = await response.json();
      const foundNode = data.nodes.find(n => n.id === id);
      
      if (!foundNode) {
        throw new Error('Node not found');
      }

      setNode(foundNode);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load node';
      setError(errorMessage);
      console.error('Failed to load node:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (nodeId) {
      loadNode(nodeId);
    }
  }, [nodeId, loadNode]);

  return {
    node,
    loading,
    error,
    loadNode,
    clearError: () => setError(null),
  };
}

// Hook for node categories and statistics
export function useNodeStats() {
  const [stats, setStats] = useState<{
    totalNodes: number;
    categoryCounts: Record<NodeCategory, number>;
    recentNodes: SerializableNodeDefinition[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/nodes?public=true');
      
      if (!response.ok) {
        throw new Error(`Failed to load stats: ${response.statusText}`);
      }

      const data: NodesResponse = await response.json();
      
      // Calculate statistics
      const categoryCounts: Record<NodeCategory, number> = {} as any;
      data.nodes.forEach(node => {
        categoryCounts[node.category] = (categoryCounts[node.category] || 0) + 1;
      });

      // Get recent nodes (last 10, sorted by creation date)
      const recentNodes = data.nodes
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 10);

      setStats({
        totalNodes: data.nodes.length,
        categoryCounts,
        recentNodes,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load stats';
      setError(errorMessage);
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    loadStats,
    clearError: () => setError(null),
  };
} 