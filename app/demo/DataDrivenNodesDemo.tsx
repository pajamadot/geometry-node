import React, { useState, useEffect } from 'react';
import { Database, Code, Play, Download, Upload, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { SerializableNodeDefinition, NodeCategory } from '../types/nodeSystem';
import { NodeDefinitionConverter } from '../registry/NodeDefinitionConverter';
import { serializableNodeRegistry } from '../registry/SerializableNodeRegistry';
import { useNodeDatabase } from '../hooks/useNodeDatabase';
import NodeLibrary from '../components/NodeLibrary';

// Demo component showcasing the data-driven node system
export default function DataDrivenNodesDemo() {
  const [demoStep, setDemoStep] = useState(0);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [jsonCode, setJsonCode] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  
  const userId = 'demo-user';
  const { nodes, saveNode, importNodes, exportNodes } = useNodeDatabase(userId);

  useEffect(() => {
    // Initialize demo with example nodes
    initializeDemo();
  }, []);

  const initializeDemo = async () => {
    try {
      // Create example serializable nodes
      const examples = NodeDefinitionConverter.createExamples();
      
      // Register them
      for (const example of examples) {
        await serializableNodeRegistry.registerSerializable(example);
      }
      
      setStatus({ type: 'success', message: 'Demo initialized with example nodes!' });
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to initialize demo: ' + error });
    }
  };

  const demoSteps = [
    {
      title: '1. Data-Driven Architecture',
      description: 'All nodes are now defined as JSON-serializable data structures instead of React components.',
      action: () => setShowJsonEditor(true),
      buttonText: 'View JSON Structure'
    },
    {
      title: '2. Database Storage',
      description: 'Nodes can be saved to and loaded from a database, making them persistent and shareable.',
      action: () => setShowLibrary(true),
      buttonText: 'Open Node Library'
    },
    {
      title: '3. Dynamic Execution',
      description: 'Execution logic is compiled from serializable expressions and builtin function references.',
      action: () => demonstrateExecution(),
      buttonText: 'Test Execution'
    },
    {
      title: '4. Import/Export',
      description: 'Nodes can be exported as JSON and imported into other projects or shared with team members.',
      action: () => demonstrateExport(),
      buttonText: 'Export Demo Nodes'
    }
  ];

  const demonstrateExecution = async () => {
    try {
      // Test execution of a math node
      const mathNode = await serializableNodeRegistry.getDefinition('example-math');
      if (mathNode) {
        const result = mathNode.execute({ valueA: 5, valueB: 3 }, { operation: 'add' });
        setStatus({ 
          type: 'success', 
          message: `Execution test: 5 + 3 = ${result.result}` 
        });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Execution failed: ' + error });
    }
  };

  const demonstrateExport = async () => {
    try {
      await exportNodes();
      setStatus({ 
        type: 'success', 
        message: 'Nodes exported successfully! Check your downloads folder.' 
      });
    } catch (error) {
      setStatus({ type: 'error', message: 'Export failed: ' + error });
    }
  };

  const createCustomNode = () => {
    const customNode: SerializableNodeDefinition = {
      type: 'demo-custom',
      name: 'Demo Custom Node',
      description: 'A custom node created in the demo',
      category: 'utilities',
      version: '1.0.0',
      color: { primary: '#8b5cf6', secondary: '#7c3aed' },
      inputs: [
        { id: 'input', name: 'Input', type: 'number', defaultValue: 0, description: 'Input value' }
      ],
      outputs: [
        { id: 'output', name: 'Output', type: 'number', description: 'Doubled input' }
      ],
      parameters: [
        { 
          id: 'multiplier', 
          name: 'Multiplier', 
          type: 'number', 
          defaultValue: 2, 
          description: 'Multiplication factor' 
        }
      ],
      ui: { icon: 'sparkles' },
      execution: {
        type: 'expression',
        expressions: {
          'output': 'input * multiplier'
        }
      },
      tags: ['demo', 'custom', 'math'],
      author: userId,
      isPublic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setJsonCode(JSON.stringify(customNode, null, 2));
    setShowJsonEditor(true);
  };

  const saveCustomNode = async () => {
    try {
      const node = JSON.parse(jsonCode) as SerializableNodeDefinition;
      await saveNode(node);
      setStatus({ type: 'success', message: 'Custom node saved successfully!' });
      setShowJsonEditor(false);
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to save node: ' + error });
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 flex items-center gap-3">
          <Database className="w-8 h-8 text-blue-600" />
          Data-Driven Node System Demo
        </h1>
        <p className="text-gray-600">
          This demo showcases how nodes are now entirely data-driven and can be stored in a database,
          exported as JSON, and dynamically created at runtime.
        </p>
      </div>

      {/* Status Messages */}
      {status && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
          status.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
          'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          {status.type === 'success' && <CheckCircle className="w-5 h-5" />}
          {status.type === 'error' && <AlertCircle className="w-5 h-5" />}
          {status.type === 'info' && <Info className="w-5 h-5" />}
          <span>{status.message}</span>
          <button 
            onClick={() => setStatus(null)}
            className="ml-auto text-current hover:opacity-70"
          >
            ✕
          </button>
        </div>
      )}

      {/* Demo Steps */}
      <div className="grid gap-6 mb-8">
        {demoSteps.map((step, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600 mb-4">{step.description}</p>
              </div>
              <button
                onClick={step.action}
                className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                {step.buttonText}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowLibrary(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2"
          >
            <Database className="w-4 h-4" />
            Browse Node Library
          </button>
          
          <button
            onClick={createCustomNode}
            className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 flex items-center gap-2"
          >
            <Code className="w-4 h-4" />
            Create Custom Node
          </button>
          
          <button
            onClick={demonstrateExecution}
            className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Test Execution
          </button>
          
          <button
            onClick={demonstrateExport}
            className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export All Nodes
          </button>
        </div>
      </div>

      {/* Architecture Overview */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Architecture Overview</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">Before (Component-Based)</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Nodes as React components</li>
              <li>• Hardcoded JavaScript functions</li>
              <li>• No database storage</li>
              <li>• Manual node registration</li>
              <li>• Limited extensibility</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">After (Data-Driven)</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Nodes as JSON definitions</li>
              <li>• Serializable execution expressions</li>
              <li>• Database-backed storage</li>
              <li>• Dynamic node loading</li>
              <li>• Full import/export support</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Node Library Dialog */}
      {showLibrary && (
        <NodeLibrary
          userId={userId}
          isOpen={showLibrary}
          onClose={() => setShowLibrary(false)}
          onAddNode={(nodeType) => {
            setStatus({ type: 'info', message: `Would add node: ${nodeType}` });
            setShowLibrary(false);
          }}
        />
      )}

      {/* JSON Editor Dialog */}
      {showJsonEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="border-b p-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Node JSON Definition</h2>
              <button 
                onClick={() => setShowJsonEditor(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 p-4">
              <p className="text-gray-600 mb-4">
                This is what a data-driven node definition looks like. You can edit this JSON 
                and save it as a new node.
              </p>
              
              <textarea
                value={jsonCode || JSON.stringify(NodeDefinitionConverter.createExamples()[0], null, 2)}
                onChange={(e) => setJsonCode(e.target.value)}
                className="w-full h-96 p-4 border border-gray-300 rounded-md font-mono text-sm"
                placeholder="Node JSON definition..."
              />
            </div>
            
            <div className="border-t p-4 flex gap-2">
              <button
                onClick={saveCustomNode}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Save as New Node
              </button>
              <button
                onClick={() => setShowJsonEditor(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Implementation Stats */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          🎉 Congratulations! Your node system is now fully data-driven and database-ready.
        </p>
        <p className="mt-1">
          Nodes can be created, stored, shared, and executed entirely from JSON definitions.
        </p>
      </div>
    </div>
  );
} 