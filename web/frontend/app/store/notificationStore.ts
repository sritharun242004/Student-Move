import { create } from 'zustand';
import { Notification, NotificationSummary } from '@/types/notificationTypes';

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  summary: NotificationSummary | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  setNotifications: (notifications: Notification[]) => void;
  setUnreadCount: (count: number) => void;
  setSummary: (summary: NotificationSummary) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  markAsRead: (notificationId: number) => void;
  markAllAsRead: () => void;
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

  setNotifications: (notifications) => set({ notifications }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  setSummary: (summary) => set({ summary }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  markAsRead: (notificationId: number) => {
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
  },

  markAllAsRead: () => {
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
  },

  addNotification: (notification: Notification) => {
    const { notifications, unreadCount } = get();
    set({ 
      notifications: [notification, ...notifications],
      unreadCount: notification.isRead ? unreadCount : unreadCount + 1
    });
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
  },

  clearError: () => set({ error: null }),
}));
