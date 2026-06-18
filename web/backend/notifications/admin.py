from django.contrib import admin
from .models import Notification, NotificationPreference


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'recipient', 'notification_type', 'title', 
        'priority', 'is_read', 'created_at'
    )
    list_filter = ('notification_type', 'priority', 'is_read', 'created_at')
    search_fields = ('recipient__username', 'recipient__email', 'title', 'message')
    readonly_fields = ('created_at', 'read_at')
    ordering = ('-created_at',)


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ('user', 'email_notifications', 'inapp_notifications')
    search_fields = ('user__username', 'user__email')
    list_filter = ('email_notifications', 'inapp_notifications')
