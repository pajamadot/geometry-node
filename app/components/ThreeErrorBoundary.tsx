'use client';

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  isWebGLError?: boolean;
}

export default class ThreeErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a WebGL-related error
    const isWebGLError = error.message.includes('WebGL') || 
                        error.message.includes('context') ||
                        error.message.includes('canvas');
    
    return { hasError: true, error, isWebGLError };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Three.js Error:', error, errorInfo);
    
    // Reset retry count on new errors
    this.retryCount = 0;
  }

  handleRetry = () => {
    this.retryCount++;
    
    if (this.retryCount <= this.maxRetries) {
      this.setState({ hasError: false, error: undefined });
      
      // Force a small delay to allow cleanup
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } else {
      console.error('Max retries reached, manual refresh required');
    }
  };

  render() {
    if (this.state.hasError) {
      const isWebGLError = this.state.error?.message.includes('WebGL') || 
                          this.state.error?.message.includes('context');

      return (
        <div className="h-full w-full flex items-center justify-center bg-gray-800">
          <div className="text-center text-white p-6 max-w-md">
            <div className="text-red-400 text-xl mb-4">
              {isWebGLError ? '🔧 WebGL Error' : '⚠️ Rendering Error'}
            </div>
            
            <div className="text-gray-300 mb-4">
              {isWebGLError ? (
                <>
                  WebGL context creation failed. This can happen due to:
                  <ul className="text-sm text-left mt-2 space-y-1">
                    <li>• Graphics driver issues</li>
                    <li>• Browser hardware acceleration disabled</li>
                    <li>• Multiple WebGL contexts</li>
                    <li>• Development hot reloads</li>
                  </ul>
                </>
              ) : (
                'A rendering error occurred in the 3D viewport.'
              )}
            </div>

            {this.retryCount < this.maxRetries ? (
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors mb-4"
              >
                Retry ({this.maxRetries - this.retryCount} attempts left)
              </button>
            ) : (
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors mb-4"
              >
                Refresh Page
              </button>
            )}

            <details className="text-left">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
                Technical Details
              </summary>
              <div className="text-xs text-gray-500 mt-2 bg-gray-900 p-2 rounded">
                <strong>Error:</strong> {this.state.error?.message}
                <br />
                <strong>Retry Count:</strong> {this.retryCount}/{this.maxRetries}
              </div>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 