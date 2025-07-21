'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { X, AlertTriangle, Info, HelpCircle, ChevronRight } from 'lucide-react';

export interface ModalOptions {
  title: string;
  message: string;
  type?: 'confirm' | 'alert' | 'info' | 'warning' | 'error';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  details?: string;
  showDetails?: boolean;
}

interface ModalContextValue {
  showModal: (options: ModalOptions) => Promise<boolean>;
  showConfirm: (title: string, message: string, details?: string) => Promise<boolean>;
  showAlert: (title: string, message: string, type?: 'info' | 'warning' | 'error') => Promise<void>;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

interface ModalState {
  isOpen: boolean;
  options: ModalOptions | null;
  resolve: ((value: boolean) => void) | null;
}

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    options: null,
    resolve: null
  });

  const showModal = useCallback((options: ModalOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        options,
        resolve
      });
    });
  }, []);

  const showConfirm = useCallback((title: string, message: string, details?: string): Promise<boolean> => {
    return showModal({
      title,
      message,
      details,
      type: 'confirm',
      confirmText: 'Confirm',
      cancelText: 'Cancel'
    });
  }, [showModal]);

  const showAlert = useCallback((title: string, message: string, type: 'info' | 'warning' | 'error' = 'info'): Promise<void> => {
    return new Promise((resolve) => {
      showModal({
        title,
        message,
        type,
        confirmText: 'OK'
      }).then(() => resolve());
    });
  }, [showModal]);

  const closeModal = useCallback(() => {
    setModalState(prev => {
      if (prev.resolve) {
        prev.resolve(false);
      }
      return {
        isOpen: false,
        options: null,
        resolve: null
      };
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setModalState(prev => {
      if (prev.resolve) {
        prev.resolve(true);
      }
      if (prev.options?.onConfirm) {
        prev.options.onConfirm();
      }
      return {
        isOpen: false,
        options: null,
        resolve: null
      };
    });
  }, []);

  const handleCancel = useCallback(() => {
    setModalState(prev => {
      if (prev.resolve) {
        prev.resolve(false);
      }
      if (prev.options?.onCancel) {
        prev.options.onCancel();
      }
      return {
        isOpen: false,
        options: null,
        resolve: null
      };
    });
  }, []);

  const contextValue: ModalContextValue = {
    showModal,
    showConfirm,
    showAlert,
    closeModal
  };

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
      {modalState.isOpen && modalState.options && (
        <Modal
          options={modalState.options}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          onClose={closeModal}
        />
      )}
    </ModalContext.Provider>
  );
}

// Modal component with themed styling
interface ModalProps {
  options: ModalOptions;
  onConfirm: () => void;
  onCancel: () => void;
  onClose: () => void;
}

function Modal({ options, onConfirm, onCancel, onClose }: ModalProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Handle keyboard events
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        onConfirm();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onConfirm, onClose]);

  const getModalStyles = (type: string) => {
    switch (type) {
      case 'error':
        return {
          headerBg: 'bg-gradient-to-r from-red-600 to-red-500',
          borderColor: 'border-red-500/30',
          iconColor: 'text-red-400',
          confirmBtn: 'bg-red-600 hover:bg-red-700 border-red-500'
        };
      case 'warning':
        return {
          headerBg: 'bg-gradient-to-r from-amber-600 to-amber-500',
          borderColor: 'border-amber-500/30',
          iconColor: 'text-amber-400',
          confirmBtn: 'bg-amber-600 hover:bg-amber-700 border-amber-500'
        };
      case 'info':
        return {
          headerBg: 'bg-gradient-to-r from-blue-600 to-blue-500',
          borderColor: 'border-blue-500/30',
          iconColor: 'text-blue-400',
          confirmBtn: 'bg-blue-600 hover:bg-blue-700 border-blue-500'
        };
      default: // confirm
        return {
          headerBg: 'bg-gradient-to-r from-cyan-600 to-cyan-500',
          borderColor: 'border-cyan-500/30',
          iconColor: 'text-cyan-400',
          confirmBtn: 'bg-cyan-600 hover:bg-cyan-700 border-cyan-500'
        };
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'error': return <X size={16} />;
      case 'warning': return <AlertTriangle size={16} />;
      case 'info': return <Info size={16} />;
      default: return <HelpCircle size={16} />;
    }
  };

  const styles = getModalStyles(options.type || 'confirm');
  const icon = getIcon(options.type || 'confirm');

  // Handle click outside to close (for non-critical modals)
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && options.type !== 'error') {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div 
        className={`bg-gradient-to-br from-slate-800 to-slate-900 border ${styles.borderColor} rounded-lg backdrop-blur-sm max-w-md w-full mx-4 overflow-hidden`}
        style={{
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 12px 24px rgba(0, 0, 0, 0.4), 0 6px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`${styles.headerBg} px-4 py-3`}>
          <h3 className="text-white font-semibold flex items-center gap-2">
            <span className={styles.iconColor}>{icon}</span>
            {options.title}
          </h3>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
            {options.message}
          </p>
          
          {options.details && (
            <div className="mt-3">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
              >
                <ChevronRight 
                  size={12} 
                  className={`transform transition-transform ${showDetails ? 'rotate-90' : ''}`} 
                />
                {showDetails ? 'Hide Details' : 'Show Details'}
              </button>
              
              {showDetails && (
                <div className="mt-2 p-3 bg-slate-900/50 border border-slate-600/30 rounded text-xs text-gray-400 max-h-32 overflow-y-auto custom-scrollbar">
                  <pre className="whitespace-pre-wrap font-mono">{options.details}</pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 py-3 bg-slate-900/50 border-t border-slate-600/30 flex gap-2 justify-end">
          {options.type === 'confirm' && (
            <button
              onClick={onCancel}
              className="px-3 py-2 text-xs font-medium text-gray-300 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded transition-colors"
            >
              {options.cancelText || 'Cancel'}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`px-3 py-2 text-xs font-medium text-white ${styles.confirmBtn} border rounded transition-colors`}
          >
            {options.confirmText || 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
} 