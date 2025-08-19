'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Wand2,
  Sparkles,
  Loader2,
  Command,
  Search,
  Edit3,
  Plus,
  Zap,
  ChevronRight,
  X,
  Send,
  Brain,
  Code,
  Layers,
  Settings,
  Activity,
  Terminal
} from 'lucide-react';
import { buildCatalog, buildSceneGenerationGuidelines } from '../agent/contextBuilders';

interface CommandSystemProps {
  onNodeGenerated?: (node: any) => void;
  onSceneGenerated?: (scene: any) => void;
  onNodeModified?: (node: any) => void;
  onSceneModified?: (scene: any) => void;
  currentNodes?: any[];
  currentScene?: { nodes: any[], edges: any[] };
}

interface Command {
  id: string;
  type: 'generate-node' | 'generate-scene' | 'modify-node' | 'modify-scene' | 'explain';
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  aliases: string[];
  usage: string;
}

interface CommandResult {
  id: string;
  command: Command;
  status: 'pending' | 'success' | 'error';
  content: string;
  timestamp: Date;
  data?: any;
  progress?: number;
}

interface GenerationProgress {
  stage: string;
  content: string;
  progress: number;
}

interface ParsedCommand {
  command: Command;
  prompt: string;
}

export function CommandSystem({
  onNodeGenerated,
  onSceneGenerated,
  onNodeModified,
  onSceneModified,
  currentNodes = [],
  currentScene
}: CommandSystemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<CommandResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const [aiMessages, setAiMessages] = useState<string[]>(["AI Agent is ready to help you"]);

  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Hacker-style commands with aliases
  const commands: Command[] = [
    {
      id: 'gen-node',
      type: 'generate-node',
      label: 'Generate Node',
      description: 'Create a new custom node with AI',
      icon: <Plus className="w-4 h-4" />,
      color: 'from-blue-500 to-cyan-500',
      aliases: ['node gen', 'n gen', 'gen node', 'create node', 'mk node'],
      usage: 'node gen <description>'
    },
    {
      id: 'gen-scene',
      type: 'generate-scene',
      label: 'Generate Scene',
      description: 'Create a complete scene with AI',
      icon: <Layers className="w-4 h-4" />,
      color: 'from-purple-500 to-pink-500',
      aliases: ['scene gen', 's gen', 'gen scene', 'create scene', 'mk scene'],
      usage: 'scene gen <description>'
    },
    {
      id: 'mod-node',
      type: 'modify-node',
      label: 'Modify Node',
      description: 'Edit an existing node with AI',
      icon: <Edit3 className="w-4 h-4" />,
      color: 'from-orange-500 to-red-500',
      aliases: ['node mod', 'n mod', 'mod node', 'edit node', 'change node'],
      usage: 'node mod <changes>'
    },
    {
      id: 'mod-scene',
      type: 'modify-scene',
      label: 'Modify Scene',
      description: 'Transform your current scene',
      icon: <Zap className="w-4 h-4" />,
      color: 'from-green-500 to-emerald-500',
      aliases: ['scene mod', 's mod', 'mod scene', 'edit scene', 'change scene'],
      usage: 'scene mod <changes>'
    },
    {
      id: 'explain',
      type: 'explain',
      label: 'Explain & Learn',
      description: 'Get explanations and learn concepts',
      icon: <Brain className="w-4 h-4" />,
      color: 'from-indigo-500 to-violet-500',
      aliases: ['explain', 'help', 'info', 'what is', 'how'],
      usage: 'explain <concept>'
    }
  ];

  // Parse command input
  const parseCommand = useCallback((input: string): ParsedCommand | null => {
    const trimmed = input.trim().toLowerCase();

    for (const command of commands) {
      for (const alias of command.aliases) {
        if (trimmed.startsWith(alias.toLowerCase())) {
          const prompt = input.slice(alias.length).trim();
          return { command, prompt };
        }
      }
    }

    return null;
  }, []);

  // Get command suggestions
  const getCommandSuggestions = useCallback((input: string) => {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return [];

    const suggestions: string[] = [];

    // Add matching aliases
    commands.forEach(cmd => {
      cmd.aliases.forEach(alias => {
        if (alias.toLowerCase().startsWith(trimmed)) {
          suggestions.push(alias);
        }
      });
    });

    // Add partial matches
    commands.forEach(cmd => {
      cmd.aliases.forEach(alias => {
        if (alias.toLowerCase().includes(trimmed) && !suggestions.includes(alias)) {
          suggestions.push(alias);
        }
      });
    });

    return suggestions.slice(0, 5);
  }, []);

  // Update suggestions when input changes
  useEffect(() => {
    const newSuggestions = getCommandSuggestions(input);
    setSuggestions(newSuggestions);
    setSelectedSuggestion(-1);
  }, [input, getCommandSuggestions]);

  // Keyboard shortcuts and navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setInput('');
        setGenerationProgress(null);
        setSuggestions([]);
        setSelectedSuggestion(-1);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle input navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedSuggestion(prev => Math.max(-1, prev - 1));
      } else if (commandHistory.length > 0) {
        const newIndex = Math.min(commandHistory.length - 1, historyIndex + 1);
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedSuggestion(prev => Math.min(suggestions.length - 1, prev + 1));
      } else if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'Tab' && selectedSuggestion >= 0) {
      e.preventDefault();
      setInput(suggestions[selectedSuggestion] + ' ');
      setSuggestions([]);
      setSelectedSuggestion(-1);
    }
  };

  // Auto-focus when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const executeCommand = async (parsedCommand: ParsedCommand) => {
    if (!parsedCommand.prompt.trim()) return;

    const { command, prompt } = parsedCommand;

    // Add to history
    const fullCommand = input;
    setCommandHistory(prev => [fullCommand, ...prev.slice(0, 19)]); // Keep last 20
    setHistoryIndex(-1);

    setIsExecuting(true);
    setGenerationProgress({
      stage: 'Initializing',
      content: 'Starting generation process...',
      progress: 0
    });

    const result: CommandResult = {
      id: crypto.randomUUID(),
      command,
      status: 'pending',
      content: '',
      timestamp: new Date(),
      progress: 0
    };

    setResults(prev => [result, ...prev]);
    setShowResults(true);

    let endpoint = '';
    let requestBody: any = {
      prompt,
      model: 'anthropic/claude-sonnet-4'
    };

    switch (command.type) {
      case 'generate-node':
        endpoint = '/api/ai/generate-node';
        setGenerationProgress(prev => prev ? { ...prev, stage: 'Analyzing Node Requirements', content: 'Understanding your node specifications...' } : null);
        break;
      case 'generate-scene':
        endpoint = '/api/ai/generate-scene';
        setGenerationProgress(prev => prev ? { ...prev, stage: 'Planning Scene Structure', content: 'Designing your scene layout...' } : null);
        break;
      case 'modify-node':
        endpoint = '/api/ai/modify-node';
        setGenerationProgress(prev => prev ? { ...prev, stage: 'Analyzing Existing Node', content: 'Understanding current node structure...' } : null);
        const firstNode = currentNodes[0];
        if (!firstNode) {
          updateResult(result.id, { status: 'error', content: 'No nodes available to modify' });
          setIsExecuting(false);
          setGenerationProgress(null);
          return;
        }
        requestBody.nodeData = firstNode;
        break;
      case 'modify-scene':
        endpoint = '/api/ai/modify-scene';
        setGenerationProgress(prev => prev ? { ...prev, stage: 'Analyzing Current Scene', content: 'Understanding your scene configuration...' } : null);
        if (!currentScene) {
          updateResult(result.id, { status: 'error', content: 'No scene available to modify' });
          setIsExecuting(false);
          setGenerationProgress(null);
          return;
        }
        requestBody.sceneData = currentScene;
        break;
      case 'explain':
        endpoint = '/api/ai/generate-node';
        setGenerationProgress(prev => prev ? { ...prev, stage: 'Gathering Information', content: 'Analyzing concepts to explain...' } : null);
        requestBody.mode = 'explain';
        break;
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let currentProgress = 10;

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
                currentProgress = Math.min(currentProgress + 2, 90);

                let stage = 'Generating';
                if (data.content.includes('analysis') || data.content.includes('analyzing')) {
                  stage = 'Analyzing Requirements';
                } else if (data.content.includes('creating') || data.content.includes('building')) {
                  stage = 'Creating Structure';
                } else if (data.content.includes('implementing') || data.content.includes('code')) {
                  stage = 'Implementing Logic';
                } else if (data.content.includes('optimizing') || data.content.includes('refining')) {
                  stage = 'Optimizing Result';
                }

                setGenerationProgress({
                  stage,
                  content: data.content.slice(-100),
                  progress: currentProgress
                });

                updateResult(result.id, {
                  content: accumulatedContent,
                  progress: currentProgress
                });
              } else if (data.type === 'success') {
                setGenerationProgress({
                  stage: 'Complete',
                  content: 'Generation completed successfully!',
                  progress: 100
                });

                updateResult(result.id, {
                  status: 'success',
                  content: accumulatedContent + '\n\n✅ ' + data.content,
                  data: data.node || data.scene,
                  progress: 100
                });

                if (data.node && onNodeGenerated) onNodeGenerated(data.node);
                if (data.scene && onSceneGenerated) onSceneGenerated(data.scene);
                if (data.node && onNodeModified) onNodeModified(data.node);
                if (data.scene && onSceneModified) onSceneModified(data.scene);

                // Close all modals after successful generation
                setTimeout(() => {
                  setGenerationProgress(null);
                  setIsOpen(false);
                  setInput('');
                  setSuggestions([]);
                  setSelectedSuggestion(-1);
                  setShowResults(false);
                }, 2000);

              } else if (data.type === 'error') {
                setGenerationProgress({
                  stage: 'Error',
                  content: 'Generation failed',
                  progress: 0
                });

                updateResult(result.id, {
                  status: 'error',
                  content: accumulatedContent + '\n\n❌ ' + data.content
                });

                setTimeout(() => setGenerationProgress(null), 3000);
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      setGenerationProgress({
        stage: 'Error',
        content: 'Network or processing error',
        progress: 0
      });

      updateResult(result.id, {
        status: 'error',
        content: `Error: ${error}`
      });

      setTimeout(() => setGenerationProgress(null), 3000);
    } finally {
      setIsExecuting(false);
    }
  };

  const updateResult = (id: string, updates: Partial<CommandResult>) => {
    setResults(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    runGeometryEditAgent(input);
    setInput('');
  };

  async function runGeometryEditAgent(userQuery: string) {
    const requestBody = {
      model: "anthropic/claude-sonnet-4",
      user_query: userQuery,
      scene_data: `${JSON.stringify(currentScene, null, 2)}`,
      catalog: buildCatalog(),
      scene_generation_guidelines: buildSceneGenerationGuidelines(),
    }
    const res = await fetch('/api/ai/geo-edit-flow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!res.body) throw new Error('No response body');

    setGenerationProgress({
      stage: 'Run Geometry Edit Agent',
      content: `Running geometry edit agent...`,
      progress: 0
    })

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) { break; }
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        try {
          const msgSSE: any = JSON.parse(line.replace(/^data:\s*/, ''));
          if (typeof msgSSE === 'object' && msgSSE !== null) {
            if (msgSSE.step === 'close') {
              break;
            }
            else if (msgSSE.step === 'apply_diff_finished' && msgSSE.content) {
              // switch by intent
              try {
                const sceneData = JSON.parse(msgSSE.content);
                console.log("sceneData: ", sceneData);
                if (msgSSE.intent === 'modify_scene') {
                  if (onSceneModified) {
                    onSceneModified(sceneData);
                  }
                }
                addMessage(`Scene updated successfully based on intent: ${msgSSE.intent || 'unknown'}`);
              } catch (error) {
                addMessage('Error parsing scene data from agent response');
              } finally {
              }
            } else if (msgSSE.step === 'intent_recognition' && msgSSE.content) {
              setGenerationProgress({
                stage: 'Intent Recognition',
                content: `Recognizing intent...`,
                progress: 10
              })
              addMessage(`Agent recognized intent: ${msgSSE.content}`);
            } else if (msgSSE.step === 'modify_scene' && msgSSE.content) {
              setGenerationProgress({
                stage: 'Modify Scene',
                content: `Modifying scene...`,
                progress: 20
              })
              addMessage(`Scene modification: ${msgSSE.content}`);
            } else if (msgSSE.step === 'chat' && msgSSE.content) {
              addMessage(msgSSE.content);
            } else if (msgSSE.step === 'edit_finished') {
              console.log(`runGeometryEditAgent\nedit_finished\n${msgSSE.content}`);
            } else if (msgSSE.step === 'error') {
              console.log(`runGeometryEditAgent\nerror\n${msgSSE.content}`);
            } else if (msgSSE.content) {
              addMessage(msgSSE.content);
            }
          }
        } catch {
        } finally {
        }
      }
    }
    setGenerationProgress(null);
    setIsOpen(false);
    setInput('');
    setSuggestions([]);
    setSelectedSuggestion(-1);
    setShowResults(false);
  }

  function addMessage(message: string) {
    setAiMessages(prev => [...prev, message]);
  }

  // Generation Progress Overlay
  if (generationProgress) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center">
        <div className="bg-black/95 backdrop-blur-xl border border-green-500/50 rounded-lg p-8 mx-4 max-w-md w-full shadow-2xl font-mono">
          <div className="text-center">
            {/* Terminal-style header */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center space-x-2 px-4 py-2 bg-gray-900/80 border border-green-500/30 rounded">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="ml-3 text-green-400 text-xs">ai-process.exe</span>
              </div>
            </div>

            {/* Animated Terminal Icon */}
            <div className="relative mb-6">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center border border-green-500/30">
                <Terminal className="w-8 h-8 text-green-400 animate-pulse" />
              </div>
              <div className="absolute inset-0 w-16 h-16 mx-auto rounded-lg bg-gradient-to-r from-green-600 to-blue-600 animate-ping opacity-20"></div>

              {/* Matrix-style particles */}
              <div className="absolute -top-2 -left-2 w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
              <div className="absolute -top-2 -right-2 w-1 h-1 bg-blue-400 rounded-full animate-bounce delay-100"></div>
              <div className="absolute -bottom-2 -left-2 w-1 h-1 bg-green-300 rounded-full animate-bounce delay-200"></div>
              <div className="absolute -bottom-2 -right-2 w-2 h-2 bg-blue-300 rounded-full animate-bounce delay-300"></div>
            </div>

            {/* Stage and Progress */}
            <div className="mb-4">
              <div className="text-green-400 text-xs mb-1 font-mono">[SYSTEM STATUS]</div>
              <h3 className="text-xl font-bold text-white mb-2 font-mono">{generationProgress.stage.toUpperCase()}</h3>
              <div className="bg-gray-900/50 border border-green-500/30 rounded p-3 mb-4">
                <div className="text-green-300 text-sm font-mono text-left overflow-hidden">
                  <span className="text-green-500">&gt;</span> {generationProgress.content}
                  <span className="animate-pulse">_</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-800 border border-green-500/30 rounded-full h-3 mb-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-500 ease-out relative"
                style={{ width: `${generationProgress.progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>

            {/* Progress Stats */}
            <div className="flex justify-between items-center text-xs font-mono mb-4">
              <span className="text-gray-400">Progress:</span>
              <span className="text-green-400">{Math.round(generationProgress.progress)}%</span>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center justify-center space-x-2 p-3 bg-gray-900/50 border border-green-500/30 rounded">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm font-mono">NEURAL_NETWORK_ACTIVE</span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse delay-500"></div>
            </div>

            {/* AI Messages */}
            <div className="text-green-400 text-xs mb-4 opacity-70 max-h-40 overflow-y-auto font-mono bg-black/40 rounded p-2 border border-green-500/10">
              {aiMessages && aiMessages.length > 0 ? (
                aiMessages.map((msg, idx) => (
                  <div key={idx} className="mb-1 whitespace-pre-line">
                    <span className="text-green-500">&gt;</span> {msg}
                  </div>
                ))
              ) : (
                <div className="italic text-green-700/60">No AI messages yet.</div>
              )}
            </div>

          </div>
        </div>
      </div>
    );
  }

  // Floating trigger button
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="group relative bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 hover:from-green-700 hover:via-blue-700 hover:to-purple-700 text-white rounded-full p-4 shadow-2xl transform transition-all duration-300 hover:scale-110"
        >
          <Terminal className="w-6 h-6" />

          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-green-400 text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity font-mono">
            Press ⌘K to hack the matrix
          </div>

          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-600 to-purple-600 animate-ping opacity-20"></div>
        </button>
      </div>
    );
  }

  const parsed = parseCommand(input);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={() => setIsOpen(false)}
      />

      {/* Terminal Panel */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
        <div
          ref={panelRef}
          className="w-full max-w-4xl mx-4 bg-black/95 backdrop-blur-xl border border-green-500/30 rounded-lg shadow-2xl overflow-hidden font-mono"
        >
          {/* Terminal Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-900/80 border-b border-green-500/30">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="ml-4 text-green-400 text-sm">geometry-ai-terminal v2.1.3</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Terminal Content */}
          <div className="p-4 max-h-[70vh] overflow-y-auto">
            {/* ASCII Art Header */}
            <div className="text-green-400 text-xs mb-4 opacity-70">
              <pre>{`
 ██████╗ ███████╗ ██████╗ ███╗   ███╗███████╗████████╗██████╗ ██╗   ██╗
██╔════╝ ██╔════╝██╔═══██╗████╗ ████║██╔════╝╚══██╔══╝██╔══██╗╚██╗ ██╔╝
██║  ███╗█████╗  ██║   ██║██╔████╔██║█████╗     ██║   ██████╔╝ ╚████╔╝ 
██║   ██║██╔══╝  ██║   ██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██╗  ╚██╔╝  
╚██████╔╝███████╗╚██████╔╝██║ ╚═╝ ██║███████╗   ██║   ██║  ██║   ██║   
 ╚═════╝ ╚══════╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝   ╚═╝   
              `}</pre>
            </div>

            {/* Command Help */}
            {input.length === 0 && (
              <div className="text-gray-400 text-sm mb-6 space-y-2">
                <div className="text-green-400 mb-3">Available commands:</div>
                {commands.map((cmd) => (
                  <div key={cmd.id} className="flex justify-between">
                    <span className="text-blue-400">{cmd.aliases[0]}</span>
                    <span className="text-gray-500 ml-4">{cmd.description}</span>
                  </div>
                ))}
                <div className="mt-4 text-xs text-gray-500">
                  Examples: <span className="text-yellow-400">node gen create a sphere</span> • <span className="text-yellow-400">scene mod add lighting</span>
                </div>
              </div>
            )}

            {/* Command Input */}
            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="flex items-center">
                <span className="text-green-400 mr-2">root@geometry:~$</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter command..."
                  className="flex-1 bg-transparent text-green-400 font-mono focus:outline-none caret-green-400"
                  disabled={isExecuting}
                  autoComplete="off"
                />
                {parsed && (
                  <div className="ml-2 text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded border border-green-500/30">
                    {parsed.command.label}
                  </div>
                )}
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="ml-20 space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={suggestion}
                      className={`text-sm cursor-pointer px-2 py-1 rounded ${index === selectedSuggestion
                        ? 'bg-green-500/20 text-green-300'
                        : 'text-gray-400 hover:text-green-400'
                        }`}
                      onClick={() => {
                        setInput(suggestion + ' ');
                        setSuggestions([]);
                        setSelectedSuggestion(-1);
                        inputRef.current?.focus();
                      }}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}

              {/* Parse Error */}
              {input.trim() && !parsed && (
                <div className="ml-20 text-red-400 text-sm">
                  Command not recognized. Type a valid command or press Tab for suggestions.
                </div>
              )}
            </form>

            {/* Command History */}
            {commandHistory.length > 0 && input.length === 0 && (
              <div className="mt-6 text-gray-500 text-xs">
                <div className="text-green-400 mb-2">Recent commands:</div>
                {commandHistory.slice(0, 3).map((cmd, index) => (
                  <div key={index} className="opacity-60">
                    root@geometry:~$ {cmd}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Execute Button */}
          {parsed && parsed.prompt.trim() && (
            <div className="p-4 border-t border-green-500/30 bg-gray-900/40">
              <button
                onClick={handleSubmit}
                disabled={isExecuting}
                className="w-full flex items-center justify-center p-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-black font-bold rounded transition-colors"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    EXECUTING...
                  </>
                ) : (
                  <>
                    <Terminal className="w-4 h-4 mr-2" />
                    EXECUTE: {parsed.command.label.toUpperCase()}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Shortcuts */}
          <div className="px-4 pb-4">
            <div className="text-xs text-gray-600 text-center font-mono">
              <kbd className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-600">⌘K</kbd> open •
              <kbd className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-600 mx-1">Tab</kbd> autocomplete •
              <kbd className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-600">↑↓</kbd> history •
              <kbd className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-600 mx-1">Esc</kbd> exit
            </div>
          </div>
        </div>
      </div>

      {/* Results Panel */}
      {showResults && results.length > 0 && (
        <div className="fixed bottom-6 left-6 w-96 max-h-96 bg-black/95 backdrop-blur-xl border border-green-500/30 rounded-lg shadow-2xl overflow-hidden z-40 font-mono">
          <div className="flex items-center justify-between p-3 border-b border-green-500/30">
            <div className="flex items-center">
              <Terminal className="w-4 h-4 text-green-400 mr-2" />
              <span className="text-green-400 font-bold text-sm">EXECUTION_LOG</span>
            </div>
            <button
              onClick={() => setShowResults(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto p-3 space-y-2">
            {results.map((result) => (
              <div key={result.id} className="border border-gray-700/50 rounded p-2 bg-gray-900/40">
                <div className="flex items-center mb-1">
                  <span className="text-green-400 text-xs font-bold">[{result.command.type.toUpperCase()}]</span>
                  <div className="ml-auto flex items-center">
                    {result.status === 'pending' && (
                      <div className="flex items-center">
                        {result.progress && result.progress > 0 && (
                          <span className="text-xs text-yellow-400 mr-2">{Math.round(result.progress)}%</span>
                        )}
                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                      </div>
                    )}
                    {result.status === 'success' && (
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    )}
                    {result.status === 'error' && (
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    )}
                  </div>
                </div>

                {result.status === 'pending' && result.progress && result.progress > 0 && (
                  <div className="w-full bg-gray-700 rounded-full h-1 mb-1">
                    <div
                      className="bg-green-400 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${result.progress}%` }}
                    ></div>
                  </div>
                )}

                {result.content && (
                  <div className="text-xs text-gray-300 font-mono">
                    {result.content.length > 80
                      ? result.content.substring(0, 80) + '...'
                      : result.content
                    }
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
} 