export interface Notification {
  id: number;
  notificationType: 'chat' | 'lease_request' | 'lease_approval' | 'lease_rejection' | 
                   'maintenance_request' | 'maintenance_update' | 'inspection_schedule' | 
                   'inspection_update' | 'payment_received' | 'payment_overdue' | 
                   'property_approval' | 'property_rejection' | 'agent_request' | 'general';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  metadata: Record<string, any>;
  actionUrl?: string;
  isRead: boolean;
  isSeen: boolean;
  createdAt: string;
  readAt?: string;
  timeAgo: string;
}

export interface NotificationSummary {
  totalUnread: number;
  byType: Record<string, number>;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  emailChat: boolean;
  emailLease: boolean;
  emailMaintenance: boolean;
  emailInspection: boolean;
  emailPayment: boolean;
  inappNotifications: boolean;
  inappChat: boolean;
  inappLease: boolean;
  inappMaintenance: boolean;
  inappInspection: boolean;
  inappPayment: boolean;
}

export interface NotificationResponse {
  status: string;
  message: string;
  data: Notification[] | Notification | NotificationSummary | { count: number };
}

export interface NotificationListResponse {
  status: string;
  message: string;
  data: Notification[];
  count?: number;
  next?: string;
  previous?: string;
}
