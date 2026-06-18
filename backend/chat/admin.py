from django.contrib import admin
from .models import ChatThread, Message, Notification




@admin.register(ChatThread)
class ChatThreadAdmin(admin.ModelAdmin):
    list_display = ("id", "lease", "created_at")
    search_fields = ("lease__property_obj__name", "lease__tenant__first_name")
    list_filter = ("created_at",)
    ordering = ("-created_at",)


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "thread", "sender", "created_at")
    search_fields = ("thread__lease__property_obj__name", "sender__first_name")
    list_filter = ("created_at",)
    ordering = ("-created_at",)


# @admin.register(Notification)
# class NotificationAdmin(admin.ModelAdmin):
#     list_display = ("id", "user", "message", "is_seen", "created_at")
#     search_fields = ("user__first_name", "message")
#     list_filter = ("is_seen", "created_at")
#     ordering = ("-created_at",)
# Register your models here.
