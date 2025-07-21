import React, { useState, useMemo } from 'react';
import { Search, Filter, Download, Upload, Plus, Trash2, Edit, Star, Clock, User, Tag } from 'lucide-react';
import { SerializableNodeDefinition, NodeCategory } from '../types/nodeSystem';
import { useNodeDatabase } from '../hooks/useNodeDatabase';
import { getIconComponent } from '../registry/IconRegistry';

interface NodeLibraryProps {
  onAddNode?: (nodeType: string) => void;
  userId?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function NodeLibrary({ onAddNode, userId, isOpen = true, onClose }: NodeLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<NodeCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<'public' | 'user' | 'all'>('public');
  const [editingNode, setEditingNode] = useState<SerializableNodeDefinition | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  
  const { 
    nodes, 
    loading, 
    error, 
    loadNodes, 
    saveNode, 
    deleteNode, 
    exportNodes, 
    importNodes,
    searchNodes,
    clearError 
  } = useNodeDatabase(userId);

  // Filter nodes based on search and category
  const filteredNodes = useMemo(() => {
    let filtered = nodes;

    // Filter by view mode
    if (viewMode === 'user' && userId) {
      filtered = filtered.filter(node => node.author === userId);
    } else if (viewMode === 'public') {
      filtered = filtered.filter(node => node.isPublic !== false);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(node => node.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(node =>
        node.name.toLowerCase().includes(query) ||
        node.description.toLowerCase().includes(query) ||
        node.type.toLowerCase().includes(query) ||
        (node.tags && node.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    return filtered;
  }, [nodes, viewMode, selectedCategory, searchQuery, userId]);

  const categories: NodeCategory[] = [
    'geometry', 'math', 'vector', 'utilities', 'input', 
    'output', 'modifiers', 'instances', 'animation'
  ];

  const handleAddNode = (nodeType: string) => {
    if (onAddNode) {
      onAddNode(nodeType);
    }
  };

  const handleEditNode = (node: SerializableNodeDefinition) => {
    setEditingNode(node);
  };

  const handleSaveNode = async (node: SerializableNodeDefinition) => {
    const result = await saveNode(node);
    if (result) {
      setEditingNode(null);
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (confirm('Are you sure you want to delete this node?')) {
      await deleteNode(nodeId);
    }
  };

  const handleExportNodes = async () => {
    await exportNodes();
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = await importNodes(text);
      if (result) {
        alert(`Successfully imported ${result.importedCount} nodes${result.errorCount > 0 ? ` with ${result.errorCount} errors` : ''}`);
        if (result.errors) {
          console.warn('Import errors:', result.errors);
        }
      }
    } catch (error) {
      alert('Failed to import nodes: ' + error);
    }

    // Reset file input
    event.target.value = '';
    setShowImportDialog(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Node Library</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search nodes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as NodeCategory | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>

            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'public' | 'user' | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="public">Public Nodes</option>
              {userId && <option value="user">My Nodes</option>}
              <option value="all">All Nodes</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            {userId && (
              <>
                <button
                  onClick={handleExportNodes}
                  className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button
                  onClick={() => setShowImportDialog(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  <Upload className="w-4 h-4" />
                  Import
                </button>
                <button
                  onClick={() => setEditingNode({
                    type: 'custom-node',
                    name: 'New Node',
                    description: 'Custom node description',
                    category: 'utilities',
                    version: '1.0.0',
                    color: { primary: '#3b82f6', secondary: '#1d4ed8' },
                    inputs: [],
                    outputs: [],
                    parameters: [],
                    execution: { type: 'builtin', functionName: 'cube' },
                    tags: ['custom'],
                    author: userId,
                    isPublic: false
                  })}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
                >
                  <Plus className="w-4 h-4" />
                  Create Node
                </button>
              </>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 p-3 m-4 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-red-700">{error}</span>
              <button onClick={clearError} className="text-red-500 hover:text-red-700">✕</button>
            </div>
          </div>
        )}

        {/* Node Grid */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredNodes.map((node) => (
                <NodeCard
                  key={node.id || node.type}
                  node={node}
                  onAdd={() => handleAddNode(node.type)}
                  onEdit={() => handleEditNode(node)}
                  onDelete={() => node.id && handleDeleteNode(node.id)}
                  canEdit={userId === node.author}
                />
              ))}
            </div>
          )}

          {!loading && filteredNodes.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No nodes found matching your criteria.
            </div>
          )}
        </div>

        {/* Import Dialog */}
        {showImportDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Import Nodes</h3>
              <p className="text-gray-600 mb-4">
                Select a JSON file containing exported node definitions.
              </p>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="mb-4 w-full"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowImportDialog(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Node Dialog */}
        {editingNode && (
          <NodeEditor
            node={editingNode}
            onSave={handleSaveNode}
            onCancel={() => setEditingNode(null)}
          />
        )}
      </div>
    </div>
  );
}

// Individual Node Card Component
interface NodeCardProps {
  node: SerializableNodeDefinition;
  onAdd: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canEdit: boolean;
}

function NodeCard({ node, onAdd, onEdit, onDelete, canEdit }: NodeCardProps) {
  const IconComponent = node.ui?.icon ? getIconComponent(node.ui.icon) : null;

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {IconComponent && (
            <div 
              className="w-8 h-8 rounded flex items-center justify-center text-white"
              style={{ backgroundColor: node.color.primary }}
            >
              <IconComponent className="w-4 h-4" />
            </div>
          )}
          <div>
            <h3 className="font-medium text-sm">{node.name}</h3>
            <p className="text-xs text-gray-500">{node.type}</p>
          </div>
        </div>
        
        {canEdit && (
          <div className="flex gap-1">
            <button
              onClick={onEdit}
              className="p-1 text-gray-400 hover:text-blue-500"
              title="Edit"
            >
              <Edit className="w-3 h-3" />
            </button>
            <button
              onClick={onDelete}
              className="p-1 text-gray-400 hover:text-red-500"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-gray-600 mb-3 line-clamp-2">{node.description}</p>

      {/* Tags */}
      {node.tags && node.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {node.tags.slice(0, 3).map(tag => (
            <span 
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
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

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <User className="w-3 h-3" />
          {node.author || 'Unknown'}
          {node.isPublic && <Star className="w-3 h-3 text-yellow-500" />}
        </div>
        
        <button
          onClick={onAdd}
          className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
        >
          Add
        </button>
      </div>
    </div>
  );
}

// Simple Node Editor Component
interface NodeEditorProps {
  node: SerializableNodeDefinition;
  onSave: (node: SerializableNodeDefinition) => void;
  onCancel: () => void;
}

function NodeEditor({ node, onSave, onCancel }: NodeEditorProps) {
  const [editedNode, setEditedNode] = useState(node);

  const handleSave = () => {
    onSave({
      ...editedNode,
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-auto">
        <h3 className="text-lg font-semibold mb-4">
          {node.id ? 'Edit Node' : 'Create Node'}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={editedNode.name}
              onChange={(e) => setEditedNode({ ...editedNode, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={editedNode.description}
              onChange={(e) => setEditedNode({ ...editedNode, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <input
                type="text"
                value={editedNode.type}
                onChange={(e) => setEditedNode({ ...editedNode, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={editedNode.category}
                onChange={(e) => setEditedNode({ ...editedNode, category: e.target.value as NodeCategory })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="geometry">Geometry</option>
                <option value="math">Math</option>
                <option value="vector">Vector</option>
                <option value="utilities">Utilities</option>
                <option value="input">Input</option>
                <option value="output">Output</option>
                <option value="modifiers">Modifiers</option>
                <option value="instances">Instances</option>
                <option value="animation">Animation</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editedNode.isPublic !== false}
                onChange={(e) => setEditedNode({ ...editedNode, isPublic: e.target.checked })}
              />
              <span className="text-sm">Make public</span>
            </label>
          </div>
        </div>
        
        <div className="flex gap-2 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
} 