'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Wand2, Sparkles, Loader2, Download, Upload, Copy, Settings, RefreshCw } from 'lucide-react';
import Button from './ui/Button';
import Dropdown from './ui/Dropdown';
import Tooltip from './ui/Tooltip';

export interface AIMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  status?: 'pending' | 'complete' | 'error';
}

export interface AIGenerationResult {
  type: 'node' | 'scene';
  data: any;
  success: boolean;
  error?: string;
}

interface AIPanelProps {
  onNodeGenerated?: (node: any) => void;
  onSceneGenerated?: (scene: any) => void;
  onNodeModified?: (node: any) => void;
  onSceneModified?: (scene: any) => void;
  className?: string;
  currentNodes?: any[];
  currentScene?: { nodes: any[], edges: any[] };
}

export function AIPanel({ 
  onNodeGenerated, 
  onSceneGenerated, 
  onNodeModified, 
  onSceneModified, 
  currentNodes = [], 
  currentScene,
  className = '' 
}: AIPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'nodes' | 'scenes'>('nodes');
  const [prompt, setPrompt] = useState('');
  const [selectedModel] = useState('openai/gpt-5');
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [generationMode, setGenerationMode] = useState<'generate' | 'explain'>('generate');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);



  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clean up event source on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const addMessage = (message: Omit<AIMessage, 'id' | 'timestamp'>) => {
    const newMessage: AIMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  };

  const updateMessage = (id: string, updates: Partial<AIMessage>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    
    // Add user message
    addMessage({
      type: 'user',
      content: prompt,
    });

    // Add assistant message placeholder
    const assistantMessageId = addMessage({
      type: 'assistant',
      content: '',
      status: 'pending'
    });

    const endpoint = activeTab === 'nodes' ? '/api/ai/generate-node' : '/api/ai/generate-scene';
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model: selectedModel,
          mode: generationMode
        }),
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
              
              if (data.type === 'progress' || data.type === 'stream') {
                accumulatedContent += data.content;
                updateMessage(assistantMessageId, {
                  content: accumulatedContent,
                  status: 'pending'
                });
              } else if (data.type === 'success') {
                accumulatedContent += '\n\n✅ ' + data.content;
                updateMessage(assistantMessageId, {
                  content: accumulatedContent,
                  status: 'complete'
                });

                // Handle successful generation
                if (data.node && onNodeGenerated) {
                  onNodeGenerated(data.node);
                } else if (data.scene && onSceneGenerated) {
                  onSceneGenerated(data.scene);
                }
              } else if (data.type === 'error') {
                accumulatedContent += '\n\n❌ ' + data.content;
                updateMessage(assistantMessageId, {
                  content: accumulatedContent,
                  status: 'error'
                });
              } else if (data.type === 'done') {
                updateMessage(assistantMessageId, {
                  status: 'complete'
                });
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      updateMessage(assistantMessageId, {
        content: `Error: ${error}`,
        status: 'error'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const exportMessages = () => {
    const data = JSON.stringify(messages, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-chat-${activeTab}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) {
    return (
      <div className={`fixed right-4 bottom-4 z-[60] ${className}`}>
        <Tooltip content="Open AI Assistant - Generate nodes and scenes with prompts!" placement="left">
          <Button
            onClick={() => setIsOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full p-4 shadow-2xl border-2 border-purple-400/30 animate-pulse hover:animate-none transition-all duration-300 hover:scale-110"
          >
            <Wand2 className="w-6 h-6" />
          </Button>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className={`fixed right-4 bottom-4 w-96 h-[600px] bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-[60] flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h3 className="text-white font-semibold">AI Assistant</h3>
        </div>
        <Button
          onClick={() => setIsOpen(false)}
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white"
        >
          ×
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab('nodes')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'nodes'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Generate Nodes
        </button>
        <button
          onClick={() => setActiveTab('scenes')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'scenes'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Generate Scenes
        </button>
      </div>

             {/* Settings */}
       <div className="p-4 border-b border-gray-700 space-y-3">
         <div className="flex items-center justify-between">
           <label className="text-sm text-gray-300">Mode:</label>
           <Dropdown
             value={generationMode}
             onChange={(value: string) => setGenerationMode(value as 'generate' | 'explain')}
             options={[
               { value: 'generate', label: 'Generate' },
               { value: 'explain', label: 'Explain' }
             ]}
             className="w-24 text-xs"
           />
         </div>
       </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${
              message.type === 'user'
                ? 'bg-blue-600 text-white ml-4'
                : 'bg-gray-700 text-gray-100 mr-4'
            } rounded-lg p-3 text-sm`}
          >
            <div className="whitespace-pre-wrap">{message.content}</div>
            {message.status === 'pending' && (
              <div className="flex items-center mt-2 text-xs opacity-70">
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                Generating...
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex space-x-2 mb-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              activeTab === 'nodes'
                ? 'Describe the node you want to create...'
                : 'Describe the scene you want to create...'
            }
            className="flex-1 bg-gray-800 text-white rounded border border-gray-600 px-3 py-2 text-sm resize-none"
            rows={2}
            disabled={isGenerating}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleGenerate();
              }
            }}
          />
          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            onClick={clearMessages}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Clear
          </Button>
          <Button
            onClick={exportMessages}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            <Download className="w-3 h-3 mr-1" />
            Export
          </Button>
        </div>
      </div>
    </div>
  );
} 