import React, { useState, useEffect } from 'react';
import { 
  Store, Search, Filter, TrendingUp, Download, Heart, 
  Star, User, Clock, Tag, Award, Verified 
} from 'lucide-react';
import { SerializableNodeDefinition, NodeCategory } from '../types/nodeSystem';
import { useNodeDatabase } from '../hooks/useNodeDatabase';
import { serializableNodeRegistry } from '../registry/SerializableNodeRegistry';
import { getIconComponent } from '../registry/IconRegistry';

interface NodeMarketplaceProps {
  isOpen: boolean;
  onClose: () => void;
  onNodeSelected: (nodeType: string) => void;
  userId?: string;
}

interface MarketplaceNode extends SerializableNodeDefinition {
  downloads: number;
  likes: number;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isFeatured: boolean;
  price?: number; // For premium nodes
}

export default function NodeMarketplace({ isOpen, onClose, onNodeSelected, userId }: NodeMarketplaceProps) {
  const [activeTab, setActiveTab] = useState<'featured' | 'trending' | 'new' | 'premium'>('featured');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<NodeCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'rating'>('popular');
  const [marketplaceNodes, setMarketplaceNodes] = useState<MarketplaceNode[]>([]);
  const [favoriteNodes, setFavoriteNodes] = useState<string[]>([]);

  // Mock marketplace data
  useEffect(() => {
    const mockNodes: MarketplaceNode[] = [
      {
        id: 'featured-1',
        type: 'ai-terrain-generator',
        name: 'AI Terrain Generator',
        description: 'Generate realistic terrains using AI-powered heightmaps with erosion simulation',
        category: 'geometry',
        version: '3.2.1',
        color: { primary: '#059669', secondary: '#047857' },
        inputs: [
          { id: 'seed', name: 'Seed', type: 'integer', defaultValue: 42 },
          { id: 'size', name: 'Size', type: 'number', defaultValue: 100 },
          { id: 'detail', name: 'Detail', type: 'number', defaultValue: 5 }
        ],
        outputs: [
          { id: 'geometry', name: 'Terrain', type: 'geometry' }
        ],
        parameters: [],
        execution: { type: 'builtin', functionName: 'ai_terrain' },
        ui: { icon: 'mountain' },
        tags: ['ai', 'terrain', 'procedural', 'landscape', 'heightmap'],
        author: 'TerrainMaster',
        isPublic: true,
        createdAt: '2024-01-10T00:00:00Z',
        updatedAt: '2024-01-22T00:00:00Z',
        downloads: 15420,
        likes: 3240,
        rating: 4.9,
        reviewCount: 847,
        isVerified: true,
        isFeatured: true
      },
      {
        id: 'trending-1',
        type: 'neural-mesh-optimizer',
        name: 'Neural Mesh Optimizer',
        description: 'Optimize mesh topology using neural networks for perfect edge flow',
        category: 'modifiers',
        version: '1.5.0',
        color: { primary: '#7c3aed', secondary: '#6d28d9' },
        inputs: [
          { id: 'mesh', name: 'Input Mesh', type: 'geometry' },
          { id: 'target_faces', name: 'Target Faces', type: 'integer', defaultValue: 1000 }
        ],
        outputs: [
          { id: 'optimized', name: 'Optimized Mesh', type: 'geometry' }
        ],
        parameters: [],
        execution: { type: 'builtin', functionName: 'neural_optimize' },
        ui: { icon: 'sparkles' },
        tags: ['ai', 'optimization', 'mesh', 'topology', 'premium'],
        author: 'NeuralLabs',
        isPublic: true,
        createdAt: '2024-01-20T00:00:00Z',
        updatedAt: '2024-01-22T00:00:00Z',
        downloads: 892,
        likes: 234,
        rating: 4.7,
        reviewCount: 67,
        isVerified: true,
        isFeatured: false,
        price: 29.99
      },
      {
        id: 'new-1',
        type: 'parametric-building',
        name: 'Parametric Building Generator',
        description: 'Create architectural buildings with customizable parameters',
        category: 'geometry',
        version: '1.0.0',
        color: { primary: '#f59e0b', secondary: '#d97706' },
        inputs: [
          { id: 'floors', name: 'Floors', type: 'integer', defaultValue: 5 },
          { id: 'width', name: 'Width', type: 'number', defaultValue: 20 },
          { id: 'depth', name: 'Depth', type: 'number', defaultValue: 15 }
        ],
        outputs: [
          { id: 'building', name: 'Building', type: 'geometry' }
        ],
        parameters: [],
        execution: { type: 'composite', steps: [] },
        ui: { icon: 'building' },
        tags: ['architecture', 'building', 'parametric', 'new'],
        author: 'ArchViz_Pro',
        isPublic: true,
        createdAt: '2024-01-23T00:00:00Z',
        updatedAt: '2024-01-23T00:00:00Z',
        downloads: 156,
        likes: 45,
        rating: 4.6,
        reviewCount: 12,
        isVerified: false,
        isFeatured: false
      }
    ];
    
    setMarketplaceNodes(mockNodes);
  }, []);

  const filteredNodes = React.useMemo(() => {
    let filtered = marketplaceNodes;

    // Filter by tab
    switch (activeTab) {
      case 'featured':
        filtered = filtered.filter(node => node.isFeatured);
        break;
      case 'trending':
        filtered = filtered.sort((a, b) => b.downloads - a.downloads);
        break;
      case 'new':
        filtered = filtered.sort((a, b) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        break;
      case 'premium':
        filtered = filtered.filter(node => node.price && node.price > 0);
        break;
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(node =>
        node.name.toLowerCase().includes(query) ||
        node.description.toLowerCase().includes(query) ||
        (node.tags && node.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(node => node.category === selectedCategory);
    }

    // Apply sorting
    switch (sortBy) {
      case 'popular':
        filtered = filtered.sort((a, b) => b.downloads - a.downloads);
        break;
      case 'recent':
        filtered = filtered.sort((a, b) => 
          new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
        );
        break;
      case 'rating':
        filtered = filtered.sort((a, b) => b.rating - a.rating);
        break;
    }

    return filtered;
  }, [marketplaceNodes, activeTab, searchQuery, selectedCategory, sortBy]);

  const handleInstallNode = async (node: MarketplaceNode) => {
    try {
      // In a real app, this would handle payment for premium nodes
      if (node.price && node.price > 0) {
        const confirmed = window.confirm(`This is a premium node ($${node.price}). Continue with purchase?`);
        if (!confirmed) return;
      }

      // Register node locally
      await serializableNodeRegistry.registerSerializable(node);
      
      // Add to current graph
      onNodeSelected(node.type);
      
      // Update download count
      setMarketplaceNodes(prev => prev.map(n => 
        n.id === node.id ? { ...n, downloads: n.downloads + 1 } : n
      ));
      
      alert(`${node.name} installed successfully!`);
      onClose();
    } catch (error) {
      console.error('Failed to install node:', error);
      alert('Failed to install node: ' + error);
    }
  };

  const handleLikeNode = (nodeId: string) => {
    setMarketplaceNodes(prev => prev.map(node =>
      node.id === nodeId ? { ...node, likes: node.likes + 1 } : node
    ));
  };

  const handleFavoriteNode = (nodeId: string) => {
    setFavoriteNodes(prev =>
      prev.includes(nodeId)
        ? prev.filter(id => id !== nodeId)
        : [...prev, nodeId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Store className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold">Node Marketplace</h2>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                {marketplaceNodes.length} nodes available
              </span>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search marketplace..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as NodeCategory | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="geometry">Geometry</option>
              <option value="modifiers">Modifiers</option>
              <option value="math">Math</option>
              <option value="utilities">Utilities</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'popular' | 'recent' | 'rating')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="popular">Most Popular</option>
              <option value="recent">Recently Updated</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex">
            {[
              { id: 'featured', label: 'Featured', icon: Award },
              { id: 'trending', label: 'Trending', icon: TrendingUp },
              { id: 'new', label: 'New', icon: Clock },
              { id: 'premium', label: 'Premium', icon: Star }
            ].map(tab => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
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

        {/* Node Grid */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNodes.map(node => (
              <MarketplaceNodeCard
                key={node.id}
                node={node}
                isFavorited={favoriteNodes.includes(node.id!)}
                onInstall={() => handleInstallNode(node)}
                onLike={() => handleLikeNode(node.id!)}
                onFavorite={() => handleFavoriteNode(node.id!)}
              />
            ))}
          </div>
          
          {filteredNodes.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Store className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">No nodes found</h3>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Marketplace Node Card Component
interface MarketplaceNodeCardProps {
  node: MarketplaceNode;
  isFavorited: boolean;
  onInstall: () => void;
  onLike: () => void;
  onFavorite: () => void;
}

function MarketplaceNodeCard({ node, isFavorited, onInstall, onLike, onFavorite }: MarketplaceNodeCardProps) {
  const IconComponent = node.ui?.icon ? getIconComponent(node.ui.icon) : null;
  
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {IconComponent && (
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: node.color.primary }}
            >
              <IconComponent className="w-5 h-5" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate">{node.name}</h3>
              {node.isVerified && (
                <Verified className="w-4 h-4 text-blue-500" />
              )}
              {node.isFeatured && (
                <Award className="w-4 h-4 text-yellow-500" />
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <User className="w-3 h-3" />
              {node.author}
            </div>
          </div>
        </div>
        
        <button
          onClick={onFavorite}
          className={`p-1 rounded hover:bg-gray-100 ${
            isFavorited ? 'text-red-500' : 'text-gray-400'
          }`}
        >
          <Heart className="w-4 h-4" fill={isFavorited ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{node.description}</p>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
        <span className="flex items-center gap-1">
          <Download className="w-3 h-3" />
          {node.downloads.toLocaleString()}
        </span>
        <span className="flex items-center gap-1">
          <Star className="w-3 h-3 text-yellow-500" />
          {node.rating} ({node.reviewCount})
        </span>
        <span className="flex items-center gap-1">
          <Heart className="w-3 h-3" />
          {node.likes}
        </span>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        {node.tags?.slice(0, 3).map(tag => (
          <span 
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
          >
            <Tag className="w-2 h-2" />
            {tag}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="text-sm">
          {node.price && node.price > 0 ? (
            <span className="font-semibold text-green-600">${node.price}</span>
          ) : (
            <span className="text-green-600 font-medium">Free</span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onLike}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500"
          >
            <Heart className="w-3 h-3" />
          </button>
          
          <button
            onClick={onInstall}
            className="px-4 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            {node.price && node.price > 0 ? 'Buy' : 'Install'}
          </button>
        </div>
      </div>
    </div>
  );
} 