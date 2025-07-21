'use client';

import React, { useState, useRef, useEffect } from 'react';
import { NodeType } from '../types/nodes';
import { nodeRegistry } from '../registry/NodeRegistry';
import { CATEGORY_METADATA } from '../types/nodeSystem';
import { Search, Settings, RefreshCw } from 'lucide-react';

interface ContextMenuProps {
  position: { x: number; y: number } | null;
  onClose: () => void;
  onAddNode: (type: string, position: { x: number; y: number }, primitiveType?: string) => void;
  onOpenCustomNodeManager?: () => void;
  onRefreshNodes?: () => void;
}

interface NodeMenuItem {
  type: string;
  label: string;
  description: string;
  category: string;
  color: string;
  icon?: string | React.ComponentType<any>;
}



export default function ContextMenu({ position, onClose, onAddNode, onOpenCustomNodeManager, onRefreshNodes }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Force refresh when context menu opens to get latest nodes
  useEffect(() => {
    if (position) {
      setRefreshKey(prev => prev + 1);
    }
  }, [position]);

  // Subscribe to registry updates to automatically refresh menu
  useEffect(() => {
    const updateCallback = () => {
      setRefreshKey(prev => prev + 1);
    };
    
    const unsubscribe = nodeRegistry.onUpdate(updateCallback);
    
    return unsubscribe;
  }, []);

  // Generate menu items from registry - refreshes when refreshKey changes
  const nodeMenuItems: NodeMenuItem[] = React.useMemo(() => {
    return nodeRegistry.getAllDefinitions().map(definition => {
      const categoryMeta = CATEGORY_METADATA[definition.category];
      return {
        type: definition.type,
        label: definition.name,
        description: definition.description,
        category: categoryMeta?.description || definition.category,
        color: `bg-${categoryMeta?.color || 'gray'}-600`,
        icon: definition.ui?.icon || categoryMeta?.icon
      };
    });
  }, [refreshKey]); // Depend on refreshKey to update when context menu opens

  // Filter items based on search query
  const filteredItems = React.useMemo(() => {
    if (!searchQuery.trim()) return nodeMenuItems;
    
    const query = searchQuery.toLowerCase();
    return nodeMenuItems.filter(item => 
      item.label.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  }, [nodeMenuItems, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (position) {
      // Add multiple event listeners to ensure reliable closing
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [position, onClose]);

  if (!position) return null;

  const handleAddNode = (item: NodeMenuItem) => {
    onAddNode(item.type, position);
    onClose();
  };

  // Group filtered items by category
  const categories = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, NodeMenuItem[]>);

  return (
    <>
      {/* Backdrop overlay to capture clicks */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />
      
      {/* Context menu */}
      <div
        ref={menuRef}
        className="fixed z-50 bg-gray-700/90 backdrop-blur-sm border border-gray-600/50 rounded-lg shadow-xl min-w-[280px] max-h-[500px] flex flex-col"
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 text-xs font-semibold text-gray-200 border-b border-gray-600/50 bg-gray-800/50 rounded-t-lg flex items-center justify-between">
          <span>Add Node</span>
          <div className="flex items-center gap-1">
            {onRefreshNodes && (
              <button
                onClick={() => {
                  onRefreshNodes();
                  onClose();
                }}
                className="p-1 hover:bg-gray-600/50 rounded transition-colors"
                title="Refresh Nodes from Server"
              >
                <RefreshCw size={14} className="text-blue-400" />
              </button>
            )}
            {onOpenCustomNodeManager && (
              <button
                onClick={() => {
                  onOpenCustomNodeManager();
                  onClose();
                }}
                className="p-1 hover:bg-gray-600/50 rounded transition-colors"
                title="Manage Custom Nodes"
              >
                <Settings size={14} className="text-gray-400" />
              </button>
            )}
          </div>
        </div>
        
        {/* Search bar */}
        <div className="px-4 py-3 border-b border-gray-600/50 bg-gray-800/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-md text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors duration-150"
              autoFocus
            />
          </div>
        </div>
        
        {/* Scrollable content with custom scrollbar */}
        <div 
          className="overflow-y-auto flex-1 custom-scrollbar"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(75, 85, 99, 0.6) transparent'
          }}
        >
          {Object.entries(categories).map(([category, items]) => (
            <div key={category}>
              <div className="px-4 py-2 text-xs font-medium text-gray-200 bg-gray-800/90 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-600/30">
                {category}
              </div>
              {items.map((item, index) => (
                <button
                  key={`${item.type}-${index}`}
                  onClick={() => handleAddNode(item)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-600/70 hover:bg-opacity-70 flex items-center space-x-3 group transition-colors duration-150"
                >
                  <div className={`w-4 h-4 rounded ${item.color}`}></div>
                  <span className="text-xs text-white font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
} 