from rest_framework import status, viewsets, permissions, generics
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import (
    ApplicationForm,
    Property,
    StudentDetails,
    EmployeeDetails,
    ParentDetails,
    PreviousLandlord,
    GuarantorForm,
    AgreementForm,
    TenantSigns,
    Otp,
    GuarantorShareToken
)
from .serializer import (
    ApplicationFormSerializer,
    StudentDetailsSerializer,
    EmployeeDetailsSerializer,
    ParentDetailsSerializer,
    PreviousLandlordSerializer,
    GuarantorFormSerializer,
    AgreementFormSerializer,
    TokenSerializer,
    OtpSerializer,
    SignGuarantorSerializer,
    SignWitnessSerializer,
    SignLandlordSerializer,
    SignAdminSerializer,
    SignTenantSerializer,
    FormsListSerializer,
    GuarantorShareTokenSerializer,
)
from .permissions import OtpAuthenticator, GuarantorTokenAuthentication
from .utils import notify_admin_new_application,notify_admin_new_guarantor_form
import time
import base64
import uuid
from django.core.files.base import ContentFile


def convert_base64_to_file(base64_string, filename_prefix="signature"):
    """Convert base64 string to Django file object"""
    if not base64_string or not isinstance(base64_string, str) or not base64_string.startswith('data:'):
        return None
    
    try:
        # Check if the base64 string has the correct format
        if ';base64,' not in base64_string:
            print(f"Invalid base64 format: missing ';base64,' separator")
            return None
            
        # Remove the data URL prefix
        format_part, data_part = base64_string.split(';base64,', 1)
        if '/' not in format_part:
            print(f"Invalid format part: {format_part}")
            return None
            
        extension = format_part.split('/')[-1]  # Get image format (png, jpg, etc.)
        
        # Decode base64
        file_data = base64.b64decode(data_part)
        
        if len(file_data) == 0:
            print(f"Empty file data after base64 decode")
            return None
        
        # Create unique filename
        filename = f"{filename_prefix}_{uuid.uuid4().hex[:8]}.{extension}"
        
        # Create Django file object
        file_obj = ContentFile(file_data, name=filename)
        print(f"Successfully converted base64 to file: {filename}, size: {len(file_data)} bytes")
        return file_obj
    except Exception as e:
        print(f"Error converting base64 to file: {e}")
        return None
import base64
import uuid
from django.core.files.base import ContentFile

