from django.shortcuts import render
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Count, Q, Sum, Avg, Case, When, IntegerField
from django.utils import timezone
from django.http import HttpResponse
from datetime import datetime, timedelta
from decimal import Decimal
import csv

from rest_framework import status, viewsets, generics, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken

from .models import Profile, AgentLandlordRelationship
from .serializers import (
    UserAuthSerializer, 
    UserLoginSerializer, 
    UserSerializer,
    LandlordListSerializer,
    AgentLandlordRelationshipSerializer,
    AgentLandlordSelectSerializer,
    AgentCreateLandlordCompleteSerializer,
)
from studentmove.permission import IsAdmin, IsAdminOrLandlord
from properties.models import Property
from tenants.models import Payment, Installment, MaintenanceRequest, Lease
from studentmove.emailnotifier import EmailNotifier
from notifications.models import Notification
import random


# Create your views here.
class UserRegistrationApiView(generics.CreateAPIView):
    serializer_class = UserAuthSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        profile_data = {
            "phone": request.data.get("phone"),
        }
        request.data["profile"] = profile_data
        response = super().post(request)

        # Send welcome email
        first_name = request.data.get("first_name", "User")
        email = request.data.get("email")
        if email:
            EmailNotifier.notify_user_registration(email, first_name)
            print(f"Welcome email sent to {email}")

        response.data = {
            "status": "success",
            "message": "User registered successfully",
            "userData": response.data,
        }
        return response


class UserLoginApiView(generics.GenericAPIView):
    serializer_class = UserLoginSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user_name = serializer.validated_data["username"]
        password = serializer.validated_data["password"]
        user = authenticate(username=user_name, password=password)
        if user:
            user_data = UserAuthSerializer(user).data
            refresh = RefreshToken.for_user(user)
            respObj = {
                "status": "success",
                "message": "User Loged In Successfully",
                "userData": user_data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            }
            return Response(respObj, status=status.HTTP_200_OK)
        else:
            respObj = {
                "status": "fail",
                "message": ["Invalid email or password"],
            }

        return Response(respObj, status=status.HTTP_403_FORBIDDEN)


class UserProfileViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    queryset = User.objects.all()

    def get_permissions(self):
        permission_classes = []
        if self.action == "approve" or self.action == "suspend":
            permission_classes = [IsAdmin]
        elif self.action == "list":
            permission_classes = [IsAdminOrLandlord]
        elif self.action == "deactivate" or self.action == "update_profile":
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        user = self.request.user
        role = self.kwargs.get("role")

        # If the user is a landlord and the role is tenant
        if user.groups.filter(name="landlord").exists() and role == "tenant":
            # Filter tenants who have a lease in the landlord's properties
            tenants = User.objects.filter(
                groups__name="tenant",
                leases__property_obj__land_lord=user,
            ).distinct()
            print(tenants)
            return tenants
        # Default behavior for other roles
        if self.action == "list" and role:
            return super().get_queryset().filter(groups__name=role)

        return super().get_queryset()

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "User list fetched successfully",
            "users": response.data,
        }
        return response

    def approve(self, request, *args, **kwargs):
        user = self.get_object()
        profile = user.profile
        old_status = profile.status
        profile.status = "active"
        profile.save()
        
        # Send approval notification
        if old_status != "active":
            self._send_status_change_notification(user, "approved", old_status)
        
        response = {
            "status": "success",
            "message": "User approved successfully",
        }
        return Response(response, status=status.HTTP_200_OK)

    def suspend(self, request, *args, **kwargs):
        user = self.get_object()
        profile = user.profile
        old_status = profile.status
        
        # Get suspension reason from request
        suspension_reason = request.data.get('reason', 'No reason provided')
        
        profile.status = "suspended"
        profile.save()
        
        # Send suspension notification
        if old_status != "suspended":
            self._send_status_change_notification(user, "suspended", old_status, suspension_reason)
        
        response = {
            "status": "success",
            "message": "User suspended successfully",
        }
        return Response(response, status=status.HTTP_200_OK)

    def deactivate(self, request, *args, **kwargs):
        user = request.user
        user.is_active = False
        user.save()
        response = {
            "status": "success",
            "message": "User account deactivated successfully",
        }
        return Response(response, status=status.HTTP_200_OK)
        
    def update_profile(self, request, *args, **kwargs):
        """Update the current user's profile information"""
        user = request.user
        
        # Update user fields
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')
        email = request.data.get('email')
        
        if first_name:
            user.first_name = first_name
        
        if last_name:
            user.last_name = last_name
        
        if email and email != user.email:
            # Check if email is already in use
            if User.objects.filter(email=email).exclude(id=user.id).exists():
                return Response(
                    {"status": "error", "message": "This email is already in use."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            user.email = email
        
        # Update profile fields
        profile = user.profile
        open_for_agents = request.data.get('open_for_agents')
        
        if open_for_agents is not None and user.groups.filter(name="landlord").exists():
            profile.open_for_agents = open_for_agents
            profile.save()
            
        user.save()
        
        response = {
            "status": "success",
            "message": "Profile updated successfully",
            "data": UserAuthSerializer(user).data,
        }
        return Response(response, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def retrieve_profile(self, request, pk=None):
        """Get a user's profile by ID"""
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {"status": "error", "message": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        response = {
            "status": "success",
            "message": "Profile retrieved successfully",
            "data": UserSerializer(user).data,
        }
        return Response(response, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def remove_my_agent(self, request):
        """Landlord removes their current agent"""
        if not request.user.groups.filter(name="landlord").exists():
            return Response(
                {"status": "error", "message": "Only landlords can remove agents"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Find the active relationship
        relationship = AgentLandlordRelationship.objects.filter(
            landlord=request.user,
            status='active'
        ).first()

        if not relationship:
            return Response(
                {"status": "error", "message": "No active agent found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Remove the relationship
        relationship.status = 'removed'
        relationship.removed_at = timezone.now()
        relationship.removed_by = 'landlord'
        relationship.save()

        return Response(
            {
                "status": "success",
                "message": f"Agent {relationship.agent.first_name} {relationship.agent.last_name} removed successfully",
            },
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_agent(self, request):
        """Get landlord's current agent"""
        if not request.user.groups.filter(name="landlord").exists():
            return Response(
                {"status": "error", "message": "Only landlords can access this endpoint"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Find the active relationship
        relationship = AgentLandlordRelationship.objects.filter(
            landlord=request.user,
            status='active'
        ).select_related('agent').first()

        if not relationship:
            return Response(
                {
                    "status": "success",
                    "message": "No active agent found",
                    "data": None
                },
                status=status.HTTP_200_OK
            )

        return Response(
            {
                "status": "success",
                "message": "Current agent retrieved successfully",
                "data": {
                    "id": relationship.agent.id,
                    "first_name": relationship.agent.first_name,
                    "last_name": relationship.agent.last_name,
                    "email": relationship.agent.email,
                    "connected_since": relationship.created_at
                }
            },
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['delete'], permission_classes=[IsAdmin])
    def remove_landlord(self, request, pk=None):
        """Remove a landlord - either directly or move to bin based on property count"""
        try:
            user = self.get_object()
            
            # Check if user is a landlord
            if not user.groups.filter(name="landlord").exists():
                return Response(
                    {"status": "error", "message": "User is not a landlord"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            # Count landlord's properties
            property_count = Property.objects.filter(land_lord=user).count()
            
            if property_count > 0:
                # Move to bin for 7 days
                profile = user.profile
                profile.status = "binned"
                profile.bin_date = timezone.now()
                profile.save()
                
                # Send notification
                self._send_removal_notification(user, "binned", property_count)
                
                response_message = f"Landlord moved to bin (has {property_count} properties). Will be permanently deleted after 7 days."
            else:
                # Delete immediately
                user_email = user.email
                user_name = f"{user.first_name} {user.last_name}"
                
                # Send notification before deletion
                self._send_removal_notification(user, "deleted", 0)
                
                # Delete the user
                user.delete()
                
                response_message = "Landlord removed immediately (no properties found)."
            
            return Response(
                {"status": "success", "message": response_message},
                status=status.HTTP_200_OK,
            )
            
        except Exception as e:
            return Response(
                {"status": "error", "message": f"Error removing landlord: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin])
    def restore_landlord(self, request, pk=None):
        """Restore a landlord from bin status"""
        try:
            user = self.get_object()
            profile = user.profile
            
            # Check if user is binned
            if profile.status != "binned":
                return Response(
                    {"status": "error", "message": "User is not in bin status"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            # Restore to active status
            profile.status = "active"
            profile.bin_date = None
            profile.save()
            
            # Send restoration notification
            # Send notification
            self._send_agent_removal_notification(user, "restored", 0, "Account restored by administrator")
            
            return Response(
                {"status": "success", "message": "Landlord restored successfully"},
                status=status.HTTP_200_OK,
            )
            
        except Exception as e:
            return Response(
                {"status": "error", "message": f"Error restoring landlord: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=['get'], permission_classes=[IsAdmin])
    def landlord_stats(self, request, pk=None):
        """Get landlord statistics including property count"""
        try:
            user = self.get_object()
            
            # Check if user is a landlord
            if not user.groups.filter(name="landlord").exists():
                return Response(
                    {"status": "error", "message": "User is not a landlord"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            # Get property count and other stats
            property_count = Property.objects.filter(land_lord=user).count()
            active_leases = Lease.objects.filter(
                property_obj__land_lord=user,
                status="active"
            ).count()
            
            # Check bin status
            profile = user.profile
            bin_info = None
            if profile.status == "binned" and profile.bin_date:
                days_remaining = 7 - (timezone.now() - profile.bin_date).days
                bin_info = {
                    "binned_date": profile.bin_date.isoformat(),
                    "days_remaining": max(0, days_remaining),
                    "deletion_date": (profile.bin_date + timedelta(days=7)).isoformat()
                }
            
            stats = {
                "property_count": property_count,
                "active_leases": active_leases,
                "status": profile.status,
                "bin_info": bin_info
            }
            
            return Response(
                {"status": "success", "data": stats},
                status=status.HTTP_200_OK,
            )
            
        except Exception as e:
            return Response(
                {"status": "error", "message": f"Error getting landlord stats: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _send_removal_notification(self, user, action_type, property_count):
        """Helper method to send removal-related notifications"""
        try:
            if action_type == "binned":
                notification_type = "removal_warning"
                title = "Account Scheduled for Removal"
                message = f"Your landlord account has been scheduled for removal. You have 7 days to resolve any issues. Your {property_count} properties will be affected."
                
            elif action_type == "deleted":
                notification_type = "account_deleted"
                title = "Account Removed"
                message = "Your landlord account has been permanently removed from the system."
                
            elif action_type == "restored":
                notification_type = "account_restored"
                title = "Account Restored"
                message = "Your landlord account has been restored and is now active again."
            
            # Create notification with metadata
            notification_data = {
                "recipient": user,
                "notification_type": notification_type,
                "title": title,
                "message": message,
                "priority": "high" if action_type == "binned" else "medium",
                "metadata": {
                    "action_type": action_type,
                    "property_count": property_count,
                    "user_email": user.email,
                    "user_name": f"{user.first_name} {user.last_name}"
                }
            }
            
            # Create notification instance
            print(f"Creating notification for user {user.email} with type {notification_type}")
            notification = Notification.objects.create(**notification_data)
            print(f"Notification created successfully: ID {notification.id}")
            
            # Send email using EmailNotifier
            EmailNotifier.send_notification_email(
                to_email=user.email,
                subject=title,
                notification_type=notification_type,
                context={
                    "user_name": f"{user.first_name} {user.last_name}",
                    "message": message,
                    "property_count": property_count,
                    "action_type": action_type
                }
            )
            print(f"Email notification sent to {user.email}")
            
        except Exception as e:
            # Log the error but don't fail the main operation
            print(f"Error sending removal notification: {str(e)}")
            import traceback
            traceback.print_exc()

    @action(detail=True, methods=['delete'], permission_classes=[IsAdmin])
    def remove_agent(self, request, pk=None):
        """Remove an agent - either directly or move to bin"""
        try:
            user = self.get_object()
            
            # Get removal reason from request data
            removal_reason = request.data.get('reason', 'No reason provided')
            
            # Check if user is an agent
            if not user.groups.filter(name="agent").exists():
                return Response(
                    {"status": "error", "message": "User is not an agent"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            # Count agent's landlord relationships
            landlord_count = AgentLandlordRelationship.objects.filter(
                agent=user, status='approved'
            ).count()
            
            # Move to bin (agents always go to bin first, regardless of relationships)
            profile = user.profile
            profile.status = "binned"
            profile.bin_date = timezone.now()
            profile.save()
            
            # Send notification with reason
            self._send_agent_removal_notification(user, "binned", landlord_count, removal_reason)
            
            response_message = f"Agent moved to bin (has {landlord_count} landlord relationships). Will be permanently deleted after 7 days."
            
            return Response(
                {"status": "success", "message": response_message},
                status=status.HTTP_200_OK,
            )
            
        except Exception as e:
            return Response(
                {"status": "error", "message": f"Error removing agent: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin])
    def restore_agent(self, request, pk=None):
        """Restore an agent from bin status"""
        try:
            user = self.get_object()
            profile = user.profile
            
            # Check if user is binned
            if profile.status != "binned":
                return Response(
                    {"status": "error", "message": "User is not in bin status"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            # Restore to active status
            profile.status = "active"
            profile.bin_date = None
            profile.save()
            
            # Send restoration notification
            self._send_agent_removal_notification(user, "restored", 0)
            
            return Response(
                {"status": "success", "message": "Agent restored successfully"},
                status=status.HTTP_200_OK,
            )
            
        except Exception as e:
            return Response(
                {"status": "error", "message": f"Error restoring agent: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=['get'], permission_classes=[IsAdmin])
    def agent_stats(self, request, pk=None):
        """Get agent statistics including landlord count"""
        try:
            user = self.get_object()
            
            # Check if user is an agent
            if not user.groups.filter(name="agent").exists():
                return Response(
                    {"status": "error", "message": "User is not an agent"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            # Get landlord count and other stats
            approved_landlord_count = AgentLandlordRelationship.objects.filter(
                agent=user, status='approved'
            ).count()
            
            pending_requests = AgentLandlordRelationship.objects.filter(
                agent=user, status='pending'
            ).count()
            
            # Check bin status
            profile = user.profile
            bin_info = None
            if profile.status == "binned" and profile.bin_date:
                days_remaining = 7 - (timezone.now() - profile.bin_date).days
                bin_info = {
                    "binned_date": profile.bin_date.isoformat(),
                    "days_remaining": max(0, days_remaining),
                    "deletion_date": (profile.bin_date + timedelta(days=7)).isoformat()
                }
            
            stats = {
                "landlord_count": approved_landlord_count,
                "pending_requests": pending_requests,
                "status": profile.status,
                "bin_info": bin_info
            }
            
            return Response(
                {"status": "success", "data": stats},
                status=status.HTTP_200_OK,
            )
            
        except Exception as e:
            return Response(
                {"status": "error", "message": f"Error getting agent stats: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _send_agent_removal_notification(self, user, action_type, landlord_count, reason=None):
        """Helper method to send agent removal-related notifications"""
        try:
            if action_type == "binned":
                notification_type = "removal_warning"
                title = "Account Scheduled for Removal"
                base_message = f"Your agent account has been scheduled for removal. You have 7 days to resolve any issues. Your {landlord_count} landlord relationships will be affected."
                if reason and reason != "No reason provided":
                    message = f"{base_message}\n\nReason: {reason}"
                else:
                    message = base_message
                
            elif action_type == "deleted":
                notification_type = "account_deleted"
                title = "Account Removed"
                base_message = "Your agent account has been permanently removed from the system."
                if reason and reason != "No reason provided":
                    message = f"{base_message}\n\nReason: {reason}"
                else:
                    message = base_message
                
            elif action_type == "restored":
                notification_type = "account_restored"
                title = "Account Restored"
                message = reason or "Your agent account has been restored and is now active again."
            
            # Create notification with metadata
            notification_data = {
                "recipient": user,
                "notification_type": notification_type,
                "title": title,
                "message": message,
                "priority": "high" if action_type == "binned" else "medium",
                "metadata": {
                    "action_type": action_type,
                    "landlord_count": landlord_count,
                    "user_email": user.email,
                    "user_name": f"{user.first_name} {user.last_name}",
                    "reason": reason
                }
            }
            
            # Create notification instance
            print(f"Creating notification for agent {user.email} with type {notification_type}")
            notification = Notification.objects.create(**notification_data)
            print(f"Notification created successfully: ID {notification.id}")
            
            # Send email using EmailNotifier
            EmailNotifier.send_notification_email(
                to_email=user.email,
                subject=title,
                notification_type=notification_type,
                context={
                    "user_name": f"{user.first_name} {user.last_name}",
                    "message": message,
                    "landlord_count": landlord_count,
                    "action_type": action_type
                }
            )
            print(f"Email notification sent to {user.email}")
            
        except Exception as e:
            # Log the error but don't fail the main operation
            print(f"Error sending agent removal notification: {str(e)}")
            import traceback
            traceback.print_exc()

    def _send_status_change_notification(self, user, action_type, old_status, reason=None):
        """Helper method to send status change notifications for approve/suspend actions"""
        try:
            # Determine user role
            user_role = "agent" if user.groups.filter(name="agent").exists() else "landlord"
            
            if action_type == "approved":
                notification_type = "account_approved"
                title = f"{user_role.capitalize()} Account Approved"
                message = f"Congratulations! Your {user_role} account has been approved and is now active. You can now access all platform features."
                priority = "medium"
                
            elif action_type == "suspended":
                notification_type = "account_suspended"
                title = f"{user_role.capitalize()} Account Suspended"
                base_message = f"Your {user_role} account has been suspended and your access has been temporarily restricted."
                message = f"{base_message} Reason: {reason}" if reason and reason != 'No reason provided' else base_message
                priority = "high"
            
            # Create notification with metadata
            notification_data = {
                "recipient": user,
                "notification_type": notification_type,
                "title": title,
                "message": message,
                "priority": priority,
                "metadata": {
                    "action_type": action_type,
                    "old_status": old_status,
                    "new_status": "active" if action_type == "approved" else "suspended",
                    "user_role": user_role,
                    "user_email": user.email,
                    "user_name": f"{user.first_name} {user.last_name}",
                    "reason": reason if reason else None
                }
            }
            
            # Create notification instance
            print(f"Creating status change notification for {user_role} {user.email} with type {notification_type}")
            notification = Notification.objects.create(**notification_data)
            print(f"Status change notification created successfully: ID {notification.id}")
            
            # Send email using EmailNotifier
            EmailNotifier.send_notification_email(
                to_email=user.email,
                subject=title,
                notification_type=notification_type,
                context={
                    "user_name": f"{user.first_name} {user.last_name}",
                    "message": message,
                    "action_type": action_type,
                    "user_role": user_role,
                    "reason": reason,
                    "old_status": old_status
                }
            )
            print(f"Status change email notification sent to {user.email}")
            
        except Exception as e:
            # Log the error but don't fail the main operation
            print(f"Error sending status change notification: {str(e)}")
            import traceback
            traceback.print_exc()


@api_view(["GET"])
@permission_classes([IsAdmin])
def dashboard_stats(request):
    """
    Get comprehensive dashboard statistics including user counts, financial data,
    maintenance requests, and payment analytics.
    """
    try:
        # Basic user and property counts
        landlord_count = User.objects.filter(groups__name="landlord").count()
        tenant_count = User.objects.filter(groups__name="tenant").count()
        total_properties = Property.objects.count()
        pending_properties = Property.objects.filter(status="pending").count()

        # Financial analytics
        # Total revenue (all successful payments)
        total_revenue = Payment.objects.filter(status="success").aggregate(
            total=Sum("amount")
        )["total"] or Decimal("0.00")

        # Monthly revenue (current month)
        current_month_start = timezone.now().replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        )
        current_month_revenue = Payment.objects.filter(
            status="success", created_at__gte=current_month_start
        ).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")

        # Pending payments (installments not yet paid)
        pending_payments = Installment.objects.filter(status="pending").aggregate(
            total=Sum("amount")
        )["total"] or Decimal("0.00")

        # Overdue payments
        overdue_payments = Installment.objects.filter(status="overdue").aggregate(
            total=Sum("amount")
        )["total"] or Decimal("0.00")

        # Payment success rate (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_payments = Payment.objects.filter(created_at__gte=thirty_days_ago)
        total_recent_payments = recent_payments.count()
        successful_recent_payments = recent_payments.filter(status="success").count()
        payment_success_rate = (
            (successful_recent_payments / total_recent_payments * 100)
            if total_recent_payments > 0
            else 0
        )

        # Maintenance request statistics
        maintenance_stats = MaintenanceRequest.objects.aggregate(
            total=Count("id"),
            pending=Count(
                Case(When(status="pending", then=1), output_field=IntegerField())
            ),
            in_progress=Count(
                Case(When(status="in_progress", then=1), output_field=IntegerField())
            ),
            completed=Count(
                Case(When(status="completed", then=1), output_field=IntegerField())
            ),
            confirmed=Count(
                Case(When(status="confirmed", then=1), output_field=IntegerField())
            ),
            high_priority=Count(
                Case(When(priority="high", then=1), output_field=IntegerField())
            ),
        )

        # Lease statistics
        lease_stats = Lease.objects.aggregate(
            total=Count("id"),
            active=Count(
                Case(When(status="active", then=1), output_field=IntegerField())
            ),
            pending=Count(
                Case(When(status="pending", then=1), output_field=IntegerField())
            ),
            completed=Count(
                Case(When(status="completed", then=1), output_field=IntegerField())
            ),
            terminated=Count(
                Case(When(status="terminated", then=1), output_field=IntegerField())
            ),
            rejected=Count(
                Case(When(status="rejected", then=1), output_field=IntegerField())
            ),
            tenant_closed=Count(
                Case(When(status="tenant_closed", then=1), output_field=IntegerField())
            ),
            landlord_closed=Count(
                Case(
                    When(status="landlord_closed", then=1), output_field=IntegerField()
                )
            ),
        )

        # Active leases (for backward compatibility)
        active_leases = lease_stats["active"]

        # Revenue trend (last 6 months)
        revenue_trend = []
        for i in range(5, -1, -1):
            month_start = (
                timezone.now().replace(day=1) - timedelta(days=32 * i)
            ).replace(day=1)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(
                days=1
            )

            month_revenue = Payment.objects.filter(
                status="success", created_at__gte=month_start, created_at__lte=month_end
            ).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")

            revenue_trend.append(
                {
                    "month": month_start.strftime("%Y-%m"),
                    "revenue": float(month_revenue),
                }
            )

        # Recent activity (last 10 activities)
        recent_activities = []

        # Recent successful payments (utility payments)
        recent_successful_payments = Payment.objects.filter(status="success").order_by(
            "-created_at"
        )[:5]

        for payment in recent_successful_payments:
            recent_activities.append(
                {
                    "type": "payment",
                    "title": f"Utility payment received - ${payment.amount}",
                    "description": f"Utility payment for {payment.utility.lease.property_obj.name}",
                    "time": payment.created_at,
                    "amount": float(payment.amount),
                }
            )

        # Recent maintenance requests
        recent_maintenance = MaintenanceRequest.objects.order_by("-created_at")[:5]

        for request in recent_maintenance:
            recent_activities.append(
                {
                    "type": "maintenance",
                    "title": f"New maintenance request",
                    "description": f"{request.issue_title} - {request.priority} priority",
                    "time": request.created_at,
                    "priority": request.priority,
                    "status": request.status,
                }
            )

        # Sort activities by time and limit to 10
        recent_activities.sort(key=lambda x: x["time"], reverse=True)
        recent_activities = recent_activities[:10]

        # Format timestamps for frontend
        for activity in recent_activities:
            activity["time"] = activity["time"].isoformat()

        stats = {
            # Basic counts
            "landlords": landlord_count,
            "tenants": tenant_count,
            "total_properties": total_properties,
            "pending_properties": pending_properties,
            "active_leases": active_leases,
            # Financial data
            "total_revenue": float(total_revenue),
            "current_month_revenue": float(current_month_revenue),
            "pending_payments": float(pending_payments),
            "overdue_payments": float(overdue_payments),
            "payment_success_rate": round(payment_success_rate, 2),
            # Maintenance statistics
            "maintenance_requests": {
                "total": maintenance_stats["total"],
                "pending": maintenance_stats["pending"],
                "in_progress": maintenance_stats["in_progress"],
                "completed": maintenance_stats["completed"],
                "confirmed": maintenance_stats["confirmed"],
                "high_priority": maintenance_stats["high_priority"],
            },
            # Lease statistics
            "lease_statistics": {
                "total": lease_stats["total"],
                "active": lease_stats["active"],
                "pending": lease_stats["pending"],
                "completed": lease_stats["completed"],
                "terminated": lease_stats["terminated"],
                "rejected": lease_stats["rejected"],
                "tenant_closed": lease_stats["tenant_closed"],
                "landlord_closed": lease_stats["landlord_closed"],
            },
            # Trend data
            "revenue_trend": revenue_trend,
            # Recent activity
            "recent_activities": recent_activities,
        }

        response = {
            "status": "success",
            "message": "Dashboard statistics retrieved successfully",
            "data": stats,
        }

        return Response(response, status=status.HTTP_200_OK)

    except Exception as e:
        response = {
            "status": "error",
            "message": f"Error retrieving dashboard statistics: {str(e)}",
        }
        return Response(response, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([IsAdmin])
def download_monthly_report(request):
    """
    Generate and return a downloadable CSV report for the current month.
    """
    try:
        # Get the same stats as dashboard_stats
        # Basic user and property counts
        landlord_count = User.objects.filter(groups__name="landlord").count()
        tenant_count = User.objects.filter(groups__name="tenant").count()
        total_properties = Property.objects.count()
        pending_properties = Property.objects.filter(status="pending").count()

        # Financial analytics
        total_revenue = Payment.objects.filter(status="success").aggregate(
            total=Sum("amount")
        )["total"] or Decimal("0.00")

        current_month_start = timezone.now().replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        )
        current_month_revenue = Payment.objects.filter(
            status="success", created_at__gte=current_month_start
        ).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")

        pending_payments = Installment.objects.filter(status="pending").aggregate(
            total=Sum("amount")
        )["total"] or Decimal("0.00")

        overdue_payments = Installment.objects.filter(status="overdue").aggregate(
            total=Sum("amount")
        )["total"] or Decimal("0.00")

        # Maintenance request statistics
        maintenance_stats = MaintenanceRequest.objects.aggregate(
            total=Count("id"),
            pending=Count(
                Case(When(status="pending", then=1), output_field=IntegerField())
            ),
            in_progress=Count(
                Case(When(status="in_progress", then=1), output_field=IntegerField())
            ),
            completed=Count(
                Case(When(status="completed", then=1), output_field=IntegerField())
            ),
            confirmed=Count(
                Case(When(status="confirmed", then=1), output_field=IntegerField())
            ),
            high_priority=Count(
                Case(When(priority="high", then=1), output_field=IntegerField())
            ),
        )

        # Lease statistics
        lease_stats = Lease.objects.aggregate(
            total=Count("id"),
            active=Count(
                Case(When(status="active", then=1), output_field=IntegerField())
            ),
            pending=Count(
                Case(When(status="pending", then=1), output_field=IntegerField())
            ),
            completed=Count(
                Case(When(status="completed", then=1), output_field=IntegerField())
            ),
            terminated=Count(
                Case(When(status="terminated", then=1), output_field=IntegerField())
            ),
            rejected=Count(
                Case(When(status="rejected", then=1), output_field=IntegerField())
            ),
            tenant_closed=Count(
                Case(When(status="tenant_closed", then=1), output_field=IntegerField())
            ),
            landlord_closed=Count(
                Case(
                    When(status="landlord_closed", then=1), output_field=IntegerField()
                )
            ),
        )

        # Payment success rate
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_payments = Payment.objects.filter(created_at__gte=thirty_days_ago)
        total_recent_payments = recent_payments.count()
        successful_recent_payments = recent_payments.filter(status="success").count()
        payment_success_rate = (
            (successful_recent_payments / total_recent_payments * 100)
            if total_recent_payments > 0
            else 0
        )

        # Create CSV response
        response = HttpResponse(content_type="text/csv")
        current_date = timezone.now()
        month_year = current_date.strftime("%B_%Y")
        response["Content-Disposition"] = (
            f'attachment; filename="Monthly_Report_{month_year}.csv"'
        )

        writer = csv.writer(response)

        # Write CSV content
        writer.writerow(
            [f'Monthly Dashboard Report - {current_date.strftime("%B %Y")}']
        )
        writer.writerow(["Generated on:", current_date.strftime("%Y-%m-%d %H:%M:%S")])
        writer.writerow([])

        writer.writerow(["=== OVERVIEW ==="])
        writer.writerow(["Total Landlords:", landlord_count])
        writer.writerow(["Total Tenants:", tenant_count])
        writer.writerow(["Total Properties:", total_properties])
        writer.writerow(["Pending Properties:", pending_properties])
        writer.writerow(["Active Leases:", lease_stats["active"]])
        writer.writerow([])

        writer.writerow(["=== FINANCIAL SUMMARY ==="])
        writer.writerow(["Total Revenue:", f"${total_revenue:.2f}"])
        writer.writerow(["Current Month Revenue:", f"${current_month_revenue:.2f}"])
        writer.writerow(["Pending Payments:", f"${pending_payments:.2f}"])
        writer.writerow(["Overdue Payments:", f"${overdue_payments:.2f}"])
        writer.writerow(["Payment Success Rate:", f"{payment_success_rate:.2f}%"])
        writer.writerow([])

        writer.writerow(["=== MAINTENANCE REQUESTS ==="])
        writer.writerow(["Total Requests:", maintenance_stats["total"]])
        writer.writerow(["Pending:", maintenance_stats["pending"]])
        writer.writerow(["In Progress:", maintenance_stats["in_progress"]])
        writer.writerow(["Completed:", maintenance_stats["completed"]])
        writer.writerow(["Confirmed:", maintenance_stats["confirmed"]])
        writer.writerow(["High Priority:", maintenance_stats["high_priority"]])
        writer.writerow([])

        writer.writerow(["=== LEASE STATISTICS ==="])
        writer.writerow(["Total Leases:", lease_stats["total"]])
        writer.writerow(["Active:", lease_stats["active"]])
        writer.writerow(["Pending:", lease_stats["pending"]])
        writer.writerow(["Completed:", lease_stats["completed"]])
        writer.writerow(["Terminated:", lease_stats["terminated"]])
        writer.writerow(["Rejected:", lease_stats["rejected"]])
        writer.writerow(["Tenant Closed:", lease_stats["tenant_closed"]])
        writer.writerow(["Landlord Closed:", lease_stats["landlord_closed"]])
        writer.writerow([])

        # Revenue trend (last 6 months)
        writer.writerow(["=== REVENUE TREND (Last 6 Months) ==="])
        writer.writerow(["Month", "Revenue"])
        for i in range(5, -1, -1):
            month_start = (
                timezone.now().replace(day=1) - timedelta(days=32 * i)
            ).replace(day=1)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(
                days=1
            )

            month_revenue = Payment.objects.filter(
                status="success", created_at__gte=month_start, created_at__lte=month_end
            ).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")

            writer.writerow([month_start.strftime("%Y-%m"), f"${month_revenue:.2f}"])
        writer.writerow([])

        # Recent activities
        writer.writerow(["=== RECENT ACTIVITIES ==="])
        writer.writerow(["Type", "Title", "Description", "Date"])

        # Recent payments
        recent_successful_payments = Payment.objects.filter(status="success").order_by(
            "-created_at"
        )[:10]

        for payment in recent_successful_payments:
            writer.writerow(
                [
                    "Payment",
                    f"Utility payment received - ${payment.amount}",
                    f"Utility payment for {payment.utility.lease.property_obj.name}",
                    payment.created_at.strftime("%Y-%m-%d"),
                ]
            )

        # Recent maintenance requests
        recent_maintenance = MaintenanceRequest.objects.order_by("-created_at")[:10]

        for request in recent_maintenance:
            writer.writerow(
                [
                    "Maintenance",
                    "New maintenance request",
                    f"{request.issue_title} - {request.priority} priority",
                    request.created_at.strftime("%Y-%m-%d"),
                ]
            )

        return response

    except Exception as e:
        return Response(
            {"status": "error", "message": f"Failed to generate report: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


class PasswordResetView(generics.CreateAPIView):

    serializer_class = UserAuthSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request):
        email = request.data.get("email")
        if not email:
            return Response(
                {"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email)

            # get profile
            profile = user.profile
            otp = str(random.randint(100000, 999999))
            profile.otp = otp
            profile.otp_expiry = timezone.now() + timedelta(
                minutes=5
            )  # OTP valid for 10 minutes
            profile.save()

            EmailNotifier.password_reset_otp(
                 email=email, otp=otp
            )

            return Response(
                {"message": "Password reset code sent to your email."},
                status=status.HTTP_200_OK,
            )
        except User.DoesNotExist:
            return Response(
                {"error": "User with this email does not exist."},
                status=status.HTTP_404_NOT_FOUND,
            )
        

class UpdatePasswordViewWithOTP(generics.UpdateAPIView):
    serializer_class = UserAuthSerializer
    permission_classes = [permissions.AllowAny]

    def update(self, request, *args, **kwargs):
        email = request.data.get("email")
        otp = request.data.get("otp")
        new_password = request.data.get("newPassword")

        if not email or not otp or not new_password:
            return Response(
                {"error": "Email, OTP, and new password are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email=email)
            profile = user.profile

            # Check if OTP matches and is not expired
            if profile.otp != otp:
                return Response(
                    {"error": "Invalid OTP"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if profile.otp_expiry < timezone.now():
                return Response(
                    {"error": "OTP has expired"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Update the password
            user.set_password(new_password)
            user.save()

            # Clear the OTP and expiry
            profile.otp = None
            profile.otp_expiry = None
            profile.save()

            return Response(
                {"message": "Password updated successfully"},
                status=status.HTTP_200_OK,
            )

        except User.DoesNotExist:
            return Response(
                {"error": "User with this email does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )

class UpdatePasswordViewWithToken(generics.UpdateAPIView):
    serializer_class = UserAuthSerializer
    permission_classes = [permissions.IsAuthenticated]

    def update(self, request, *args, **kwargs):
        user = self.request.user
        current_password = request.data.get("currentPassword")
        new_password = request.data.get("newPassword")

        if not current_password or not new_password:
            return Response(
                {"error": "Current password and new password are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verify the current password
        if not user.check_password(current_password):
            return Response(
                {"error": "Current password is incorrect"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update the password
        user.set_password(new_password)
        user.save()

        # Generate a new access token
        access_token = AccessToken.for_user(user)

        return Response(
            {
                "message": "Password updated successfully",
                "access_token": str(access_token),
            },
            status=status.HTTP_200_OK,
        )


class AgentLandlordViewSet(viewsets.ModelViewSet):
    """ViewSet for managing agent-landlord relationships"""
    serializer_class = AgentLandlordRelationshipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.groups.filter(name="agent").exists():
            # Agents can see their own relationships
            return AgentLandlordRelationship.objects.filter(agent=user)
        elif user.groups.filter(name="landlord").exists():
            # Landlords can see their agent relationships
            return AgentLandlordRelationship.objects.filter(landlord=user)
        elif user.groups.filter(name="admin").exists():
            # Admins can see all relationships
            return AgentLandlordRelationship.objects.all()
        else:
            return AgentLandlordRelationship.objects.none()

    def list(self, request, *args, **kwargs):
        """List all agent-landlord relationships for the authenticated user"""
        response = super().list(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Agent-landlord relationships retrieved successfully",
            "data": response.data,
        }
        return response

    def create(self, request, *args, **kwargs):
        """Agent selects a landlord (no approval needed after admin approval)"""
        if not request.user.groups.filter(name="agent").exists():
            return Response(
                {"status": "error", "message": "Only agents can select landlords"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if agent is approved by admin
        if not request.user.is_active or request.user.profile.status != 'active':
            return Response(
                {"status": "error", "message": "Agent must be approved by admin first"},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = AgentLandlordSelectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        landlord_id = serializer.validated_data['landlord_id']
        
        try:
            landlord = User.objects.get(id=landlord_id)
        except User.DoesNotExist:
            return Response(
                {"status": "error", "message": "Landlord not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if relationship already exists
        existing_relationship = AgentLandlordRelationship.objects.filter(
            agent=request.user, landlord=landlord
        ).first()
        
        if existing_relationship and existing_relationship.status == 'active':
            return Response(
                {"status": "error", "message": "You are already connected to this landlord"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create or reactivate the relationship
        if existing_relationship:
            existing_relationship.status = 'active'
            existing_relationship.removed_at = None
            existing_relationship.removed_by = None
            existing_relationship.save()
            relationship = existing_relationship
        else:
            relationship = AgentLandlordRelationship.objects.create(
                agent=request.user,
                landlord=landlord,
                status='active'
            )

        return Response(
            {
                "status": "success",
                "message": "Successfully connected to landlord",
                "data": AgentLandlordRelationshipSerializer(relationship).data,
            },
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'])
    def remove_relationship(self, request, pk=None):
        """Remove agent-landlord relationship (can be initiated by either party)"""
        try:
            relationship = AgentLandlordRelationship.objects.get(id=pk)
        except AgentLandlordRelationship.DoesNotExist:
            return Response(
                {"status": "error", "message": "Relationship not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check permissions - only involved parties can remove
        if not (relationship.agent == request.user or 
               relationship.landlord == request.user or
               request.user.groups.filter(name="admin").exists()):
            return Response(
                {"status": "error", "message": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN
            )

        if relationship.status != 'active':
            return Response(
                {"status": "error", "message": "Relationship is not active"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Determine who is removing the relationship
        removed_by = None
        if relationship.agent == request.user:
            removed_by = 'agent'
        elif relationship.landlord == request.user:
            removed_by = 'landlord'

        relationship.status = 'removed'
        relationship.removed_at = timezone.now()
        relationship.removed_by = removed_by
        relationship.save()

        return Response(
            {
                "status": "success",
                "message": "Relationship removed successfully",
                "data": AgentLandlordRelationshipSerializer(relationship).data,
            },
            status=status.HTTP_200_OK
        )

    def retrieve(self, request, pk=None):
        """Retrieve a specific agent-landlord relationship"""
        try:
            relationship = AgentLandlordRelationship.objects.get(id=pk)
            
            # Check permissions - only involved parties can view
            if not (relationship.agent == request.user or 
                   relationship.landlord == request.user or
                   request.user.groups.filter(name="admin").exists()):
                return Response(
                    {"status": "error", "message": "Permission denied"},
                    status=status.HTTP_403_FORBIDDEN
                )
                
        except AgentLandlordRelationship.DoesNotExist:
            return Response(
                {"status": "error", "message": "Relationship not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(relationship)
        return Response(
            {
                "status": "success",
                "message": "Relationship retrieved successfully",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK
        )


class LandlordListView(generics.ListAPIView):
    """View for agents to see list of available landlords"""
    serializer_class = LandlordListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not self.request.user.groups.filter(name="agent").exists():
            return User.objects.none()
        
        # Return only active landlords
        return User.objects.filter(
            groups__name="landlord",
            profile__status="active"
        ).distinct()

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Landlords list retrieved successfully",
            "data": response.data,
        }
        return response


class ApprovedLandlordsView(generics.ListAPIView):
    """View for agents to see list of their active landlords"""
    serializer_class = LandlordListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not self.request.user.groups.filter(name="agent").exists():
            return User.objects.none()
        
        # Get active landlord relationships for this agent
        active_relationships = AgentLandlordRelationship.objects.filter(
            agent=self.request.user,
            status='active'
        ).select_related('landlord')
        
        # Extract landlord IDs
        landlord_ids = [rel.landlord.id for rel in active_relationships]
        
        # Return the landlords
        return User.objects.filter(
            id__in=landlord_ids,
            profile__status="active"
        ).distinct()

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Active landlords retrieved successfully",
            "data": response.data,
        }
        return response


class AvailableLandlordsView(generics.ListAPIView):
    """View for agents to see landlords available for selection"""
    serializer_class = LandlordListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not self.request.user.groups.filter(name="agent").exists():
            return User.objects.none()
        
        # Get landlords who are open for agents and don't have an agent yet
        occupied_landlord_ids = AgentLandlordRelationship.objects.filter(
            status='active'
        ).values_list('landlord_id', flat=True)
        
        return User.objects.filter(
            groups__name="landlord",
            profile__status="active",
            profile__open_for_agents=True
        ).exclude(
            id__in=occupied_landlord_ids
        ).distinct()

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Available landlords retrieved successfully",
            "data": response.data,
        }
        return response


class AgentLandlordManagementViewSet(viewsets.ViewSet):
    """ViewSet for agent landlord management including creating new landlords"""
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        """Only agents can access these endpoints"""
        if not self.request.user.groups.filter(name="agent").exists():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only agents can access this endpoint")
        return super().get_permissions()

    @action(detail=False, methods=['get'])
    def my_landlords(self, request):
        """Get all landlords managed by this agent"""
        # Get all active relationships for this agent
        relationships = AgentLandlordRelationship.objects.filter(
            agent=request.user,
            status='active'
        ).select_related('landlord', 'landlord__profile')

        # Separate agent-created vs existing landlords
        agent_created = []
        existing = []

        for rel in relationships:
            landlord_data = {
                "id": rel.landlord.id,
                "email": rel.landlord.email,
                "first_name": rel.landlord.first_name,
                "last_name": rel.landlord.last_name,
                "profile": {
                    "phone": rel.landlord.profile.phone,
                    "status": rel.landlord.profile.status,
                    "company_name": rel.landlord.profile.company_name,
                    "address": rel.landlord.profile.address,
                    "bank_account_number": rel.landlord.profile.bank_account_number,
                    "sort_code": rel.landlord.profile.sort_code,
                    "commission_rate": rel.landlord.profile.commission_rate,
                    "preferred_contact_method": rel.landlord.profile.preferred_contact_method,
                    "notes": rel.landlord.profile.notes,
                    "created_by_agent": rel.landlord.profile.created_by_agent_id,
                },
                "relationship_id": rel.id,
                "created_at": rel.created_at,
                "properties_count": Property.objects.filter(land_lord=rel.landlord).count()
            }

            if rel.landlord.profile.created_by_agent == request.user:
                agent_created.append(landlord_data)
            else:
                existing.append(landlord_data)

        return Response({
            "status": "success",
            "message": "Landlords retrieved successfully",
            "data": {
                "agent_created": agent_created,
                "existing": existing,
                "total": len(agent_created) + len(existing)
            }
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def create_landlord(self, request):
        """Create a new landlord that will be automatically assigned to this agent"""
        serializer = AgentCreateLandlordCompleteSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            landlord = serializer.save()
            
            return Response({
                "status": "success",
                "message": "Landlord created successfully",
                "data": {
                    "id": landlord.id,
                    "email": landlord.email,
                    "first_name": landlord.first_name,
                    "last_name": landlord.last_name,
                    "generated_password": getattr(landlord, 'temp_password', None),
                    "message": "Landlord account created and automatically connected to your agent account"
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            "status": "error",
            "message": "Validation failed",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['put', 'patch'])
    def update_landlord(self, request, pk=None):
        """Update a landlord that was created by this agent"""
        try:
            landlord = User.objects.get(
                id=pk,
                groups__name="landlord",
                profile__created_by_agent=request.user
            )
        except User.DoesNotExist:
            return Response({
                "status": "error",
                "message": "Landlord not found or you don't have permission to edit this landlord"
            }, status=status.HTTP_404_NOT_FOUND)

        # Update user fields
        user_fields = ['first_name', 'last_name', 'email']
        for field in user_fields:
            if field in request.data.get('user', {}):
                setattr(landlord, field, request.data['user'][field])
        
        # Validate email uniqueness if it's being changed
        if 'email' in request.data.get('user', {}) and landlord.email != request.data['user']['email']:
            if User.objects.filter(email=request.data['user']['email']).exists():
                return Response({
                    "status": "error",
                    "message": "A user with this email already exists"
                }, status=status.HTTP_400_BAD_REQUEST)
        
        landlord.save()

        # Update profile fields
        profile = landlord.profile
        profile_fields = [
            'phone', 'company_name', 'address', 'bank_account_number',
            'sort_code', 'commission_rate', 'preferred_contact_method', 'notes'
        ]
        
        for field in profile_fields:
            if field in request.data.get('profile', {}):
                setattr(profile, field, request.data['profile'][field])
        
        profile.save()

        return Response({
            "status": "success",
            "message": "Landlord updated successfully",
            "data": {
                "id": landlord.id,
                "email": landlord.email,
                "first_name": landlord.first_name,
                "last_name": landlord.last_name,
            }
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def available_landlords(self, request):
        """Get landlords available for connection (existing landlords not created by this agent)"""
        # Get landlords that this agent hasn't connected to yet
        connected_landlord_ids = AgentLandlordRelationship.objects.filter(
            agent=request.user,
            status='active'
        ).values_list('landlord_id', flat=True)

        # Get all occupied landlord IDs (landlords that already have active agents)
        occupied_landlord_ids = AgentLandlordRelationship.objects.filter(
            status='active'
        ).values_list('landlord_id', flat=True)

        available_landlords = User.objects.filter(
            groups__name="landlord",
            profile__status="active",
            profile__open_for_agents=True,
            profile__created_by_agent__isnull=True  # Only show landlords not created by agents
        ).exclude(
            id__in=connected_landlord_ids
        ).exclude(
            id__in=occupied_landlord_ids
        ).distinct()

        serializer = LandlordListSerializer(available_landlords, many=True)
        
        return Response({
            "status": "success",
            "message": "Available landlords retrieved successfully",
            "data": serializer.data
        }, status=status.HTTP_200_OK)
