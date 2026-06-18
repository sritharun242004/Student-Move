from rest_framework import serializers
from studentmove.serializers import CamelCaseSerializer
from .models import ChatThread, Message, Notification
from django.contrib.auth import get_user_model
User = get_user_model()


class MessageSerializer(CamelCaseSerializer):
    
    class Meta:
        model = Message
        fields = "__all__"

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation["sender"] = {  
            # get gourps . first
            "role": instance.sender.groups.first().name,
            "id": instance.sender.id,
            "username": instance.sender.username,
        }
        return representation


class ChatThreadSerializer(CamelCaseSerializer):
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    participants = serializers.StringRelatedField(many=True)

    class Meta:
        model = ChatThread
        fields = [
            "id",
            "thread_type",
            "lease",
            "participants",
            "created_at",
            "last_message",
            "unread_count",
        ]

    def get_last_message(self, obj):
        last_msg = obj.messages.order_by("-created_at").first()
        return MessageSerializer(last_msg).data if last_msg else None

    def get_unread_count(self, obj):
        user = self.context.get("request").user
        return obj.messages.filter(is_read=False).exclude(sender=user).count()


class NotificationSerializer(CamelCaseSerializer):
    message = MessageSerializer()

    class Meta:
        model = Notification
        fields = ["id", "message", "created_at", "is_seen"]


class MessageCreateSerializer(CamelCaseSerializer):
    class Meta:
        model = Message
        fields = ["thread", "text"]

    def create(self, validated_data):
        user = self.context["request"].user
        message = Message.objects.create(sender=user, **validated_data)

        # Create notification for others (already handled in signal or can duplicate here)
        for user in message.thread.participants.exclude(id=message.sender.id):
            Notification.objects.create(user=user, message=message)

        return message
