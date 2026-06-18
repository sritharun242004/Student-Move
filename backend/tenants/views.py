from rest_framework import viewsets, generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import (
    Lease,
    MaintenanceRequest,
    Inspection,
    Inquiries,
    Installment,
    Report,
    Payment,
    Document,
    Utility,
    DirectDebitUtility,
    DirectDebitInstallment,
)
from properties.models import Property
from .serializers import (
    LeaseSerializer,
    LeaseApproveSerializer,
    LeaseCloseSerializer,
    MaintananceRequestSerializer,
    InspectionSerializer,
    InspectionStatusUpdateSerializer,
    InspectionScheduleUpdateSerializer,
    InquiriesSerializer,
    InstallmentSerializer,
    ChangeMaintanceRequestStatusSerializer,
    ReportPropertySerializer,
    ResolveReportSerializer,
    DocumentSerializer,
    UtilitySerializer,
    DirectDebitUtilitySerializer,
    DirectDebitInstallmentSerializer,
)
from rest_framework.response import Response
from studentmove.permission import IsAdminOrLandlord
from rest_framework.exceptions import PermissionDenied
from django.http import HttpResponse, Http404
import csv
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum, Count, Case, When, IntegerField, Avg, F, ExpressionWrapper, fields
from decimal import Decimal


class LeaseViewSet(viewsets.ModelViewSet):
    queryset = Lease.objects.all()
    serializer_class = LeaseSerializer

    def get_queryset(self):
        user = self.request.user
        if user.groups.filter(name="admin").exists():
            return Lease.objects.all()
        elif user.groups.filter(name="landlord").exists():
            return Lease.objects.filter(property_obj__land_lord=user)
        elif user.groups.filter(name="agent").exists():
            # If agent is acting as a landlord, show that landlord's leases
            if hasattr(self.request, 'acting_as_landlord') and self.request.acting_as_landlord:
                return Lease.objects.filter(property_obj__land_lord=self.request.acting_as_landlord)
            else:
                return Lease.objects.none()
        elif user.is_authenticated:
            return Lease.objects.filter(tenant=user)
        else:
            return Lease.objects.none()

    def get_object(self):
        if self.action == "get_active_lease":
            tenant = self.request.user
            # get the active or pending lease for the tenant
            active_lease = Lease.objects.filter(
                tenant=tenant, status__in=["active", "pending"]
            ).first()
            if not active_lease:
                raise PermissionDenied("You don't have an active lease.")
            return active_lease
        return super().get_object()

    def create(self, request, *args, **kwargs):
        response = super().create(request)
        response.data = {
            "status": "success",
            "message": "Tenant request created successfully",
            "data": response.data,
        }
        return response

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Tenant requests fetched successfully",
            "data": response.data,
        }

        return response

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Tenant Request retrieved successfully",
            "data": response.data,
        }
        return response

    def destroy(self, request, *args, **kwargs):
        response = super().destroy(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Request deleted successfully",
        }
        return response

    def get_active_lease(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)

        response.data = {
            "status": "success",
            "message": "Active lease retrieved successfully",
            "data": response.data,
        }
        return response


class ApproveLeaseViewSet(generics.UpdateAPIView):
    queryset = Lease.objects.all()
    serializer_class = LeaseApproveSerializer

    def get_queryset(self):
        user = self.request.user
        if user.groups.filter(name="admin").exists():
            return Lease.objects.all()
        elif user.groups.filter(name="landlord").exists():
            return Lease.objects.filter(property_obj__land_lord=user)
        elif user.groups.filter(name="agent").exists():
            # If agent is acting as a landlord, show that landlord's leases
            if hasattr(self.request, 'acting_as_landlord') and self.request.acting_as_landlord:
                return Lease.objects.filter(property_obj__land_lord=self.request.acting_as_landlord)
            else:
                return Lease.objects.none()
        elif user.is_authenticated:
            return Lease.objects.filter(tenant=user)
        else:
            return Lease.objects.none()

    def filter_queryset(self, queryset):
        return queryset.filter(status="pending")

    def patch(self, request, *args, **kwargs):
        response = super().partial_update(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Lease approved successfully",
            "data": response.data,
        }
        return response


class LeaseCloseViewSet(generics.UpdateAPIView):
    queryset = Lease.objects.all()
    serializer_class = LeaseCloseSerializer

    def get_queryset(self):
        user = self.request.user
        if user.groups.filter(name="admin").exists():
            return Lease.objects.all()
        elif user.groups.filter(name="landlord").exists():
            return Lease.objects.filter(property_obj__land_lord=user)
        elif user.groups.filter(name="agent").exists():
            # If agent is acting as a landlord, show that landlord's leases
            if hasattr(self.request, 'acting_as_landlord') and self.request.acting_as_landlord:
                return Lease.objects.filter(property_obj__land_lord=self.request.acting_as_landlord)
            else:
                return Lease.objects.none()
        elif user.is_authenticated:
            return Lease.objects.filter(tenant=user)
        else:
            return Lease.objects.none()

    def filter_queryset(self, queryset):
        return queryset.filter(
            status__in=["active", "tenant_closed", "landlord_closed"]
        )

    def patch(self, request, *args, **kwargs):
        response = super().partial_update(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Lease closed successfully",
            "data": response.data,
        }
        return response


