'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Download, 
  Upload, 
  Edit, 
  Trash2, 
  Copy, 
  Save, 
  X, 
  AlertCircle, 
  CheckCircle,
  FileText,
  Code
} from 'lucide-react';
import { JsonNodeDefinition, JSON_NODE_TEMPLATE } from '../types/jsonNodes';
import { nodeRegistry } from '../registry/NodeRegistry';
import { nodeStorageManager } from '../utils/nodeStorage';
import { validateJsonNode } from '../utils/jsonNodeLoader';

interface CustomNodeManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomNodeManager({ isOpen, onClose }: CustomNodeManagerProps) {
  const [customNodes, setCustomNodes] = useState<JsonNodeDefinition[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingNode, setEditingNode] = useState<JsonNodeDefinition | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'warning';
    message: string;
  }>>([]);

  // Load custom nodes on mount
  useEffect(() => {
    if (isOpen) {
      loadCustomNodes();
    }
  }, [isOpen]);

  const loadCustomNodes = () => {
    const nodes = nodeRegistry.getCustomNodes();
    setCustomNodes(nodes);
  };

  const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const handleAddNode = () => {
    setEditingNode({ ...JSON_NODE_TEMPLATE });
    setJsonInput(JSON.stringify(JSON_NODE_TEMPLATE, null, 2));
    setIsEditing(true);
    setShowJsonEditor(true);
  };

  const handleEditNode = (node: JsonNodeDefinition) => {
    setEditingNode(node);
    setJsonInput(JSON.stringify(node, null, 2));
    setIsEditing(true);
    setShowJsonEditor(true);
  };

  const handleSaveNode = () => {
    if (!editingNode) return;

    try {
      const parsedNode = JSON.parse(jsonInput);
      const validation = validateJsonNode(parsedNode);
      
      if (!validation.valid) {
        showNotification('error', `Validation failed: ${validation.errors.join(', ')}`);
        return;
      }

      const result = nodeRegistry.registerJsonNode(parsedNode);
      
      if (result.success) {
        showNotification('success', `Node "${parsedNode.name}" saved successfully`);
        loadCustomNodes();
        setIsEditing(false);
        setEditingNode(null);
        setShowJsonEditor(false);
      } else {
        showNotification('error', result.error || 'Failed to save node');
      }
    } catch (error) {
      showNotification('error', `JSON parsing error: ${error}`);
    }
  };

  const handleDeleteNode = (nodeType: string) => {
    if (confirm('Are you sure you want to delete this node?')) {
      const success = nodeRegistry.removeCustomNode(nodeType);
      if (success) {
        showNotification('success', 'Node deleted successfully');
        loadCustomNodes();
      } else {
        showNotification('error', 'Failed to delete node');
      }
    }
  };

  const handleExportAll = async () => {
    try {
      await nodeStorageManager.exportToFile(customNodes);
      showNotification('success', 'Nodes exported successfully');
    } catch (error) {
      showNotification('error', `Export failed: ${error}`);
    }
  };

  const handleImportFile = async () => {
    try {
      const imported = await nodeStorageManager.importFromFile();
      if (imported.length > 0) {
        const result = nodeRegistry.loadJsonNodeCollection({
          version: '1.0.0',
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
          nodes: imported
        });
        
        showNotification('success', `Imported ${result.success} nodes successfully`);
        if (result.failed.length > 0) {
          showNotification('warning', `${result.failed.length} nodes failed to import`);
        }
        loadCustomNodes();
      }
    } catch (error) {
      showNotification('error', `Import failed: ${error}`);
    }
  };

  const handleCopyAsJson = (node: JsonNodeDefinition) => {
    const jsonString = JSON.stringify(node, null, 2);
    navigator.clipboard.writeText(jsonString);
    showNotification('success', 'Node copied to clipboard');
  };

  const handleImportFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const nodes = nodeStorageManager.importFromString(text);
      
      const result = nodeRegistry.loadJsonNodeCollection({
        version: '1.0.0',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        nodes
      });
      
      showNotification('success', `Imported ${result.success} nodes from clipboard`);
      if (result.failed.length > 0) {
        showNotification('warning', `${result.failed.length} nodes failed to import`);
      }
      loadCustomNodes();
    } catch (error) {
      showNotification('error', `Failed to import from clipboard: ${error}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Custom Node Manager</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Node List */}
          <div className="w-1/2 border-r overflow-y-auto">
            <div className="p-4">
              {/* Action Buttons */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={handleAddNode}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Plus size={16} />
                  Add Node
                </button>
                <button
                  onClick={handleExportAll}
                  className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Download size={16} />
                  Export All
                </button>
                <button
                  onClick={handleImportFile}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  <Upload size={16} />
                  Import
                </button>
                <button
                  onClick={handleImportFromClipboard}
                  className="flex items-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <FileText size={16} />
                  From Clipboard
                </button>
              </div>

              {/* Node List */}
              <div className="space-y-2">
                {customNodes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Code size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No custom nodes yet</p>
                    <p className="text-sm">Click "Add Node" to create your first custom node</p>
                  </div>
                ) : (
                  customNodes.map((node) => (
                    <div key={node.type} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{node.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{node.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                              {node.category}
                            </span>
                            <span className="text-xs text-gray-500">
                              {node.inputs.length} inputs, {node.outputs.length} outputs
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1 ml-4">
                          <button
                            onClick={() => handleEditNode(node)}
                            className="p-2 hover:bg-blue-100 rounded transition-colors"
                          >
                            <Edit size={16} className="text-blue-600" />
                          </button>
                          <button
                            onClick={() => handleCopyAsJson(node)}
                            className="p-2 hover:bg-green-100 rounded transition-colors"
                          >
                            <Copy size={16} className="text-green-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteNode(node.type)}
                            className="p-2 hover:bg-red-100 rounded transition-colors"
                          >
                            <Trash2 size={16} className="text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Editor */}
          <div className="w-1/2 flex flex-col">
            {isEditing && showJsonEditor ? (
              <>
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      {editingNode?.type === 'custom-node' ? 'Add New Node' : 'Edit Node'}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveNode}
                        className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        <Save size={16} />
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditingNode(null);
                          setShowJsonEditor(false);
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        <X size={16} />
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex-1 p-4">
                  <textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    className="w-full h-full font-mono text-sm border rounded-lg p-3 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your node definition as JSON..."
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Code size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Select a node to edit or create a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="fixed top-4 right-4 space-y-2 z-50">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
                notification.type === 'success' ? 'bg-green-100 text-green-800' :
                notification.type === 'error' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}
            >
              {notification.type === 'success' ? <CheckCircle size={16} /> :
               notification.type === 'error' ? <AlertCircle size={16} /> :
               <AlertCircle size={16} />}
              <span className="text-sm">{notification.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 