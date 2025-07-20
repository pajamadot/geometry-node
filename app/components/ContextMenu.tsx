'use client';

import React, { useState, useRef, useEffect } from 'react';
import { NodeType } from '../types/nodes';

interface ContextMenuProps {
  position: { x: number; y: number } | null;
  onClose: () => void;
  onAddNode: (type: NodeType, position: { x: number; y: number }, primitiveType?: string) => void;
}

interface NodeMenuItem {
  type: NodeType;
  label: string;
  description: string;
  category: string;
  color: string;
}

const nodeMenuItems: NodeMenuItem[] = [
  {
    type: 'primitive',
    label: 'Cube',
    description: 'Basic cube geometry',
    category: 'Primitives',
    color: 'bg-blue-600'
  },
  {
    type: 'primitive', 
    label: 'Sphere',
    description: 'Basic sphere geometry',
    category: 'Primitives',
    color: 'bg-blue-600'
  },
  {
    type: 'primitive',
    label: 'Cylinder', 
    description: 'Basic cylinder geometry',
    category: 'Primitives',
    color: 'bg-blue-600'
  },
  {
    type: 'parametric',
    label: 'Parametric Surface',
    description: 'Mathematical surface from equations',
    category: 'Generators',
    color: 'bg-purple-600'
  },
  {
    type: 'time',
    label: 'Time',
    description: 'Time-based animation values',
    category: 'Animation',
    color: 'bg-pink-600'
  },
  {
    type: 'transform',
    label: 'Transform',
    description: 'Apply position, rotation, scale',
    category: 'Transforms',
    color: 'bg-green-600'
  },
  {
    type: 'join',
    label: 'Join',
    description: 'Combine multiple geometries',
    category: 'Operations',
    color: 'bg-orange-600'
  },
  {
    type: 'output',
    label: 'Output',
    description: 'Final geometry output',
    category: 'Output',
    color: 'bg-purple-600'
  },
  // Blender-inspired Geometry Nodes
  {
    type: 'distribute-points',
    label: 'Distribute Points',
    description: 'Generate points on geometry surface',
    category: 'Point',
    color: 'bg-cyan-600'
  },
  {
    type: 'instance-on-points',
    label: 'Instance on Points',
    description: 'Place geometry instances at points',
    category: 'Instances',
    color: 'bg-emerald-600'
  },
  {
    type: 'subdivide-mesh',
    label: 'Subdivide Mesh',
    description: 'Add geometry detail by subdivision',
    category: 'Mesh',
    color: 'bg-violet-600'
  },
  // Raw Vertex/Face Construction
  {
    type: 'create-vertices',
    label: 'Create Vertices',
    description: 'Define raw vertex positions',
    category: 'Vertex/Face',
    color: 'bg-red-600'
  },
  {
    type: 'create-faces',
    label: 'Create Faces',
    description: 'Define face topology from vertices',
    category: 'Vertex/Face',
    color: 'bg-indigo-600'
  },
  {
    type: 'merge-geometry',
    label: 'Merge Geometry',
    description: 'Combine vertices and faces into geometry',
    category: 'Vertex/Face',
    color: 'bg-amber-600'
  },
  
  // Math Operations
  {
    type: 'math',
    label: 'Math',
    description: 'Mathematical operations on numbers',
    category: 'Math',
    color: 'bg-green-600'
  },
  {
    type: 'vector-math',
    label: 'Vector Math',
    description: 'Mathematical operations on vectors',
    category: 'Math',
    color: 'bg-blue-600'
  }
];

export default function ContextMenu({ position, onClose, onAddNode }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

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
    if (item.type === 'primitive') {
      const primitiveType = item.label.toLowerCase();
      onAddNode(item.type, position, primitiveType);
    } else {
      onAddNode(item.type, position);
    }
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