class MaintananceRequestViewSet(viewsets.ModelViewSet):
    queryset = MaintenanceRequest.objects.all()
    serializer_class = MaintananceRequestSerializer

    def get_serializer_class(self):
        if self.action == "update_status":
            return ChangeMaintanceRequestStatusSerializer
        return super().get_serializer_class()

    def get_queryset(self):
        user = self.request.user
        if user.groups.filter(name="admin").exists():
            return MaintenanceRequest.objects.all()
        elif user.groups.filter(name="landlord").exists():
            return MaintenanceRequest.objects.filter(
                lease__property_obj__land_lord=user
            )
        elif user.groups.filter(name="agent").exists():
            # If agent is acting as a landlord, show that landlord's maintenance requests
            if hasattr(self.request, 'acting_as_landlord') and self.request.acting_as_landlord:
                return MaintenanceRequest.objects.filter(
                    lease__property_obj__land_lord=self.request.acting_as_landlord
                )
            else:
                return MaintenanceRequest.objects.none()
        elif user.is_authenticated:
            return MaintenanceRequest.objects.filter(lease__tenant=user)
        else:
            return MaintenanceRequest.objects.none()

    def filter_queryset(self, queryset):
        if self.action == "filter_by_lease":
            lease_id = self.kwargs.get("lease_id")
            return super().filter_queryset(queryset).filter(lease_id=lease_id)
        return super().filter_queryset(queryset)

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Maintenance request created successfully",
            "data": response.data,
        }
        return response

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Maintenance requests fetched successfully",
            "data": response.data,
        }

        return response

    def update_status(self, request, *args, **kwargs):
        request.data["status"] = self.kwargs.get("status")

        user = request.user
        status_value = request.data["status"]

        # Check permissions based on user role and status
        if ((user.groups.filter(name="landlord").exists() or 
             (user.groups.filter(name="agent").exists() and 
              hasattr(request, 'acting_as_landlord') and request.acting_as_landlord)) and 
            status_value == "confirmed") or (
            user.groups.filter(name="tenant").exists()
            and status_value in ["completed", "in_progress"]
        ):
            raise PermissionDenied(
                "You don't have permission to perform this operation"
            )

        response = super().update(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Maintenance request status updated successfully.",
            "data": response.data,
        }
        return response

    def filter_by_lease(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)

        response.data = {
            "status": "success",
            "message": "Maintenance requests filtered by lease ID",
            "data": response.data,
        }
        return response

    def update(self, request, *args, **kwargs):

        response = super().update(request,partial=True, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Maintenance request updated successfully",
            "data": response.data,
        }
        return response


class InspectionViewSet(viewsets.ModelViewSet):
    queryset = Inspection.objects.all()
    serializer_class = InspectionSerializer

    def get_queryset(self):
        user = self.request.user
        if user.groups.filter(name="admin").exists():
            return Inspection.objects.all()
        elif user.groups.filter(name="landlord").exists():
            return Inspection.objects.filter(lease__property_obj__land_lord=user)
        elif user.groups.filter(name="agent").exists():
            # If agent is acting as a landlord, show that landlord's inspections
            if hasattr(self.request, 'acting_as_landlord') and self.request.acting_as_landlord:
                return Inspection.objects.filter(lease__property_obj__land_lord=self.request.acting_as_landlord)
            else:
                return Inspection.objects.none()
        elif user.is_authenticated:
            return Inspection.objects.filter(lease__tenant=user)
        else:
            return Inspection.objects.none()

    def filter_queryset(self, queryset):
        if self.action == "filter_by_lease":
            lease_id = self.kwargs.get("lease_id")
            return super().filter_queryset(queryset).filter(lease_id=lease_id)
        return super().filter_queryset(queryset)

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Inspection request created successfully",
            "data": response.data,
        }
        return response

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Inspection requests fetched successfully",
            "data": response.data,
        }

        return response

    def destroy(self, request, *args, **kwargs):
        response = super().destroy(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Inspection request deleted successfully",
        }
        return response

    def patch(self, request, *args, **kwargs):
        response = super().partial_update(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Inspection request updated successfully",
            "data": response.data,
        }
        return response

    def filter_by_lease(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)

        response.data = {
            "status": "success",
            "message": "Inspections filtered by lease ID",
            "data": response.data,
        }
        return response


class InspectionStatusUpdateViewSet(generics.UpdateAPIView):
    queryset = Inspection.objects.all()
    serializer_class = InspectionStatusUpdateSerializer

    def get_queryset(self):
        user = self.request.user
        if user.groups.filter(name="admin").exists():
            return Inspection.objects.all()
        elif user.groups.filter(name="landlord").exists():
            return Inspection.objects.filter(lease__property_obj__land_lord=user)
        elif user.groups.filter(name="agent").exists():
            # If agent is acting as a landlord, show that landlord's inspections
            if hasattr(self.request, 'acting_as_landlord') and self.request.acting_as_landlord:
                return Inspection.objects.filter(lease__property_obj__land_lord=self.request.acting_as_landlord)
            else:
                raise PermissionDenied(
                    "You don't have permission to perform this operation"
                )
        else:
            raise PermissionDenied(
                "You don't have permission to perform this operation"
            )

    def patch(self, request, *args, **kwargs):
        response = super().partial_update(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Inspection status updated successfully",
            "data": response.data,
        }
        return response


