import { Notification } from '@/types/notificationTypes';
import { 
  Bell, 
  Home, 
  Wrench, 
  Calendar, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  Users,
  AlertTriangle
} from 'lucide-react';

export const getNotificationIcon = (type: Notification['notificationType']) => {
  switch (type) {
    case 'chat':
      return MessageSquare;
    case 'lease_request':
    case 'lease_approval':
    case 'lease_rejection':
      return Home;
    case 'maintenance_request':
    case 'maintenance_update':
      return Wrench;
    case 'inspection_schedule':
    case 'inspection_update':
      return Calendar;
    case 'payment_received':
    case 'payment_overdue':
      return CreditCard;
    case 'property_approval':
      return CheckCircle;
    case 'property_rejection':
      return XCircle;
    case 'agent_request':
      return Users;
    default:
      return Bell;
  }
};

export const getNotificationColor = (type: Notification['notificationType'], priority: Notification['priority']) => {
  // Priority-based colors
  if (priority === 'urgent') return 'text-red-600';
  if (priority === 'high') return 'text-orange-600';
  
  // Type-based colors for medium and low priority
  switch (type) {
    case 'lease_approval':
    case 'property_approval':
    case 'payment_received':
      return 'text-green-600';
    case 'lease_rejection':
    case 'property_rejection':
    case 'payment_overdue':
      return 'text-red-600';
    case 'maintenance_request':
      return 'text-yellow-600';
    case 'maintenance_update':
      return 'text-blue-600';
    case 'inspection_schedule':
    case 'inspection_update':
      return 'text-purple-600';
    case 'chat':
      return 'text-blue-500';
    case 'agent_request':
      return 'text-indigo-600';
    default:
      return 'text-gray-600';
  }
};

export const getNotificationBadgeColor = (priority: Notification['priority']) => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 text-red-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'medium':
      return 'bg-blue-100 text-blue-800';
    case 'low':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const formatNotificationType = (type: Notification['notificationType']) => {
  const typeMap = {
    'chat': 'Chat Message',
    'lease_request': 'Lease Request',
    'lease_approval': 'Lease Approved',
    'lease_rejection': 'Lease Rejected',
    'maintenance_request': 'Maintenance Request',
    'maintenance_update': 'Maintenance Update',
    'inspection_schedule': 'Inspection Scheduled',
    'inspection_update': 'Inspection Update',
    'payment_received': 'Payment Received',
    'payment_overdue': 'Payment Overdue',
    'property_approval': 'Property Approved',
    'property_rejection': 'Property Rejected',
    'agent_request': 'Agent Request',
    'general': 'Notification'
  };
  
  return typeMap[type] || 'Notification';
};
