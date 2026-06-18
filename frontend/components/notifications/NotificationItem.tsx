"use client";

import React from 'react';
import { Notification } from '@/types/notificationTypes';
import { 
  getNotificationIcon, 
  getNotificationColor, 
  getNotificationBadgeColor, 
  formatNotificationType 
} from '@/utils/notificationUtils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: number) => void;
  onAction?: (notification: Notification) => void;
  compact?: boolean;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onAction,
  compact = false
}) => {
  const Icon = getNotificationIcon(notification.notificationType);
  const iconColor = getNotificationColor(notification.notificationType, notification.priority);
  const badgeColor = getNotificationBadgeColor(notification.priority);

  const handleClick = () => {
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    if (onAction) {
      onAction(notification);
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div
      className={cn(
        "group relative p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer",
        !notification.isRead && "bg-blue-50/30 border-l-4 border-l-blue-500",
        compact && "p-2"
      )}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className={cn("flex-shrink-0 mt-1", iconColor)}>
          <Icon className={cn("h-5 w-5", compact && "h-4 w-4")} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className={cn(
                  "text-sm font-medium text-gray-900 truncate",
                  compact && "text-xs"
                )}>
                  {notification.title}
                </h4>
                {notification.priority !== 'low' && (
                  <Badge 
                    variant="secondary" 
                    className={cn(badgeColor, "text-xs px-1.5 py-0.5")}
                  >
                    {notification.priority}
                  </Badge>
                )}
              </div>
              
              <p className={cn(
                "text-sm text-gray-600 line-clamp-2",
                compact && "text-xs line-clamp-1"
              )}>
                {notification.message}
              </p>
              
              <div className="flex items-center justify-between mt-2">
                <span className={cn(
                  "text-xs text-gray-500",
                  compact && "text-[10px]"
                )}>
                  {formatNotificationType(notification.notificationType)} • {notification.timeAgo}
                </span>
                
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-blue-600 hover:text-blue-700 h-auto p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleMarkAsRead}
                  >
                    Mark as read
                  </Button>
                )}
              </div>
            </div>
            
            {/* Unread indicator */}
            {!notification.isRead && (
              <div className="flex-shrink-0 ml-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