class InspectionScheduleUpdateViewSet(generics.UpdateAPIView):
    queryset = Inspection.objects.all()
    serializer_class = InspectionScheduleUpdateSerializer

    def get_queryset(self):
        user = self.request.user
        if user.groups.filter(name="admin").exists():
            return Inspection.objects.all()
        elif user.groups.filter(name="landlord").exists():
            return Inspection.objects.filter(lease__property_obj__land_lord=user)
        elif user.groups.filter(name="agent").exists():
            # If agent is acting as a landlord, show that landlord's inspections
            if hasattr(self.request, 'acting_as_landlord') and self.request.acting_as_landlord:
                return Inspection.objects.filter(lease__property_obj__land_lord=self.request.acting_as_landlord)
            else:
                raise PermissionDenied(
                    "You don't have permission to perform this operation"
                )
        else:
            raise PermissionDenied(
                "You don't have permission to perform this operation"
            )

    def patch(self, request, *args, **kwargs):
        response = super().partial_update(request, *args, **kwargs)
        # Explicitly structure the response
        response.data = {
            "status": "success",
            "message": "Inspection schedule updated successfully",
            "data": {
                "date": response.data.get("date"),
                "time": response.data.get("time"),
            },
        }
        print(response)
        return response


class InquiriesViewSet(viewsets.ModelViewSet):
    queryset = Inquiries.objects.all()
    serializer_class = InquiriesSerializer

    def get_queryset(self):
        user = self.request.user
        if user.groups.filter(name="admin").exists():
            return Inquiries.objects.all()
        elif user.groups.filter(name="landlord").exists():
            return Inquiries.objects.filter(property__land_lord=user)
        elif user.groups.filter(name="agent").exists():
            # If agent is acting as a landlord, show that landlord's inquiries
            if hasattr(self.request, 'acting_as_landlord') and self.request.acting_as_landlord:
                return Inquiries.objects.filter(property__land_lord=self.request.acting_as_landlord)
            else:
                return Inquiries.objects.none()
        elif user.is_authenticated:
            return Inquiries.objects.filter(tenant=user)
        else:
            return Inquiries.objects.none()

    def filter_queryset(self, queryset):
        if self.action == "filter_by_property":
            property_id = self.kwargs.get("property_id")
            return super().filter_queryset(queryset).filter(property_id=property_id)
        return super().filter_queryset(queryset)

    def create(self, request, *args, **kwargs):
        request.data["tenant"] = request.user.id
        response = super().create(request)
        response.data = {
            "status": "success",
            "message": "Inquiry created successfully",
            "data": response.data,
        }
        return response

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Inquiries fetched successfully",
            "data": response.data,
        }

        return response

    def destroy(self, request, *args, **kwargs):
        response = super().destroy(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Inquiry deleted successfully",
        }
        return response

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Inquiry retrieved successfully",
            "data": response.data,
        }
        return response

    def filter_by_property(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)

        response.data = {
            "status": "success",
            "message": "Inquiries filtered by Property ID",
            "data": response.data,
        }
        return response

    def update(self, request, *args, **kwargs):
        response = super().update(request, partial=True, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Inquiry updated successfully",
            "data": response.data,
        }
        return response

    def resolve(self, request, *args, **kwargs):
        user = request.user
        if not (user.groups.filter(name="landlord").exists() or 
                (user.groups.filter(name="agent").exists() and 
                 hasattr(request, 'acting_as_landlord') and request.acting_as_landlord)):
            raise PermissionDenied(
                "You don't have permission to perform this operation"
            )
        request.data["status"] = "resolved"
        response = super().update(request, partial=True, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Inquiry resolved successfully",
            "data": response.data,
        }
        return response


class RespondToInquiryViewSet(viewsets.ModelViewSet):
    queryset = Inquiries.objects.all()
    serializer_class = InquiriesSerializer
    permission_classes = [IsAdminOrLandlord]

    def get_queryset(self):
        user = self.request.user
        if user.groups.filter(name="admin").exists():
            return Inquiries.objects.all()
        elif user.groups.filter(name="landlord").exists():
            return Inquiries.objects.filter(property__land_lord=user)
        elif user.groups.filter(name="agent").exists():
            # If agent is acting as a landlord, show that landlord's inquiries
            if hasattr(self.request, 'acting_as_landlord') and self.request.acting_as_landlord:
                return Inquiries.objects.filter(property__land_lord=self.request.acting_as_landlord)
            else:
                return Inquiries.objects.none()
        else:
            return Inquiries.objects.filter(lease__tenant=user)

    def patch(self, request, *args, **kwargs):
        response = self.partial_update(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Inquiry response updated successfully",
            "data": response.data,
        }
        return response


class ChangeInstallementType(generics.UpdateAPIView):
    queryset = Lease.objects.all()
    serializer_class = LeaseSerializer

    def get_object(self):
        lease_obj = super().get_object()
        user = self.request.user
        
        # Check permissions: landlord, admin, or agent acting as the landlord
        if user.groups.filter(name="admin").exists():
            return lease_obj
        elif user.groups.filter(name="landlord").exists() and lease_obj.property_obj.land_lord == user:
            return lease_obj
        elif user.groups.filter(name="agent").exists():
            if hasattr(self.request, 'acting_as_landlord') and self.request.acting_as_landlord:
                if lease_obj.property_obj.land_lord == self.request.acting_as_landlord:
                    return lease_obj
            
        raise PermissionDenied(
            "You don't have permission to perform this operation"
        )

    def update(self, request, *args, **kwargs):
        lease_obj = self.get_object()
        lease_obj.installment_type = (
            "monthly" if lease_obj.installment_type == "weekly" else "weekly"
        )
        lease_obj.save()
        return Response(
            {"status": "success", "message": "Installment type toggled successfully"},
            status=status.HTTP_200_OK,
        )


