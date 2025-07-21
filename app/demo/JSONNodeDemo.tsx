import React, { useState, useEffect } from 'react';
import { 
  Database, Download, Upload, Play, Save, Code, 
  Check, AlertCircle, Copy, RefreshCw, Zap 
} from 'lucide-react';
import { SerializableNodeDefinition } from '../types/nodeSystem';
import { serializableNodeRegistry } from '../registry/SerializableNodeRegistry';

export default function JSONNodeDemo() {
  const [demoStep, setDemoStep] = useState<'create' | 'json' | 'save' | 'load' | 'register' | 'execute'>('create');
  const [currentNode, setCurrentNode] = useState<SerializableNodeDefinition | null>(null);
  const [jsonString, setJsonString] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [saveResult, setSaveResult] = useState<any>(null);
  const [loadedNodes, setLoadedNodes] = useState<SerializableNodeDefinition[]>([]);
  const [selectedNodeForLoad, setSelectedNodeForLoad] = useState<string>('');
  const [registrationStatus, setRegistrationStatus] = useState<string>('');
  const [executionResult, setExecutionResult] = useState<any>(null);

  // Step 1: Create a demo node
  const createDemoNode = () => {
    const demoNode: SerializableNodeDefinition = {
      type: 'json-demo-multiplier',
      name: 'JSON Demo Multiplier',
      description: 'A demo node created and saved as pure JSON',
      category: 'math',
      version: '1.0.0',
      color: { primary: '#8b5cf6', secondary: '#7c3aed' },
      inputs: [
        { id: 'value', name: 'Value', type: 'number', defaultValue: 5, description: 'Input value' },
        { id: 'multiplier', name: 'Multiplier', type: 'number', defaultValue: 2, description: 'Multiply by this' }
      ],
      outputs: [
        { id: 'result', name: 'Result', type: 'number', description: 'Multiplied result' }
      ],
      parameters: [
        { id: 'power', name: 'Power', type: 'number', defaultValue: 1, description: 'Apply power after multiply' }
      ],
      execution: {
        type: 'expression',
        expressions: {
          'result': 'Math.pow(value * multiplier, power)'
        }
      },
      ui: { icon: 'calculator' },
      tags: ['demo', 'json', 'math', 'multiplier'],
      author: 'demo-user',
      isPublic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setCurrentNode(demoNode);
    setJsonString(JSON.stringify(demoNode, null, 2));
    setDemoStep('json');
  };

  // Step 2: Validate and edit JSON
  const validateJSON = (json: string) => {
    try {
      const parsed = JSON.parse(json);
      setCurrentNode(parsed);
      setIsValid(true);
    } catch (error) {
      setIsValid(false);
    }
  };

  // Step 3: Save to "database" (API)
  const saveToDatabase = async () => {
    if (!currentNode) return;

    try {
      const response = await fetch('/api/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentNode)
      });

      if (response.ok) {
        const saved = await response.json();
        setSaveResult(saved);
        setDemoStep('load');
      } else {
        setSaveResult({ error: 'Failed to save' });
      }
    } catch (error) {
      setSaveResult({ error: String(error) });
    }
  };

  // Step 4: Load from database
  const loadFromDatabase = async () => {
    try {
      const response = await fetch('/api/nodes');
      if (response.ok) {
        const nodes = await response.json();
        setLoadedNodes(nodes);
        
        // Auto-select our demo node if it exists
        const demoNode = nodes.find((n: SerializableNodeDefinition) => 
          n.type === 'json-demo-multiplier'
        );
        if (demoNode) {
          setSelectedNodeForLoad(demoNode.id!);
        }
      }
    } catch (error) {
      console.error('Failed to load nodes:', error);
    }
  };

  // Step 5: Register node dynamically
  const registerNode = async () => {
    const nodeToRegister = loadedNodes.find(n => n.id === selectedNodeForLoad);
    if (!nodeToRegister) return;

    try {
      setRegistrationStatus('Registering node...');
      
      // Register in the serializable registry
      await serializableNodeRegistry.registerSerializable(nodeToRegister);
      
      setRegistrationStatus(`✓ Successfully registered: ${nodeToRegister.name}`);
      setDemoStep('execute');
    } catch (error) {
      setRegistrationStatus(`✗ Failed to register: ${error}`);
    }
  };

  // Step 6: Execute the registered node
  const executeNode = async () => {
    try {
      const { ExecutionEngine } = await import('../registry/ExecutionEngine');
      const node = loadedNodes.find(n => n.id === selectedNodeForLoad);
      if (!node) return;

      // Test execution with sample inputs
      const testInputs = { value: 10, multiplier: 3 };
      const testParameters = { power: 2 };

      const executeFunction = ExecutionEngine.compileExecution(node.execution);
      const result = executeFunction(testInputs, testParameters);
      
      setExecutionResult({
        inputs: testInputs,
        parameters: testParameters,
        outputs: result,
        calculation: '(10 * 3) ^ 2 = 900'
      });
    } catch (error) {
      setExecutionResult({ error: String(error) });
    }
  };

  useEffect(() => {
    if (demoStep === 'load') {
      loadFromDatabase();
    }
  }, [demoStep]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Database className="w-6 h-6 text-blue-600" />
          JSON Node Serialization Demo
        </h1>
        
        <p className="text-gray-600 mb-6">
          This demo shows how nodes can be represented as pure JSON, saved to a database, 
          loaded via API, and dynamically registered into the system.
        </p>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-6">
          {[
            { id: 'create', label: 'Create', icon: Zap },
            { id: 'json', label: 'JSON', icon: Code },
            { id: 'save', label: 'Save', icon: Save },
            { id: 'load', label: 'Load', icon: Download },
            { id: 'register', label: 'Register', icon: RefreshCw },
            { id: 'execute', label: 'Execute', icon: Play }
          ].map((step, index) => {
            const IconComponent = step.icon;
            const isActive = step.id === demoStep;
            const isCompleted = ['create', 'json', 'save', 'load', 'register', 'execute'].indexOf(demoStep) > 
                              ['create', 'json', 'save', 'load', 'register', 'execute'].indexOf(step.id);
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  isCompleted ? 'bg-green-500 text-white' :
                  isActive ? 'bg-blue-500 text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {isCompleted ? <Check className="w-4 h-4" /> : <IconComponent className="w-4 h-4" />}
                </div>
                <span className={`ml-2 text-sm ${isActive ? 'font-medium' : ''}`}>
                  {step.label}
                </span>
                {index < 5 && <div className="w-8 h-0.5 bg-gray-200 mx-2" />}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        {demoStep === 'create' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 1: Create a Node Definition</h3>
            <p className="text-gray-600">
              First, let's create a node definition using only JSON-serializable data types.
            </p>
            <button
              onClick={createDemoNode}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Create Demo Node
            </button>
          </div>
        )}

        {demoStep === 'json' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 2: Pure JSON Representation</h3>
            <p className="text-gray-600">
              Here's the node as pure JSON. You can edit it directly - it contains no functions or React components!
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Node JSON:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(jsonString)}
                    className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </button>
                  <div className={`px-2 py-1 text-xs rounded ${
                    isValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {isValid ? '✓ Valid JSON' : '✗ Invalid JSON'}
                  </div>
                </div>
              </div>
              
              <textarea
                value={jsonString}
                onChange={(e) => {
                  setJsonString(e.target.value);
                  validateJSON(e.target.value);
                }}
                className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                spellCheck={false}
              />
            </div>
            
            <button
              onClick={() => setDemoStep('save')}
              disabled={!isValid}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Continue to Save
            </button>
          </div>
        )}

        {demoStep === 'save' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 3: Save to Database</h3>
            <p className="text-gray-600">
              Now we'll save this JSON to our backend database via API.
            </p>
            
            {saveResult && (
              <div className={`p-3 rounded-md ${
                saveResult.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
              }`}>
                {saveResult.error ? (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Error: {saveResult.error}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Successfully saved with ID: {saveResult.id}
                  </div>
                )}
              </div>
            )}
            
            <button
              onClick={saveToDatabase}
              className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              Save to Database
            </button>
          </div>
        )}

        {demoStep === 'load' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 4: Load from Database</h3>
            <p className="text-gray-600">
              Load nodes from the database via API and select one to register.
            </p>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium mb-2">Available Nodes:</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {loadedNodes.map(node => (
                  <label key={node.id} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="nodeSelection"
                      value={node.id}
                      checked={selectedNodeForLoad === node.id}
                      onChange={(e) => setSelectedNodeForLoad(e.target.value)}
                    />
                    <span className="text-sm">
                      <strong>{node.name}</strong> ({node.type}) - {node.description}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            
            <button
              onClick={() => setDemoStep('register')}
              disabled={!selectedNodeForLoad}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Continue to Register
            </button>
          </div>
        )}

        {demoStep === 'register' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 5: Dynamic Registration</h3>
            <p className="text-gray-600">
              Register the loaded node into the live system.
            </p>
            
            {registrationStatus && (
              <div className={`p-3 rounded-md ${
                registrationStatus.startsWith('✗') ? 'bg-red-50 text-red-700' : 
                registrationStatus.startsWith('✓') ? 'bg-green-50 text-green-700' :
                'bg-blue-50 text-blue-700'
              }`}>
                {registrationStatus}
              </div>
            )}
            
            <button
              onClick={registerNode}
              className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Register Node Dynamically
            </button>
          </div>
        )}

        {demoStep === 'execute' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 6: Execute Registered Node</h3>
            <p className="text-gray-600">
              Test that the dynamically registered node works correctly.
            </p>
            
            {executionResult && (
              <div className={`p-4 rounded-md ${
                executionResult.error ? 'bg-red-50' : 'bg-green-50'
              }`}>
                {executionResult.error ? (
                  <div className="text-red-700">
                    <strong>Execution Error:</strong> {executionResult.error}
                  </div>
                ) : (
                  <div className="text-green-700">
                    <h4 className="font-medium mb-2">✓ Execution Successful!</h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>Inputs:</strong> {JSON.stringify(executionResult.inputs)}</div>
                      <div><strong>Parameters:</strong> {JSON.stringify(executionResult.parameters)}</div>
                      <div><strong>Outputs:</strong> {JSON.stringify(executionResult.outputs)}</div>
                      <div><strong>Calculation:</strong> {executionResult.calculation}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <button
              onClick={executeNode}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Execute Node
            </button>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <h4 className="font-medium text-blue-800 mb-2">🎉 Complete!</h4>
              <p className="text-blue-700 text-sm">
                You've successfully demonstrated the full JSON node pipeline:
                Create → Serialize → Save → Load → Register → Execute
              </p>
            </div>
          </div>
        )}

        {/* Technical Details */}
        <div className="mt-8 p-4 bg-gray-50 rounded-md">
          <h4 className="font-medium mb-2">Technical Implementation Details:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>Pure JSON:</strong> All node data uses basic types (string, number, array, object)</li>
            <li>• <strong>Database Ready:</strong> Can be stored in any JSON-compatible database</li>
            <li>• <strong>API Compatible:</strong> Standard REST endpoints for CRUD operations</li>
            <li>• <strong>Dynamic Registration:</strong> Nodes compile from JSON to executable functions</li>
            <li>• <strong>Type Safety:</strong> Full TypeScript support with serializable interfaces</li>
            <li>• <strong>Execution Engine:</strong> Converts JSON execution definitions to JavaScript functions</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 