class ApplicationFormViewSet(viewsets.ModelViewSet):
    queryset = ApplicationForm.objects.all()
    serializer_class = ApplicationFormSerializer
    permission_classes = [permissions.IsAuthenticated]

    def filter_queryset(self, queryset):
        if self.request.user.is_staff is False:
            from django.db.models import Q
            
            # Allow users to see their own applications
            user_filter = Q(user=self.request.user.id)
            
            # Allow landlords to see applications for their properties
            if self.request.user.groups.filter(name="landlord").exists():
                landlord_filter = Q(property__land_lord=self.request.user.id)
                queryset = queryset.filter(user_filter | landlord_filter)
            # Allow agents to see applications for properties managed by their landlords
            elif self.request.user.groups.filter(name="agent").exists():
                # Get landlords associated with this agent
                from users.models import AgentLandlordRelationship
                agent_landlords = AgentLandlordRelationship.objects.filter(
                    agent=self.request.user,
                    status='active'
                ).values_list('landlord_id', flat=True)
                
                if agent_landlords:
                    agent_filter = Q(property__land_lord__in=agent_landlords)
                    queryset = queryset.filter(user_filter | agent_filter)
                else:
                    queryset = queryset.filter(user_filter)
            else:
                # For regular users (tenants), only show their own applications
                queryset = queryset.filter(user_filter)
        return super().filter_queryset(queryset)

    def list(self, request, *args, **kwargs):
        # Check if this is a request for applications by property and tenant (for inquiries)
        property_id = kwargs.get('property_id')
        tenant_id = request.query_params.get('tenant_id')
        
        if property_id and tenant_id:
            # This is an inquiry-specific request
            return self.get_applications_for_inquiry(request, property_id, tenant_id)
        
        # Regular list behavior
        return super().list(request, *args, **kwargs)
    
    def get_applications_for_inquiry(self, request, property_id, tenant_id):
        """
        Get applications for a specific property-tenant combination (used for inquiries)
        Only landlords and agents can access this
        """
        from django.db.models import Q
        
        # Verify user has permission to access this data
        if not (request.user.groups.filter(name__in=["landlord", "agent"]).exists() or request.user.is_staff):
            return Response(
                {"status": "error", "message": "Unauthorized access"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Base queryset with property and tenant filters
        queryset = ApplicationForm.objects.filter(
            property_id=property_id,
            user_id=tenant_id
        )

        # Optional: filter by specific inquiry if provided
        inquiry_id = request.query_params.get('inquiry_id')
        if inquiry_id:
            queryset = queryset.filter(inquiry_id=inquiry_id)
        
        # Apply additional permission filters
        if not request.user.is_staff:
            user_filter = Q(user=request.user.id)
            
            if request.user.groups.filter(name="landlord").exists():
                # Landlord can see applications for their properties
                landlord_filter = Q(property__land_lord=request.user.id)
                queryset = queryset.filter(user_filter | landlord_filter)
            elif request.user.groups.filter(name="agent").exists():
                # Agent can see applications for properties managed by their landlords
                from users.models import AgentLandlordRelationship
                agent_landlords = AgentLandlordRelationship.objects.filter(
                    agent=request.user,
                    status='active'
                ).values_list('landlord_id', flat=True)
                
                if agent_landlords:
                    agent_filter = Q(property__land_lord__in=agent_landlords)
                    queryset = queryset.filter(user_filter | agent_filter)
                else:
                    queryset = queryset.filter(user_filter)
        
        # Serialize and return the results
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "status": "success",
            "data": serializer.data,
            "count": queryset.count()
        })

    def get_serializer_class(self):
        if self.action == "list":
            return FormsListSerializer
        return super().get_serializer_class()

    def update_user(self, request, *args, **kwargs):
        user = request.user
        user.first_name = request.data.get("first_name")
        user.last_name = request.data.get("last_name")
        user.save()

    def get_property(self, property_id):
        try:
            return Property.objects.get(id=property_id)
        except Property.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

    def create(self, request, *args, **kwargs):
        request.data["user"] = request.user.id
        property_instance = self.get_property(kwargs["property_id"])
        if isinstance(property_instance, Response):
            return property_instance
        request.data["property"] = property_instance.id

        # Check if inquiry_id is provided and link it to the application
        inquiry_id = request.query_params.get('inquiry_id')
        if inquiry_id:
            try:
                from tenants.models import Inquiries
                inquiry = Inquiries.objects.get(id=inquiry_id)
                # Verify that the inquiry matches the property and user
                if inquiry.property.id == property_instance.id and inquiry.tenant.id == request.user.id:
                    request.data["inquiry"] = inquiry.id
                else:
                    return Response({
                        "status": "error",
                        "message": "Inquiry does not match the property or user"
                    }, status=status.HTTP_400_BAD_REQUEST)
            except Inquiries.DoesNotExist:
                return Response({
                    "status": "error",
                    "message": "Invalid inquiry ID"
                }, status=status.HTTP_400_BAD_REQUEST)

        self.update_user(request, *args, **kwargs)
        response = super().create(request, *args, **kwargs)

        response.data = {
            "status": "success",
            "message": "Application form created successfully",
            "data": {"id": response.data["id"]},
        }
        return response

    def signature(self, request, *args, **kwargs):
        response = super().update(request, partial=True, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "sign added",
            "data": {"id": response.data["id"]},
        }
        return response

    def approve(self, request, *args, **kwargs):
        status_choices = {"pass": "Pass", "fail": "Fail"}

        user = request.user
        action = kwargs.get("status")

        if user.is_staff is False:
            return Response(
                {"status": "error", "message": "You are not authorized"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        application_instance = self.get_object()
        application_instance.credit_check = status_choices[action]
        application_instance.save()
        return Response(
            {"status": "success", "message": "Application form approved"},
            status=status.HTTP_200_OK,
        )

    def nic(self, request, *args, **kwargs):
        response = super().update(request, partial=True, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "NIC added",
        }
        return response
    
    def update(self, request, *args, **kwargs):
        response =  super().update(request,partial=True, *args, **kwargs)
        print(request.data)
        response.data = {
            "status": "success",
            "message": "Application form updated successfully",
            "data": response.data,
        }
        return response
    
    def mark_completed(self, request, *args, **kwargs):
        request.data["credit_check"] = "Pending"
        request.data["is_completed"] = True
        response = super().update(request, partial=True, *args, **kwargs)
        notify_admin_new_application(response.data["user"])
        response.data = {
            "status": "success",
            "message": "Application form completed",
            "data": response.data,
        }
                
        return response


class StudentDetailsViewSet(viewsets.ModelViewSet):
    queryset = StudentDetails.objects.all()
    serializer_class = StudentDetailsSerializer

    def get_application_form(self, application_form_id):
        try:
            return ApplicationForm.objects.get(id=application_form_id)
        except ApplicationForm.DoesNotExist:
            return None

    def get_object(self):
        application_form_id = self.kwargs["form_id"]
        instance = StudentDetails.objects.filter(application_id=application_form_id)
        return instance.first()

    def create(self, request, *args, **kwargs):
        application_form_id = kwargs["form_id"]
        application_form_instance = self.get_application_form(application_form_id)

        if application_form_instance is None:
            return Response(status=status.HTTP_404_NOT_FOUND)

        request.data["application"] = application_form_instance.id
        request.data["user"] = request.user.id

        student_details_instance = StudentDetails.objects.filter(
            application=application_form_instance
        )

        if student_details_instance.exists():
            response = self.update(request, *args, **kwargs)
            response.data = {
                "status": "success",
                "message": "Student details updated successfully",
            }
            return response

        response = super().create(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Student details created successfully",
        }
        return response


class EmployeeDetailsViewSet(viewsets.ModelViewSet):
    queryset = EmployeeDetails.objects.all()
    serializer_class = EmployeeDetailsSerializer

    def get_application_form(self, application_form_id):
        try:
            return ApplicationForm.objects.get(id=application_form_id)
        except ApplicationForm.DoesNotExist:
            return None

    def get_object(self):
        application_form_id = self.kwargs["form_id"]
        instance = EmployeeDetails.objects.filter(application_id=application_form_id)
        return instance.first()

    def create(self, request, *args, **kwargs):
        application_form_id = kwargs["form_id"]
        application_form_instance = self.get_application_form(application_form_id)

        if application_form_instance is None:
            return Response(status=status.HTTP_404_NOT_FOUND)

        request.data["application"] = application_form_instance.id
        request.data["user"] = request.user.id

        employee_details_instance = EmployeeDetails.objects.filter(
            application=application_form_instance
        )

        if employee_details_instance.exists():
            response = self.update(request, *args, **kwargs)
            response.data = {
                "status": "success",
                "message": "Employee details updated successfully",
            }
            return response

        response = super().create(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Employee details created successfully",
        }
        return response


class ParentDetailsViewSet(viewsets.ModelViewSet):
    queryset = ParentDetails.objects.all()
    serializer_class = ParentDetailsSerializer

    def get_application_form(self, application_form_id):
        try:
            return ApplicationForm.objects.get(id=application_form_id)
        except ApplicationForm.DoesNotExist:
            return None

    def get_object(self):
        application_form_id = self.kwargs["form_id"]
        instance = ParentDetails.objects.filter(application_id=application_form_id)
        return instance.first()

    def create(self, request, *args, **kwargs):
        application_form_id = kwargs["form_id"]
        application_form_instance = self.get_application_form(application_form_id)

        if application_form_instance is None:
            return Response(status=status.HTTP_404_NOT_FOUND)

        request.data["application"] = application_form_instance.id
        request.data["user"] = request.user.id

        parent_details_instance = ParentDetails.objects.filter(
            application=application_form_instance
        )

        if parent_details_instance.exists():
            response = self.update(request, *args, **kwargs)
            response.data = {
                "status": "success",
                "message": "Parent details updated successfully",
            }
            return response

        response = super().create(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Parent details created successfully",
        }
        return response


class PreviousLandlordViewSet(viewsets.ModelViewSet):
    queryset = PreviousLandlord.objects.all()
    serializer_class = PreviousLandlordSerializer

    def get_application_form(self, application_form_id):
        try:
            return ApplicationForm.objects.get(id=application_form_id)
        except ApplicationForm.DoesNotExist:
            return None

    def get_object(self):
        application_form_id = self.kwargs["form_id"]
        instance = PreviousLandlord.objects.filter(application_id=application_form_id)
        return instance.first()

    def create(self, request, *args, **kwargs):
        application_form_id = kwargs["form_id"]
        application_form_instance = self.get_application_form(application_form_id)
        

        if application_form_instance is None:
            return Response(status=status.HTTP_404_NOT_FOUND)

        request.data["application"] = application_form_instance.id
        request.data["user"] = request.user.id

        previous_landlord_instance = PreviousLandlord.objects.filter(
            application=application_form_instance
        )

        if previous_landlord_instance.exists():
            response = self.update(request, *args, **kwargs)
            response.data = {
                "status": "success",
                "message": "Previous landlord details updated successfully",
            }
            return response

        response = super().create(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Previous landlord details created successfully",
        }
        return response


class GuaranterFormViewSet(viewsets.ModelViewSet):
    queryset = GuarantorForm.objects.all()
    serializer_class = GuarantorFormSerializer
    authentication_classes = [OtpAuthenticator]
    permission_classes = [permissions.AllowAny]

    def get_object(self):
        if self.action == "add_guarantor":
            instance = GuarantorForm.objects.filter(
                application_id=self.request.application
            )
        else:
            instance = GuarantorForm.objects.filter(
                application_id=self.kwargs["form_id"]
            )
        return instance.first()

    def get_application_form(self, application_form_id):
        try:
            return ApplicationForm.objects.get(id=application_form_id)
        except ApplicationForm.DoesNotExist:
            return None

    def add_guarantor(self, request, *args, **kwargs):

        request.data["application"] = request.application

        guarantor_form_instance = GuarantorForm.objects.filter(
            application=request.application
        )

        if guarantor_form_instance.exists():
            response = self.update(request, *args, **kwargs)
            response.data = {
                "status": "success",
                "message": "Guarantor form updated successfully",
                "data": response.data,
            }
            return response

        response = super().create(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Guarantor form created successfully",
            "data": response.data,
        }
        return response

    def add_owner(self, request, *args, **kwargs):

        application_instance = self.get_application_form(kwargs["form_id"])

        print("Received data:", request.data)

        if application_instance is None:
            return Response(status=status.HTTP_404_NOT_FOUND)

        try:
            request.data._mutable = True
        except:
            pass
        request.data["application"] = application_instance.id

        guarantor_form_instance = GuarantorForm.objects.filter(
            application=application_instance
        )

        if guarantor_form_instance.exists():
            response = self.update(request, *args, **kwargs)
            response.data = {
                "status": "success",
                "message": "Guarantor form updated successfully",
                "data": response.data,
            }
            return response

        response = super().create(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Guarantor form created successfully",
            "data": response.data,
        }
        return response

    def update(self, request, *args, **kwargs):
        response = super().update(request, partial=True, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "sign added",
            "data": response.data,
        }
        return response

    def approve(self, request, *args, **kwargs):
        status_choices = {"pass": "Pass", "fail": "Fail"}

        user = request.user
        action = kwargs.get("status")

        if user.is_staff is False:
            return Response(
                {"status": "error", "message": "You are not authorized"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        application_instance = self.get_object()
        application_instance.credit_check = status_choices[action]
        application_instance.save()

        return Response(
            {"status": "success", "message": "Application form approved"},
            status=status.HTTP_200_OK,
        )
    
    def mark_completed(self, request, *args, **kwargs):
        request.data["credit_check"] = "Pending"
        request.data["completed"] = True
        response = super().update(request, partial=True, *args, **kwargs)
        notify_admin_new_guarantor_form()
        response.data = {
            "status": "success",
            "message": "Guarantor form Submitted",
            "data": response.data,
        }
        return response

    def upload_guarantor_signature(self, request, *args, **kwargs):
        """Upload guarantor signature for a specific application"""
        try:
            application_id = kwargs.get('form_id')
            application_instance = self.get_application_form(application_id)
            
            if not application_instance:
                return Response(
                    {"status": "error", "message": "Application not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            guarantor_instance = GuarantorForm.objects.filter(
                application=application_instance
            ).first()
            
            if not guarantor_instance:
                return Response(
                    {"status": "error", "message": "Guarantor form not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Update the guarantor with signature and related data
            serializer = self.get_serializer(guarantor_instance, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({
                    "status": "success",
                    "message": "Guarantor signature uploaded successfully",
                    "data": serializer.data
                })
            else:
                return Response({
                    "status": "error",
                    "message": "Invalid data",
                    "errors": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({
                "status": "error", 
                "message": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def upload_witness_signature(self, request, *args, **kwargs):
        """Upload witness signature for a specific application"""
        try:
            application_id = kwargs.get('form_id')
            application_instance = self.get_application_form(application_id)
            
            if not application_instance:
                return Response(
                    {"status": "error", "message": "Application not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            guarantor_instance = GuarantorForm.objects.filter(
                application=application_instance
            ).first()
            
            if not guarantor_instance:
                return Response(
                    {"status": "error", "message": "Guarantor form not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Update the guarantor with witness signature and related data
            serializer = self.get_serializer(guarantor_instance, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({
                    "status": "success",
                    "message": "Witness signature uploaded successfully",
                    "data": serializer.data
                })
            else:
                return Response({
                    "status": "error",
                    "message": "Invalid data",
                    "errors": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({
                "status": "error", 
                "message": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AgreementFormViewSet(viewsets.ModelViewSet):
    queryset = AgreementForm.objects.all()
    serializer_class = AgreementFormSerializer
    # Use default authentication and permissions from settings.py
    # authentication_classes = [OtpAuthenticator]
    # permission_classes = [permissions.AllowAny]

    def get_object(self):
        if self.action == "add_guarantor":
            try:
                app = ApplicationForm.objects.get(id=self.request.application)
                # Check by property first (multi-tenant), then by application (backward compat)
                instance = AgreementForm.objects.filter(linked_property=app.property).first()
                if not instance:
                    instance = AgreementForm.objects.filter(application_id=self.request.application).first()
            except ApplicationForm.DoesNotExist:
                instance = None
        else:
            try:
                app = ApplicationForm.objects.get(id=self.kwargs["form_id"])
                # Check by property first (multi-tenant), then by application (backward compat)
                instance = AgreementForm.objects.filter(linked_property=app.property).first()
                if not instance:
                    instance = AgreementForm.objects.filter(application_id=self.kwargs["form_id"]).first()
            except ApplicationForm.DoesNotExist:
                instance = None
        return instance

    def get_application_form(self, application_form_id):
        try:
            return ApplicationForm.objects.get(id=application_form_id)
        except ApplicationForm.DoesNotExist:
            return None

    def add_guarantor(self, request, *args, **kwargs):

        request.data["application"] = request.application

        agreement_form_instance = AgreementForm.objects.filter(
            application=request.application
        )

        if agreement_form_instance.exists():
            response = self.update(request, *args, **kwargs)
            response.data = {
                "status": "success",
                "message": "Agreement form updated successfully",
                "data": response.data,
            }
            return response

        response = super().create(request, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Agreement form created successfully",
            "data": response.data,
        }
        return response

    def add_owner(self, request, *args, **kwargs):
        """
        DEPRECATED: This endpoint uses the old lead_tenant_sign approach.
        NEW: Use upload_tenant_signature() endpoint instead for tenant signatures.
        This endpoint is kept for backward compatibility with agent/landlord details only.
        """
        application_instance = self.get_application_form(kwargs["form_id"])

        if application_instance is None:
            return Response(status=status.HTTP_404_NOT_FOUND)

        # Make request data mutable for signature conversion
        if hasattr(request.data, '_mutable'):
            request.data._mutable = True

        # Check permissions and prerequisites
        user = request.user
        
        # Check if user is authenticated
        if not user.is_authenticated:
            return Response({
                "status": "error",
                "message": "Authentication required"
            }, status=status.HTTP_401_UNAUTHORIZED)
            
        is_agent_or_landlord = user.groups.filter(name__in=["agent", "landlord"]).exists() or user.is_staff
        is_tenant = user == application_instance.user

        # Check if application and guarantor are completed
        if not application_instance.is_completed:
            return Response({
                "status": "error",
                "message": "Application form must be completed first"
            }, status=status.HTTP_400_BAD_REQUEST)

        if not hasattr(application_instance, 'guarantorform') or not application_instance.guarantorform.completed:
            return Response({
                "status": "error", 
                "message": "Guarantor form must be completed first"
            }, status=status.HTTP_400_BAD_REQUEST)

        request.data["application"] = application_instance.id
        
        # MULTI-TENANT SUPPORT: Try to get existing agreement for the property
        property_instance = application_instance.property
        agreement_form_instance = AgreementForm.objects.filter(
            linked_property=property_instance
        ).first()
        
        # If no property-level agreement exists, try to get one for this application
        if not agreement_form_instance:
            agreement_form_instance = AgreementForm.objects.filter(
                application=application_instance.id
            ).first()
        
        # Convert base64 signatures to files if present
        signature_fields_to_remove = []
        
        if 'land_lord_sign' in request.data:
            if request.data['land_lord_sign'] and isinstance(request.data['land_lord_sign'], str):
                if request.data['land_lord_sign'].startswith('data:'):
                    signature_file = convert_base64_to_file(request.data['land_lord_sign'], 'landlord_signature')
                    if signature_file:
                        request.data['land_lord_sign'] = signature_file
                    else:
                        signature_fields_to_remove.append('land_lord_sign')
                elif request.data['land_lord_sign'] == "":
                    signature_fields_to_remove.append('land_lord_sign')
            else:
                signature_fields_to_remove.append('land_lord_sign')
        
        if 'lead_tenant_sign' in request.data:
            if request.data['lead_tenant_sign'] and isinstance(request.data['lead_tenant_sign'], str):
                if request.data['lead_tenant_sign'].startswith('data:'):
                    signature_file = convert_base64_to_file(request.data['lead_tenant_sign'], 'tenant_signature')
                    if signature_file:
                        request.data['lead_tenant_sign'] = signature_file
                    else:
                        signature_fields_to_remove.append('lead_tenant_sign')
                elif request.data['lead_tenant_sign'] == "":
                    signature_fields_to_remove.append('lead_tenant_sign')
            else:
                signature_fields_to_remove.append('lead_tenant_sign')
        
        # Remove problematic signature fields
        for field in signature_fields_to_remove:
            if field in request.data:
                del request.data[field]

        # Logic for agent/landlord filling
        if is_agent_or_landlord:
            if agreement_form_instance:
                # MULTI-TENANT: Reuse existing agreement for property
                request.data["filled_by_agent"] = user.id
                request.data["agent_filled"] = True
                
                response = self.update(request, *args, **kwargs)
                response.data = {
                    "status": "success",
                    "message": "Agreement form reused for this property (multi-tenant support)",
                    "data": response.data,
                }
                return response
            else:
                # Create new agreement, mark as filled by agent
                # MULTI-TENANT: Link to property instead of just application
                request.data["filled_by_agent"] = user.id
                request.data["agent_filled"] = True
                request.data["linked_property"] = property_instance.id  # NEW: Link to property
                
                response = super().create(request, *args, **kwargs)
                response.data = {
                    "status": "success",
                    "message": "Agreement form created successfully for this property",
                    "data": response.data,
                }
                return response

        # Logic for tenant filling 
        elif is_tenant:
            if not agreement_form_instance:
                return Response({
                    "status": "error",
                    "message": "Agent/Landlord must fill the agreement first"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if not agreement_form_instance.agent_filled:
                return Response({
                    "status": "error",
                    "message": "Agent/Landlord must complete the initial agreement details first"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Convert base64 signatures to files if present
            if 'lead_tenant_sign' in request.data and request.data['lead_tenant_sign']:
                if isinstance(request.data['lead_tenant_sign'], str) and request.data['lead_tenant_sign'].startswith('data:'):
                    signature_file = convert_base64_to_file(request.data['lead_tenant_sign'], 'tenant_signature')
                    if signature_file:
                        request.data['lead_tenant_sign'] = signature_file
            
            # Tenant can only update certain fields (like signatures)
            allowed_fields = ['lead_tenant_sign', 'application']
            filtered_data = {k: v for k, v in request.data.items() if k in allowed_fields}
            
            # If tenant is adding signature, mark tenant_filled
            if 'lead_tenant_sign' in filtered_data and filtered_data['lead_tenant_sign']:
                filtered_data["tenant_filled"] = True
            
            # Create new request data with filtered fields
            original_data = request.data
            request.data = filtered_data
            
            response = self.update(request, *args, **kwargs)
            response.data = {
                "status": "success",
                "message": "Agreement form updated successfully",
                "data": response.data,
            }
            return response
        
        else:
            return Response({
                "status": "error",
                "message": "Unauthorized to modify agreement form"
            }, status=status.HTTP_403_FORBIDDEN)

    def update(self, request, *args, **kwargs):
        response = super().update(request, partial=True, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "sign added",
            "data": response.data,
        }
        return response
    
    def mark_completed(self, request, *args, **kwargs):

        request.data["completed"] = True
        response = super().update(request, partial=True, *args, **kwargs)
        response.data = {
            "status": "success",
            "message": "Agreement form completed",
            "data": response.data,
        }
        return response

    def upload_landlord_signature(self, request, *args, **kwargs):
        """Upload landlord signature for a specific agreement"""
        try:
            application_id = kwargs.get('form_id')
            application_instance = self.get_application_form(application_id)
            
            if not application_instance:
                return Response(
                    {"status": "error", "message": "Application not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            agreement_instance = AgreementForm.objects.filter(
                application=application_instance
            ).first()
            
            # If not found by application, try by property (multi-tenant scenario)
            if not agreement_instance and application_instance.property:
                agreement_instance = AgreementForm.objects.filter(
                    linked_property=application_instance.property
                ).first()
            
            if not agreement_instance:
                return Response(
                    {"status": "error", "message": "Agreement form not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Handle FormData upload - map 'signature' to 'land_lord_sign'
            # Create a new dict with the mapped field
            serializer_data = {}
            if 'signature' in request.FILES:
                serializer_data['land_lord_sign'] = request.FILES['signature']
            else:
                return Response({
                    "status": "error",
                    "message": "No signature file uploaded"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Update the agreement with landlord signature (lls_date will be set in model save)
            serializer = self.get_serializer(agreement_instance, data=serializer_data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({
                    "status": "success",
                    "message": "Landlord signature uploaded successfully",
                    "data": serializer.data
                })
            else:
                return Response({
                    "status": "error",
                    "message": "Invalid data",
                    "errors": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({
                "status": "error", 
                "message": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def upload_landlord_signature_1(self, request, *args, **kwargs):
        """Upload landlord signature for step 1 (first agreement)"""
        try:
            application_id = kwargs.get('form_id')
            application_instance = self.get_application_form(application_id)
            
            if not application_instance:
                return Response(
                    {"status": "error", "message": "Application not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            agreement_instance = AgreementForm.objects.filter(
                application=application_instance
            ).first()
            
            # If not found by application, try by property (multi-tenant scenario)
            if not agreement_instance and application_instance.property:
                agreement_instance = AgreementForm.objects.filter(
                    linked_property=application_instance.property
                ).first()
            
            if not agreement_instance:
                return Response(
                    {"status": "error", "message": "Agreement form not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Handle FormData upload - map 'signature' to 'land_lord_sign_1'
            serializer_data = {}
            if 'signature' in request.FILES:
                serializer_data['land_lord_sign_1'] = request.FILES['signature']
            else:
                return Response({
                    "status": "error",
                    "message": "No signature file uploaded"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Update the agreement with landlord signature for step 1
            serializer = self.get_serializer(agreement_instance, data=serializer_data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({
                    "status": "success",
                    "message": "Landlord signature (Step 1) uploaded successfully",
                    "data": serializer.data
                })
            else:
                return Response({
                    "status": "error",
                    "message": "Invalid data",
                    "errors": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({
                "status": "error", 
                "message": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def upload_admin_signature(self, request, *args, **kwargs):
        """Upload admin signature for a specific agreement"""
        try:
            application_id = kwargs.get('form_id')
            application_instance = self.get_application_form(application_id)
            
            if not application_instance:
                return Response(
                    {"status": "error", "message": "Application not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            agreement_instance = AgreementForm.objects.filter(
                application=application_instance
            ).first()
            
            # If not found by application, try by property (multi-tenant scenario)
            if not agreement_instance and application_instance.property:
                agreement_instance = AgreementForm.objects.filter(
                    linked_property=application_instance.property
                ).first()
            
            if not agreement_instance:
                return Response(
                    {"status": "error", "message": "Agreement form not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if user is admin/staff
            if not request.user.is_staff:
                return Response(
                    {"status": "error", "message": "Only admin users can upload admin signatures"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Handle FormData upload - map 'signature' to 'admin_sign' and get 'admin_name'
            # Create a new dict with the mapped field
            serializer_data = {}
            if 'signature' in request.FILES:
                serializer_data['admin_sign'] = request.FILES['signature']
            else:
                return Response({
                    "status": "error",
                    "message": "No signature file uploaded"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get admin_name from request data
            admin_name = request.data.get('admin_name')
            if admin_name:
                serializer_data['admin_name'] = admin_name
            else:
                return Response({
                    "status": "error",
                    "message": "Admin name is required"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Update the agreement with admin signature and mark as admin_filled
            serializer_data['admin_filled'] = True
            serializer = self.get_serializer(agreement_instance, data=serializer_data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({
                    "status": "success",
                    "message": "Admin signature uploaded successfully",
                    "data": serializer.data
                })
            else:
                return Response({
                    "status": "error",
                    "message": "Invalid data",
                    "errors": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({
                "status": "error", 
                "message": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def upload_admin_signature_1(self, request, *args, **kwargs):
        """Upload admin signature for step 1 (first agreement)"""
        try:
            application_id = kwargs.get('form_id')
            application_instance = self.get_application_form(application_id)
            
            if not application_instance:
                return Response(
                    {"status": "error", "message": "Application not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            agreement_instance = AgreementForm.objects.filter(
                application=application_instance
            ).first()
            
            # If not found by application, try by property (multi-tenant scenario)
            if not agreement_instance and application_instance.property:
                agreement_instance = AgreementForm.objects.filter(
                    linked_property=application_instance.property
                ).first()
            
            if not agreement_instance:
                return Response(
                    {"status": "error", "message": "Agreement form not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if user is admin/staff
            if not request.user.is_staff:
                return Response(
                    {"status": "error", "message": "Only admin users can upload admin signatures"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Handle FormData upload - map 'signature' to 'admin_sign_1'
            serializer_data = {}
            if 'signature' in request.FILES:
                serializer_data['admin_sign_1'] = request.FILES['signature']
            else:
                return Response({
                    "status": "error",
                    "message": "No signature file uploaded"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get admin_name from request data
            admin_name = request.data.get('admin_name')
            if admin_name:
                serializer_data['admin_name_1'] = admin_name
            else:
                return Response({
                    "status": "error",
                    "message": "Admin name is required"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Update the agreement with admin signature for step 1
            serializer = self.get_serializer(agreement_instance, data=serializer_data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({
                    "status": "success",
                    "message": "Admin signature (Step 1) uploaded successfully",
                    "data": serializer.data
                })
            else:
                return Response({
                    "status": "error",
                    "message": "Invalid data",
                    "errors": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({
                "status": "error", 
                "message": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def upload_tenant_signature(self, request, *args, **kwargs):
        """Upload tenant signature for a specific agreement
        
        All tenants (including the first one) are stored in TenantSigns table
        """
        try:
            application_id = kwargs.get('form_id')
            application_instance = self.get_application_form(application_id)
            
            if not application_instance:
                return Response(
                    {
                        "status": "error",
                        "message": f"Application not found with ID: {application_id}",
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
            
            agreement_instance = AgreementForm.objects.filter(
                application=application_instance
            ).first()
            
            # If not found by application, try by property (multi-tenant scenario)
            if not agreement_instance and application_instance.property:
                agreement_instance = AgreementForm.objects.filter(
                    linked_property=application_instance.property
                ).first()
            
            if not agreement_instance:
                return Response(
                    {
                        "status": "error",
                        "message": f"Agreement form not found for application ID: {application_id}",
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if signature file exists
            if 'signature' not in request.FILES:
                return Response({
                    "status": "error",
                    "message": "No signature file uploaded"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            signature_file = request.FILES['signature']
            
            # All tenants go into TenantSigns table - simplified approach
            tenant_name = request.data.get('tenant_name') or f"{request.user.first_name} {request.user.last_name}"
            tenant_email = request.data.get('tenant_email') or request.user.email
            tenant_phone = request.data.get('tenant_phone', '')
            
            print(f"DEBUG: Creating TenantSigns record")
            print(f"  - Current user ID: {request.user.id}")
            print(f"  - Current user: {request.user}")
            print(f"  - Tenant name: {tenant_name}")
            print(f"  - Agreement ID: {agreement_instance.id}")
            
            # Create TenantSigns record
            tenant_sign = TenantSigns.objects.create(
                agreement=agreement_instance,
                application=application_instance,
                tenant_user=request.user,
                full_name=tenant_name,
                email=tenant_email,
                phone=tenant_phone,
                sign=signature_file
            )
            
            print(f"DEBUG: TenantSigns record created")
            print(f"  - Record ID: {tenant_sign.id}")
            print(f"  - Tenant User ID: {tenant_sign.tenant_user.id}")
            print(f"  - Tenant User: {tenant_sign.tenant_user}")
            
            # Serialize the created record
            from .serializer import TenantSignsSerializer
            serializer = TenantSignsSerializer(tenant_sign, context={'request': request})
            
            return Response({
                "status": "success",
                "message": "Tenant signature uploaded successfully",
                "data": serializer.data
            })
                
        except Exception as e:
            return Response({
                "status": "error", 
                "message": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def upload_tenant_signature_1(self, request, *args, **kwargs):
        """Upload tenant signature for step 1 of a specific agreement
        
        All tenants (including the first one) are stored in TenantSigns1 table
        """
        try:
            application_id = kwargs.get('form_id')
            application_instance = self.get_application_form(application_id)
            
            if not application_instance:
                return Response(
                    {
                        "status": "error",
                        "message": f"Application not found with ID: {application_id}",
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
            
            agreement_instance = AgreementForm.objects.filter(
                application=application_instance
            ).first()
            
            # If not found by application, try by property (multi-tenant scenario)
            if not agreement_instance and application_instance.property:
                agreement_instance = AgreementForm.objects.filter(
                    linked_property=application_instance.property
                ).first()
            
            if not agreement_instance:
                return Response(
                    {
                        "status": "error",
                        "message": f"Agreement form not found for application ID: {application_id}",
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if signature file exists
            if 'signature' not in request.FILES:
                return Response({
                    "status": "error",
                    "message": "No signature file uploaded"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            signature_file = request.FILES['signature']
            
            # All tenants go into TenantSigns1 table
            tenant_name = request.data.get('tenant_name') or f"{request.user.first_name} {request.user.last_name}"
            tenant_email = request.data.get('tenant_email') or request.user.email
            tenant_phone = request.data.get('tenant_phone', '')
            
            # Create TenantSigns1 record
            from .models import TenantSigns1
            tenant_sign = TenantSigns1.objects.create(
                agreement=agreement_instance,
                application=application_instance,
                tenant_user=request.user,
                full_name=tenant_name,
                email=tenant_email,
                phone=tenant_phone,
                sign=signature_file
            )
            
            # Serialize the created record
            from .serializer import TenantSignsSerializer
            serializer = TenantSignsSerializer(tenant_sign, context={'request': request})
            
            return Response({
                "status": "success",
                "message": "Tenant signature (Step 1) uploaded successfully",
                "data": serializer.data
            })
                
        except Exception as e:
            return Response({
                "status": "error", 
                "message": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get_status(self, request, *args, **kwargs):
        """Get agreement status for current user"""
        try:
            application_instance = self.get_application_form(kwargs["form_id"])
            if not application_instance:
                return Response(status=status.HTTP_404_NOT_FOUND)

            user = request.user
            is_agent_or_landlord = user.groups.filter(name__in=["agent", "landlord"]).exists() or user.is_staff
            is_tenant = user == application_instance.user

            # Check if agreement form exists - First check by linked_property (multi-tenant), then by application (backward compat)
            property_instance = application_instance.property
            agreement_form = AgreementForm.objects.filter(linked_property=property_instance).first()
            
            # Fallback to application-level agreement for backward compatibility
            if not agreement_form:
                agreement_form = AgreementForm.objects.filter(application=application_instance).first()
            
            if not agreement_form:
                # No agreement form exists yet
                status_data = {
                    "exists": False,
                    "can_create": False,
                    "can_edit": False,
                    "status": "locked",
                    "message": "Agreement form not created yet"
                }
                
                # Check prerequisites
                if application_instance.is_completed and hasattr(application_instance, 'guarantorform') and application_instance.guarantorform.completed:
                    if is_agent_or_landlord:
                        status_data.update({
                            "can_create": True,
                            "status": "can_create",
                            "message": "Ready to create agreement form"
                        })
                    elif is_tenant:
                        status_data.update({
                            "status": "pending",
                            "message": "Waiting for agent/landlord to create agreement"
                        })
                else:
                    status_data["message"] = "Application and guarantor forms must be completed first"
                    
                return Response({
                    "status": "success",
                    "data": status_data
                })
            
            # Agreement form exists, determine user's permissions
            if is_agent_or_landlord:
                user_status = agreement_form.status_for_agent
            elif is_tenant:
                user_status = agreement_form.status_for_tenant
            elif request.user.is_staff:
                # Admin status logic
                has_tenant_signatures = agreement_form.tenant_signs.exists()
                if not agreement_form.agent_filled:
                    user_status = "waiting_for_agent"
                elif not has_tenant_signatures:
                    user_status = "waiting_for_tenant"
                elif not agreement_form.land_lord_sign:
                    user_status = "waiting_for_agent_signature"
                elif not agreement_form.admin_sign:
                    user_status = "can_sign"  # Admin can sign
                else:
                    user_status = "completed"
            else:
                user_status = "unauthorized"
            
            # Set helpful message based on status
            message = ""
            if user_status == "waiting_for_tenant":
                if is_tenant:
                    message = "Please review the agreement details and provide your signature below."
                else:
                    message = "Agreement submitted! Waiting for tenant to review and sign."
            elif user_status == "pending_landlord_signature":
                if is_agent_or_landlord:
                    message = "Tenant has signed! Please review and add your signature to complete the agreement."
                else:
                    message = "Your signature has been submitted. Waiting for landlord/agent to finalize."
            elif user_status == "can_edit":
                if is_agent_or_landlord:
                    message = "Fill out the agreement details and submit for tenant review."

            print(f"Message: {message}")

            status_data = {
                "exists": True,
                "can_edit": user_status in ["can_edit", "can_create", "waiting_for_tenant", "pending_landlord_signature", "pending_admin_signature", "can_sign"],
                "status": user_status,
                "agent_filled": agreement_form.agent_filled,
                "tenant_filled": agreement_form.tenant_filled,
                "admin_filled": agreement_form.admin_filled,
                "completed": agreement_form.completed,
                "is_agent_details_complete": agreement_form.is_agent_details_complete,
                "waiting_for_tenant": user_status == "waiting_for_tenant",
                "can_sign": user_status == "can_sign",
                "pending_landlord_signature": user_status == "pending_landlord_signature",
                "pending_admin_signature": user_status == "pending_admin_signature",
                "message": message
            }
            
            print(f"Status data: {status_data}")
            print("=== END DEBUG Agreement Status API ===\n")
            
            return Response({
                "status": "success",
                "data": status_data
            })

        except Exception as e:
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def get_tenant_signatures(self, request, *args, **kwargs):
        """Get all tenant signatures for an agreement (multi-tenant support)"""
        try:
            application_id = kwargs.get('form_id')
            application_instance = self.get_application_form(application_id)
            
            if not application_instance:
                return Response(
                    {"status": "error", "message": "Application not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get the agreement for this property
            property_instance = application_instance.property
            agreement_form = AgreementForm.objects.filter(
                linked_property=property_instance
            ).first()
            
            if not agreement_form:
                agreement_form = AgreementForm.objects.filter(
                    application=application_instance
                ).first()
            
            if not agreement_form:
                return Response({
                    "status": "success",
                    "message": "No agreement found",
                    "data": {
                        "tenant_signatures": []
                    }
                })
            
            # Get all tenant signatures
            tenant_signs = TenantSigns.objects.filter(
                agreement=agreement_form
            ).select_related('tenant_user').order_by('-date')
            
            print(f"DEBUG: Retrieved {tenant_signs.count()} tenant signatures for agreement {agreement_form.id}")
            
            signatures_data = []
            for sig in tenant_signs:
                sig_data = {
                    "id": sig.id,
                    "full_name": sig.full_name,
                    "email": sig.email,
                    "phone": sig.phone,
                    "sign": sig.sign.url if sig.sign else None,
                    "date": sig.date.isoformat(),
                    "tenant_user_id": sig.tenant_user.id if sig.tenant_user else None,
                    "tenant_user_name": f"{sig.tenant_user.first_name} {sig.tenant_user.last_name}" if sig.tenant_user else None,
                }
                print(f"DEBUG: Signature data - {sig_data}")
                signatures_data.append(sig_data)
            
            return Response({
                "status": "success",
                "message": f"Retrieved {len(signatures_data)} tenant signature(s)",
                "data": {
                    "agreement_id": agreement_form.id,
                    "property_id": property_instance.id,
                    "tenant_signatures": signatures_data,
                    "total_signatures": len(signatures_data)
                }
            })
            
        except Exception as e:
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get_tenant_signatures_1(self, request, *args, **kwargs):
        """Get all tenant signatures for step 1 of an agreement (multi-tenant support)"""
        try:
            application_id = kwargs.get('form_id')
            application_instance = self.get_application_form(application_id)
            
            if not application_instance:
                return Response(
                    {"status": "error", "message": "Application not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get the agreement for this property
            property_instance = application_instance.property
            agreement_form = AgreementForm.objects.filter(
                linked_property=property_instance
            ).first()
            
            if not agreement_form:
                agreement_form = AgreementForm.objects.filter(
                    application=application_instance
                ).first()
            
            if not agreement_form:
                return Response({
                    "status": "success",
                    "message": "No agreement found",
                    "data": {
                        "tenant_signatures": []
                    }
                })
            
            # Get all tenant signatures for step 1
            from .models import TenantSigns1
            tenant_signs = TenantSigns1.objects.filter(
                agreement=agreement_form
            ).select_related('tenant_user').order_by('-date')
            
            signatures_data = []
            for sig in tenant_signs:
                sig_data = {
                    "id": sig.id,
                    "full_name": sig.full_name,
                    "email": sig.email,
                    "phone": sig.phone,
                    "sign": sig.sign.url if sig.sign else None,
                    "date": sig.date.isoformat(),
                    "tenant_user_id": sig.tenant_user.id if sig.tenant_user else None,
                    "tenant_user_name": f"{sig.tenant_user.first_name} {sig.tenant_user.last_name}" if sig.tenant_user else None,
                }
                signatures_data.append(sig_data)
            
            return Response({
                "status": "success",
                "message": f"Retrieved {len(signatures_data)} tenant signature(s) for step 1",
                "data": {
                    "agreement_id": agreement_form.id,
                    "property_id": property_instance.id,
                    "tenant_signatures": signatures_data,
                    "total_signatures": len(signatures_data)
                }
            })
            
        except Exception as e:
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def pending_admin_signature(self, request):
        """Get all agreements that are pending admin signature"""
        try:
            # Only allow admin/staff users
            if not request.user.is_staff:
                return Response(
                    {"status": "error", "message": "Only admin users can access this endpoint"},
                    status=status.HTTP_403_FORBIDDEN
                )

            from django.db.models import Q

            # Get agreements where tenant AND landlord/agent have signed but admin hasn't
            # Critical check: landlord/agent signature must exist before admin can sign
            agreements = AgreementForm.objects.filter(
                agent_filled=True,
                tenant_filled=True,
            ).exclude(
                Q(land_lord_sign__isnull=True) | Q(land_lord_sign='')
            ).filter(
                Q(admin_sign__isnull=True) | Q(admin_sign='')
            ).select_related(
                'application__user',
                'application__property',
                'filled_by_agent'
            )

            agreement_data = []
            for agreement in agreements:
                agreement_data.append({
                    'id': agreement.id,
                    'application_id': agreement.application.id,
                    'tenant_name': f"{agreement.application.user.first_name} {agreement.application.user.last_name}",
                    'property_address': agreement.application.property.address if agreement.application.property else "N/A",
                    'agent_name': f"{agreement.filled_by_agent.first_name} {agreement.filled_by_agent.last_name}" if agreement.filled_by_agent else "N/A",
                    'status': 'pending_admin_signature',
                    'created_at': agreement.date.isoformat() if agreement.date else None,
                    'tenant_signed_at': None,  # No timestamp field for tenant signature
                    'agent_signed_at': agreement.lls_date.isoformat() if agreement.lls_date else None,
                    'admin_signed_at': agreement.admin_sign_date.isoformat() if agreement.admin_sign_date else None,
                })

            return Response({
                "status": "success",
                "data": agreement_data
            })

        except Exception as e:
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OtpTokenApiView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = TokenSerializer

    def post(self, request, *args, **kwargs):
        request.data["form_id"] = kwargs["form_id"]
        
        response = super().post(request, *args, **kwargs)

        response.data = {
            "status": "success",
            "message": "OTP is validated",
            "data": response.data,
        }
        return response


class InviteViewSet(viewsets.ModelViewSet):
    serializer_class = OtpSerializer
    queryset = Otp.objects.all()

    def filter_queryset(self, queryset):
        form_id = self.kwargs.get("form_id")
        return super().filter_queryset(queryset).filter(form=form_id)

    def create(self, request, *args, **kwargs):
        request.data["form"] = kwargs["form_id"]

        response = super().create(request, *args, **kwargs)

        response.data = {
            "status": "success",
            "message": "Invited",
            "data": response.data,
        }
        return response


class SignApiView(generics.UpdateAPIView):
    authentication_classes = [OtpAuthenticator]
    permission_classes = [permissions.AllowAny]


    def get_queryset(self):
        if self.request.role == "Guarantor" or self.request.role == "Witness":
            return GuarantorForm.objects.all().filter(application_id=self.request.application)
        elif self.request.role == "Landlord":
            return AgreementForm.objects.all().filter(application_id=self.request.application)
        return super().get_queryset()
    
    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        obj = queryset.first()
        return obj

    def get_serializer_class(self):
        if self.request.role == "Guarantor":
            return SignGuarantorSerializer
        elif self.request.role == "Witness":
            return SignWitnessSerializer
        elif self.request.role == "Landlord":
            return SignLandlordSerializer
       
    def post(self, request, *args, **kwargs):
        request.data["form_id"] = self.request.application

        response = super().update(request, partial=True,*args, **kwargs)

        response.data = {
            "status": "success",
            "message": "Sign Added",
            "data": response.data,
        }
        return response
    
class ViewFormApiview(generics.RetrieveAPIView):
    authentication_classes=[OtpAuthenticator]

    def get_queryset(self):
        if self.request.role == "Guarantor" or self.request.role == "Witness":
            return GuarantorForm.objects.all().filter(application_id=self.request.application)
        elif self.request.role in ["Landlord", "Tenant"]:
            return AgreementForm.objects.all().filter(application_id=self.request.application)
        return super().get_queryset()
    
    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        obj = queryset.first()
        return obj
    
    def get_serializer_class(self):
        if self.request.role == "Guarantor" or self.request.role == "Witness":
            return GuarantorFormSerializer
        elif self.request.role in ["Landlord", "Tenant"]:
            return AgreementFormSerializer

    
    
class AddTenantSignApiView(generics.CreateAPIView):
    serializer_class = SignTenantSerializer
    queryset = TenantSigns.objects.all()
    authentication_classes=[OtpAuthenticator]
    permission_classes = [permissions.AllowAny]

    def filter_queryset(self, queryset):
        return (
            super()
            .filter_queryset(queryset)
            .filter(application_id=self.kwargs["form_id"])
        )
    
    def get_agreement_form(self, form_id):
        try:
            # First get the application to find its property
            application = ApplicationForm.objects.get(id=form_id)
            property_instance = application.property
            
            # Try to get agreement by linked_property first (multi-tenant support)
            agreement = AgreementForm.objects.filter(linked_property=property_instance).first()
            
            # Fall back to application-level agreement for backward compatibility
            if not agreement:
                agreement = AgreementForm.objects.get(application_id=form_id)
            
            return agreement
        except AgreementForm.DoesNotExist:
            return None
        except ApplicationForm.DoesNotExist:
            return None

    def create(self, request, *args, **kwargs):
        # request.data._mutable = True
        request.data["form_id"] = kwargs.get("form_id",None)
            
        agreement_form_instance = self.get_agreement_form(kwargs["form_id"])

        if agreement_form_instance is None:
            return Response(status=status.HTTP_404_NOT_FOUND)

        request.data["agreement"] = agreement_form_instance.id

        response = super().create(request, *args, **kwargs)

        response.data = {
            "status": "success",
            "message": "Tenant sign added",
            "data": response.data,
        }
        return response


class StatRetiveAPIView(generics.RetrieveAPIView):

    def retrieve(self, request, *args, **kwargs):
        total_properties = Property.objects.all().count()
        pending_applications = ApplicationForm.objects.filter(
            credit_check="Pending"
        ).count()
        approved_applications = ApplicationForm.objects.filter(
            credit_check="Pass"
        ).count()
        pending_guarantor_forms = GuarantorForm.objects.filter(
            credit_check="Pending"
        ).count()

        data = {
            "total_properties": total_properties,
            "pending_applications": pending_applications,
            "approved_applications": approved_applications,
            "pending_guarantor_forms": pending_guarantor_forms,
        }

        return Response(data, status=status.HTTP_200_OK)


class CreateGuarantorShareTokenView(generics.CreateAPIView):
    """Simple API view for creating guarantor share tokens"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = GuarantorShareTokenSerializer

    def post(self, request, *args, **kwargs):
        """Create or retrieve a share token for an application"""
        application_id = kwargs.get('application_id')
        
        try:
            application = ApplicationForm.objects.get(id=application_id, user=request.user)
        except ApplicationForm.DoesNotExist:
            return Response(
                {"status": "error", "message": "Application not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if token already exists
        share_token, created = GuarantorShareToken.objects.get_or_create(
            application=application
        )

        # If token exists but is expired, create a new one
        if not created and share_token.is_expired:
            share_token.delete()
            share_token = GuarantorShareToken.objects.create(application=application)
            created = True

        serializer = self.get_serializer(share_token)
        return Response({
            "status": "success",
            "message": "Share token created" if created else "Share token retrieved",
            "data": serializer.data
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class GuarantorShareTokenViewSet(viewsets.ModelViewSet):
    """ViewSet for managing guarantor share tokens"""
    queryset = GuarantorShareToken.objects.all()
    serializer_class = GuarantorShareTokenSerializer
    permission_classes = [permissions.IsAuthenticated]

    def filter_queryset(self, queryset):
        # Only show tokens for applications owned by the current user
        if not self.request.user.is_staff:
            queryset = queryset.filter(application__user=self.request.user)
        return super().filter_queryset(queryset)

    def create(self, request, *args, **kwargs):
        """Create or retrieve a share token for an application"""
        application_id = kwargs.get('application_id')
        
        try:
            application = ApplicationForm.objects.get(id=application_id, user=request.user)
        except ApplicationForm.DoesNotExist:
            return Response(
                {"status": "error", "message": "Application not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if token already exists
        share_token, created = GuarantorShareToken.objects.get_or_create(
            application=application
        )

        # If token exists but is expired, create a new one
        if not created and share_token.is_expired:
            share_token.delete()
            share_token = GuarantorShareToken.objects.create(application=application)
            created = True

        serializer = self.get_serializer(share_token)
        return Response({
            "status": "success",
            "message": "Share token created" if created else "Share token retrieved",
            "data": serializer.data
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        """Deactivate a share token"""
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        
        return Response({
            "status": "success",
            "message": "Share token deactivated"
        }, status=status.HTTP_200_OK)


class SharedGuarantorFormViewSet(viewsets.ModelViewSet):
    """ViewSet for handling guarantor forms accessed via shared token"""
    queryset = GuarantorForm.objects.all()
    serializer_class = GuarantorFormSerializer
    authentication_classes = [GuarantorTokenAuthentication]
    permission_classes = [permissions.AllowAny]

    def get_object(self):
        """Get guarantor form for the application in the shared token"""
        application = self.request.application
        instance = GuarantorForm.objects.filter(application=application).first()
        return instance

    def retrieve(self, request, *args, **kwargs):
        """Retrieve guarantor form data for shared access"""
        try:
            instance = self.get_object()
            if instance:
                serializer = self.get_serializer(instance)
                data = serializer.data
                # Include application details for context
                data['application_info'] = {
                    'id': request.application.id,
                    'property_id': request.application.property.id,
                    'tenant_name': f"{request.application.user.first_name} {request.application.user.last_name}",
                    'start_date': request.application.start_date,
                    'end_date': request.application.end_date,
                }
                return Response({
                    "status": "success",
                    "data": data
                })
            else:
                # Return empty form structure
                return Response({
                    "status": "success",
                    "data": {
                        'application_info': {
                            'id': request.application.id,
                            'property_id': request.application.property.id,
                            'tenant_name': f"{request.application.user.first_name} {request.application.user.last_name}",
                            'start_date': request.application.start_date,
                            'end_date': request.application.end_date,
                        }
                    }
                })
        except Exception as e:
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def create(self, request, *args, **kwargs):
        """Create or update guarantor form via shared access"""
        try:
            application = request.application
            request.data['application'] = application.id

            # Check if guarantor form already exists
            existing_form = GuarantorForm.objects.filter(application=application).first()
            
            if existing_form:
                # Update existing form
                serializer = self.get_serializer(existing_form, data=request.data, partial=True)
                if serializer.is_valid():
                    serializer.save()
                    return Response({
                        "status": "success",
                        "message": "Guarantor form updated successfully",
                        "data": serializer.data
                    })
                else:
                    return Response({
                        "status": "error",
                        "message": "Invalid data",
                        "errors": serializer.errors
                    }, status=status.HTTP_400_BAD_REQUEST)
            else:
                # Create new form
                serializer = self.get_serializer(data=request.data)
                if serializer.is_valid():
                    serializer.save()
                    return Response({
                        "status": "success", 
                        "message": "Guarantor form created successfully",
                        "data": serializer.data
                    }, status=status.HTTP_201_CREATED)
                else:
                    return Response({
                        "status": "error",
                        "message": "Invalid data", 
                        "errors": serializer.errors
                    }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LeaseFormDataViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only viewset to retrieve form data by lease ID"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Override to return empty queryset since we don't use standard model queries"""
        return ApplicationForm.objects.none()
    
    def get_application_by_lease(self, lease_id):
        """Get application form through lease relationship"""
        try:
            from tenants.models import Lease
            lease = Lease.objects.get(id=lease_id)
            
            # Check permissions
            user = self.request.user
            is_admin = user.is_staff
            is_tenant = user == lease.tenant
            is_landlord = lease.property_obj.land_lord == user
            is_agent = user.groups.filter(name="agent").exists()
            
            # Check agent-landlord relationship if user is agent
            if is_agent and not is_admin:
                from users.models import AgentLandlordRelationship
                agent_landlords = AgentLandlordRelationship.objects.filter(
                    agent=user, status='active'
                ).values_list('landlord_id', flat=True)
                is_agent = lease.property_obj.land_lord.id in agent_landlords
            
            if not (is_admin or is_tenant or is_landlord or is_agent):
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You don't have permission to view this lease's forms")
            
            if not lease.source_application:
                from django.http import Http404
                raise Http404("No application form found for this lease")
                
            return lease.source_application
        except Lease.DoesNotExist:
            from django.http import Http404
            raise Http404("Lease not found")
    
    def retrieve_application_form(self, request, lease_id=None):
        """Retrieve application form data by lease ID"""
        application = self.get_application_by_lease(lease_id)
        
        # Get related data
        student_details = getattr(application, 'student_details', None)
        employee_details = getattr(application, 'employee_details', None)
        parent_details = getattr(application, 'parent_details', None)
        previous_landlord = getattr(application, 'previous_landlord', None)
        
        # Serialize the data
        serializer = ApplicationFormSerializer(application)
        data = serializer.data
        
        # Add related details
        if student_details:
            data['student_details'] = StudentDetailsSerializer(student_details).data
        if employee_details:
            data['employee_details'] = EmployeeDetailsSerializer(employee_details).data
        if parent_details:
            data['parent_details'] = ParentDetailsSerializer(parent_details).data
        if previous_landlord:
            data['previous_landlord'] = PreviousLandlordSerializer(previous_landlord).data
        
        return Response({
            "status": "success",
            "message": "Application form data retrieved successfully",
            "data": data
        })
    
    def retrieve_guarantor_form(self, request, lease_id=None):
        """Retrieve guarantor form data by lease ID"""
        application = self.get_application_by_lease(lease_id)
        
        try:
            guarantor_form = application.guarantorform
            serializer = GuarantorFormSerializer(guarantor_form)
            
            return Response({
                "status": "success",
                "message": "Guarantor form data retrieved successfully",
                "data": serializer.data
            })
        except GuarantorForm.DoesNotExist:
            return Response({
                "status": "error",
                "message": "Guarantor form not found for this lease"
            }, status=status.HTTP_404_NOT_FOUND)
    
    def retrieve_agreement_form(self, request, lease_id=None):
        """Retrieve agreement form data by lease ID"""
        application = self.get_application_by_lease(lease_id)
        
        try:
            agreement_form = application.agreementform
            serializer = AgreementFormSerializer(agreement_form)
            
            return Response({
                "status": "success",
                "message": "Agreement form data retrieved successfully",
                "data": serializer.data
            })
        except AgreementForm.DoesNotExist:
            return Response({
                "status": "error",
                "message": "Agreement form not found for this lease"
            }, status=status.HTTP_404_NOT_FOUND)
