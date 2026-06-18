import { create } from 'zustand';
import { Notification, NotificationSummary } from '@/types/notificationTypes';
import NotificationService from '@/services/notificationService';

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  summary: NotificationSummary | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchNotifications: (params?: { type?: string; unreadOnly?: boolean }) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  fetchSummary: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  removeNotification: (notificationId: number) => void;
  clearError: () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  summary: null,
  loading: false,
  error: null,

  fetchNotifications: async (params) => {
    set({ loading: true, error: null });
    try {
      const response = await NotificationService.getNotifications(params);
      set({ 
        notifications: response.data,
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch notifications',
        loading: false 
      });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const { count } = await NotificationService.getUnreadCount();
      set({ unreadCount: count });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  fetchSummary: async () => {
    try {
      const summary = await NotificationService.getSummary();
      set({ summary });
    } catch (error) {
      console.error('Failed to fetch notification summary:', error);
    }
  },

  markAsRead: async (notificationId: number) => {
    try {
      await NotificationService.markAsRead(notificationId);
      
      // Update local state
      const { notifications, unreadCount } = get();
      const updatedNotifications = notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true, isSeen: true }
          : notification
      );
      
      const wasUnread = notifications.find(n => n.id === notificationId && !n.isRead);
      const newUnreadCount = wasUnread ? Math.max(0, unreadCount - 1) : unreadCount;
      
      set({ 
        notifications: updatedNotifications,
        unreadCount: newUnreadCount
      });
      
      // Refresh summary
      get().fetchSummary();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to mark as read' });
    }
  },

  markAllAsRead: async () => {
    try {
      await NotificationService.markAllAsRead();
      
      // Update local state
      const { notifications } = get();
      const updatedNotifications = notifications.map(notification => ({
        ...notification,
        isRead: true,
        isSeen: true
      }));
      
      set({ 
        notifications: updatedNotifications,
        unreadCount: 0,
        summary: { totalUnread: 0, byType: {} }
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to mark all as read' });
    }
  },

  addNotification: (notification: Notification) => {
    const { notifications, unreadCount } = get();
    set({ 
      notifications: [notification, ...notifications],
      unreadCount: notification.isRead ? unreadCount : unreadCount + 1
    });
    
    // Refresh summary
    get().fetchSummary();
  },

  removeNotification: (notificationId: number) => {
    const { notifications, unreadCount } = get();
    const notification = notifications.find(n => n.id === notificationId);
    const filteredNotifications = notifications.filter(n => n.id !== notificationId);
    
    const newUnreadCount = notification && !notification.isRead 
      ? Math.max(0, unreadCount - 1) 
      : unreadCount;
    
    set({ 
      notifications: filteredNotifications,
      unreadCount: newUnreadCount
    });
    
    // Refresh summary
    get().fetchSummary();
  },

  clearError: () => set({ error: null }),
}));
