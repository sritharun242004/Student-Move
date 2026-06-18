from rest_framework import serializers
from studentmove.serializers import CamelCaseSerializer
from .models import Notification, NotificationPreference


class NotificationSerializer(CamelCaseSerializer):
    """Serializer for notifications with enhanced data"""
    
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'title', 'message', 'priority',
            'metadata', 'action_url', 'is_read', 'is_seen', 
            'created_at', 'read_at'
        ]
        read_only_fields = ['id', 'created_at', 'read_at']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        # Add time ago for better UX
        from django.utils import timezone
        from datetime import datetime, timedelta
        
        created_at = instance.created_at
        now = timezone.now()
        diff = now - created_at
        
        if diff.days > 0:
            if diff.days == 1:
                representation['timeAgo'] = '1 day ago'
            else:
                representation['timeAgo'] = f'{diff.days} days ago'
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            if hours == 1:
                representation['timeAgo'] = '1 hour ago'
            else:
                representation['timeAgo'] = f'{hours} hours ago'
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            if minutes == 1:
                representation['timeAgo'] = '1 minute ago'
            else:
                representation['timeAgo'] = f'{minutes} minutes ago'
        else:
            representation['timeAgo'] = 'Just now'
            
        return representation


class NotificationPreferenceSerializer(CamelCaseSerializer):
    """Serializer for notification preferences"""
    
    class Meta:
        model = NotificationPreference
        fields = [
            'email_notifications', 'email_chat', 'email_lease', 
            'email_maintenance', 'email_inspection', 'email_payment',
            'inapp_notifications', 'inapp_chat', 'inapp_lease',
            'inapp_maintenance', 'inapp_inspection', 'inapp_payment'
        ]
