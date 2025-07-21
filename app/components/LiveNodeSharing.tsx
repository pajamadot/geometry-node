import React, { useState, useEffect, useCallback } from 'react';
import { 
  Share2, Users, Download, Upload, Heart, Eye, Star, 
  TrendingUp, Clock, Filter, Search, Tag, User, Globe 
} from 'lucide-react';
import { SerializableNodeDefinition, NodeCategory } from '../types/nodeSystem';
import { useNodeDatabase } from '../hooks/useNodeDatabase';
import { serializableNodeRegistry } from '../registry/SerializableNodeRegistry';

interface LiveNodeSharingProps {
  userId: string;
  onNodeAdded: (nodeType: string) => void;
}

export default function LiveNodeSharing({ userId, onNodeAdded }: LiveNodeSharingProps) {
  const [activeTab, setActiveTab] = useState<'trending' | 'recent' | 'favorites' | 'mine'>('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<NodeCategory | 'all'>('all');
  const [trendingNodes, setTrendingNodes] = useState<TrendingNode[]>([]);
  const [recentNodes, setRecentNodes] = useState<SerializableNodeDefinition[]>([]);
  const [favoriteNodes, setFavoriteNodes] = useState<string[]>([]);
  
  const { nodes, saveNode, searchNodes } = useNodeDatabase(userId);

  interface TrendingNode extends SerializableNodeDefinition {
    downloads: number;
    likes: number;
    views: number;
    trend: 'up' | 'down' | 'stable';
    isNew: boolean;
  }

  // Mock trending data - in real app, this would come from analytics
  useEffect(() => {
    const mockTrending: TrendingNode[] = [
      {
        id: 'trending-1',
        type: 'advanced-spiral',
        name: 'Advanced Spiral Generator',
        description: 'Creates beautiful spirals with customizable parameters',
        category: 'geometry',
        version: '2.1.0',
        color: { primary: '#f59e0b', secondary: '#d97706' },
        inputs: [
          { id: 'turns', name: 'Turns', type: 'number', defaultValue: 5 },
          { id: 'radius', name: 'Radius', type: 'number', defaultValue: 2 }
        ],
        outputs: [
          { id: 'geometry', name: 'Geometry', type: 'geometry' }
        ],
        parameters: [],
        execution: { type: 'builtin', functionName: 'spiral_advanced' },
        ui: { icon: 'waves' },
        tags: ['spiral', 'geometry', 'procedural'],
        author: 'spiralmaster',
        isPublic: true,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T15:30:00Z',
        downloads: 1547,
        likes: 342,
        views: 8912,
        trend: 'up',
        isNew: false
      },
      {
        id: 'trending-2',
        type: 'neural-growth',
        name: 'Neural Growth Pattern',
        description: 'Simulates organic neural growth patterns',
        category: 'modifiers',
        version: '1.0.0',
        color: { primary: '#10b981', secondary: '#059669' },
        inputs: [
          { id: 'seed', name: 'Seed', type: 'integer', defaultValue: 42 },
          { id: 'branches', name: 'Branches', type: 'integer', defaultValue: 8 }
        ],
        outputs: [
          { id: 'geometry', name: 'Geometry', type: 'geometry' }
        ],
        parameters: [],
        execution: { type: 'composite', steps: [] },
        ui: { icon: 'sparkles' },
        tags: ['organic', 'neural', 'growth', 'new'],
        author: 'biodesigner',
        isPublic: true,
        createdAt: '2024-01-22T08:00:00Z',
        updatedAt: '2024-01-22T08:00:00Z',
        downloads: 89,
        likes: 23,
        views: 456,
        trend: 'up',
        isNew: true
      }
    ];
    
    setTrendingNodes(mockTrending);
    setRecentNodes(mockTrending.slice().reverse());
  }, []);

  const handleLikeNode = useCallback(async (nodeId: string) => {
    // In real app, this would make an API call
    setTrendingNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { ...node, likes: node.likes + 1 }
        : node
    ));
  }, []);

  const handleFavoriteNode = useCallback((nodeId: string) => {
    setFavoriteNodes(prev => 
      prev.includes(nodeId)
        ? prev.filter(id => id !== nodeId)
        : [...prev, nodeId]
    );
  }, []);

  const handleUseNode = useCallback(async (node: SerializableNodeDefinition) => {
    try {
      // Register the node in the local registry
      await serializableNodeRegistry.registerSerializable(node);
      
      // Add to the current graph
      onNodeAdded(node.type);
      
      // Update download count (in real app, this would be server-side)
      if ('downloads' in node) {
        setTrendingNodes(prev => prev.map(n => 
          n.id === node.id 
            ? { ...n, downloads: (n as TrendingNode).downloads + 1 }
            : n
        ));
      }
    } catch (error) {
      console.error('Failed to use node:', error);
    }
  }, [onNodeAdded]);

  const filteredNodes = React.useMemo(() => {
    let nodesToFilter: (SerializableNodeDefinition | TrendingNode)[] = [];
    
    switch (activeTab) {
      case 'trending':
        nodesToFilter = trendingNodes;
        break;
      case 'recent':
        nodesToFilter = recentNodes;
        break;
      case 'favorites':
        nodesToFilter = trendingNodes.filter(node => favoriteNodes.includes(node.id!));
        break;
      case 'mine':
        nodesToFilter = nodes.filter(node => node.author === userId);
        break;
    }
    
    // Apply filters
    return nodesToFilter.filter(node => {
      const matchesSearch = !searchQuery || 
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (node.tags && node.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
      
      const matchesCategory = selectedCategory === 'all' || node.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [activeTab, trendingNodes, recentNodes, favoriteNodes, nodes, userId, searchQuery, selectedCategory]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center gap-2 mb-4">
          <Share2 className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">Live Node Sharing</h3>
          <div className="ml-auto flex items-center gap-1 text-xs text-green-600">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            Live
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search community nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as NodeCategory | 'all')}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="geometry">Geometry</option>
            <option value="math">Math</option>
            <option value="modifiers">Modifiers</option>
            <option value="animation">Animation</option>
            <option value="utilities">Utilities</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex">
          {[
            { id: 'trending', label: 'Trending', icon: TrendingUp },
            { id: 'recent', label: 'Recent', icon: Clock },
            { id: 'favorites', label: 'Favorites', icon: Heart },
            { id: 'mine', label: 'My Nodes', icon: User }
          ].map(tab => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Node List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredNodes.map(node => (
          <NodeShareCard
            key={node.id || node.type}
            node={node}
            isFavorited={favoriteNodes.includes(node.id!)}
            onLike={() => handleLikeNode(node.id!)}
            onFavorite={() => handleFavoriteNode(node.id!)}
            onUse={() => handleUseNode(node)}
            showStats={activeTab === 'trending'}
          />
        ))}
        
        {filteredNodes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Share2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No nodes found</p>
            <p className="text-xs mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Individual Node Share Card
interface NodeShareCardProps {
  node: SerializableNodeDefinition | (SerializableNodeDefinition & { 
    downloads: number; 
    likes: number; 
    views: number; 
    trend: 'up' | 'down' | 'stable';
    isNew: boolean;
  });
  isFavorited: boolean;
  onLike: () => void;
  onFavorite: () => void;
  onUse: () => void;
  showStats: boolean;
}

function NodeShareCard({ node, isFavorited, onLike, onFavorite, onUse, showStats }: NodeShareCardProps) {
  const trendingNode = node as any;
  const hasStats = 'downloads' in node;
  
  return (
    <div className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm truncate">{node.name}</h4>
            {hasStats && trendingNode.isNew && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">New</span>
            )}
          </div>
          <p className="text-xs text-gray-600 line-clamp-2">{node.description}</p>
        </div>
        
        <div 
          className="w-8 h-8 rounded flex items-center justify-center text-white ml-2 flex-shrink-0"
          style={{ backgroundColor: node.color.primary }}
        >
          <div className="w-3 h-3 bg-white bg-opacity-30 rounded"></div>
        </div>
      </div>

      {/* Tags */}
      {node.tags && node.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {node.tags.slice(0, 3).map(tag => (
            <span 
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
            >
              <Tag className="w-2 h-2" />
              {tag}
            </span>
          ))}
          {node.tags.length > 3 && (
            <span className="text-xs text-gray-400">+{node.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Stats */}
      {showStats && hasStats && (
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
          <span className="flex items-center gap-1">
            <Download className="w-3 h-3" />
            {trendingNode.downloads.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3" />
            {trendingNode.likes}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {trendingNode.views.toLocaleString()}
          </span>
          {trendingNode.trend === 'up' && (
            <TrendingUp className="w-3 h-3 text-green-500" />
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <User className="w-3 h-3" />
          {node.author}
          {node.isPublic && <Globe className="w-3 h-3 text-blue-500" />}
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={onFavorite}
            className={`p-1 rounded hover:bg-gray-100 ${
              isFavorited ? 'text-red-500' : 'text-gray-400'
            }`}
            title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className="w-3 h-3" fill={isFavorited ? 'currentColor' : 'none'} />
          </button>
          
          {hasStats && (
            <button
              onClick={onLike}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500"
              title="Like this node"
            >
              <Heart className="w-3 h-3" />
            </button>
          )}
          
          <button
            onClick={onUse}
            className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
          >
            Use
          </button>
        </div>
      </div>
    </div>
  );
} 