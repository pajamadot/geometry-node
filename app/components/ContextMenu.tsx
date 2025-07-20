'use client';

import React, { useState, useRef, useEffect } from 'react';
import { NodeType } from '../types/nodes';
import { nodeRegistry } from '../registry/NodeRegistry';
import { CATEGORY_METADATA } from '../types/nodeSystem';

interface ContextMenuProps {
  position: { x: number; y: number } | null;
  onClose: () => void;
  onAddNode: (type: string, position: { x: number; y: number }, primitiveType?: string) => void;
}

interface NodeMenuItem {
  type: string;
  label: string;
  description: string;
  category: string;
  color: string;
  icon?: string | React.ComponentType<any>;
}



export default function ContextMenu({ position, onClose, onAddNode }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Generate menu items from registry
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
  }, []);

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

  // Group items by category
  const categories = nodeMenuItems.reduce((acc, item) => {
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
        className="fixed z-50 bg-gray-700 border border-gray-600 rounded shadow-lg py-1 min-w-[180px]"
        style={{
          left: position.x,
          top: position.y,
        }}
      >
      <div className="px-3 py-1 text-xs font-medium text-gray-300 border-b border-gray-600 mb-1">
        Add
      </div>
      
      {Object.entries(categories).map(([category, items]) => (
        <div key={category}>
          <div className="px-3 py-1 text-xs font-medium text-gray-500">
            {category}
          </div>
          {items.map((item, index) => (
            <button
              key={`${item.type}-${index}`}
              onClick={() => handleAddNode(item)}
              className="w-full px-3 py-2 text-left hover:bg-gray-600 flex items-center space-x-2 group"
            >
              <div className={`w-3 h-3 rounded ${item.color}`}></div>
              <span className="text-sm text-white">{item.label}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
    </>
  );
} 