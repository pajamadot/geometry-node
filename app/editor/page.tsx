'use client';

import React from 'react';
import { ReactFlowProvider } from 'reactflow';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs';
import GeometryNodeEditor from '../components/GeometryNodeEditor';
import ThreeViewport from '../components/ThreeViewport';
import FallbackViewport from '../components/FallbackViewport';
import { GeometryProvider } from '../components/GeometryContext';
import { TimeProvider } from '../components/TimeContext';
import ResizableLayout from '../components/ResizableLayout';
import SystemMonitor from '../components/SystemMonitor';
import { LoggingProvider } from '../components/LoggingContext';
import LogPanel from '../components/LogPanel';
import { ModalProvider } from '../components/ModalContext';

export default function EditorPage() {
  const [showShortcuts, setShowShortcuts] = React.useState(true);

  // Auto-hide shortcuts after 5 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => setShowShortcuts(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Left Panel Component - 3D Viewport
  const LeftPanel = (
    <div className="bg-gray-900 relative h-full">
      <div className="h-full relative">
        {/* Viewport Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-black/90 backdrop-blur-sm border-b border-gray-800 p-3">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
            <h2 className="text-white text-sm font-semibold tracking-wide">3D Viewport</h2>
            <div className="px-2 py-1 bg-gray-800/60 rounded-full text-xs text-cyan-300 font-medium">
              LIVE
            </div>
          </div>
        </div>
        <div className="pt-12 h-full">
          <ThreeViewport />
        </div>
      </div>
    </div>
  );

  // Right Panel Component - Node Editor
  const RightPanel = (
    <div className="bg-black relative h-full">
      <div className="h-full relative">
        {/* Node Editor Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-black/90 backdrop-blur-sm border-b border-gray-800 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
              <h2 className="text-white text-sm font-semibold tracking-wide">Geometry Nodes</h2>
            </div>
            <div className="text-xs text-gray-500 font-medium">
              Right-click to create • Right-click nodes to manage • Alt+click to break • Time animation
            </div>
          </div>
        </div>
        <div className="pt-12 h-full">
          <ReactFlowProvider>
            <GeometryNodeEditor />
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <SignedIn>
        <ModalProvider>
          <LoggingProvider>
            <TimeProvider>
              <GeometryProvider>
                <div className="h-screen w-screen overflow-hidden bg-black text-white relative">
                  <ResizableLayout
                    leftPanel={LeftPanel}
                    rightPanel={RightPanel}
                    initialLeftWidth={40}
                    minLeftWidth={25}
                    maxLeftWidth={75}
                  />
                  
                  {/* Layout shortcuts indicator */}
                  {showShortcuts && (
                    <div 
                      className="absolute bottom-3 left-1/2 transform -translate-x-1/2 z-40 bg-black/80 backdrop-blur-sm border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-400 transition-opacity duration-500"
                      onMouseEnter={() => setShowShortcuts(true)}
                    >
                      <div className="flex items-center space-x-4">
                        <span>Drag splitter to resize</span>
                        <span className="text-gray-600">|</span>
                        <span><kbd className="bg-gray-800 px-1 rounded">Ctrl+[</kbd> <kbd className="bg-gray-800 px-1 rounded">Ctrl+]</kbd> <kbd className="bg-gray-800 px-1 rounded">Ctrl+\</kbd></span>
                      </div>
                    </div>
                  )}
                  
                  {/* Memory Monitor */}
                  <SystemMonitor />
                  
                  {/* Log Panel */}
                  <LogPanel />
                </div>
              </GeometryProvider>
            </TimeProvider>
          </LoggingProvider>
        </ModalProvider>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
} 