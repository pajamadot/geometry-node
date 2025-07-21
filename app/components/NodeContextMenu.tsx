'use client';

import React, { useState } from 'react';
import { nodeRegistry } from '../registry/NodeRegistry';
import { Zap, Database, Search, Sparkles, Box, Calculator, Clock, GitBranch } from 'lucide-react';

interface NodeContextMenuProps {
  onAddNode: (type: string) => void;
  onClose: () => void;
  onCreateCustomNode?: () => void;
  onOpenLibrary?: () => void;
}

export default function NodeContextMenu({ 
  onAddNode, 
  onClose, 
  onCreateCustomNode, 
  onOpenLibrary 
}: NodeContextMenuProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Get available nodes by category
  const nodesByCategory = nodeRegistry.getNodesByCategories();
  
  // Quick access nodes (most commonly used)
  const quickNodes = [
    { type: 'cube', name: 'Cube', icon: Box, color: '#ea580c' },
    { type: 'sphere', name: 'Sphere', icon: Box, color: '#ea580c' },
    { type: 'math', name: 'Math', icon: Calculator, color: '#16a34a' },
    { type: 'time', name: 'Time', icon: Clock, color: '#ec4899' },
    { type: 'make-vector', name: 'Vector', icon: GitBranch, color: '#3b82f6' },
    { type: 'transform', name: 'Transform', icon: Box, color: '#2563eb' }
  ];

  // Filter nodes based on search
  const filteredNodes = React.useMemo(() => {
    if (!searchQuery && selectedCategory === 'all') {
      return nodesByCategory;
    }

         const filtered: Partial<typeof nodesByCategory> = {};
    
    Object.entries(nodesByCategory).forEach(([category, nodes]) => {
      if (selectedCategory !== 'all' && category !== selectedCategory) return;
      
      const matchingNodes = nodes.filter(node =>
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      if (matchingNodes.length > 0) {
        filtered[category as keyof typeof nodesByCategory] = matchingNodes;
      }
    });
    
    return filtered;
  }, [nodesByCategory, searchQuery, selectedCategory]);

  const handleAddNode = (type: string) => {
    onAddNode(type);
    onClose();
  };

  return (
    <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-80 max-h-96 overflow-hidden">
      {/* Header */}
      <div className="border-b p-3">
        <div className="flex items-center gap-2 mb-3">
          <span className="font-medium text-gray-700">Add Node</span>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border-b p-3">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onCreateCustomNode}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md transition-colors"
          >
            <Zap className="w-4 h-4" />
            Create Custom
          </button>
          <button
            onClick={onOpenLibrary}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors"
          >
            <Database className="w-4 h-4" />
            Node Library
          </button>
        </div>
      </div>

      {/* Quick Nodes */}
      {!searchQuery && selectedCategory === 'all' && (
        <div className="border-b p-3">
          <div className="text-xs font-medium text-gray-500 mb-2">QUICK ACCESS</div>
          <div className="grid grid-cols-2 gap-1">
            {quickNodes.map(node => {
              const IconComponent = node.icon;
              return (
                <button
                  key={node.type}
                  onClick={() => handleAddNode(node.type)}
                  className="flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-gray-50 rounded transition-colors"
                >
                  <div 
                    className="w-4 h-4 rounded flex items-center justify-center"
                    style={{ backgroundColor: node.color }}
                  >
                    <IconComponent className="w-2.5 h-2.5 text-white" />
                  </div>
                  {node.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="border-b p-3">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
        >
          <option value="all">All Categories</option>
          {Object.keys(nodesByCategory).map(category => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Node List */}
      <div className="max-h-48 overflow-y-auto">
        {Object.entries(filteredNodes).map(([category, nodes]) => (
          <div key={category} className="p-2">
            <div className="text-xs font-medium text-gray-500 mb-1 px-1 uppercase">
              {category}
            </div>
            <div className="space-y-0.5">
              {nodes.slice(0, 8).map(node => (
                <button
                  key={node.type}
                  onClick={() => handleAddNode(node.type)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-gray-50 rounded transition-colors text-left"
                >
                  <div 
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: node.color.primary }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{node.name}</div>
                    {node.description && (
                      <div className="text-xs text-gray-500 truncate">{node.description}</div>
                    )}
                  </div>
                </button>
              ))}
              {nodes.length > 8 && (
                <button
                  onClick={onOpenLibrary}
                  className="w-full px-2 py-1 text-xs text-blue-600 hover:text-blue-800 text-center"
                >
                  +{nodes.length - 8} more in library...
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {Object.keys(filteredNodes).length === 0 && (
        <div className="p-6 text-center text-gray-500">
          <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <div className="text-sm">No nodes found</div>
          <div className="text-xs mt-1">Try a different search term</div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t p-2 text-xs text-gray-500 text-center">
        Right-click anywhere to add nodes • ESC to close
      </div>
    </div>
  );
} 