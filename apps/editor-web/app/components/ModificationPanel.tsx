'use client';

import React, { useState } from 'react';
import { Edit3, Loader2, Sparkles } from 'lucide-react';
import Button from './ui/Button';
import Dropdown from './ui/Dropdown';

interface ModificationPanelProps {
  onNodeModified?: (node: any) => void;
  onSceneModified?: (scene: any) => void;
  currentNodes?: any[];
  currentScene?: { nodes: any[], edges: any[] };
  className?: string;
}

export function ModificationPanel({
  onNodeModified,
  onSceneModified,
  currentNodes = [],
  currentScene,
  className = ''
}: ModificationPanelProps) {
  const [activeTab, setActiveTab] = useState<'nodes' | 'scenes'>('nodes');
  const [prompt, setPrompt] = useState('');
  const [selectedModel] = useState('anthropic/claude-sonnet-4');
  const [isModifying, setIsModifying] = useState(false);
  const [selectedNodeForModification, setSelectedNodeForModification] = useState<any>(null);
  const [result, setResult] = useState<string>('');

  const handleModify = async () => {
    if (!prompt.trim() || isModifying) return;

    if (activeTab === 'nodes' && !selectedNodeForModification) {
      setResult('Please select a node to modify');
      return;
    }

    if (activeTab === 'scenes' && !currentScene) {
      setResult('No scene available to modify');
      return;
    }

    setIsModifying(true);
    setResult('Generating modifications...');

    const endpoint = activeTab === 'nodes' ? '/api/ai/modify-node' : '/api/ai/modify-scene';
    
    try {
      const requestBody = activeTab === 'nodes' 
        ? {
            nodeData: selectedNodeForModification,
            prompt: prompt,
            model: selectedModel
          }
        : {
            sceneData: currentScene,
            prompt: prompt,
            model: selectedModel
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'progress') {
                accumulatedContent += data.content;
                setResult(accumulatedContent);
              } else if (data.type === 'success') {
                setResult('✅ ' + data.content);

                // Handle successful modification
                if (data.node && onNodeModified) {
                  onNodeModified(data.node);
                } else if (data.scene && onSceneModified) {
                  onSceneModified(data.scene);
                }
              } else if (data.type === 'error') {
                setResult('❌ ' + data.content);
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setIsModifying(false);
    }
  };

  const nodeOptions = currentNodes.map(node => ({
    value: node.id,
    label: `${node.data?.label || node.data?.type || 'Unknown'} (${node.id})`,
    description: node.data?.type || 'Unknown type'
  }));

  return (
    <div className={`modification-panel bg-gray-900 border border-gray-700 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Edit3 className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">AI Modifications</h3>
      </div>

      {/* Tab Selection */}
      <div className="flex mb-4 bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('nodes')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'nodes'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          Modify Nodes
        </button>
        <button
          onClick={() => setActiveTab('scenes')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'scenes'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          Modify Scene
        </button>
      </div>

      {/* Node Selection for Node Modifications */}
      {activeTab === 'nodes' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Node to Modify
          </label>
          <Dropdown
            value={selectedNodeForModification?.id || ''}
            onChange={(value) => {
              const node = currentNodes.find(n => n.id === value);
              setSelectedNodeForModification(node);
            }}
            options={nodeOptions}
            placeholder="Choose a node..."
            className="w-full"
          />
        </div>
      )}

      {/* Modification Prompt */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Describe the modification you want to make
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            activeTab === 'nodes'
              ? 'e.g., "Change the cube to be red instead of blue" or "Add a rotation parameter"'
              : 'e.g., "Add a rotating sphere above the existing geometry" or "Change all materials to metallic"'
          }
          className="w-full h-24 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleModify}
        disabled={isModifying || !prompt.trim() || (activeTab === 'nodes' && !selectedNodeForModification)}
        variant="primary"
        className="w-full mb-4"
      >
        {isModifying ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Modifying...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Apply Modifications
          </>
        )}
      </Button>

      {/* Result */}
      {result && (
        <div className="mt-4 p-3 bg-gray-800 border border-gray-600 rounded-lg">
          <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
} 