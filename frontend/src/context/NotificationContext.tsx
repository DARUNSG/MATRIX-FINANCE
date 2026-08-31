import React, { createContext, useContext, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { AppNotification } from '../types';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  addNotification: (title: string, message: string, type: AppNotification['type'], link?: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const notifications = useLiveQuery(() => db.notifications.orderBy('date').reverse().toArray(), []) || [];

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (id: string) => {
    await db.notifications.update(id, { read: true });
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    for (const id of unreadIds) {
      await db.notifications.update(id, { read: true });
    }
  };

  const deleteNotification = async (id: string) => {
    await db.notifications.delete(id);
  };

  const clearAllNotifications = async () => {
    await db.notifications.clear();
  };

  const addNotification = async (
    title: string,
    message: string,
    type: AppNotification['type'],
    link?: string
  ) => {
    const newNotif: AppNotification = {
      id: `NOTIF-${Date.now()}`,
      title,
      message,
      type,
      date: new Date().toISOString(),
      read: false,
      link
    };
    await db.notifications.add(newNotif);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isDrawerOpen,
        openDrawer: () => setIsDrawerOpen(true),
        closeDrawer: () => setIsDrawerOpen(false),
        toggleDrawer: () => setIsDrawerOpen((prev) => !prev),
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        addNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};
