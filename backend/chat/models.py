# chat/models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from tenants.models import Lease
from django.core.exceptions import ValidationError

User = get_user_model()


class ChatThread(models.Model):
    """
    Represents a conversation.
    - Between landlord and tenant (lease_chat)
    - Or between admin and landlord (admin_chat)
    """

    THREAD_TYPE_CHOICES = [
        ("lease_chat", "Lease Chat"),
        ("admin_chat", "Admin Chat"),
    ]

    thread_type = models.CharField(max_length=20, choices=THREAD_TYPE_CHOICES)
    lease = models.OneToOneField(Lease, null=True, blank=True, on_delete=models.CASCADE, related_name="chat_thread")
    participants = models.ManyToManyField(User, related_name="chat_threads_participants")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.thread_type} - {self.id}"

    def clean(self):
        if self.thread_type == "lease_chat" and self.lease is None:
            raise ValidationError("Lease is required for lease_chat.")
        if self.thread_type == "admin_chat" and self.lease is not None:
            raise ValidationError("Lease must be null for admin_chat.")


class Message(models.Model):
    thread = models.ForeignKey(
        ChatThread, related_name="messages", on_delete=models.CASCADE
    )
    sender = models.ForeignKey(
        User, related_name="sent_messages", on_delete=models.CASCADE
    )
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)  # basic notification

    def __str__(self):
        return f"{self.sender} -> {self.thread.id}"


class Notification(models.Model):
    """
    Notifies user about new messages.
    This is optional and depends on how you want to handle frontend polling.
    """

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="chat_notifications"
    )
    message = models.ForeignKey(Message, on_delete=models.CASCADE)
    created_at = models.DateTimeField(default=timezone.now)
    is_seen = models.BooleanField(default=False)

    def __str__(self):
        return f"Notify {self.user} - Msg {self.message.id}"
