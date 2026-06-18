from rest_framework import viewsets, status, generics, permissions
from rest_framework.response import Response
from .models import Property, PropertyImage, SystemSettings
from .serializers import (
    PropertySerializer,
    ApprovePropertySerializer,
    PropertyImageSerializer,
    ImageListSerializer,
    FlagPropertySerializer,
    FeaturePropertySerializer,
)
from .system_serializers import SystemSettingsReadOnlySerializer
from studentmove.permission import IsAdmin


# Create your views here.
class PropertyViewSet(viewsets.ModelViewSet):
    queryset = Property.objects.all()
    serializer_class = PropertySerializer

    def get_permissions(self):
        permission_classes = []
        if self.action == "pending" or self.action == "flagged":
            permission_classes = [IsAdmin]
        elif self.action in ["create", "update", "partial_update", "destroy"]:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def filter_queryset(self, queryset):
        if self.action == "pending":
            return queryset.filter(status="pending")
        if self.action == "flagged":
            return queryset.filter(status="flagged")
        
     
        # For retrieve, update, and partial_update actions (viewing/updating individual property)
        if self.action in ["retrieve", "update", "partial_update"]:
            # If user is an admin, allow access to all properties
            if self.request.user.groups.filter(name="admin").exists():
                return queryset
            # If user is a landlord, allow them to view their own properties regardless of status
            elif self.request.user.groups.filter(name="landlord").exists():
                return queryset.filter(land_lord=self.request.user)
            # If user is an agent acting as a landlord, filter by the landlord they're acting as
            elif self.request.user.groups.filter(name="agent").exists() and hasattr(self.request, 'acting_as_landlord') and self.request.acting_as_landlord:
                return queryset.filter(land_lord=self.request.acting_as_landlord)
            # For other users, exclude flagged, pending properties and properties from suspended/binned landlords
            return queryset.exclude(status__in=["flagged", "pending"]).exclude(land_lord__profile__status__in=["suspended", "binned"])
        
        # For listing properties
        if self.request.user.groups.filter(name="landlord").exists():
            return queryset.filter(land_lord=self.request.user)
        # If user is an agent acting as a landlord, filter by the landlord they're acting as
        elif self.request.user.groups.filter(name="agent").exists() and hasattr(self.request, 'acting_as_landlord') and self.request.acting_as_landlord:
            return queryset.filter(land_lord=self.request.acting_as_landlord)   
        
        # NOTE: If you ever want agents to see all properties, uncomment the following lines
        elif self.request.user.groups.filter(name="agent").exists():
            return []     
        # For other users, exclude flagged, pending properties and properties from suspended/binned landlord
        return queryset.exclude(status__in=["flagged", "pending"]).exclude(land_lord__profile__status__in=["suspended", "binned"])

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)

        response.data = {
            "status": "success",
            "message": "Property created successfully",
            "data": response.data,
        }
        return response

    def list(self, request, *args, **kwargs):

        response = super().list(request, *args, **kwargs)
        print(response.data)
        response.data = {
            "status": "success",
            "message": "Property listed successfully",
            "data": response.data,
        }
        return response

    def pending(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Pending properties listed successfully",
            "data": response.data,
        }
        return response

    def flagged(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Flagged properties listed successfully",
            "data": response.data,
        }
        return response

    def update(self, request, *args, **kwargs):
        # Check if the user is the landlord of this property or an admin
        property_instance = self.get_object()
        
        is_authorized = False
        
        # Admin can always update
        if request.user.groups.filter(name="admin").exists():
            is_authorized = True
        # Landlord can update their own properties
        elif request.user == property_instance.land_lord:
            is_authorized = True
        # Agent can update if they're acting as the landlord who owns the property
        elif (request.user.groups.filter(name="agent").exists() and 
              hasattr(request, 'acting_as_landlord') and 
              request.acting_as_landlord == property_instance.land_lord):
            is_authorized = True
        
        if not is_authorized:
            return Response(
                {"status": "error", "message": "You don't have permission to update this property."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        response = super().update(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Property updated successfully",
            "data": response.data,
        }
        return response

    def partial_update(self, request, *args, **kwargs):
        # Check if the user is the landlord of this property or an admin
        property_instance = self.get_object()
        
        is_authorized = False
        
        # Admin can always update
        if request.user.groups.filter(name="admin").exists():
            is_authorized = True
        # Landlord can update their own properties
        elif request.user == property_instance.land_lord:
            is_authorized = True
        # Agent can update if they're acting as the landlord who owns the property
        elif (request.user.groups.filter(name="agent").exists() and 
              hasattr(request, 'acting_as_landlord') and 
              request.acting_as_landlord == property_instance.land_lord):
            is_authorized = True
        
        if not is_authorized:
            return Response(
                {"status": "error", "message": "You don't have permission to update this property."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        response = super().partial_update(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Property updated successfully",
            "data": response.data,
        }
        return response

    def destroy(self, request, *args, **kwargs):
        # Check if the user is the landlord of this property or an admin
        property_instance = self.get_object()
        
        is_authorized = False
        
        # Admin can always delete
        if request.user.groups.filter(name="admin").exists():
            is_authorized = True
        # Landlord can delete their own properties
        elif request.user == property_instance.land_lord:
            is_authorized = True
        # Agent can delete if they're acting as the landlord who owns the property
        elif (request.user.groups.filter(name="agent").exists() and 
              hasattr(request, 'acting_as_landlord') and 
              request.acting_as_landlord == property_instance.land_lord):
            is_authorized = True
        
        if not is_authorized:
            return Response(
                {"status": "error", "message": "You don't have permission to delete this property."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        response = super().destroy(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Property deleted successfully",
        }
        return response

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Property retrieved successfully",
            "data": response.data,
        }
        return response

class PropertyListPublicAPIView(generics.ListAPIView):
    serializer_class = PropertySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        # Exclude properties from suspended/binned landlords and properties that are flagged/pending
        return Property.objects.exclude(
            status__in=["flagged", "pending"]
        ).exclude(
            land_lord__profile__status__in=["suspended", "binned"]
        )

    def get(self, request, *args, **kwargs):
        response = super().get(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Property listed successfully",
            "data": response.data,
        }
        return response


class LandlordPropertiesAPIView(generics.ListAPIView):
    """Get properties for a specific landlord (Admin only)"""
    serializer_class = PropertySerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        landlord_id = self.kwargs.get('landlord_id')
        if landlord_id:
            return Property.objects.filter(land_lord_id=landlord_id)
        return Property.objects.none()

    def get(self, request, *args, **kwargs):
        response = super().get(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Landlord properties retrieved successfully",
            "data": response.data,
        }
        return response


class ApprovePropertyViewSet(generics.UpdateAPIView):
    queryset = Property.objects.filter(status__in=["pending", "flagged"])

    serializer_class = ApprovePropertySerializer
    permission_classes = [IsAdmin]

    def patch(self, request, *args, **kwargs):
        response = self.partial_update(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Property approved successfully",
            "data": response.data,
        }
        return response


class FlagPropertyViewSet(generics.UpdateAPIView):
    queryset = Property.objects.all()
    serializer_class = FlagPropertySerializer
    permission_classes = [IsAdmin]

    def patch(self, request, *args, **kwargs):
        response = self.partial_update(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Property Flagged successfully",
            "data": response.data,
        }
        return response


class FeaturePropertyViewSet(generics.UpdateAPIView):
    queryset = Property.objects.all()
    serializer_class = FeaturePropertySerializer
    permission_classes = [IsAdmin]

    def patch(self, request, *args, **kwargs):
        response = self.partial_update(request, *args, **kwargs)
        message = "Property marked as featured" if self.get_object().is_featured else "Property removed from featured"
        response.data = {
            "status": "success",
            "message": message,
            "data": {
                "id": self.get_object().id,
                "is_featured": self.get_object().is_featured,
            },
        }
        return response


class PropertyImageViewSet(viewsets.ModelViewSet):
    queryset = PropertyImage.objects.all()
    serializer_class = PropertyImageSerializer

    def get_serializer_class(self):
        if self.action == "list":
            return ImageListSerializer
        return super().get_serializer_class()

    def filter_queryset(self, queryset):
        property_id = self.kwargs.get("property_id")
        if property_id:
            return queryset.filter(property_id=property_id)
        return queryset

    def create(self, request, *args, **kwargs):
        request.data["property"] = self.kwargs.get("property_id")
        response = super().create(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Property image created successfully",
            "data": response.data,
        }
        return response

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Property image listed successfully",
            "data": response.data,
        }
        return response

    def update(self, request, *args, **kwargs):
        """
        Handle updating property images.
        Expect an array of image IDs to keep and new images to add.
        """
        property_id = self.kwargs.get("property_id")
        keep_image_ids = request.data.getlist(
            "keep"
        )  # Use getlist to handle multiple values
        images = request.data.get("images", [])

        # make keep ids ints
        keep_image_ids = [int(i) for i in keep_image_ids]

        # Validate property existence
        property_obj = Property.objects.filter(id=property_id).first()

        if not property_obj:
            return Response(
                {"status": "fail", "message": "Invalid property ID"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        PropertyImage.objects.filter(property_id=property_id).exclude(
            id__in=keep_image_ids
        ).delete()

        if images:
            request.data["property"] = property_id
            response = super().create(request, *args, **kwargs)
            response.data = {
                "status": "success",
                "message": "New images added successfully",
                "data": response.data,
            }
            return response
        response = Response(
            {"status": "success", "message": "Images Updated successfully"},
            status=status.HTTP_200_OK,
        )

        return response


class SystemSettingsAPIView(generics.RetrieveAPIView):
    """Get system settings for property management"""
    permission_classes = [permissions.AllowAny]
    serializer_class = SystemSettingsReadOnlySerializer

    def get_object(self):
        setting_key = self.kwargs.get('setting_key')
        try:
            return SystemSettings.objects.get(setting_key=setting_key)
        except SystemSettings.DoesNotExist:
            # Return default setting for auto_approve_properties
            if setting_key == "auto_approve_properties":
                return SystemSettings(
                    setting_key="auto_approve_properties",
                    setting_value=False,
                    description="Automatically approve property listings when enabled"
                )
            raise

    def get(self, request, *args, **kwargs):
        try:
            response = super().get(request, *args, **kwargs)
            response.data = {
                "status": "success",
                "message": "System setting retrieved successfully",
                "data": response.data,
            }
            return response
        except SystemSettings.DoesNotExist:
            return Response(
                {"status": "error", "message": "Setting not found"},
                status=status.HTTP_404_NOT_FOUND,
            )


class SystemSettingsUpdateAPIView(generics.UpdateAPIView):
    """Update system settings (Admin only)"""
    permission_classes = [IsAdmin]
    serializer_class = SystemSettingsReadOnlySerializer

    def get_object(self):
        setting_key = self.kwargs.get('setting_key')
        setting, created = SystemSettings.objects.get_or_create(
            setting_key=setting_key,
            defaults={
                'setting_value': False,
                'description': f"System setting for {setting_key}"
            }
        )
        return setting

    def patch(self, request, *args, **kwargs):
        setting_key = self.kwargs.get('setting_key')
        setting_value = request.data.get('setting_value')
        
        if setting_value is None:
            return Response(
                {"status": "error", "message": "setting_value is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Get or create the setting
        setting, created = SystemSettings.objects.get_or_create(
            setting_key=setting_key,
            defaults={
                'setting_value': bool(setting_value),
                'description': f"System setting for {setting_key}"
            }
        )
        
        if not created:
            setting.setting_value = bool(setting_value)
            setting.save()
        
        serializer = self.get_serializer(setting)
        
        return Response({
            "status": "success",
            "message": f"System setting '{setting_key}' updated successfully",
            "data": serializer.data,
        })
