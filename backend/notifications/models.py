from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey

User = get_user_model()


class Notification(models.Model):
    """
    Enhanced notification system that can handle different types of notifications
    beyond just chat messages
    """
    
    NOTIFICATION_TYPES = [
        ('chat', 'Chat Message'),
        ('lease_request', 'Lease Request'),
        ('lease_approval', 'Lease Approval'),
        ('lease_rejection', 'Lease Rejection'),
        ('maintenance_request', 'Maintenance Request'),
        ('maintenance_update', 'Maintenance Update'),
        ('inspection_schedule', 'Inspection Scheduled'),
        ('inspection_update', 'Inspection Update'),
        ('payment_received', 'Payment Received'),
        ('payment_overdue', 'Payment Overdue'),
        ('property_approval', 'Property Approval'),
        ('property_rejection', 'Property Rejection'),
        ('agent_request', 'Agent Request'),
        ('account_suspension', 'Account Suspension'),
        ('account_reactivation', 'Account Reactivation'),
        ('removal_warning', 'Account Removal Warning'),
        ('account_deleted', 'Account Deleted'),
        ('account_restored', 'Account Restored'),
        ('general', 'General Notification'),
        ('reels', 'Reels'),
        ('marketplace', 'Marketplace'),
        ('offers', 'Offers'),
    ]
    
    PRIORITY_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]

    recipient = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name="notifications"
    )
    notification_type = models.CharField(
        max_length=50, 
        choices=NOTIFICATION_TYPES,
        default='general'
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    priority = models.CharField(
        max_length=20, 
        choices=PRIORITY_LEVELS,
        default='medium'
    )
    
    # Generic foreign key to link to any model
    content_type = models.ForeignKey(
        ContentType, 
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    related_object = GenericForeignKey('content_type', 'object_id')
    
    # Additional data as JSON
    metadata = models.JSONField(default=dict, blank=True)
    
    # Action URL for deep linking
    action_url = models.URLField(max_length=500, null=True, blank=True)
    
    # Status tracking
    is_read = models.BooleanField(default=False)
    is_seen = models.BooleanField(default=False)  # Backward compatibility
    created_at = models.DateTimeField(default=timezone.now)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['recipient', 'notification_type']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.notification_type}: {self.title} -> {self.recipient}"

    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            self.is_read = True
            self.is_seen = True  # Backward compatibility
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'is_seen', 'read_at'])

    @classmethod
    def create_notification(
        cls, 
        recipient, 
        notification_type, 
        title, 
        message, 
        priority='medium',
        related_object=None,
        metadata=None,
        action_url=None
    ):
        """Helper method to create notifications"""
        notification = cls.objects.create(
            recipient=recipient,
            notification_type=notification_type,
            title=title,
            message=message,
            priority=priority,
            related_object=related_object,
            metadata=metadata or {},
            action_url=action_url
        )
        return notification


class NotificationPreference(models.Model):
    """User preferences for notifications"""
    
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE,
        related_name='notification_preferences'
    )
    
    # Email notifications
    email_notifications = models.BooleanField(default=True)
    email_chat = models.BooleanField(default=True)
    email_lease = models.BooleanField(default=True)
    email_maintenance = models.BooleanField(default=True)
    email_inspection = models.BooleanField(default=True)
    email_payment = models.BooleanField(default=True)
    
    # In-app notifications
    inapp_notifications = models.BooleanField(default=True)
    inapp_chat = models.BooleanField(default=True)
    inapp_lease = models.BooleanField(default=True)
    inapp_maintenance = models.BooleanField(default=True)
    inapp_inspection = models.BooleanField(default=True)
    inapp_payment = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Notification preferences for {self.user}"
