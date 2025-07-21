import React, { useState } from 'react';
import { Zap, Save, X, Code } from 'lucide-react';
import { SerializableNodeDefinition, NodeCategory } from '../types/nodeSystem';
import { serializableNodeRegistry } from '../registry/SerializableNodeRegistry';

interface InlineNodeCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onNodeCreated: (nodeType: string) => void;
  position: { x: number; y: number };
  userId?: string;
}

export default function InlineNodeCreator({ 
  isOpen, 
  onClose, 
  onNodeCreated, 
  position,
  userId 
}: InlineNodeCreatorProps) {
  const [nodeName, setNodeName] = useState('');
  const [description, setDescription] = useState('');
  const [expression, setExpression] = useState('input * 2');
  const [category, setCategory] = useState<NodeCategory>('utilities');

  const handleQuickCreate = async () => {
    if (!nodeName.trim()) return;

    const nodeType = nodeName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    const quickNode: SerializableNodeDefinition = {
      type: nodeType,
      name: nodeName,
      description: description || `Custom ${nodeName} node`,
      category,
      version: '1.0.0',
      color: { primary: '#8b5cf6', secondary: '#7c3aed' },
      inputs: [
        { id: 'input', name: 'Input', type: 'number', defaultValue: 0, description: 'Input value' }
      ],
      outputs: [
        { id: 'result', name: 'Result', type: 'number', description: 'Calculated result' }
      ],
      parameters: [],
      execution: {
        type: 'expression',
        expressions: { 'result': expression }
      },
      ui: { icon: 'sparkles' },
      tags: ['custom', 'quick-create'],
      author: userId,
      isPublic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await serializableNodeRegistry.registerSerializable(quickNode);
      onNodeCreated(nodeType);
      onClose();
      
      // Reset form
      setNodeName('');
      setDescription('');
      setExpression('input * 2');
    } catch (error) {
      alert('Failed to create node: ' + error);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="absolute bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80 z-50"
      style={{ left: position.x, top: position.y }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-purple-600" />
          <span className="font-medium text-sm">Quick Node</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <input
            type="text"
            placeholder="Node name..."
            value={nodeName}
            onChange={(e) => setNodeName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
            autoFocus
          />
        </div>
        
        <div>
          <input
            type="text"
            placeholder="Description (optional)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Code className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-600">Expression</span>
          </div>
          <input
            type="text"
            placeholder="e.g., input * 2 + 1"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md font-mono focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        <div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as NodeCategory)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
          >
            <option value="utilities">Utilities</option>
            <option value="math">Math</option>
            <option value="geometry">Geometry</option>
            <option value="modifiers">Modifiers</option>
          </select>
        </div>
        
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleQuickCreate}
            disabled={!nodeName.trim()}
            className="flex-1 px-3 py-2 bg-purple-500 text-white text-sm rounded-md hover:bg-purple-600 disabled:opacity-50 flex items-center justify-center gap-1"
          >
            <Save className="w-3 h-3" />
            Create
          </button>
          <button
            onClick={onClose}
            className="px-3 py-2 border border-gray-300 text-gray-600 text-sm rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        Variables: <code>input</code> • Math: <code>Math.sin</code>, <code>Math.cos</code>, etc.
      </div>
    </div>
  );
} 