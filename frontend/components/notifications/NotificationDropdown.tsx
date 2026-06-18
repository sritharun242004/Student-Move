"use client";

import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotificationStore } from '@/app/store/notificationStore';
import { useNotificationApi } from '@/hooks/useNotificationApi';
import { NotificationItem } from './NotificationItem';
import { Notification } from '@/types/notificationTypes';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';

interface NotificationDropdownProps {
  className?: string;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ className }) => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  
  const {
    notifications,
    unreadCount,
    loading,
    error,
    setNotifications,
    setUnreadCount,
    setLoading,
    setError,
    markAsRead,
    markAllAsRead: storeMarkAllAsRead,
    clearError
  } = useNotificationStore();

  const notificationApi = useNotificationApi();

  // Fetch notifications and unread count when dropdown opens
  useEffect(() => {
    if (isOpen && status === 'authenticated') {
      fetchNotifications();
    }
    if (status === 'authenticated') {
      fetchUnreadCount();
    }
  }, [isOpen, filter, status]);

  // Refresh unread count periodically only when authenticated
  useEffect(() => {
    if (status !== 'authenticated') return;
    
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [status]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await notificationApi.getNotifications({ 
        unreadOnly: filter === 'unread' 
      });
      setNotifications(response.data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationApi.getUnreadCount();
      setUnreadCount(response.count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      // Don't show error to user for unread count failures, just silently fail
    }
  };

  const handleNotificationAction = (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    // Navigate to action URL if provided
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      setIsOpen(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      markAsRead(id);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      storeMarkAllAsRead();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to mark all as read');
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("relative z-40", className)}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-80 p-0 z-50"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-xs text-gray-500">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-blue-600 hover:text-blue-700"
                onClick={handleMarkAllAsRead}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center border-b">
          <button
            className={cn(
              "flex-1 px-4 py-2 text-xs font-medium border-b-2 transition-colors",
              filter === 'all' 
                ? "border-blue-500 text-blue-600 bg-blue-50" 
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={cn(
              "flex-1 px-4 py-2 text-xs font-medium border-b-2 transition-colors",
              filter === 'unread' 
                ? "border-blue-500 text-blue-600 bg-blue-50" 
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
            onClick={() => setFilter('unread')}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </button>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              <span className="ml-2 text-sm text-gray-500">Loading notifications...</span>
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <p className="text-sm text-red-600 mb-2">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  clearError();
                  fetchNotifications();
                }}
              >
                Try again
              </Button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {filter === 'unread' 
                  ? 'All caught up!' 
                  : 'You\'ll see notifications here when they arrive'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onAction={handleNotificationAction}
                  compact
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {filteredNotifications.length > 0 && (
          <div className="border-t p-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-xs"
              onClick={() => {
                router.push('/dashboard/notifications');
                setIsOpen(false);
              }}
            >
              View all notifications
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
