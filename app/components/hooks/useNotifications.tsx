'use client';

import { useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import React from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((type: NotificationType, message: string, duration: number = 4000) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  }, []);

  return { notifications, showNotification };
};

export const NotificationPanel = ({ notifications }: { notifications: Notification[] }) => {
    const getNotificationClass = (type: NotificationType) => {
        let classes = 'flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm border transition-all duration-300 ';
        switch (type) {
            case 'success':
                classes += 'bg-green-900/90 text-green-300 border-green-700';
                break;
            case 'error':
                classes += 'bg-red-900/90 text-red-300 border-red-700';
                break;
            case 'warning':
                classes += 'bg-yellow-900/90 text-yellow-300 border-yellow-700';
                break;
            default:
                classes += 'bg-blue-900/90 text-blue-300 border-blue-700';
                break;
        }
        return classes;
    };

    const getNotificationIcon = (type: NotificationType): React.ReactNode => {
        switch (type) {
            case 'success':
                return <CheckCircle2 size={16} />;
            case 'error':
                return <AlertCircle size={16} />;
            case 'warning':
                return <AlertCircle size={16} />;
            default:
                return <RefreshCw size={16} />;
        }
    };

    return (
        <div className="fixed top-4 right-4 space-y-2 z-50">
            {notifications.map((notification) => (
                <div
                    key={notification.id}
                    className={getNotificationClass(notification.type)}
                >
                    {getNotificationIcon(notification.type)}
                    <span className="text-sm font-medium">{notification.message}</span>
                </div>
            ))}
        </div>
    );
}; 