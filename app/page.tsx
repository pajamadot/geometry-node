'use client';

import GeometryNodeEditor from './components/GeometryNodeEditor';
import { LoggingProvider } from './components/LoggingContext';
import { AuthProvider } from './components/UserAuthProvider';
import { NodeProvider } from './components/NodeContext';
import { GeometryProvider } from './components/GeometryContext';
import { TimeProvider } from './components/TimeContext';
import JSONNodeDemo from './demo/JSONNodeDemo';
import NodePersistenceDemo from './demo/NodePersistenceDemo';
import { useState } from 'react';
import { Database, Code, Layers, Home as HomeIcon } from 'lucide-react';

export default function Home() {
  const [currentView, setCurrentView] = useState<'editor' | 'json-demo' | 'persistence-demo'>('editor');

  return (
    <AuthProvider>
      <LoggingProvider>
        <GeometryProvider>
          <TimeProvider>
                         <NodeProvider updateNodeData={() => {}}>
              <div className="min-h-screen bg-gray-50">
                {/* Navigation */}
                <nav className="bg-white border-b border-gray-200 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-6 h-6 text-blue-600" />
                      <h1 className="text-xl font-semibold text-gray-900">Geometry Script</h1>
                      <span className="text-sm text-gray-500">Data-Driven Node Editor</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentView('editor')}
                        className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-2 ${
                          currentView === 'editor' 
                            ? 'bg-blue-500 text-white' 
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                                                 <HomeIcon className="w-4 h-4" />
                        Editor
                      </button>
                      
                      <button
                        onClick={() => setCurrentView('json-demo')}
                        className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-2 ${
                          currentView === 'json-demo' 
                            ? 'bg-purple-500 text-white' 
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Code className="w-4 h-4" />
                        JSON Demo
                      </button>
                      
                      <button
                        onClick={() => setCurrentView('persistence-demo')}
                        className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-2 ${
                          currentView === 'persistence-demo' 
                            ? 'bg-green-500 text-white' 
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Database className="w-4 h-4" />
                        Database Demo
                      </button>
                    </div>
                  </div>
                </nav>

                {/* Content */}
                <div className="h-[calc(100vh-64px)]">
                  {currentView === 'editor' && <GeometryNodeEditor />}
                  {currentView === 'json-demo' && <JSONNodeDemo />}
                  {currentView === 'persistence-demo' && <NodePersistenceDemo />}
                </div>

                {/* Footer */}
                <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>
                      {currentView === 'editor' && 'Live Node Editor with Dynamic Registration'}
                      {currentView === 'json-demo' && 'JSON Serialization Pipeline Demo'}
                      {currentView === 'persistence-demo' && 'Database Persistence & API Integration'}
                    </span>
                  </div>
                </div>
              </div>
            </NodeProvider>
          </TimeProvider>
        </GeometryProvider>
      </LoggingProvider>
    </AuthProvider>
  );
}
