'use client';

import React, { createContext, useContext, useState } from 'react';

interface LogsVisibilityContextType {
  showLogs: boolean;
  toggleLogs: () => void;
  setShowLogs: (show: boolean) => void;
}

const LogsVisibilityContext = createContext<LogsVisibilityContextType | undefined>(undefined);

export function LogsVisibilityProvider({ children }: { children: React.ReactNode }) {
  const [showLogs, setShowLogs] = useState(false);

  const toggleLogs = () => {
    setShowLogs(prev => !prev);
  };

  return (
    <LogsVisibilityContext.Provider value={{ showLogs, toggleLogs, setShowLogs }}>
      {children}
    </LogsVisibilityContext.Provider>
  );
}

export function useLogsVisibility() {
  const context = useContext(LogsVisibilityContext);
  if (context === undefined) {
    throw new Error('useLogsVisibility must be used within a LogsVisibilityProvider');
  }
  return context;
} 