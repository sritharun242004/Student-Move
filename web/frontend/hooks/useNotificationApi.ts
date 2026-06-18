"use client";

import { useSession } from 'next-auth/react';
import Axios from "@/config/axios.config";
import { 
  Notification, 
  NotificationListResponse, 
  NotificationResponse, 
  NotificationSummary,
  NotificationPreferences 
} from "@/types/notificationTypes";

export const useNotificationApi = () => {
  const { data: session, status } = useSession();

  const getHeaders = () => {
    if (status === 'loading') {
      return {};
    }
    
    if (!session?.access) {
      console.log('No session or access token available');
      return {};
    }
    
    return { Authorization: `Bearer ${session.access}` };
  };

  const checkAuth = () => {
    if (status === 'loading') {
      throw new Error('Authentication is loading');
    }
    if (!session?.access) {
      throw new Error('Not authenticated');
    }
  };

  const getNotifications = async (params?: {
    type?: string;
    unreadOnly?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<NotificationListResponse> => {
    checkAuth();
    const queryParams = new URLSearchParams();
    
    if (params?.type) queryParams.append('type', params.type);
    if (params?.unreadOnly) queryParams.append('unread_only', 'true');
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('page_size', params.pageSize.toString());

    const url = `/notifications/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await Axios.get(url, { headers: getHeaders() });
    return response.data;
  };

  const getNotification = async (id: number): Promise<NotificationResponse> => {
    checkAuth();
    const response = await Axios.get(`/notifications/${id}/`, { headers: getHeaders() });
    return response.data;
  };

  const markAsRead = async (id: number): Promise<NotificationResponse> => {
    checkAuth();
    const response = await Axios.post(`/notifications/${id}/mark-as-read/`, {}, { headers: getHeaders() });
    return response.data;
  };

  const markAllAsRead = async (): Promise<NotificationResponse> => {
    checkAuth();
    const response = await Axios.post('/notifications/mark-all-as-read/', {}, { headers: getHeaders() });
    return response.data;
  };

  const getUnreadCount = async (): Promise<{ count: number }> => {
    checkAuth();
    const response = await Axios.get('/notifications/unread-count/', { headers: getHeaders() });
    // Backend returns { status: "success", message: "...", data: { count: number } }
    return response.data.data;
  };

  const getSummary = async (): Promise<NotificationSummary> => {
    checkAuth();
    const response = await Axios.get('/notifications/summary/', { headers: getHeaders() });
    return response.data.data;
  };

  const getPreferences = async (): Promise<NotificationPreferences> => {
    checkAuth();
    const response = await Axios.get('/notification-preferences/', { headers: getHeaders() });
    return response.data.data;
  };

  const updatePreferences = async (preferences: Partial<NotificationPreferences>): Promise<NotificationResponse> => {
    checkAuth();
    const response = await Axios.patch('/notification-preferences/', preferences, { headers: getHeaders() });
    return response.data;
  };

  return {
    getNotifications,
    getNotification,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    getSummary,
    getPreferences,
    updatePreferences
  };
};
