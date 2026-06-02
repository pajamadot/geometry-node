'use client';

import React, { useRef, useEffect } from 'react';
import { GeometryNodeData, NodeType } from '../types/nodes';

interface NodeContextMenuProps {
  position: { x: number; y: number } | null;
  onClose: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onCopy: () => void;
  onDisable: () => void;
  nodeData: GeometryNodeData | null;
  isDisabled?: boolean;
}

interface NodeMenuItem {
  label: string;
  description: string;
  icon: string;
  action: () => void;
  color: string;
  disabled?: boolean;
  separator?: boolean;
}

export default function NodeContextMenu({ 
  position, 
  onClose, 
  onDelete, 
  onDuplicate, 
  onCopy, 
  onDisable,
  nodeData,
  isDisabled = false
}: NodeContextMenuProps) {
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

  if (!position || !nodeData) return null;

  const menuItems: NodeMenuItem[] = [
    {
      label: 'Duplicate',
      description: 'Create a copy of this node',
      icon: '⧉',
      action: onDuplicate,
      color: 'hover:bg-blue-600',
    },
    {
      label: 'Copy',
      description: 'Copy node to clipboard',
      icon: '📋',
      action: onCopy,
      color: 'hover:bg-green-600',
    },
    {
      label: isDisabled ? 'Enable' : 'Disable',
      description: isDisabled ? 'Enable this node' : 'Disable this node temporarily',
      icon: isDisabled ? '👁️' : '🚫',
      action: onDisable,
      color: isDisabled ? 'hover:bg-green-600' : 'hover:bg-yellow-600',
    },
    {
      label: '',
      description: '',
      icon: '',
      action: () => {},
      color: '',
      separator: true,
    },
    {
      label: 'Delete',
      description: 'Remove this node permanently',
      icon: '🗑️',
      action: onDelete,
      color: 'hover:bg-red-600',
    },
  ];

  const getNodeTypeColor = (type: NodeType) => {
    switch (type) {
      case 'primitive': return 'text-orange-400';
      case 'transform': return 'text-blue-400';
      case 'parametric': return 'text-purple-400';
      case 'time': return 'text-pink-400';
      case 'join': return 'text-orange-400';
      case 'output': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />
      
      {/* Context Menu */}
      <div
        ref={menuRef}
        className="fixed z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl backdrop-blur-sm min-w-[200px]"
        style={{
          left: position.x,
          top: position.y,
          transform: 'translate(-10px, -10px)' // Slight offset from cursor
        }}
      >
        {/* Node Info Header */}
        <div className="px-3 py-2 border-b border-gray-700 bg-gray-800/50">
          <div className="flex items-center space-x-2">
            <div className={`text-sm font-semibold ${getNodeTypeColor(nodeData.type)}`}>
              {nodeData.label || nodeData.type}
            </div>
            {isDisabled && (
              <div className="px-1 py-0.5 bg-yellow-600/20 text-yellow-400 text-xs rounded">
                DISABLED
              </div>
            )}
          </div>
          <div className="text-xs text-gray-500 capitalize">
            {nodeData.type} node
          </div>
        </div>

        {/* Menu Items */}
        <div className="py-1">
          {menuItems.map((item, index) => {
            if (item.separator) {
              return (
                <div key={index} className="h-px bg-gray-700 my-1 mx-2" />
              );
            }

            return (
              <button
                key={index}
                onClick={() => {
                  item.action();
                  onClose();
                }}
                disabled={item.disabled}
                className={`
                  w-full px-3 py-2 text-left flex items-center space-x-3
                  text-gray-300 transition-colors
                  ${item.disabled ? 'opacity-50 cursor-not-allowed' : `${item.color} hover:text-white`}
                `}
              >
                <span className="w-4 text-center">{item.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Keyboard Shortcuts Footer */}
        <div className="px-3 py-2 border-t border-gray-700 bg-gray-800/30">
          <div className="text-xs text-gray-500 space-y-1">
            <div><kbd className="bg-gray-700 px-1 rounded">Del</kbd> Delete</div>
            <div><kbd className="bg-gray-700 px-1 rounded">Ctrl+D</kbd> Duplicate</div>
            <div><kbd className="bg-gray-700 px-1 rounded">Ctrl+C</kbd> Copy</div>
          </div>
        </div>
      </div>
    </>
  );
} 