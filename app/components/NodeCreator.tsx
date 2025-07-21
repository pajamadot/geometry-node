import React, { useState, useCallback, useEffect } from 'react';
import { 
  Plus, Code, Play, Save, Share, Eye, EyeOff, TestTube2, 
  Zap, Settings, X, Check, AlertCircle, Info, Copy
} from 'lucide-react';
import { SerializableNodeDefinition, NodeCategory, ParameterType, IconType } from '../types/nodeSystem';
import { serializableNodeRegistry } from '../registry/SerializableNodeRegistry';
import { useNodeDatabase } from '../hooks/useNodeDatabase';
import { getAvailableIcons } from '../registry/IconRegistry';
import { BUILTIN_FUNCTIONS } from '../registry/ExecutionEngine';

interface NodeCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onNodeCreated: (nodeType: string) => void;
  userId?: string;
  currentPosition?: { x: number; y: number };
}

export default function NodeCreator({ 
  isOpen, 
  onClose, 
  onNodeCreated, 
  userId, 
  currentPosition 
}: NodeCreatorProps) {
  const [step, setStep] = useState<'basic' | 'io' | 'execution' | 'test' | 'save'>('basic');
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  
  const { saveNode } = useNodeDatabase(userId);
  
  // Node definition state
  const [nodeDefinition, setNodeDefinition] = useState<Partial<SerializableNodeDefinition>>({
    type: '',
    name: '',
    description: '',
    category: 'utilities',
    version: '1.0.0',
    color: { primary: '#3b82f6', secondary: '#1d4ed8' },
    inputs: [],
    outputs: [],
    parameters: [],
    execution: { type: 'builtin', functionName: 'cube' },
    tags: ['custom'],
    author: userId,
    isPublic: false,
    ui: { icon: 'settings' }
  });

  const resetForm = useCallback(() => {
    setStep('basic');
    setTestResult(null);
    setTestError(null);
    setNodeDefinition({
      type: '',
      name: '',
      description: '',
      category: 'utilities',
      version: '1.0.0',
      color: { primary: '#3b82f6', secondary: '#1d4ed8' },
      inputs: [],
      outputs: [],
      parameters: [],
      execution: { type: 'builtin', functionName: 'cube' },
      tags: ['custom'],
      author: userId,
      isPublic: false,
      ui: { icon: 'settings' }
    });
  }, [userId]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const addInput = () => {
    setNodeDefinition(prev => ({
      ...prev,
      inputs: [
        ...(prev.inputs || []),
        {
          id: `input${(prev.inputs?.length || 0) + 1}`,
          name: 'Input',
          type: 'number',
          defaultValue: 0,
          description: 'Input parameter'
        }
      ]
    }));
  };

  const addOutput = () => {
    setNodeDefinition(prev => ({
      ...prev,
      outputs: [
        ...(prev.outputs || []),
        {
          id: `output${(prev.outputs?.length || 0) + 1}`,
          name: 'Output',
          type: 'number',
          description: 'Output value'
        }
      ]
    }));
  };

  const addParameter = () => {
    setNodeDefinition(prev => ({
      ...prev,
      parameters: [
        ...(prev.parameters || []),
        {
          id: `param${(prev.parameters?.length || 0) + 1}`,
          name: 'Parameter',
          type: 'number',
          defaultValue: 0,
          description: 'Parameter'
        }
      ]
    }));
  };

  const testNode = async () => {
    if (!nodeDefinition.execution) return;
    
    setIsTesting(true);
    setTestError(null);
    
    try {
      // Create test inputs based on node definition
      const testInputs: Record<string, any> = {};
      const testParameters: Record<string, any> = {};
      
      nodeDefinition.inputs?.forEach(input => {
        testInputs[input.id] = input.defaultValue ?? 0;
      });
      
      nodeDefinition.parameters?.forEach(param => {
        testParameters[param.id] = param.defaultValue ?? 0;
      });

      // Compile and test execution
      const { ExecutionEngine } = await import('../registry/ExecutionEngine');
      const executeFunction = ExecutionEngine.compileExecution(nodeDefinition.execution);
      
      const result = executeFunction(testInputs, testParameters);
      setTestResult(result);
      
    } catch (error) {
      setTestError(error instanceof Error ? error.message : 'Test failed');
    } finally {
      setIsTesting(false);
    }
  };

  const saveAndRegisterNode = async () => {
    if (!nodeDefinition.type || !nodeDefinition.name) {
      alert('Please fill in required fields (type and name)');
      return;
    }

    try {
      const completeNode: SerializableNodeDefinition = {
        ...nodeDefinition,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as SerializableNodeDefinition;

      // Save to database
      const savedNode = await saveNode(completeNode);
      
      if (savedNode) {
        // Register in the node registry for immediate use
        await serializableNodeRegistry.registerSerializable(savedNode);
        
        // Notify parent and close
        onNodeCreated(savedNode.type);
        onClose();
        
        alert(`Node "${savedNode.name}" created and registered successfully!`);
      }
    } catch (error) {
      alert('Failed to save node: ' + error);
    }
  };

  const generateTypeFromName = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold">Create Custom Node</h2>
            <div className="flex items-center gap-2 ml-4">
              {['basic', 'io', 'execution', 'test', 'save'].map((s, i) => (
                <div
                  key={s}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    step === s ? 'bg-purple-500 text-white' :
                    ['basic', 'io', 'execution', 'test', 'save'].indexOf(step) > i ? 'bg-green-500 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}
                >
                  {['basic', 'io', 'execution', 'test', 'save'].indexOf(step) > i ? <Check className="w-4 h-4" /> : i + 1}
                </div>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {step === 'basic' && <BasicInfoStep 
            nodeDefinition={nodeDefinition} 
            setNodeDefinition={setNodeDefinition}
            generateTypeFromName={generateTypeFromName}
          />}
          
          {step === 'io' && <InputOutputStep 
            nodeDefinition={nodeDefinition} 
            setNodeDefinition={setNodeDefinition}
            addInput={addInput}
            addOutput={addOutput}
            addParameter={addParameter}
          />}
          
          {step === 'execution' && <ExecutionStep 
            nodeDefinition={nodeDefinition} 
            setNodeDefinition={setNodeDefinition}
          />}
          
          {step === 'test' && <TestStep 
            nodeDefinition={nodeDefinition}
            testResult={testResult}
            testError={testError}
            isTesting={isTesting}
            onTest={testNode}
          />}
          
          {step === 'save' && <SaveStep 
            nodeDefinition={nodeDefinition} 
            setNodeDefinition={setNodeDefinition}
            onSave={saveAndRegisterNode}
          />}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-between">
          <button
            onClick={() => {
              const steps = ['basic', 'io', 'execution', 'test', 'save'] as const;
              const currentIndex = steps.indexOf(step);
              if (currentIndex > 0) setStep(steps[currentIndex - 1]);
            }}
            disabled={step === 'basic'}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          
          <div className="flex gap-2">
            {step !== 'save' ? (
              <button
                onClick={() => {
                  const steps = ['basic', 'io', 'execution', 'test', 'save'] as const;
                  const currentIndex = steps.indexOf(step);
                  if (currentIndex < steps.length - 1) setStep(steps[currentIndex + 1]);
                }}
                className="px-6 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
              >
                Next
              </button>
            ) : (
              <button
                onClick={saveAndRegisterNode}
                className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Create Node
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step Components
function BasicInfoStep({ 
  nodeDefinition, 
  setNodeDefinition, 
  generateTypeFromName 
}: {
  nodeDefinition: Partial<SerializableNodeDefinition>;
  setNodeDefinition: (update: (prev: Partial<SerializableNodeDefinition>) => Partial<SerializableNodeDefinition>) => void;
  generateTypeFromName: (name: string) => string;
}) {
  const availableIcons = getAvailableIcons();
  const categories: NodeCategory[] = [
    'geometry', 'math', 'vector', 'utilities', 'input', 
    'output', 'modifiers', 'instances', 'animation'
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Basic Information</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Node Name *</label>
          <input
            type="text"
            value={nodeDefinition.name || ''}
            onChange={(e) => {
              const name = e.target.value;
              setNodeDefinition(prev => ({
                ...prev,
                name,
                type: generateTypeFromName(name)
              }));
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
            placeholder="e.g., Custom Multiplier"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Node Type *</label>
          <input
            type="text"
            value={nodeDefinition.type || ''}
            onChange={(e) => setNodeDefinition(prev => ({ ...prev, type: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
            placeholder="e.g., custom-multiplier"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          value={nodeDefinition.description || ''}
          onChange={(e) => setNodeDefinition(prev => ({ ...prev, description: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
          rows={3}
          placeholder="Describe what this node does..."
        />
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Category</label>
          <select
            value={nodeDefinition.category || 'utilities'}
            onChange={(e) => setNodeDefinition(prev => ({ ...prev, category: e.target.value as NodeCategory }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Icon</label>
          <select
            value={nodeDefinition.ui?.icon || 'settings'}
            onChange={(e) => setNodeDefinition(prev => ({
              ...prev,
              ui: { ...prev.ui, icon: e.target.value as IconType }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
          >
            {availableIcons.map(icon => (
              <option key={icon} value={icon}>
                {icon.replace('-', ' ')}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Primary Color</label>
          <input
            type="color"
            value={nodeDefinition.color?.primary || '#3b82f6'}
            onChange={(e) => setNodeDefinition(prev => ({
              ...prev,
              color: { ...prev.color!, primary: e.target.value }
            }))}
            className="w-full h-10 border border-gray-300 rounded-md"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
        <input
          type="text"
          value={nodeDefinition.tags?.join(', ') || 'custom'}
          onChange={(e) => setNodeDefinition(prev => ({
            ...prev,
            tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
          }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
          placeholder="custom, math, utility"
        />
      </div>
    </div>
  );
}

function InputOutputStep({ 
  nodeDefinition, 
  setNodeDefinition, 
  addInput, 
  addOutput, 
  addParameter 
}: {
  nodeDefinition: Partial<SerializableNodeDefinition>;
  setNodeDefinition: (update: (prev: Partial<SerializableNodeDefinition>) => Partial<SerializableNodeDefinition>) => void;
  addInput: () => void;
  addOutput: () => void;
  addParameter: () => void;
}) {
  const parameterTypes: ParameterType[] = [
    'number', 'integer', 'boolean', 'string', 'color', 'select', 'vector', 'geometry'
  ];

  const updateInput = (index: number, field: string, value: any) => {
    setNodeDefinition(prev => ({
      ...prev,
      inputs: prev.inputs?.map((input, i) => 
        i === index ? { ...input, [field]: value } : input
      )
    }));
  };

  const updateOutput = (index: number, field: string, value: any) => {
    setNodeDefinition(prev => ({
      ...prev,
      outputs: prev.outputs?.map((output, i) => 
        i === index ? { ...output, [field]: value } : output
      )
    }));
  };

  const updateParameter = (index: number, field: string, value: any) => {
    setNodeDefinition(prev => ({
      ...prev,
      parameters: prev.parameters?.map((param, i) => 
        i === index ? { ...param, [field]: value } : param
      )
    }));
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Inputs & Outputs</h3>
      
      {/* Inputs Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium">Inputs</h4>
          <button
            onClick={addInput}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add Input
          </button>
        </div>
        
        <div className="space-y-3">
          {nodeDefinition.inputs?.map((input, index) => (
            <div key={index} className="grid grid-cols-4 gap-3 p-3 border rounded">
              <input
                type="text"
                value={input.id}
                onChange={(e) => updateInput(index, 'id', e.target.value)}
                placeholder="ID"
                className="px-2 py-1 border rounded text-sm"
              />
              <input
                type="text"
                value={input.name}
                onChange={(e) => updateInput(index, 'name', e.target.value)}
                placeholder="Display Name"
                className="px-2 py-1 border rounded text-sm"
              />
              <select
                value={input.type}
                onChange={(e) => updateInput(index, 'type', e.target.value)}
                className="px-2 py-1 border rounded text-sm"
              >
                {parameterTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <input
                type="text"
                value={input.defaultValue?.toString() || ''}
                onChange={(e) => updateInput(index, 'defaultValue', 
                  input.type === 'number' || input.type === 'integer' ? 
                  Number(e.target.value) || 0 : e.target.value
                )}
                placeholder="Default Value"
                className="px-2 py-1 border rounded text-sm"
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Outputs Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium">Outputs</h4>
          <button
            onClick={addOutput}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add Output
          </button>
        </div>
        
        <div className="space-y-3">
          {nodeDefinition.outputs?.map((output, index) => (
            <div key={index} className="grid grid-cols-3 gap-3 p-3 border rounded">
              <input
                type="text"
                value={output.id}
                onChange={(e) => updateOutput(index, 'id', e.target.value)}
                placeholder="ID"
                className="px-2 py-1 border rounded text-sm"
              />
              <input
                type="text"
                value={output.name}
                onChange={(e) => updateOutput(index, 'name', e.target.value)}
                placeholder="Display Name"
                className="px-2 py-1 border rounded text-sm"
              />
              <select
                value={output.type}
                onChange={(e) => updateOutput(index, 'type', e.target.value)}
                className="px-2 py-1 border rounded text-sm"
              >
                {parameterTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
      
      {/* Parameters Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium">Parameters</h4>
          <button
            onClick={addParameter}
            className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add Parameter
          </button>
        </div>
        
        <div className="space-y-3">
          {nodeDefinition.parameters?.map((param, index) => (
            <div key={index} className="grid grid-cols-4 gap-3 p-3 border rounded">
              <input
                type="text"
                value={param.id}
                onChange={(e) => updateParameter(index, 'id', e.target.value)}
                placeholder="ID"
                className="px-2 py-1 border rounded text-sm"
              />
              <input
                type="text"
                value={param.name}
                onChange={(e) => updateParameter(index, 'name', e.target.value)}
                placeholder="Display Name"
                className="px-2 py-1 border rounded text-sm"
              />
              <select
                value={param.type}
                onChange={(e) => updateParameter(index, 'type', e.target.value)}
                className="px-2 py-1 border rounded text-sm"
              >
                {parameterTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <input
                type="text"
                value={param.defaultValue?.toString() || ''}
                onChange={(e) => updateParameter(index, 'defaultValue', 
                  param.type === 'number' || param.type === 'integer' ? 
                  Number(e.target.value) || 0 : e.target.value
                )}
                placeholder="Default Value"
                className="px-2 py-1 border rounded text-sm"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExecutionStep({ 
  nodeDefinition, 
  setNodeDefinition 
}: {
  nodeDefinition: Partial<SerializableNodeDefinition>;
  setNodeDefinition: (update: (prev: Partial<SerializableNodeDefinition>) => Partial<SerializableNodeDefinition>) => void;
}) {
  const builtinFunctions = Object.keys(BUILTIN_FUNCTIONS);

  const updateExecution = (field: string, value: any) => {
    setNodeDefinition(prev => ({
      ...prev,
      execution: { ...prev.execution!, [field]: value }
    }));
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Execution Logic</h3>
      
      <div>
        <label className="block text-sm font-medium mb-2">Execution Type</label>
        <select
          value={nodeDefinition.execution?.type || 'builtin'}
          onChange={(e) => updateExecution('type', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
        >
          <option value="builtin">Builtin Function</option>
          <option value="expression">Mathematical Expression</option>
          <option value="composite">Composite Operations</option>
        </select>
      </div>
      
      {nodeDefinition.execution?.type === 'builtin' && (
        <div>
          <label className="block text-sm font-medium mb-2">Builtin Function</label>
          <select
            value={nodeDefinition.execution.functionName || 'cube'}
            onChange={(e) => updateExecution('functionName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
          >
            {builtinFunctions.map(func => (
              <option key={func} value={func}>{func}</option>
            ))}
          </select>
        </div>
      )}
      
      {nodeDefinition.execution?.type === 'expression' && (
        <div>
          <label className="block text-sm font-medium mb-2">Output Expressions</label>
          <div className="space-y-3">
            {nodeDefinition.outputs?.map(output => (
              <div key={output.id}>
                <label className="block text-xs text-gray-600 mb-1">{output.name} ({output.id})</label>
                <textarea
                  value={nodeDefinition.execution?.expressions?.[output.id] || ''}
                  onChange={(e) => updateExecution('expressions', {
                    ...nodeDefinition.execution?.expressions,
                    [output.id]: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                  rows={2}
                  placeholder={`e.g., input1 * 2 + parameter1`}
                />
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <h5 className="font-medium text-sm mb-2">Available Variables:</h5>
            <div className="text-xs text-gray-600 space-y-1">
              <div><strong>Inputs:</strong> {nodeDefinition.inputs?.map(i => i.id).join(', ') || 'none'}</div>
              <div><strong>Parameters:</strong> {nodeDefinition.parameters?.map(p => p.id).join(', ') || 'none'}</div>
              <div><strong>Math:</strong> Math.sin, Math.cos, Math.sqrt, Math.PI, etc.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TestStep({ 
  nodeDefinition, 
  testResult, 
  testError, 
  isTesting, 
  onTest 
}: {
  nodeDefinition: Partial<SerializableNodeDefinition>;
  testResult: any;
  testError: string | null;
  isTesting: boolean;
  onTest: () => void;
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Test Your Node</h3>
      
      <div className="bg-gray-50 p-4 rounded-md">
        <h4 className="font-medium mb-3">Node Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Name:</strong> {nodeDefinition.name || 'Unnamed'}
          </div>
          <div>
            <strong>Type:</strong> {nodeDefinition.type || 'undefined'}
          </div>
          <div>
            <strong>Inputs:</strong> {nodeDefinition.inputs?.length || 0}
          </div>
          <div>
            <strong>Outputs:</strong> {nodeDefinition.outputs?.length || 0}
          </div>
          <div>
            <strong>Parameters:</strong> {nodeDefinition.parameters?.length || 0}
          </div>
          <div>
            <strong>Execution:</strong> {nodeDefinition.execution?.type || 'undefined'}
          </div>
        </div>
      </div>
      
      <div className="flex justify-center">
        <button
          onClick={onTest}
          disabled={isTesting}
          className="px-6 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
        >
          <TestTube2 className="w-5 h-5" />
          {isTesting ? 'Testing...' : 'Test Node'}
        </button>
      </div>
      
      {testResult && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-md">
          <h5 className="font-medium text-green-800 mb-2 flex items-center gap-2">
            <Check className="w-4 h-4" />
            Test Successful!
          </h5>
          <pre className="text-sm text-green-700 bg-green-100 p-2 rounded overflow-auto">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}
      
      {testError && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-md">
          <h5 className="font-medium text-red-800 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Test Failed
          </h5>
          <p className="text-sm text-red-700">{testError}</p>
        </div>
      )}
    </div>
  );
}

function SaveStep({ 
  nodeDefinition, 
  setNodeDefinition, 
  onSave 
}: {
  nodeDefinition: Partial<SerializableNodeDefinition>;
  setNodeDefinition: (update: (prev: Partial<SerializableNodeDefinition>) => Partial<SerializableNodeDefinition>) => void;
  onSave: () => void;
}) {
  const handleShare = () => {
    const nodeJson = JSON.stringify(nodeDefinition, null, 2);
    navigator.clipboard.writeText(nodeJson);
    alert('Node definition copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Save & Share</h3>
      
      <div className="space-y-4">
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={nodeDefinition.isPublic !== false}
              onChange={(e) => setNodeDefinition(prev => ({ ...prev, isPublic: e.target.checked }))}
            />
            <span className="text-sm">Make this node public</span>
            <div title="Public nodes can be used by all users">
              <Info className="w-4 h-4 text-gray-400" />
            </div>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Public nodes appear in the shared library for all users to discover and use
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Version</label>
          <input
            type="text"
            value={nodeDefinition.version || '1.0.0'}
            onChange={(e) => setNodeDefinition(prev => ({ ...prev, version: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
            placeholder="1.0.0"
          />
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-md">
        <h4 className="font-medium mb-3">Final Node Definition</h4>
        <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-48">
          {JSON.stringify(nodeDefinition, null, 2)}
        </pre>
      </div>
      
      <div className="flex gap-3 justify-center">
        <button
          onClick={handleShare}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
        >
          <Copy className="w-4 h-4" />
          Copy JSON
        </button>
        
        <button
          onClick={onSave}
          className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Create & Register Node
        </button>
      </div>
      
      <div className="text-center text-sm text-gray-500">
        Once created, your node will be immediately available in the node library and can be added to any graph.
      </div>
    </div>
  );
} 