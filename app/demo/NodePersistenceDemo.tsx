import React, { useState, useEffect } from 'react';
import { 
  Database, Server, Code2, Wifi, WifiOff, Download, 
  Upload, Trash2, Edit3, Eye, Save, RefreshCw 
} from 'lucide-react';
import { SerializableNodeDefinition } from '../types/nodeSystem';

export default function NodePersistenceDemo() {
  const [isConnected, setIsConnected] = useState(true);
  const [nodes, setNodes] = useState<SerializableNodeDefinition[]>([]);
  const [selectedNode, setSelectedNode] = useState<SerializableNodeDefinition | null>(null);
  const [jsonView, setJsonView] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Simulate network connection
  const toggleConnection = () => {
    setIsConnected(!isConnected);
    if (!isConnected) {
      // Reconnecting - sync with server
      syncWithServer();
    }
  };

  // Load nodes from API
  const loadNodes = async () => {
    if (!isConnected) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/nodes');
      if (response.ok) {
        const loadedNodes = await response.json();
        setNodes(loadedNodes);
        setLastSync(new Date());
      }
    } catch (error) {
      console.error('Failed to load nodes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save node to API
  const saveNode = async (node: SerializableNodeDefinition) => {
    if (!isConnected) return;

    setLoading(true);
    try {
      const method = node.id ? 'PUT' : 'POST';
      const url = node.id ? `/api/nodes/${node.id}` : '/api/nodes';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(node)
      });

      if (response.ok) {
        const savedNode = await response.json();
        setNodes(prev => {
          const existing = prev.findIndex(n => n.id === savedNode.id);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = savedNode;
            return updated;
          } else {
            return [...prev, savedNode];
          }
        });
        setSelectedNode(savedNode);
        setLastSync(new Date());
        return savedNode;
      }
    } catch (error) {
      console.error('Failed to save node:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete node from API
  const deleteNode = async (nodeId: string) => {
    if (!isConnected) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/nodes/${nodeId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setNodes(prev => prev.filter(n => n.id !== nodeId));
        if (selectedNode?.id === nodeId) {
          setSelectedNode(null);
        }
        setLastSync(new Date());
      }
    } catch (error) {
      console.error('Failed to delete node:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sync with server
  const syncWithServer = () => {
    if (isConnected) {
      loadNodes();
    }
  };

  // Create a new node
  const createNewNode = () => {
    const newNode: SerializableNodeDefinition = {
      type: `custom-node-${Date.now()}`,
      name: 'New Custom Node',
      description: 'A new custom node created via API',
      category: 'utilities',
      version: '1.0.0',
      color: { primary: '#6366f1', secondary: '#4f46e5' },
      inputs: [
        { id: 'input', name: 'Input', type: 'number', defaultValue: 0, description: 'Input value' }
      ],
      outputs: [
        { id: 'output', name: 'Output', type: 'number', description: 'Output value' }
      ],
      parameters: [],
      execution: {
        type: 'expression',
        expressions: { 'output': 'input * 2' }
      },
      ui: { icon: 'settings' },
      tags: ['custom', 'api', 'demo'],
      author: 'demo-user',
      isPublic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setSelectedNode(newNode);
    setJsonView(JSON.stringify(newNode, null, 2));
    setEditMode(true);
  };

  // Select node for viewing/editing
  const selectNode = (node: SerializableNodeDefinition) => {
    setSelectedNode(node);
    setJsonView(JSON.stringify(node, null, 2));
    setEditMode(false);
  };

  // Update node from JSON
  const updateFromJson = () => {
    try {
      const updated = JSON.parse(jsonView);
      setSelectedNode(updated);
      setEditMode(false);
    } catch (error) {
      alert('Invalid JSON: ' + error);
    }
  };

  // Export nodes as JSON
  const exportNodes = () => {
    const dataStr = JSON.stringify(nodes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nodes-export.json';
    link.click();
  };

  // Import nodes from JSON file
  const importNodes = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        const importedNodes = Array.isArray(imported) ? imported : [imported];
        
        // Save imported nodes to database
        for (const node of importedNodes) {
          await saveNode(node);
        }
        
        alert(`Imported ${importedNodes.length} nodes successfully!`);
      } catch (error) {
        alert('Import failed: ' + error);
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    if (isConnected) {
      loadNodes();
    }
  }, [isConnected]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold">Node Persistence Demo</h1>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                {isConnected ? 'Connected' : 'Offline'}
              </div>
              
              {/* Sync Button */}
              <button
                onClick={toggleConnection}
                className={`px-3 py-1 rounded text-sm ${
                  isConnected ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {isConnected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          </div>
          
          {lastSync && (
            <p className="text-sm text-gray-500 mt-2">
              Last synced: {lastSync.toLocaleTimeString()}
            </p>
          )}
        </div>

        <div className="flex h-[600px]">
          {/* Node List */}
          <div className="w-1/3 border-r p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Database Nodes</h3>
              <div className="flex gap-2">
                <button
                  onClick={createNewNode}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  title="Create New Node"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={syncWithServer}
                  disabled={!isConnected || loading}
                  className="p-1 text-gray-600 hover:bg-gray-50 rounded disabled:opacity-50"
                  title="Refresh from Server"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            
            <div className="space-y-2 overflow-y-auto h-96">
              {nodes.map(node => (
                <div
                  key={node.id}
                  onClick={() => selectNode(node)}
                  className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                    selectedNode?.id === node.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="font-medium text-sm">{node.name}</div>
                  <div className="text-xs text-gray-500">{node.type}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                      {node.category}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNode(node.id!);
                      }}
                      className="text-red-500 hover:text-red-700"
                      title="Delete Node"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Import/Export */}
            <div className="mt-4 pt-4 border-t space-y-2">
              <button
                onClick={exportNodes}
                className="w-full px-3 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export JSON
              </button>
              
              <label className="w-full px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 flex items-center justify-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                Import JSON
                <input
                  type="file"
                  accept=".json"
                  onChange={importNodes}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Node Details */}
          <div className="flex-1 p-4">
            {selectedNode ? (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">{selectedNode.name}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditMode(!editMode)}
                      className={`px-3 py-1 text-sm rounded ${
                        editMode ? 'bg-gray-500 text-white' : 'bg-blue-500 text-white'
                      }`}
                    >
                      {editMode ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                      {editMode ? 'View' : 'Edit'}
                    </button>
                    
                    {editMode && (
                      <button
                        onClick={updateFromJson}
                        className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                      >
                        Update
                      </button>
                    )}
                    
                    <button
                      onClick={() => saveNode(selectedNode)}
                      disabled={!isConnected || loading}
                      className="px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 disabled:opacity-50 flex items-center gap-1"
                    >
                      <Save className="w-3 h-3" />
                      Save
                    </button>
                  </div>
                </div>
                
                {editMode ? (
                  <textarea
                    value={jsonView}
                    onChange={(e) => setJsonView(e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded font-mono text-sm"
                    spellCheck={false}
                  />
                ) : (
                  <div className="flex-1 overflow-auto">
                    <pre className="p-3 bg-gray-50 rounded text-sm overflow-auto">
                      {JSON.stringify(selectedNode, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Database className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>Select a node to view its JSON representation</p>
                  <p className="text-sm mt-2">
                    All nodes are stored as pure JSON in the database
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* API Info */}
        <div className="border-t p-4 bg-gray-50">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Server className="w-4 h-4" />
            API Endpoints
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Available Endpoints:</strong>
              <ul className="mt-1 space-y-1 text-gray-600">
                <li>• GET /api/nodes - List all nodes</li>
                <li>• POST /api/nodes - Create new node</li>
                <li>• PUT /api/nodes/:id - Update node</li>
                <li>• DELETE /api/nodes/:id - Delete node</li>
              </ul>
            </div>
            <div>
              <strong>JSON Schema:</strong>
              <ul className="mt-1 space-y-1 text-gray-600">
                <li>• Fully serializable TypeScript interfaces</li>
                <li>• No functions or React components</li>
                <li>• Compatible with any JSON database</li>
                <li>• Supports versioning and metadata</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 