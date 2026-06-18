# chat/views.py
from rest_framework import viewsets, mixins, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Max, Prefetch
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model

from .models import ChatThread, Message, Notification
from .serializers import (
    ChatThreadSerializer,
    MessageSerializer,
    MessageCreateSerializer,
    NotificationSerializer,
)
from studentmove.permission import IsAdminOrLandlord

User = get_user_model()


class ChatThreadViewSet(viewsets.ModelViewSet):
    serializer_class = ChatThreadSerializer
    queryset = ChatThread.objects.all()

    def get_object(self):
        if self.action == "get_admin_chat":
            # Get the thread with the admin
            thread = get_object_or_404(
                ChatThread,
                participants=self.request.user,
                thread_type = "admin_chat",
            )
            return thread
        return super().get_object()

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Chat threads retrieved successfully",
            "threads": response.data,
        }
        return response

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Chat thread retrieved successfully",
            "data": response.data,
        }
        return response

    def get_admin_chat(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Chat thread retrieved successfully",
            "data": response.data,
        }
        return response

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return MessageCreateSerializer
        return MessageSerializer

    def get_queryset(self):
        user = self.request.user
        thread_id = self.kwargs.get("thread_id")

        if thread_id:
            # Verify user is a participant in this thread
            thread = get_object_or_404(ChatThread, id=thread_id, participants=user)
            return Message.objects.filter(thread=thread).order_by("-created_at")

        # If no thread_id, return all messages from user's threads
        return Message.objects.filter(thread__participants=user).order_by("-created_at")

    def create(self, request, *args, **kwargs):
        thread_id = self.kwargs.get("thread_id")
        request.data["thread"] = thread_id
        response = super().create(request, *args, **kwargs)

        response.data = {
            "status": "success",
            "message": "Message sent successfully",
            "data": response.data,
        }
        return response

    def thread_messages(self, request, thread_id=None):
        """Get all messages for a specific thread"""
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(
                {
                    "status": "success",
                    "message": "Thread messages retrieved successfully",
                    "data": serializer.data,
                }
            )

        serializer = self.get_serializer(queryset, many=True)
        return Response(
            {
                "status": "success",
                "message": "Thread messages retrieved successfully",
                "data": serializer.data,
            }
        )


    def mark_thread_read(self, request, thread_id=None):
        """Mark all messages in a thread as read"""
        if not thread_id:
            return Response(
                {"error": "Thread ID is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Verify user is a participant
        thread = get_object_or_404(ChatThread, id=thread_id, participants=request.user)
    
        # Mark all messages not sent by the user as read
        messages = Message.objects.filter(
            thread=thread
        ).exclude(sender=request.user).filter(is_read=False)

        print(messages)

        for message in messages:
            message.is_read = True
            message.save()
            print(message.is_read)

        return Response(
            {
                "status": "success",
                "message": "All messages marked as read",
            }
        )


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by(
            "-created_at"
        )

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        return Response(
            {
                "status": "success",
                "message": "Notifications retrieved successfully",
                "data": response.data,
            }
        )

    def mark_seen(self, request, pk=None):
        """Mark a notification as seen"""
        notification = self.get_object()
        notification.is_seen = True
        notification.save()

        return Response(
            {
                "status": "success",
                "message": "Notification marked as seen",
            }
        )

    def mark_all_seen(self, request):
        """Mark all notifications as seen"""
        Notification.objects.filter(user=request.user, is_seen=False).update(
            is_seen=True
        )

        return Response(
            {
                "status": "success",
                "message": "All notifications marked as seen",
            }
        )

    def unread_count(self, request):
        """Get count of unseen notifications"""
        count = Notification.objects.filter(user=request.user, is_seen=False).count()

        return Response(
            {
                "status": "success",
                "message": "Unread notification count retrieved",
                "data": {"count": count},
            }
        )
