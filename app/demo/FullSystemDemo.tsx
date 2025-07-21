import React, { useState, useEffect } from 'react';
import { 
  Zap, Database, Users, Code, Play, Save, Download, 
  Upload, Star, Heart, Eye, TrendingUp, Award, Search,
  Settings, Layers, CheckCircle, AlertCircle, Info, Rocket
} from 'lucide-react';
import { SerializableNodeDefinition } from '../types/nodeSystem';
import { serializableNodeRegistry } from '../registry/SerializableNodeRegistry';
import { useAuth } from '../components/UserAuthProvider';
import { useNodeDatabase } from '../hooks/useNodeDatabase';

export default function FullSystemDemo() {
  const { user } = useAuth();
  const { nodes, saveNode, deleteNode } = useNodeDatabase(user?.id);
  const [activeDemo, setActiveDemo] = useState<'create' | 'library' | 'collaborate' | 'marketplace'>('create');
  const [demoProgress, setDemoProgress] = useState(0);
  const [createdNode, setCreatedNode] = useState<SerializableNodeDefinition | null>(null);
  const [registeredNodes, setRegisteredNodes] = useState<string[]>([]);
  const [collaborativeActivity, setCollaborativeActivity] = useState<any[]>([]);

  // Demo progression tracking
  useEffect(() => {
    const progress = [
      activeDemo === 'create' ? 25 : 0,
      createdNode ? 25 : 0,
      registeredNodes.length > 0 ? 25 : 0,
      collaborativeActivity.length > 0 ? 25 : 0
    ].reduce((a, b) => a + b, 0);
    
    setDemoProgress(progress);
  }, [activeDemo, createdNode, registeredNodes, collaborativeActivity]);

  // Create a demo node
  const createDemoNode = async () => {
    const demoNode: SerializableNodeDefinition = {
      type: `demo-${Date.now()}`,
      name: 'Demo Wave Generator',
      description: 'Creates wave patterns with customizable frequency and amplitude',
      category: 'utilities',
      version: '1.0.0',
      color: { primary: '#3b82f6', secondary: '#1d4ed8' },
      inputs: [
        { id: 'frequency', name: 'Frequency', type: 'number', defaultValue: 1, description: 'Wave frequency' },
        { id: 'amplitude', name: 'Amplitude', type: 'number', defaultValue: 1, description: 'Wave amplitude' },
        { id: 'phase', name: 'Phase', type: 'number', defaultValue: 0, description: 'Wave phase offset' }
      ],
      outputs: [
        { id: 'wave', name: 'Wave', type: 'number', description: 'Generated wave value' }
      ],
      parameters: [
        { id: 'waveType', name: 'Wave Type', type: 'select', defaultValue: 'sine', 
          options: ['sine', 'cosine', 'square', 'triangle'], description: 'Type of wave to generate' }
      ],
      execution: {
        type: 'expression',
        expressions: {
          'wave': `waveType === 'sine' ? Math.sin(frequency * Math.PI * 2 + phase) * amplitude :
                   waveType === 'cosine' ? Math.cos(frequency * Math.PI * 2 + phase) * amplitude :
                   waveType === 'square' ? (Math.sin(frequency * Math.PI * 2 + phase) > 0 ? 1 : -1) * amplitude :
                   Math.abs((frequency * 2 + phase / Math.PI) % 2 - 1) * 2 - 1) * amplitude`
        }
      },
      ui: { icon: 'waves' },
      tags: ['demo', 'wave', 'generator', 'math'],
      author: user?.id || 'demo-user',
      isPublic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      // Save to database
      const saved = await saveNode(demoNode);
      if (saved) {
        setCreatedNode(saved);
        
        // Register dynamically
        await serializableNodeRegistry.registerSerializable(saved);
        setRegisteredNodes(prev => [...prev, saved.type]);
        
        // Add to collaborative activity
        setCollaborativeActivity(prev => [...prev, {
          type: 'node_created',
          user: user?.username || 'Demo User',
          node: saved.name,
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (error) {
      console.error('Failed to create demo node:', error);
    }
  };

  // Test node execution
  const testNodeExecution = async () => {
    if (!createdNode) return;

    try {
      const { ExecutionEngine } = await import('../registry/ExecutionEngine');
      const executeFunction = ExecutionEngine.compileExecution(createdNode.execution);
      
      const testInputs = { frequency: 2, amplitude: 0.5, phase: 0 };
      const testParameters = { waveType: 'sine' };
      
      const result = executeFunction(testInputs, testParameters);
      
      alert(`Node executed successfully!\nInput: ${JSON.stringify(testInputs)}\nParameters: ${JSON.stringify(testParameters)}\nOutput: ${JSON.stringify(result)}`);
    } catch (error) {
      alert('Execution failed: ' + error);
    }
  };

  // Share node publicly
  const shareNode = async () => {
    if (!createdNode) return;

    const shared = { ...createdNode, isPublic: true };
    await saveNode(shared);
    
    setCollaborativeActivity(prev => [...prev, {
      type: 'node_shared',
      user: user?.username || 'Demo User',
      node: shared.name,
      timestamp: new Date().toISOString()
    }]);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Complete Data-Driven Node System</h1>
            <p className="text-blue-100">
              Experience the full workflow: Create → Save → Share → Collaborate
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{demoProgress}%</div>
            <div className="text-sm text-blue-200">Complete</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4 bg-blue-700 rounded-full h-2">
          <div 
            className="bg-white rounded-full h-2 transition-all duration-500"
            style={{ width: `${demoProgress}%` }}
          />
        </div>
      </div>

      {/* Demo Tabs */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="border-b">
          <div className="flex">
            {[
              { id: 'create', label: 'Create Node', icon: Zap, color: 'purple' },
              { id: 'library', label: 'Node Library', icon: Database, color: 'blue' },
              { id: 'collaborate', label: 'Collaborate', icon: Users, color: 'green' },
              { id: 'marketplace', label: 'Marketplace', icon: Star, color: 'orange' }
            ].map(tab => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveDemo(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeDemo === tab.id
                      ? `border-${tab.color}-500 text-${tab.color}-600 bg-${tab.color}-50`
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {/* Create Node Demo */}
          {activeDemo === 'create' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Zap className="w-6 h-6 text-purple-600" />
                Create Custom Node
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">1. Define Node Structure</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <code className="bg-white px-2 py-1 rounded">demo-wave-generator</code>
                      </div>
                      <div className="flex justify-between">
                        <span>Inputs:</span>
                        <span>3 (frequency, amplitude, phase)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Outputs:</span>
                        <span>1 (wave value)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Execution:</span>
                        <span>Mathematical Expression</span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={createDemoNode}
                    disabled={!!createdNode}
                    className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {createdNode ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Node Created!
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        Create Demo Node
                      </>
                    )}
                  </button>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">2. JSON Serialization</h4>
                  {createdNode ? (
                    <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-auto max-h-64">
                      <pre>{JSON.stringify(createdNode, null, 2)}</pre>
                    </div>
                  ) : (
                    <div className="bg-gray-100 p-4 rounded-lg text-center text-gray-500">
                      Create a node to see its JSON representation
                    </div>
                  )}
                  
                  {createdNode && (
                    <div className="flex gap-2">
                      <button
                        onClick={testNodeExecution}
                        className="flex-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center justify-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Test
                      </button>
                      <button
                        onClick={shareNode}
                        className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Share
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Library Demo */}
          {activeDemo === 'library' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Database className="w-6 h-6 text-blue-600" />
                Node Library & Database
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Your Nodes</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {nodes.filter(node => node.author === user?.id).map(node => (
                      <div key={node.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium">{node.name}</h5>
                            <p className="text-sm text-gray-600">{node.description}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                              <span>{node.category}</span>
                              <span>{node.inputs?.length || 0} inputs</span>
                              <span>{node.outputs?.length || 0} outputs</span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {node.isPublic && <Eye className="w-4 h-4 text-green-500" />}
                            <button
                              onClick={() => deleteNode(node.id!)}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 text-center text-sm text-gray-500">
                    Total: {nodes.filter(node => node.author === user?.id).length} nodes
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">System Statistics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">{nodes.length}</div>
                      <div className="text-sm text-blue-700">Total Nodes</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">{registeredNodes.length}</div>
                      <div className="text-sm text-green-700">Registered</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-600">{nodes.filter(n => n.isPublic).length}</div>
                      <div className="text-sm text-purple-700">Public</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-orange-600">{collaborativeActivity.length}</div>
                      <div className="text-sm text-orange-700">Activities</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <h5 className="font-medium text-sm">Recent Activities</h5>
                    {collaborativeActivity.slice(0, 3).map((activity, index) => (
                      <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                        <strong>{activity.user}</strong> {activity.type.replace('_', ' ')} <em>{activity.node}</em>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Collaboration Demo */}
          {activeDemo === 'collaborate' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Users className="w-6 h-6 text-green-600" />
                Real-time Collaboration
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Live Activity Feed
                  </h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {collaborativeActivity.map((activity, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {activity.user.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm">
                            <strong>{activity.user}</strong> {activity.type.replace('_', ' ')} <em>{activity.node}</em>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(activity.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {collaborativeActivity.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No recent activity</p>
                      <p className="text-sm">Create and share nodes to see activity here</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Community Features</h4>
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium mb-2">Share & Discover</h5>
                      <p className="text-sm text-gray-600 mb-3">
                        Share your custom nodes with the community and discover nodes created by others
                      </p>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                          Browse Community
                        </button>
                        <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                          My Shares
                        </button>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium mb-2">Real-time Updates</h5>
                      <p className="text-sm text-gray-600 mb-3">
                        See live updates when users create, share, and use nodes
                      </p>
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span>Live system active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Marketplace Demo */}
          {activeDemo === 'marketplace' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Star className="w-6 h-6 text-orange-600" />
                Node Marketplace
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { 
                    name: 'AI Terrain Generator', 
                    author: 'TerrainMaster', 
                    downloads: 1547, 
                    rating: 4.9, 
                    price: 'Free',
                    featured: true 
                  },
                  { 
                    name: 'Neural Mesh Optimizer', 
                    author: 'NeuralLabs', 
                    downloads: 892, 
                    rating: 4.7, 
                    price: '$29.99',
                    featured: false 
                  },
                  { 
                    name: 'Organic Growth Pattern', 
                    author: 'BioDesigner', 
                    downloads: 634, 
                    rating: 4.8, 
                    price: 'Free',
                    featured: false 
                  },
                  { 
                    name: 'Procedural City Builder', 
                    author: 'UrbanPlanner', 
                    downloads: 421, 
                    rating: 4.6, 
                    price: '$19.99',
                    featured: false 
                  },
                  { 
                    name: 'Wave Generator Pro', 
                    author: user?.username || 'You', 
                    downloads: 0, 
                    rating: 0, 
                    price: 'Free',
                    featured: false,
                    isOwn: true
                  }
                ].map((node, index) => (
                  <div key={index} className={`border rounded-lg p-4 hover:shadow-lg transition-shadow ${
                    node.featured ? 'border-orange-300 bg-orange-50' : ''
                  } ${node.isOwn ? 'border-blue-300 bg-blue-50' : ''}`}>
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{node.name}</h4>
                      <div className="flex gap-1">
                        {node.featured && <Award className="w-4 h-4 text-orange-500" />}
                        {node.isOwn && <Settings className="w-4 h-4 text-blue-500" />}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-3">by {node.author}</div>
                    
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        {node.downloads.toLocaleString()}
                      </span>
                      {node.rating > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          {node.rating}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className={`font-semibold ${
                        node.price === 'Free' ? 'text-green-600' : 'text-gray-900'
                      }`}>
                        {node.price}
                      </span>
                      <button className={`px-3 py-1 text-xs rounded ${
                        node.isOwn 
                          ? 'bg-blue-500 text-white hover:bg-blue-600' 
                          : 'bg-orange-500 text-white hover:bg-orange-600'
                      }`}>
                        {node.isOwn ? 'Edit' : 'Install'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-center">
                <button className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 flex items-center gap-2 mx-auto">
                  <Rocket className="w-5 h-5" />
                  Explore Full Marketplace
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-600" />
          System Capabilities Demonstrated
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { 
              title: 'JSON Serialization', 
              status: createdNode ? 'complete' : 'pending',
              description: 'Nodes as pure JSON'
            },
            { 
              title: 'Database Storage', 
              status: nodes.length > 0 ? 'complete' : 'pending',
              description: 'Persistent node storage'
            },
            { 
              title: 'Dynamic Registration', 
              status: registeredNodes.length > 0 ? 'complete' : 'pending',
              description: 'Hot-loading capabilities'
            },
            { 
              title: 'Real-time Collaboration', 
              status: collaborativeActivity.length > 0 ? 'complete' : 'pending',
              description: 'Live community features'
            }
          ].map((capability, index) => (
            <div key={index} className="border rounded-lg p-4 text-center">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                capability.status === 'complete' ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {capability.status === 'complete' ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <h4 className="font-medium mb-1">{capability.title}</h4>
              <p className="text-sm text-gray-600">{capability.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 