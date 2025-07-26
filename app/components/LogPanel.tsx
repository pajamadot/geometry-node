'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, Info, Search, FileText, Bell, BellOff, ChevronRight } from 'lucide-react';
import { useLogging, LogEntry, LogLevel } from './LoggingContext';

interface LogPanelProps {
  isVisible?: boolean;
  onClose?: () => void;
}

export default function LogPanel({ isVisible = false, onClose }: LogPanelProps) {
  const { logs, clearLogs, getLogsByLevel } = useLogging();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<LogLevel | 'all'>('all');
  const [autoExpandOnError, setAutoExpandOnError] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('logPanel-autoExpandOnError');
      return saved === 'true';
    }
    return false;
  });
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  // Save auto-expand setting to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('logPanel-autoExpandOnError', autoExpandOnError.toString());
    }
  }, [autoExpandOnError]);

  // Auto-expand when there are new errors (only if enabled)
  useEffect(() => {
    if (autoExpandOnError) {
      const errors = getLogsByLevel('error');
      if (errors.length > 0 && !isExpanded) {
        setIsExpanded(true);
      }
    }
  }, [logs, getLogsByLevel, isExpanded, autoExpandOnError]);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (logContainerRef.current && isExpanded) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, isExpanded]);

  const filteredLogs = selectedLevel === 'all' 
    ? logs 
    : logs.filter(log => log.level === selectedLevel);

  const getLogIcon = (level: LogLevel) => {
    switch (level) {
      case 'error': return <X size={14} className="text-red-400" />;
      case 'warning': return <AlertTriangle size={14} className="text-yellow-400" />;
      case 'success': return <CheckCircle size={14} className="text-green-400" />;
      case 'info': return <Info size={14} className="text-blue-400" />;
      case 'debug': return <Search size={14} className="text-purple-400" />;
      default: return <FileText size={14} className="text-gray-400" />;
    }
  };

  const getLogColor = (level: LogLevel) => {
    switch (level) {
      case 'error': return 'text-red-400 bg-red-900/20 border-red-500/30';
      case 'warning': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      case 'success': return 'text-green-400 bg-green-900/20 border-green-500/30';
      case 'info': return 'text-blue-400 bg-blue-900/20 border-blue-500/30';
      case 'debug': return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
      default: return 'text-gray-300 bg-gray-800/20 border-gray-600/30';
    }
  };

  const getLevelBadgeColor = (level: LogLevel) => {
    switch (level) {
      case 'error': return 'bg-red-600 text-white';
      case 'warning': return 'bg-yellow-600 text-white';
      case 'success': return 'bg-green-600 text-white';
      case 'info': return 'bg-blue-600 text-white';
      case 'debug': return 'bg-gray-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  const errorCount = getLogsByLevel('error').length;
  const warningCount = getLogsByLevel('warning').length;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-t border-gray-700 transition-all duration-300 ${
      isExpanded ? 'h-80' : 'h-12'
    }`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-gray-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <ChevronRight 
              size={14}
              className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
            />
            <h3 className="text-sm font-semibold text-white">Compilation Logs</h3>
          </div>
          
          {/* Status badges */}
          <div className="flex items-center space-x-2">
            {errorCount > 0 && (
              <span className="px-2 py-1 text-xs bg-red-600 text-white rounded-full">
                {errorCount} Error{errorCount !== 1 ? 's' : ''}
              </span>
            )}
            {warningCount > 0 && (
              <span className="px-2 py-1 text-xs bg-yellow-600 text-white rounded-full">
                {warningCount} Warning{warningCount !== 1 ? 's' : ''}
              </span>
            )}
            {logs.length === 0 && (
              <span className="px-2 py-1 text-xs bg-gray-600 text-white rounded-full">
                No logs
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Filter dropdown */}
          {isExpanded && (
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as LogLevel | 'all')}
              className="px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-400 focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="all">All Logs</option>
              <option value="error">Errors</option>
              <option value="warning">Warnings</option>
              <option value="success">Success</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
            </select>
          )}

          {/* Auto-expand toggle */}
          {isExpanded && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setAutoExpandOnError(!autoExpandOnError);
              }}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                autoExpandOnError 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
              title={autoExpandOnError ? 'Auto-expand on errors: ON' : 'Auto-expand on errors: OFF'}
            >
              <div className="flex items-center gap-1">
                <span className="text-xs">Auto</span>
                {autoExpandOnError ? <Bell size={12} /> : <BellOff size={12} />}
              </div>
            </button>
          )}

          {/* Clear button */}
          {logs.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearLogs();
              }}
              className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            >
              Clear
            </button>
          )}

          {/* Close button */}
          {onClose && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Log content */}
      {isExpanded && (
        <div 
          ref={logContainerRef}
          className="h-64 overflow-y-auto px-4 pb-4 space-y-1"
        >
          {filteredLogs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">📋</div>
              <div>No logs to display</div>
              {selectedLevel !== 'all' && (
                <div className="text-xs mt-1">Try selecting "All Logs" to see other messages</div>
              )}
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`p-2 rounded border-l-4 ${getLogColor(log.level)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2 flex-1">
                    <span className="text-lg">{getLogIcon(log.level)}</span>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`px-1.5 py-0.5 text-xs rounded font-medium ${getLevelBadgeColor(log.level)}`}>
                          {log.level.toUpperCase()}
                        </span>
                        {log.category && (
                          <span className="px-1.5 py-0.5 text-xs bg-gray-700 text-gray-300 rounded">
                            {log.category}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {formatTime(log.timestamp)}
                        </span>
                      </div>
                      <div className="mt-1 text-sm font-mono break-words">
                        {log.message}
                      </div>
                      {log.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                            Show details
                          </summary>
                          <pre className="mt-1 p-2 bg-black/30 rounded text-xs text-gray-300 overflow-x-auto">
                            {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
} 