class InstallmentViewSet(viewsets.ModelViewSet):
    queryset = Installment.objects.all()
    serializer_class = InstallmentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.groups.filter(name="admin").exists():
            return Installment.objects.all()
        elif user.groups.filter(name="landlord").exists():
            return Installment.objects.filter(lease__property_obj__land_lord=user)
        elif user.groups.filter(name="agent").exists():
            # If agent is acting as a landlord, show that landlord's installments
            if hasattr(self.request, 'acting_as_landlord') and self.request.acting_as_landlord:
                return Installment.objects.filter(lease__property_obj__land_lord=self.request.acting_as_landlord)
            else:
                return Installment.objects.none()
        elif user.is_authenticated:
            return Installment.objects.filter(lease__tenant=user)
        else:
            return Installment.objects.none()

    def get_object(self):
        obj = super().get_object()
        if self.action == "update" or self.action == "destroy":
            user = self.request.user
            
            # Check permissions: landlord, admin, or agent acting as the landlord
            if user.groups.filter(name="admin").exists():
                pass  # Admin can do anything
            elif user.groups.filter(name="landlord").exists():
                if obj.lease.property_obj.land_lord != user:
                    raise PermissionDenied(
                        "You don't have permission to perform this operation"
                    )
            elif user.groups.filter(name="agent").exists():
                if hasattr(self.request, 'acting_as_landlord') and self.request.acting_as_landlord:
                    if obj.lease.property_obj.land_lord != self.request.acting_as_landlord:
                        raise PermissionDenied(
                            "You don't have permission to perform this operation"
                        )
                else:
                    raise PermissionDenied(
                        "You don't have permission to perform this operation"
                    )
            else:
                raise PermissionDenied(
                    "You don't have permission to perform this operation"
                )
                
            if obj.status == "paid":
                raise PermissionDenied("You can't Change paid installments.")
        return obj

    def filter_queryset(self, queryset):
        if self.action == "list":
            lease_id = self.kwargs.get("lease_id")
            return super().filter_queryset(queryset).filter(lease_id=lease_id)

        return super().filter_queryset(queryset)

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Installment updated successfully",
            "data": response.data,
        }
        return response

    def destroy(self, request, *args, **kwargs):
        response = super().destroy(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Installment deleted successfully",
        }
        return response

    def list(self, request, *args, **kwargs):

        response = super().list(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Installments fetched successfully",
            "data": response.data,
        }
        return response


class ReportPropertyViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all()
    serializer_class = ReportPropertySerializer

    def get_queryset(self):
        user = self.request.user
        if user.groups.filter(name="tenant").exists():
            return Report.objects.filter(tenant=user)
        elif user.groups.filter(name="admin").exists():
            return Report.objects.all()
        raise PermissionDenied("You do not have permission to access reports.")

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Property reported successfully",
            "data": response.data,
        }
        return response

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Property report retrieved successfully",
            "data": response.data,
        }
        return response

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Property reports fetched successfully",
            "data": response.data,
        }
        return response


class PropertyReportResolveViewSet(generics.UpdateAPIView):
    queryset = Report.objects.filter(status="pending")
    serializer_class = ResolveReportSerializer

    def get_queryset(self):
        user = self.request.user
        if user.groups.filter(name="admin").exists():
            return Report.objects.all()
        raise PermissionDenied("You do not have permission to access reports.")

    def patch(self, request, *args, **kwargs):
        response = super().partial_update(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Property report resolved successfully",
            "data": response.data,
        }
        return response


