from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q
from django.contrib.auth import get_user_model
from .models import Notification, NotificationPreference
from .serializers import NotificationSerializer, NotificationPreferenceSerializer
from studentmove.emailnotifier import EmailNotifier

User = get_user_model()


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for managing user notifications"""
    
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action == 'create_public_notification':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    def list(self, request, *args, **kwargs):
        """Get paginated list of notifications"""
        # Add filtering by type if specified
        notification_type = request.query_params.get('type')
        unread_only = request.query_params.get('unread_only', 'false').lower() == 'true'
        
        queryset = self.get_queryset()
        
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)
        
        if unread_only:
            queryset = queryset.filter(is_read=False)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response({
                "status": "success",
                "message": "Notifications retrieved successfully",
                "data": serializer.data,
            })

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "status": "success",
            "message": "Notifications retrieved successfully",
            "data": serializer.data,
        })

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark a specific notification as read"""
        notification = self.get_object()
        notification.mark_as_read()
        
        return Response({
            "status": "success",
            "message": "Notification marked as read",
        })

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """Mark all notifications as read"""
        updated_count = Notification.objects.filter(
            recipient=request.user, 
            is_read=False
        ).update(is_read=True, is_seen=True)
        
        return Response({
            "status": "success",
            "message": f"{updated_count} notifications marked as read",
            "data": {"updated_count": updated_count}
        })

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications"""
        count = Notification.objects.filter(
            recipient=request.user, 
            is_read=False
        ).count()
        
        return Response({
            "status": "success",
            "message": "Unread notification count retrieved",
            "data": {"count": count},
        })

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get notification summary by type"""
        queryset = self.get_queryset()
        
        summary = {}
        for notification_type, _ in Notification.NOTIFICATION_TYPES:
            type_count = queryset.filter(notification_type=notification_type, is_read=False).count()
            if type_count > 0:
                summary[notification_type] = type_count
        
        total_unread = queryset.filter(is_read=False).count()
        
        return Response({
            "status": "success",
            "message": "Notification summary retrieved",
            "data": {
                "total_unread": total_unread,
                "by_type": summary
            }
        })

    @action(detail=False, methods=['post'])
    def test_notification(self, request):
        """Test notification creation for debugging"""
        if not request.user.is_staff and not request.user.groups.filter(name='admin').exists():
            return Response({
                "status": "error",
                "message": "Permission denied. Admin access required.",
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Create a test notification for the admin user
            notification = Notification.objects.create(
                recipient=request.user,
                notification_type="general",
                title="Test Notification",
                message="This is a test notification to verify the system is working.",
                priority="medium",
                metadata={"test": True}
            )
            
            return Response({
                "status": "success",
                "message": "Test notification created successfully",
                "data": {
                    "notification_id": notification.id,
                    "recipient": notification.recipient.email,
                    "title": notification.title
                }
            })
            
        except Exception as e:
            return Response({
                "status": "error",
                "message": f"Failed to create test notification: {str(e)}",
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def create_notification(self, request):
        """Create a new notification (admin only)"""
        # Check if user has admin permissions
        if not request.user.is_staff and not request.user.groups.filter(name='admin').exists():
            return Response({
                "status": "error",
                "message": "Permission denied. Admin access required.",
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get the required data
        recipient_id = request.data.get('recipient_id')
        notification_type = request.data.get('notification_type', 'general')
        title = request.data.get('title')
        message = request.data.get('message')
        priority = request.data.get('priority', 'medium')
        metadata = request.data.get('metadata', {})
        action_url = request.data.get('action_url')
        
        # Validate required fields
        if not all([recipient_id, title, message]):
            return Response({
                "status": "error",
                "message": "recipient_id, title, and message are required fields",
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            recipient = User.objects.get(id=recipient_id)
        except User.DoesNotExist:
            return Response({
                "status": "error",
                "message": "Recipient user not found",
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Create the notification
        notification = Notification.create_notification(
            recipient=recipient,
            notification_type=notification_type,
            title=title,
            message=message,
            priority=priority,
            metadata=metadata,
            action_url=action_url
        )
        
        # Send email for certain notification types
        try:
            if metadata.get('action_type') in ['account_suspension', 'verification_rejection', 'verification_approval', 'account_reactivation']:
                action_type = metadata.get('action_type')
                recipient_name = f"{recipient.first_name} {recipient.last_name}".strip() or recipient.username
                
                if action_type == 'account_suspension':
                    reason = metadata.get('suspension_reason', 'Policy violation')
                    notes = metadata.get('suspension_notes', '')
                    
                    email_message = (
                        f"Dear {recipient_name},\n\n"
                        f"Your landlord account has been suspended.\n\n"
                        f"Reason: {reason}\n\n"
                        f"{f'Additional Information: {notes}' if notes else ''}\n\n"
                        f"Your properties will not be visible to the public until your account is reactivated.\n\n"
                        f"If you believe this is an error or would like to appeal this decision, "
                        f"please contact our support team.\n\n"
                        f"Best regards,\nStudent Moves Admin Team"
                    )
                    EmailNotifier.send_email("Account Suspension Notice", email_message, recipient.email)
                    
                elif action_type == 'verification_rejection':
                    reason = metadata.get('rejection_reason', 'Verification requirements not met')
                    notes = metadata.get('rejection_notes', '')
                    
                    email_message = (
                        f"Dear {recipient_name},\n\n"
                        f"Your landlord verification has been rejected.\n\n"
                        f"Reason: {reason}\n\n"
                        f"{f'Additional Information: {notes}' if notes else ''}\n\n"
                        f"Please review our verification requirements and resubmit your application "
                        f"with the correct documentation.\n\n"
                        f"If you have any questions, please contact our support team.\n\n"
                        f"Best regards,\nStudent Moves Admin Team"
                    )
                    EmailNotifier.send_email("Verification Rejected", email_message, recipient.email)
                    
                elif action_type == 'verification_approval':
                    email_message = (
                        f"Dear {recipient_name},\n\n"
                        f"Congratulations! Your landlord verification has been approved.\n\n"
                        f"You can now:\n"
                        f"- List your properties\n"
                        f"- Manage rental applications\n"
                        f"- Access your landlord dashboard\n"
                        f"- Connect with potential tenants\n\n"
                        f"Welcome to the Student Moves community!\n\n"
                        f"Best regards,\nStudent Moves Admin Team"
                    )
                    EmailNotifier.send_email("Verification Approved - Welcome to Student Moves!", email_message, recipient.email)
                    
                elif action_type == 'account_reactivation':
                    email_message = (
                        f"Dear {recipient_name},\n\n"
                        f"Your landlord account has been reactivated.\n\n"
                        f"You can now:\n"
                        f"- Access your dashboard\n"
                        f"- Manage your properties\n"
                        f"- Respond to tenant inquiries\n"
                        f"- List new properties\n\n"
                        f"Welcome back to Student Moves!\n\n"
                        f"Best regards,\nStudent Moves Admin Team"
                    )
                    EmailNotifier.send_email("Account Reactivated", email_message, recipient.email)
                    
        except Exception as email_error:
            # Log email error but don't fail the notification creation
            print(f"Email sending failed: {email_error}")
        
        serializer = self.get_serializer(notification)
        return Response({
            "status": "success",
            "message": "Notification created successfully",
            "data": serializer.data,
        }, status=status.HTTP_201_CREATED)

    PUBLIC_NOTIFICATION_TYPES = {'reels', 'marketplace', 'offers'}

    @action(detail=False, methods=['post'], url_path='create-public')
    def create_public_notification(self, request):
        """Create a reels, marketplace, or offers notification. No authentication required."""
        recipient_id = request.data.get('recipient_id')
        notification_type = request.data.get('notification_type')
        title = request.data.get('title')
        message = request.data.get('message')
        priority = request.data.get('priority', 'medium')
        metadata = request.data.get('metadata', {})
        action_url = request.data.get('action_url')

        if not all([recipient_id, notification_type, title, message]):
            return Response({
                "status": "error",
                "message": "recipient_id, notification_type, title, and message are required fields",
            }, status=status.HTTP_400_BAD_REQUEST)

        if notification_type not in self.PUBLIC_NOTIFICATION_TYPES:
            return Response({
                "status": "error",
                "message": f"notification_type must be one of: {', '.join(sorted(self.PUBLIC_NOTIFICATION_TYPES))}",
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            recipient = User.objects.get(id=recipient_id)
        except User.DoesNotExist:
            return Response({
                "status": "error",
                "message": "Recipient user not found",
            }, status=status.HTTP_404_NOT_FOUND)

        notification = Notification.create_notification(
            recipient=recipient,
            notification_type=notification_type,
            title=title,
            message=message,
            priority=priority,
            metadata=metadata,
            action_url=action_url,
        )

        serializer = self.get_serializer(notification)
        return Response({
            "status": "success",
            "message": "Notification created successfully",
            "data": serializer.data,
        }, status=status.HTTP_201_CREATED)


class NotificationPreferenceViewSet(viewsets.ModelViewSet):
    """ViewSet for managing notification preferences"""
    
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return NotificationPreference.objects.filter(user=self.request.user)

    def get_object(self):
        """Get or create notification preferences for the user"""
        preferences, created = NotificationPreference.objects.get_or_create(
            user=self.request.user
        )
        return preferences

    def list(self, request, *args, **kwargs):
        """Get user's notification preferences"""
        preferences = self.get_object()
        serializer = self.get_serializer(preferences)
        
        return Response({
            "status": "success",
            "message": "Notification preferences retrieved",
            "data": serializer.data,
        })

    def update(self, request, *args, **kwargs):
        """Update notification preferences"""
        preferences = self.get_object()
        serializer = self.get_serializer(preferences, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                "status": "success",
                "message": "Notification preferences updated successfully",
                "data": serializer.data,
            })
        
        return Response({
            "status": "error",
            "message": "Invalid data provided",
            "errors": serializer.errors,
        }, status=status.HTTP_400_BAD_REQUEST)
