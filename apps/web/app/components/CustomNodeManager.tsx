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
import Button from './ui/Button';
import { JsonNodeDefinition, JSON_NODE_TEMPLATE } from '../types/jsonNodes';
import { nodeRegistry } from '../registry/NodeRegistry';
import { nodeStorageManager } from '../utils/nodeStorage';
import { validateJsonNode } from '../utils/jsonNodeLoader';
import { useModal } from './ModalContext';

interface CustomNodeManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomNodeManager({ isOpen, onClose }: CustomNodeManagerProps) {
  const [customNodes, setCustomNodes] = useState<JsonNodeDefinition[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingNode, setEditingNode] = useState<JsonNodeDefinition | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const { showConfirm } = useModal();
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

  const handleDeleteNode = async (nodeType: string) => {
    const confirmed = await showConfirm(
      'Delete Custom Node',
      `Are you sure you want to delete the "${nodeType}" node? This action cannot be undone.`
    );
    
    if (confirmed) {
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600/50 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden backdrop-blur-sm"
           style={{
             boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 12px 24px rgba(0, 0, 0, 0.4), 0 6px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
           }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-cyan-500 px-6 py-4 border-b border-slate-600/30">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white tracking-wide flex items-center gap-2">
              <Code size={20} />
              Custom Node Manager
            </h2>
            <Button
              variant="ghost"
              size="sm"
              icon={X}
              onClick={onClose}
              className="!p-2"
            >
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Node List */}
          <div className="w-1/2 border-r border-slate-600/30 overflow-y-auto bg-slate-900/50">
            <div className="p-4">
              {/* Action Buttons */}
              <div className="flex gap-2 mb-4 flex-wrap">
                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={handleAddNode}
                >
                  Add Node
                </Button>
                
                <Button
                  variant="success"
                  size="sm"
                  icon={Download}
                  onClick={handleExportAll}
                >
                  Export All
                </Button>
                
                <Button
                  variant="info"
                  size="sm"
                  icon={Upload}
                  onClick={handleImportFile}
                >
                  Import
                </Button>
                
                <Button
                  variant="warning"
                  size="sm"
                  icon={FileText}
                  onClick={handleImportFromClipboard}
                >
                  From Clipboard
                </Button>
              </div>
              
              {/* Storage Info */}
              <div className="mb-4 p-3 bg-slate-800/50 border border-slate-600/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-cyan-300">Local Storage</h4>
                  <span className="text-xs text-gray-500">Auto-saved</span>
                </div>
                <p className="text-xs text-gray-400">
                  Custom nodes are automatically saved to your browser's local storage and will persist between sessions.
                </p>
              </div>

              {/* Node List */}
              <div className="space-y-2">
                {customNodes.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Code size={48} className="mx-auto mb-4 opacity-50 text-slate-500" />
                    <p className="text-gray-300">No custom nodes yet</p>
                    <p className="text-sm text-gray-500">Click "Add Node" to create your first custom node</p>
                  </div>
                ) : (
                  customNodes.map((node) => (
                    <div key={node.type} className="border border-slate-600/30 rounded-lg p-4 hover:bg-slate-800/50 bg-slate-800/20 backdrop-blur-sm transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{node.name}</h3>
                          <p className="text-sm text-gray-400 mt-1">{node.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs bg-cyan-600/20 text-cyan-300 px-2 py-1 rounded border border-cyan-600/30">
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
                            className="p-2 hover:bg-blue-600/20 rounded transition-colors"
                            title="Edit Node"
                          >
                            <Edit size={14} className="text-blue-400" />
                          </button>
                          <button
                            onClick={() => handleCopyAsJson(node)}
                            className="p-2 hover:bg-green-600/20 rounded transition-colors"
                            title="Copy as JSON"
                          >
                            <Copy size={14} className="text-green-400" />
                          </button>
                          <button
                            onClick={() => handleDeleteNode(node.type)}
                            className="p-2 hover:bg-red-600/20 rounded transition-colors"
                            title="Delete Node"
                          >
                            <Trash2 size={14} className="text-red-400" />
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
          <div className="w-1/2 flex flex-col bg-slate-900/30">
            {isEditing && showJsonEditor ? (
              <>
                <div className="p-4 border-b border-slate-600/30 bg-slate-800/50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">
                      {editingNode?.type === 'custom-node' ? 'Add New Node' : 'Edit Node'}
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        variant="success"
                        size="sm"
                        icon={Save}
                        onClick={handleSaveNode}
                      >
                        Save
                      </Button>
                      
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={X}
                        onClick={() => {
                          setIsEditing(false);
                          setEditingNode(null);
                          setShowJsonEditor(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex-1 p-4">
                  <textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    className="w-full h-full font-mono text-sm bg-slate-800 border border-slate-600/50 rounded-lg p-3 resize-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white placeholder-gray-500 transition-colors"
                    placeholder="Enter your node definition as JSON..."
                    spellCheck={false}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Code size={48} className="mx-auto mb-4 opacity-50 text-slate-600" />
                  <p className="text-gray-400">Select a node to edit or create a new one</p>
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
              className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm border ${
                notification.type === 'success' ? 'bg-green-900/90 text-green-300 border-green-700' :
                notification.type === 'error' ? 'bg-red-900/90 text-red-300 border-red-700' :
                'bg-yellow-900/90 text-yellow-300 border-yellow-700'
              }`}
            >
              {notification.type === 'success' ? <CheckCircle size={16} /> :
               notification.type === 'error' ? <AlertCircle size={16} /> :
               <AlertCircle size={16} />}
              <span className="text-sm font-medium">{notification.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 