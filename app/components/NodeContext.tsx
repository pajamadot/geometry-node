'use client';

import React, { createContext, useContext, ReactNode } from 'react';

interface NodeContextValue {
  updateNodeData: (nodeId: string, newData: any) => void;
}

const NodeContext = createContext<NodeContextValue | null>(null);

interface NodeProviderProps {
  children: ReactNode;
  updateNodeData: (nodeId: string, newData: any) => void;
}

export function NodeProvider({ children, updateNodeData }: NodeProviderProps) {
  const value: NodeContextValue = {
    updateNodeData,
  };

  return (
    <NodeContext.Provider value={value}>
      {children}
    </NodeContext.Provider>
  );
}

export function useNodeContext() {
  const context = useContext(NodeContext);
  if (!context) {
    throw new Error('useNodeContext must be used within a NodeProvider');
  }
  return context;
} 