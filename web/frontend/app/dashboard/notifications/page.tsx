"use client";

import React, { useEffect, useState } from 'react';
import { useNotificationStore } from '@/app/store/notificationStore';
import { useNotificationApi } from '@/hooks/useNotificationApi';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Bell, 
  CheckCheck, 
  Search, 
  Loader2,
} from 'lucide-react';
import { Notification } from '@/types/notificationTypes';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { formatNotificationType } from '@/utils/notificationUtils';

export default function NotificationsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  
  
  const {
    notifications,
    unreadCount,
    loading,
    error,
    setNotifications,
    setLoading,
    setError,
    markAsRead,
    markAllAsRead: storeMarkAllAsRead,
    clearError
  } = useNotificationStore();

  const notificationApi = useNotificationApi();

  // Fetch notifications on mount
  useEffect(() => {
    if (!session) return;
    fetchNotifications();
  }, [session]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await notificationApi.getNotifications();
      setNotifications(response.data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
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

  const handleDeleteAll = async () => {
    if (confirm('Are you sure you want to delete all notifications?')) {
      try {
        // Note: You'll need to implement deleteAll in the API
        await fetchNotifications(); // Refresh after delete
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to delete notifications');
      }
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || notification.notificationType === typeFilter;
    const matchesPriority = priorityFilter === 'all' || notification.priority === priorityFilter;
    
    return matchesSearch && matchesType && matchesPriority;
  });

  // Get unique notification types for filter
  const notificationTypes = Array.from(new Set(notifications.map(n => n.notificationType)));

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-500">Loading notifications...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500">
            Stay updated with your latest activities and updates
          </p>
        </div>
        
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead} className="flex items-center">
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {notificationTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {formatNotificationType(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-red-600">{error}</p>
              <Button 
                variant="outline" 
                onClick={() => {
                  clearError();
                  fetchNotifications();
                }}
              >
                Try again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
              <p className="text-gray-500">
                {searchTerm || typeFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Try adjusting your filters to see more notifications.'
                  : 'You\'ll see notifications here when they arrive.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onAction={handleNotificationAction}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