# Class has been moved to report_views.py - keeping this as a reference
# class LandlordLeaseReportView(generics.GenericAPIView):
#     """
#     Generate and return a downloadable CSV report for a landlord's leases
#     """
#     permission_classes = [IsAuthenticated]
#     
#     def get(self, request, *args, **kwargs):
#         user = request.user
#         if not user.groups.filter(name="landlord").exists():
#             return Response(
#                 {"status": "error", "message": "Only landlords can access lease reports"},
#                 status=status.HTTP_403_FORBIDDEN,
#             )
#             
#         # Get all leases for this landlord
#         landlord_leases = Lease.objects.filter(property_obj__land_lord=user)
#         
#         # Lease statistics
#         lease_stats = landlord_leases.aggregate(
#             total=Count("id"),
#             active=Count(Case(When(status="active", then=1), output_field=IntegerField())),
#             pending=Count(Case(When(status="pending", then=1), output_field=IntegerField())),
#             completed=Count(Case(When(status="completed", then=1), output_field=IntegerField())),
#             terminated=Count(Case(When(status="terminated", then=1), output_field=IntegerField())),
#             rejected=Count(Case(When(status="rejected", then=1), output_field=IntegerField())),
#             tenant_closed=Count(Case(When(status="tenant_closed", then=1), output_field=IntegerField())),
#             landlord_closed=Count(Case(When(status="landlord_closed", then=1), output_field=IntegerField()))
#         )
#         
#         # For each active lease, get the monthly installment amount
#         active_leases = landlord_leases.filter(status="active")
#         total_rent_value = Decimal("0.00")
#         
#         # Get total from first installment of each active lease
#         for lease in active_leases:
#             first_installment = lease.installments.first()
#             if first_installment:
#                 total_rent_value += first_installment.amount
#         
#         # Calculate installments and payment statistics
#         installments = Installment.objects.filter(lease__in=landlord_leases)
#         installment_stats = installments.aggregate(
#             total=Count("id"),
#             paid=Count(Case(When(status="paid", then=1), output_field=IntegerField())),
#             pending=Count(Case(When(status="pending", then=1), output_field=IntegerField())),
#             overdue=Count(Case(When(status="overdue", then=1), output_field=IntegerField()))
#         )
#         
#         # Calculate payment amounts
#         paid_amount = Payment.objects.filter(installment__in=installments, status="success").aggregate(
#             total=Sum("amount")
#         )["total"] or Decimal("0.00")
#         
#         pending_amount = installments.filter(status="pending").aggregate(
#             total=Sum("amount")
#         )["total"] or Decimal("0.00")
#         
#         overdue_amount = installments.filter(status="overdue").aggregate(
#             total=Sum("amount")
#         )["total"] or Decimal("0.00")
#         
#         # Create CSV response
#         response = HttpResponse(content_type="text/csv")
#         current_date = timezone.now()
#         month_year = current_date.strftime("%B_%Y")
#         landlord_name = user.get_full_name() or user.username
#         response["Content-Disposition"] = f'attachment; filename="Landlord_Lease_Report_{landlord_name}_{month_year}.csv"'
#         
#         writer = csv.writer(response)
#         
#         # Write CSV content
#         writer.writerow([f'Landlord Lease Report - {current_date.strftime("%B %Y")}'])
#         writer.writerow(["Landlord:", landlord_name])
#         writer.writerow(["Generated on:", current_date.strftime("%Y-%m-%d %H:%M:%S")])
#         writer.writerow([])
#         
#         writer.writerow(["=== LEASE SUMMARY ==="])
#         writer.writerow(["Total Properties:", Property.objects.filter(land_lord=user).count()])
#         writer.writerow(["Total Leases:", lease_stats["total"]])
#         writer.writerow(["Active Leases:", lease_stats["active"]])
#         writer.writerow(["Pending Leases:", lease_stats["pending"]])
#         writer.writerow(["Completed Leases:", lease_stats["completed"]])
#         writer.writerow(["Terminated Leases:", lease_stats["terminated"]])
#         writer.writerow(["Total Monthly Rent Value:", f"${total_rent_value:.2f}"])
#         writer.writerow([])
#         
#         writer.writerow(["=== PAYMENT SUMMARY ==="])
#         writer.writerow(["Total Installments:", installment_stats["total"]])
#         writer.writerow(["Paid Installments:", installment_stats["paid"]])
#         writer.writerow(["Pending Installments:", installment_stats["pending"]])
#         writer.writerow(["Overdue Installments:", installment_stats["overdue"]])
#         writer.writerow(["Total Paid Amount:", f"${paid_amount:.2f}"])
#         writer.writerow(["Pending Amount:", f"${pending_amount:.2f}"])
#         writer.writerow(["Overdue Amount:", f"${overdue_amount:.2f}"])
#         writer.writerow([])
#         
#         # Monthly revenue for last 6 months
#         writer.writerow(["=== MONTHLY REVENUE (Last 6 Months) ==="])
#         writer.writerow(["Month", "Revenue"])
#         for i in range(5, -1, -1):
#             month_start = (timezone.now().replace(day=1) - timedelta(days=32 * i)).replace(day=1)
#             month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
#             
#             month_revenue = Payment.objects.filter(
#                 installment__lease__in=landlord_leases,
#                 status="success", 
#                 created_at__gte=month_start, 
#                 created_at__lte=month_end
#             ).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
#             
#             writer.writerow([month_start.strftime("%Y-%m"), f"${month_revenue:.2f}"])
#         writer.writerow([])
#         
#         # List of properties and active leases
#         writer.writerow(["=== PROPERTY AND LEASE DETAILS ==="])
#         writer.writerow(["Property ID", "Property Name", "Address", "Lease Status", "Tenant", "Monthly Rent", "Start Date", "End Date"])
#         
#         for lease in landlord_leases:
#             # Get monthly rent amount from first installment
#             first_installment = lease.installments.first()
#             monthly_rent = first_installment.amount if first_installment else Decimal("0.00")
#             
#             writer.writerow([
#                 lease.property_obj.id,
#                 lease.property_obj.name,
#                 lease.property_obj.address,
#                 lease.status,
#                 lease.tenant.username,
#                 f"${monthly_rent:.2f}",
#                 lease.start_date.strftime("%Y-%m-%d") if lease.start_date else "N/A",
#                 lease.end_date.strftime("%Y-%m-%d") if lease.end_date else "N/A",
#             ])
#         writer.writerow([])
#         
#         # Recent payments
#         writer.writerow(["=== RECENT PAYMENTS ==="])
#         writer.writerow(["Date", "Property", "Tenant", "Amount", "Status"])
#         recent_payments = Payment.objects.filter(
#             installment__lease__in=landlord_leases
#         ).order_by("-created_at")[:20]
#         
#         for payment in recent_payments:
#            writer.writerow([
#                payment.created_at.strftime("%Y-%m-%d"),
#                payment.installment.lease.property_obj.name,
#                payment.installment.lease.tenant.username,
#                f"${payment.amount:.2f}",
#                payment.status,
#            ])
#        
#            return response
#
#        except Exception as e:
#            # Return an error response compatible with DRF
#            return Response(
#                {"status": "error", "message": f"Failed to generate lease report: {str(e)}"},
#                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
#            )


