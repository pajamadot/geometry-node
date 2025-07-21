'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type LogLevel = 'info' | 'warning' | 'error' | 'success';

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  data?: any;
  category?: string;
  timestamp: Date;
}

interface LoggingContextType {
  logs: LogEntry[];
  addLog: (level: LogLevel, message: string, data?: any, category?: string) => void;
  clearLogs: () => void;
  getLogsByCategory: (category: string) => LogEntry[];
}

const LoggingContext = createContext<LoggingContextType | undefined>(undefined);

export const useLog = () => {
  const context = useContext(LoggingContext);
  if (!context) {
    throw new Error('useLog must be used within LoggingProvider');
  }
  return context;
};

interface LoggingProviderProps {
  children: ReactNode;
}

export const LoggingProvider: React.FC<LoggingProviderProps> = ({ children }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (level: LogLevel, message: string, data?: any, category?: string) => {
    const newLog: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      level,
      message,
      data,
      category,
      timestamp: new Date()
    };

    setLogs(prev => [newLog, ...prev].slice(0, 1000)); // Keep last 1000 logs
    
    // Also log to console for development
    console.log(`[${level.toUpperCase()}] ${message}`, data || '');
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const getLogsByCategory = (category: string) => {
    return logs.filter(log => log.category === category);
  };

  return (
    <LoggingContext.Provider value={{ logs, addLog, clearLogs, getLogsByCategory }}>
      {children}
    </LoggingContext.Provider>
  );
}; 