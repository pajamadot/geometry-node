'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type LogLevel = 'error' | 'warning' | 'info' | 'debug' | 'success';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  details?: any;
  category?: string;
}

interface LoggingContextValue {
  logs: LogEntry[];
  addLog: (level: LogLevel, message: string, details?: any, category?: string) => void;
  clearLogs: () => void;
  getLogsByLevel: (level: LogLevel) => LogEntry[];
  getLogsByCategory: (category: string) => LogEntry[];
}

const LoggingContext = createContext<LoggingContextValue | undefined>(undefined);

export function useLogging() {
  const context = useContext(LoggingContext);
  if (context === undefined) {
    throw new Error('useLogging must be used within a LoggingProvider');
  }
  return context;
}

interface LoggingProviderProps {
  children: ReactNode;
}

export function LoggingProvider({ children }: LoggingProviderProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((level: LogLevel, message: string, details?: any, category?: string) => {
    const newLog: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      message,
      details,
      category
    };

    setLogs(prevLogs => {
      const updatedLogs = [newLog, ...prevLogs];
      // Keep only the last 100 logs to prevent memory issues
      return updatedLogs.slice(0, 100);
    });

    // Also log to console for development
    const consoleMessage = category ? `[${category}] ${message}` : message;
    switch (level) {
      case 'error':
        console.error(consoleMessage, details);
        break;
      case 'warning':
        console.warn(consoleMessage, details);
        break;
      case 'debug':
        console.debug(consoleMessage, details);
        break;
      case 'success':
        console.log(`✅ ${consoleMessage}`, details);
        break;
      default:
        console.log(consoleMessage, details);
    }
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const getLogsByLevel = useCallback((level: LogLevel) => {
    return logs.filter(log => log.level === level);
  }, [logs]);

  const getLogsByCategory = useCallback((category: string) => {
    return logs.filter(log => log.category === category);
  }, [logs]);

  const value: LoggingContextValue = {
    logs,
    addLog,
    clearLogs,
    getLogsByLevel,
    getLogsByCategory
  };

  return (
    <LoggingContext.Provider value={value}>
      {children}
    </LoggingContext.Provider>
  );
} 