class DocumentUploadView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DocumentSerializer

    def post(self, request, *args, **kwargs):
        try:
            # Get the lease ID from the request data
            lease_id = request.data.get('lease_id')
            
            if not lease_id:
                return Response(
                    {'error': 'Lease ID is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Verify that the lease exists and the user has permission to upload documents
            user = request.user
            try:
                if user.groups.filter(name="tenant").exists():
                    # Tenants can upload documents for their own leases
                    lease = Lease.objects.get(id=lease_id, tenant=user)
                elif user.groups.filter(name="landlord").exists():
                    # Landlords can upload documents for leases on their properties
                    lease = Lease.objects.get(id=lease_id, property_obj__land_lord=user)
                elif user.groups.filter(name="agent").exists():
                    # Agents can upload documents for leases when acting as landlord
                    if hasattr(request, 'acting_as_landlord') and request.acting_as_landlord:
                        lease = Lease.objects.get(id=lease_id, property_obj__land_lord=request.acting_as_landlord)
                    else:
                        return Response(
                            {'error': 'You do not have permission to upload documents'},
                            status=status.HTTP_403_FORBIDDEN
                        )
                elif user.groups.filter(name="admin").exists():
                    # Admins can upload documents for any lease
                    lease = Lease.objects.get(id=lease_id)
                else:
                    return Response(
                        {'error': 'You do not have permission to upload documents'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except Lease.DoesNotExist:
                return Response(
                    {'error': 'Lease not found or you do not have permission to upload documents for this lease'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Create a copy of request data without lease_id since we'll set lease manually
            data = request.data.copy()
            if 'lease_id' in data:
                del data['lease_id']
            
            # Create the document
            serializer = self.get_serializer(data=data)
            if serializer.is_valid():
                serializer.save(lease=lease)
                return Response(
                    {
                        'message': 'Document uploaded successfully',
                        'data': serializer.data
                    },
                    status=status.HTTP_201_CREATED
                )
            else:
                return Response(
                    {'error': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {'error': f'An error occurred: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DocumentListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DocumentSerializer

    def get_queryset(self):
        user = self.request.user
        lease_id = self.kwargs.get('lease_id')
        
        if lease_id:
            # Get documents for a specific lease based on user permissions
            if user.groups.filter(name="tenant").exists():
                # Tenants can view documents for their own leases
                return Document.objects.filter(lease_id=lease_id, lease__tenant=user)
            elif user.groups.filter(name="landlord").exists():
                # Landlords can view documents for leases on their properties
                return Document.objects.filter(lease_id=lease_id, lease__property_obj__land_lord=user)
            elif user.groups.filter(name="agent").exists():
                # Agents can view documents when acting as landlord
                if hasattr(self.request, 'acting_as_landlord') and self.request.acting_as_landlord:
                    return Document.objects.filter(lease_id=lease_id, lease__property_obj__land_lord=self.request.acting_as_landlord)
                else:
                    return Document.objects.none()
            elif user.groups.filter(name="admin").exists():
                # Admins can view documents for any lease
                return Document.objects.filter(lease_id=lease_id)
            else:
                return Document.objects.none()
        else:
            # Get all documents for the user's leases
            if user.groups.filter(name="tenant").exists():
                # Tenants can view documents for their own leases
                return Document.objects.filter(lease__tenant=user)
            elif user.groups.filter(name="landlord").exists():
                # Landlords can view documents for leases on their properties
                return Document.objects.filter(lease__property_obj__land_lord=user)
            elif user.groups.filter(name="agent").exists():
                # Agents can view documents when acting as landlord
                if hasattr(self.request, 'acting_as_landlord') and self.request.acting_as_landlord:
                    return Document.objects.filter(lease__property_obj__land_lord=self.request.acting_as_landlord)
                else:
                    return Document.objects.none()
            elif user.groups.filter(name="admin").exists():
                # Admins can view all documents
                return Document.objects.all()
            else:
                return Document.objects.none()


class DocumentDownloadView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, document_id, *args, **kwargs):
        try:
            # Get the document and verify ownership based on user permissions
            user = request.user
            document = None
            
            if user.groups.filter(name="tenant").exists():
                # Tenants can download documents for their own leases
                document = Document.objects.get(id=document_id, lease__tenant=user)
            elif user.groups.filter(name="landlord").exists():
                # Landlords can download documents for leases on their properties
                document = Document.objects.get(id=document_id, lease__property_obj__land_lord=user)
            elif user.groups.filter(name="agent").exists():
                # Agents can download documents when acting as landlord
                if hasattr(request, 'acting_as_landlord') and request.acting_as_landlord:
                    document = Document.objects.get(id=document_id, lease__property_obj__land_lord=request.acting_as_landlord)
                else:
                    return Response(
                        {'error': 'You do not have permission to download documents'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            elif user.groups.filter(name="admin").exists():
                # Admins can download any document
                document = Document.objects.get(id=document_id)
            else:
                return Response(
                    {'error': 'You do not have permission to download documents'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Create HTTP response with file
            from django.http import HttpResponse
            import os
            
            if document.file and os.path.exists(document.file.path):
                with open(document.file.path, 'rb') as file:
                    response = HttpResponse(file.read())
                    response['Content-Type'] = 'application/octet-stream'
                    response['Content-Disposition'] = f'attachment; filename="{os.path.basename(document.file.name)}"'
                    return response
            else:
                return Response(
                    {'error': 'File not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
                
        except Document.DoesNotExist:
            return Response(
                {'error': 'Document not found or you do not have permission to access it'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'An error occurred: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DocumentDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, document_id, *args, **kwargs):
        try:
            # Get the document and verify ownership based on user permissions
            user = request.user
            document = None
            
            if user.groups.filter(name="tenant").exists():
                # Tenants can delete documents for their own leases
                document = Document.objects.get(id=document_id, lease__tenant=user)
            elif user.groups.filter(name="landlord").exists():
                # Landlords can delete documents for leases on their properties
                document = Document.objects.get(id=document_id, lease__property_obj__land_lord=user)
            elif user.groups.filter(name="agent").exists():
                # Agents can delete documents when acting as landlord
                if hasattr(request, 'acting_as_landlord') and request.acting_as_landlord:
                    document = Document.objects.get(id=document_id, lease__property_obj__land_lord=request.acting_as_landlord)
                else:
                    return Response(
                        {'error': 'You do not have permission to delete documents'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            elif user.groups.filter(name="admin").exists():
                # Admins can delete any document
                document = Document.objects.get(id=document_id)
            else:
                return Response(
                    {'error': 'You do not have permission to delete documents'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Delete the file from storage
            if document.file:
                import os
                if os.path.exists(document.file.path):
                    os.remove(document.file.path)
            
            # Delete the document record
            document.delete()
            
            return Response(
                {'message': 'Document deleted successfully'},
                status=status.HTTP_200_OK
            )
                
        except Document.DoesNotExist:
            return Response(
                {'error': 'Document not found or you do not have permission to delete it'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'An error occurred: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UtilityViewSet(viewsets.ModelViewSet):
    queryset = Utility.objects.all()
    serializer_class = UtilitySerializer  # You may want to create a UtilitySerializer for more specific fields

    def get_queryset(self):
        user = self.request.user
        if user.groups.filter(name="admin").exists():
            return Utility.objects.all()
        elif user.groups.filter(name="landlord").exists():
            return Utility.objects.filter(lease__property_obj__land_lord=user)
        elif user.groups.filter(name="agent").exists():
            if hasattr(self.request, 'acting_as_landlord') and self.request.acting_as_landlord:
                return Utility.objects.filter(lease__property_obj__land_lord=self.request.acting_as_landlord)
            else:
                return Utility.objects.none()
        elif user.is_authenticated:
            return Utility.objects.filter(lease__tenant=user)
        else:
            return Utility.objects.none()

    def get_object(self):
        obj = super().get_object()
        if self.action in ["update", "destroy"]:
            user = self.request.user
            if user.groups.filter(name="admin").exists():
                pass
            elif user.groups.filter(name="landlord").exists():
                if obj.lease.property_obj.land_lord != user:
                    raise PermissionDenied("You don't have permission to perform this operation")
            elif user.groups.filter(name="agent").exists():
                if hasattr(self.request, 'acting_as_landlord') and self.request.acting_as_landlord:
                    if obj.lease.property_obj.land_lord != self.request.acting_as_landlord:
                        raise PermissionDenied("You don't have permission to perform this operation")
                else:
                    raise PermissionDenied("You don't have permission to perform this operation")
            else:
                raise PermissionDenied("You don't have permission to perform this operation")
            if obj.status == "paid":
                raise PermissionDenied("You can't change paid utilities.")
        return obj

    def filter_queryset(self, queryset):
        if self.action == "list":
            lease_id = self.kwargs.get("lease_id")
            return super().filter_queryset(queryset).filter(lease_id=lease_id)
        return super().filter_queryset(queryset)

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Utility updated successfully",
            "data": response.data,
        }
        return response

    def destroy(self, request, *args, **kwargs):
        response = super().destroy(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Utility deleted successfully",
        }
        return response

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Utilities fetched successfully",
            "data": response.data,
        }
        return response


class DirectDebitUtilityViewSet(viewsets.ModelViewSet):
    queryset = DirectDebitUtility.objects.all()
    serializer_class = DirectDebitUtilitySerializer

    def get_queryset(self):
        user = self.request.user
        if user.groups.filter(name="admin").exists():
            return DirectDebitUtility.objects.all()
        elif user.groups.filter(name="landlord").exists():
            return DirectDebitUtility.objects.filter(lease_for_utility__property_obj__land_lord=user)
        elif user.groups.filter(name="agent").exists():
            if hasattr(self.request, 'acting_as_landlord') and self.request.acting_as_landlord:
                return DirectDebitUtility.objects.filter(lease_for_utility__property_obj__land_lord=self.request.acting_as_landlord)
            else:
                return DirectDebitUtility.objects.none()
        elif user.is_authenticated:
            return DirectDebitUtility.objects.filter(lease_for_utility__tenant=user)
        else:
            return DirectDebitUtility.objects.none()

    def get_object(self):
        obj = super().get_object()
        if self.action in ["update", "destroy"]:
            user = self.request.user
            lease = getattr(obj, 'lease_for_utility', None)
            if user.groups.filter(name="admin").exists():
                pass
            elif user.groups.filter(name="landlord").exists():
                if not lease or lease.property_obj.land_lord != user:
                    raise PermissionDenied("You don't have permission to perform this operation")
            elif user.groups.filter(name="agent").exists():
                if hasattr(self.request, 'acting_as_landlord') and self.request.acting_as_landlord:
                    if not lease or lease.property_obj.land_lord != self.request.acting_as_landlord:
                        raise PermissionDenied("You don't have permission to perform this operation")
                else:
                    raise PermissionDenied("You don't have permission to perform this operation")
            else:
                if not lease or lease.tenant != user:
                    raise PermissionDenied("You don't have permission to perform this operation")
        return obj

    def filter_queryset(self, queryset):
        if self.action == "list":
            lease_id = self.kwargs.get("lease_id")
            if lease_id:
                return super().filter_queryset(queryset).filter(lease_for_utility__id=lease_id)
        return super().filter_queryset(queryset)

    def perform_create(self, serializer):
        # If proof_file is provided on creation, set status to CONFIGURED
        if 'proof_file' in self.request.FILES:
            serializer.save(status=DirectDebitUtility.STATUS_CONFIGURED)
        else:
            obj = serializer.save()
        
        lease_id = self.request.data.get('lease_id') or self.request.query_params.get('lease_id')
        if lease_id:
            try:
                lease = Lease.objects.get(id=lease_id)
                # Get the saved object - either from serializer or from perform_create
                if 'proof_file' in self.request.FILES:
                    obj = serializer.instance
                lease.direct_debit_utility = obj
                lease.save(update_fields=['direct_debit_utility'])
            except Lease.DoesNotExist:
                pass

    def perform_update(self, serializer):
        instance = serializer.instance
        user = self.request.user
        lease = getattr(instance, 'lease_for_utility', None)
        if 'proof_file' in self.request.FILES and lease and lease.tenant == user:
            serializer.save(status=DirectDebitUtility.STATUS_CONFIGURED)
        else:
            serializer.save()

    def create_or_update(self, request, *args, **kwargs):
        """Custom action to create or update direct debit utility by lease_id"""
        lease_id = kwargs.get('lease_id')
        
        if not lease_id:
            return Response(
                {"error": "lease_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            lease = Lease.objects.get(id=lease_id)
        except Lease.DoesNotExist:
            return Response(
                {"error": f"Lease with id {lease_id} not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if direct debit utility already exists for this lease
        direct_debit = getattr(lease, 'direct_debit_utility', None)
        
        if direct_debit:
            # Update existing
            serializer = self.get_serializer(direct_debit, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            response_data = {
                "status": "success",
                "message": "Direct debit utility updated successfully",
                "data": serializer.data,
            }
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            # Create new
            request.data['lease_id'] = lease_id
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            response_data = {
                "status": "success",
                "message": "Direct debit utility created successfully",
                "data": serializer.data,
            }
            return Response(response_data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Direct debit utility updated successfully",
            "data": response.data,
        }
        return response


class DirectDebitInstallmentViewSet(viewsets.ModelViewSet):
    queryset = DirectDebitInstallment.objects.all()
    serializer_class = DirectDebitInstallmentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.groups.filter(name="admin").exists():
            return DirectDebitInstallment.objects.all()
        elif user.groups.filter(name="landlord").exists():
            return DirectDebitInstallment.objects.filter(lease_for_installment__property_obj__land_lord=user)
        elif user.groups.filter(name="agent").exists():
            if hasattr(self.request, 'acting_as_landlord') and self.request.acting_as_landlord:
                return DirectDebitInstallment.objects.filter(lease_for_installment__property_obj__land_lord=self.request.acting_as_landlord)
            else:
                return DirectDebitInstallment.objects.none()
        elif user.is_authenticated:
            return DirectDebitInstallment.objects.filter(lease_for_installment__tenant=user)
        else:
            return DirectDebitInstallment.objects.none()

    def get_object(self):
        obj = super().get_object()
        if self.action in ["update", "destroy"]:
            user = self.request.user
            lease = getattr(obj, 'lease_for_installment', None)
            if user.groups.filter(name="admin").exists():
                pass
            elif user.groups.filter(name="landlord").exists():
                if not lease or lease.property_obj.land_lord != user:
                    raise PermissionDenied("You don't have permission to perform this operation")
            elif user.groups.filter(name="agent").exists():
                if hasattr(self.request, 'acting_as_landlord') and self.request.acting_as_landlord:
                    if not lease or lease.property_obj.land_lord != self.request.acting_as_landlord:
                        raise PermissionDenied("You don't have permission to perform this operation")
                else:
                    raise PermissionDenied("You don't have permission to perform this operation")
            else:
                if not lease or lease.tenant != user:
                    raise PermissionDenied("You don't have permission to perform this operation")
        return obj

    def filter_queryset(self, queryset):
        if self.action == "list":
            lease_id = self.kwargs.get("lease_id")
            if lease_id:
                return super().filter_queryset(queryset).filter(lease_for_installment__id=lease_id)
        return super().filter_queryset(queryset)

    def perform_create(self, serializer):
        # If proof_file is provided on creation, set status to CONFIGURED
        if 'proof_file' in self.request.FILES:
            serializer.save(status=DirectDebitInstallment.STATUS_CONFIGURED)
        else:
            obj = serializer.save()
        
        lease_id = self.request.data.get('lease_id') or self.request.query_params.get('lease_id')
        if lease_id:
            try:
                lease = Lease.objects.get(id=lease_id)
                # Get the saved object - either from serializer or from perform_create
                if 'proof_file' in self.request.FILES:
                    obj = serializer.instance
                lease.direct_debit_installment = obj
                lease.save(update_fields=['direct_debit_installment'])
            except Lease.DoesNotExist:
                pass

    def perform_update(self, serializer):
        instance = serializer.instance
        user = self.request.user
        lease = getattr(instance, 'lease_for_installment', None)
        if 'proof_file' in self.request.FILES and lease and lease.tenant == user:
            serializer.save(status=DirectDebitInstallment.STATUS_CONFIGURED)
        else:
            serializer.save()

    def create_or_update(self, request, *args, **kwargs):
        """Custom action to create or update direct debit installment by lease_id"""
        lease_id = kwargs.get('lease_id')
        
        if not lease_id:
            return Response(
                {"error": "lease_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            lease = Lease.objects.get(id=lease_id)
        except Lease.DoesNotExist:
            return Response(
                {"error": f"Lease with id {lease_id} not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if direct debit installment already exists for this lease
        direct_debit = getattr(lease, 'direct_debit_installment', None)
        
        if direct_debit:
            # Update existing
            serializer = self.get_serializer(direct_debit, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            response_data = {
                "status": "success",
                "message": "Direct debit installment updated successfully",
                "data": serializer.data,
            }
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            # Create new
            request.data['lease_id'] = lease_id
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            response_data = {
                "status": "success",
                "message": "Direct debit installment created successfully",
                "data": serializer.data,
            }
            return Response(response_data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Direct debit installment updated successfully",
            "data": response.data,
        }
        return response
