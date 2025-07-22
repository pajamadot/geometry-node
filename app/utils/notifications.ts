import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

export interface NotificationState {
  notifications: Notification[];
}

/**
 * Get the appropriate icon for a notification type
 */
export function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'success':
      return CheckCircle2;
    case 'error':
    case 'warning':
      return AlertCircle;
    case 'info':
    default:
      return RefreshCw;
  }
}

/**
 * Get the appropriate CSS classes for a notification type
 */
export function getNotificationClasses(type: NotificationType): string {
  const baseClasses = 'flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm border transition-all duration-300';
  
  switch (type) {
    case 'success':
      return `${baseClasses} bg-green-900/90 text-green-300 border-green-700`;
    case 'error':
      return `${baseClasses} bg-red-900/90 text-red-300 border-red-700`;
    case 'warning':
      return `${baseClasses} bg-yellow-900/90 text-yellow-300 border-yellow-700`;
    case 'info':
    default:
      return `${baseClasses} bg-blue-900/90 text-blue-300 border-blue-700`;
  }
}

/**
 * Create a notification object with default values
 */
export function createNotification(
  type: NotificationType, 
  message: string, 
  duration: number = 4000
): Notification {
  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    type,
    message,
    duration
  };
}

/**
 * Hook-like utility for managing notifications state
 */
export class NotificationManager {
  private notifications: Notification[] = [];
  private listeners: ((notifications: Notification[]) => void)[] = [];

  /**
   * Add a notification
   */
  public add(type: NotificationType, message: string, duration?: number): string {
    const notification = createNotification(type, message, duration);
    this.notifications = [...this.notifications, notification];
    this.notifyListeners();

    // Auto-remove after duration
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.remove(notification.id);
      }, notification.duration);
    }

    return notification.id;
  }

  /**
   * Remove a notification by ID
   */
  public remove(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  /**
   * Clear all notifications
   */
  public clear(): void {
    this.notifications = [];
    this.notifyListeners();
  }

  /**
   * Get current notifications
   */
  public getNotifications(): Notification[] {
    return [...this.notifications];
  }

  /**
   * Subscribe to notification changes
   */
  public subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }
}

/**
 * Predefined notification messages for common actions
 */
export const NotificationMessages = {
  // Scene operations
  SCENE_SAVED: 'Scene saved to local storage! 💾',
  SCENE_LOADED: (sceneName: string) => `${sceneName} scene loaded! 🎬`,
  SCENE_LOAD_FAILED: (sceneName: string, error: string) => `Failed to load ${sceneName} scene: ${error}`,
  
  // Export operations
  EXPORT_IMAGE_FRAMING: 'Framing all nodes for export...',
  EXPORT_IMAGE_SUCCESS: 'Graph image downloaded successfully! 📷',
  EXPORT_IMAGE_FAILED: (error: string) => `Export failed: ${error}`,
  EXPORT_JSON_SUCCESS: 'Graph exported as JSON successfully! 📄',
  EXPORT_JSON_FAILED: (error: string) => `JSON export failed: ${error}`,
  
  // Import operations
  IMPORT_JSON_SUCCESS: 'Graph imported successfully! 📥',
  IMPORT_JSON_FAILED: (error: string) => `JSON import failed: ${error}`,
  
  // Layout operations
  LAYOUT_ORGANIZING: 'Organizing nodes...',
  LAYOUT_SUCCESS: (nodeCount: number, layerCount: number, crossings: number) => 
    `Organized ${nodeCount} nodes in ${layerCount} layers with ${crossings} crossings using barycenter optimization! ✨`,
  LAYOUT_NO_NODES: 'No nodes to layout',
  
  // Cleanup operations
  CLEANUP_SUCCESS: (nodeCount: number, edgeCount: number) => 
    `Cleaned up ${nodeCount} node${nodeCount === 1 ? '' : 's'} and ${edgeCount} edge${edgeCount === 1 ? '' : 's'}! 🧹`,
  CLEANUP_NO_NODES_NEEDED: 'All nodes contribute to the final output. No cleanup needed! ✨',
  
  // Generic messages
  NO_NODES: 'No nodes to export',
  OPERATION_CANCELLED: 'Operation cancelled',
  UNKNOWN_ERROR: 'An unexpected error occurred'
} as const;

/**
 * Utility functions for common notification patterns
 */
export const NotificationHelpers = {
  /**
   * Show a success notification
   */
  success: (manager: NotificationManager, message: string, duration?: number) => 
    manager.add('success', message, duration),

  /**
   * Show an error notification
   */
  error: (manager: NotificationManager, message: string, duration?: number) => 
    manager.add('error', message, duration || 6000), // Errors stay longer

  /**
   * Show a warning notification
   */
  warning: (manager: NotificationManager, message: string, duration?: number) => 
    manager.add('warning', message, duration),

  /**
   * Show an info notification
   */
  info: (manager: NotificationManager, message: string, duration?: number) => 
    manager.add('info', message, duration),

  /**
   * Show a temporary loading notification that auto-resolves
   */
  loading: (manager: NotificationManager, message: string, duration: number = 2000) => 
    manager.add('info', message, duration),

  /**
   * Show an operation result notification
   */
  operationResult: (
    manager: NotificationManager, 
    success: boolean, 
    successMessage: string, 
    errorMessage: string
  ) => {
    if (success) {
      manager.add('success', successMessage);
    } else {
      manager.add('error', errorMessage, 6000);
    }
  }
}; 