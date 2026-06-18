from rest_framework import serializers
from .models import (
    Lease,
    MaintenanceRequest,
    Inspection,
    Inquiries,
    Installment,
    Payment,
    MaintenanceRequestImage,
    Report,
    Document,
    Utility,
    DirectDebitUtility,
    DirectDebitInstallment,
    RentersRightsAcknowledgment,
)

from studentmove.serializers import CamelCaseSerializer
from studentmove.emailnotifier import EmailNotifier
from dateutil.relativedelta import relativedelta
from properties.models import Property
from chat.models import ChatThread


class LeaseSerializer(CamelCaseSerializer):
    class Meta:
        model = Lease
        fields = "__all__"
        read_only_fields = ["tenant"]

    def validate(self, attrs):
        request = self.context.get("request")
        user = request.user
        property_obj = attrs.get("property_obj")
        source_application = attrs.get("source_application")
        
        # If creating from an application form (Make Lease feature), different validation
        if source_application:
            # Check if user is agent/landlord who can create lease from completed application
            is_agent_or_landlord = user.groups.filter(name__in=["agent", "landlord"]).exists() or user.is_staff
            
            if not is_agent_or_landlord:
                raise serializers.ValidationError({
                    "detail": ["Only agents or landlords can create leases from applications."]
                })
            
            # Validate that the application is fully completed with all signatures
            if not source_application.is_completed:
                raise serializers.ValidationError({
                    "detail": ["Application form must be completed before creating lease."]
                })
            
            if not hasattr(source_application, 'guarantorform') or not source_application.guarantorform.completed:
                raise serializers.ValidationError({
                    "detail": ["Guarantor form must be completed before creating lease."]
                })
            
            if not hasattr(source_application, 'agreementform') or not source_application.agreementform.completed:
                raise serializers.ValidationError({
                    "detail": ["Agreement form must be completed and signed before creating lease."]
                })
            
            # Use the application's tenant for lease
            attrs["tenant"] = source_application.user
            
            return attrs
        
        # Original validation for regular tenant-initiated lease requests
        # find for a inqurie with user and property
        inquiry = Inquiries.objects.filter(
            tenant=user, property=property_obj, status="resolved"
        ).first()
        if not inquiry:
            raise serializers.ValidationError(
                {
                    "detail": [
                        "You must inquire about the property before requesting a lease."
                    ]
                }
            )

        # Check if the user has any other "active" or "pending" lease
        existing_lease = (
            Lease.objects.filter(tenant=user, status__in=["active", "pending"])
            .exclude(property_obj=property_obj)
            .first()
        )
        if existing_lease:
            raise serializers.ValidationError(
                {
                    "detail": [
                        "You have a lease in progress. Please resolve it before requesting a new one."
                    ]
                }
            )

        return super().validate(attrs)

    def create(self, validated_data):
        request = self.context.get("request")
        tenant = validated_data.get("tenant")  # May come from source_application
        source_application = validated_data.get("source_application")
        
        # If tenant is not set, use request user (original behavior)
        if not tenant:
            tenant = request.user
            validated_data["tenant"] = tenant

        # Ensure that the tenant can only request a specific property once
        if Lease.objects.filter(
            tenant=tenant, property_obj=validated_data["property_obj"]
        ).exists():
            raise serializers.ValidationError(
                {"detail": ["A lease for this property and tenant already exists."]}
            )

        tenant_request = Lease.objects.create(**validated_data)

        # Send email notification
        EmailNotifier.notify_landlord_new_lease_request(
            tenant_request.property_obj.land_lord.email,
            tenant.first_name + " " + tenant.last_name,
        )

        # Create a chat thread for the lease request
        chat_thread = ChatThread.objects.create(lease=tenant_request)
        chat_thread.participants.set([tenant, tenant_request.property_obj.land_lord])

        return tenant_request

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        representation["property"] = {
            "id": instance.property_obj.id,
            "name": instance.property_obj.name,
            "address": instance.property_obj.address,
            "landlord": {
                "id": instance.property_obj.land_lord.id,
                "name": f"{instance.property_obj.land_lord.first_name} {instance.property_obj.land_lord.last_name}",
                "phone": instance.property_obj.land_lord.profile.phone if hasattr(instance.property_obj.land_lord, 'profile') else None,
                "email": instance.property_obj.land_lord.email,
            },
            "security_deposit": instance.property_obj.security_deposit,
            "holding_deposit": instance.property_obj.holding_deposit,
            "utility_amount": instance.property_obj.utility_amount,
        }

        representation["tenant"] = {
            "id": instance.tenant.id,
            "name": f"{instance.tenant.first_name} {instance.tenant.last_name}",
            "email": instance.tenant.email,
            "phone": instance.tenant.profile.phone if hasattr(instance.tenant, 'profile') else None,
        }
        representation["end_date"] = instance.start_date + relativedelta(
            months=instance.lease_months
        )

        installment = instance.installments.first()  # Get the first related installment
        installment_amount = installment.amount if installment else None

        representation["chat_thread_id"] = instance.chat_thread.id if hasattr(instance, 'chat_thread') and instance.chat_thread else None

        representation["installmentAmount"] = installment_amount

        # Add agreement admin signature status
        admin_signed = False
        if instance.source_application and hasattr(instance.source_application, 'agreementform'):
            agreement = instance.source_application.agreementform
            admin_signed = bool(agreement.admin_sign)
        representation["admin_signed"] = admin_signed

        # Add monthly_rent and holding_fee fields
        representation["monthly_rent"] = instance.monthly_rent
        representation["holding_fee"] = instance.holding_fee

        return representation


class LeaseApproveSerializer(CamelCaseSerializer):
    class Meta:
        model = Lease
        fields = ["status"]

    def update(self, instance, validated_data):
        new_status = validated_data.get("status")

        if new_status not in ["active", "rejected"]:
            raise serializers.ValidationError(
                {"detail": ["Invalid status provided for lease approval."]}
            )

        instance.status = new_status
        instance.save()
        return instance


class LeaseCloseSerializer(CamelCaseSerializer):
    class Meta:
        model = Lease
        fields = ["status"]

    def update(self, instance, validated_data):
        request = self.context.get("request")
        user = request.user
        new_status = validated_data.get("status")

        if new_status == "tenant_closed":
            if user != instance.tenant:
                raise serializers.ValidationError(
                    {
                        "detail": [
                            "Only the tenant can close the lease as 'tenant_closed'."
                        ]
                    }
                )
            if instance.status == "landlord_closed":
                instance.status = "terminated"
            else:
                instance.status = "tenant_closed"

        elif new_status == "landlord_closed":
            if user != instance.property_obj.land_lord:
                raise serializers.ValidationError(
                    {
                        "detail": [
                            "Only the landlord can close the lease as 'landlord_closed'."
                        ]
                    }
                )
            if instance.status == "tenant_closed":
                instance.status = "terminated"
            else:
                instance.status = "landlord_closed"

        elif new_status == "completed":
            if instance.status != "active":
                raise serializers.ValidationError(
                    {"detail": ["Only active leases can be marked as completed."]}
                )
            instance.status = "completed"

        else:
            raise serializers.ValidationError(
                {"detail": ["Invalid status provided for closing the lease."]}
            )

        instance.save()
        return instance


class MaintenanceRequestImageSerializer(CamelCaseSerializer):
    class Meta:
        model = MaintenanceRequestImage
        fields = ("id", "image")


class MaintananceRequestSerializer(CamelCaseSerializer):
    images = MaintenanceRequestImageSerializer(many=True, read_only=True)

    class Meta:
        model = MaintenanceRequest
        fields = "__all__"

    def create(self, validated_data):
        # Get the request from context (this is important!)
        request = self.context.get("request")

        # Extract image files
        image_files = request.FILES.getlist("image_files")

        # Create maintenance request
        maintenance_request = MaintenanceRequest.objects.create(**validated_data)

        # Create image objects for each uploaded image
        for image_file in image_files:
            MaintenanceRequestImage.objects.create(
                maintenance_request=maintenance_request, image=image_file
            )

        return maintenance_request

    def update(self, instance, validated_data):
        request = self.context.get("request")
        image_files = request.FILES.getlist("image_files")

        # Create image objects
        for image_file in image_files:
            MaintenanceRequestImage.objects.create(
                maintenance_request=instance, image=image_file
            )

        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation["property"] = {
            "id": instance.lease.property_obj.id,
            "name": instance.lease.property_obj.name,
        }
        representation["lease"] = {
            "id": instance.lease.id,
            "tenant": {
                "id": instance.lease.tenant.id,
                "name": f"{instance.lease.tenant.first_name} {instance.lease.tenant.last_name}",
            },
        }
        return representation


class InspectionSerializer(CamelCaseSerializer):

    class Meta:
        model = Inspection
        fields = "__all__"

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        representation["lease"] = {
            "id": instance.lease.id,
            "property": {
                "name": instance.lease.property_obj.name,
                "landlord": {
                    "name": f"{instance.lease.property_obj.land_lord.first_name} {instance.lease.property_obj.land_lord.last_name}",
                },
            },
            "tenant": {
                "name": f"{instance.lease.tenant.first_name} {instance.lease.tenant.last_name}",
            },
        }

        return representation

    def validate(self, attrs):
        request = self.context.get("request")
        user = request.user

        # Check if the user is a landlord
        if user.groups.filter(name="landlord").exists():
            lease = attrs.get("lease")
            if not lease:
                raise serializers.ValidationError(
                    {"lease": "Lease is required to create an inspection."}
                )

            # Validate that the lease belongs to a property owned by the landlord
            if lease.property_obj.land_lord != user:
                raise serializers.ValidationError(
                    {
                        "lease": "You can only create inspections for leases in properties you own."
                    }
                )

            if lease and lease.status in ["completed", "pending", "terminated"]:
                raise serializers.ValidationError(
                    {"lease": "Inspections cannot be created for this lease"}
                )

        return attrs


class InspectionStatusUpdateSerializer(CamelCaseSerializer):
    class Meta:
        model = Inspection
        fields = ["status"]

    def update(self, instance, validated_data):
        new_status = validated_data.get("status")

        if new_status not in ["scheduled", "completed", "canceled"]:
            raise serializers.ValidationError(
                {"detail": ["Invalid status provided for inspection."]}
            )

        instance.status = new_status
        instance.save()
        return instance


class InspectionScheduleUpdateSerializer(CamelCaseSerializer):
    class Meta:
        model = Inspection
        fields = ["date", "time"]

    def update(self, instance, validated_data):
        new_date = validated_data.get("date")
        new_time = validated_data.get("time")

        if not new_date or not new_time:
            raise serializers.ValidationError(
                {"detail": ["Date and time are required to update the inspection."]}
            )

        instance.date = new_date
        instance.time = new_time
        instance.save()
        return instance


class InquiriesSerializer(CamelCaseSerializer):
    class Meta:
        model = Inquiries
        fields = "__all__"

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation["property"] = {
            "id": instance.property.id,
            "name": instance.property.name,
            "address": instance.property.address,
        }

        return representation


class InstallmentSerializer(CamelCaseSerializer):
    class Meta:
        model = Installment
        fields = "__all__"

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation["lease"] = {
            "id": instance.lease.id,
            "property": {
                "id": instance.lease.property_obj.id,
                "name": instance.lease.property_obj.name,
                "landlord": {
                    "id": instance.lease.property_obj.land_lord.id,
                    "name": f"{instance.lease.property_obj.land_lord.first_name} {instance.lease.property_obj.land_lord.last_name}",
                },
            },
            "tenant": {
                "id": instance.lease.tenant.id,
                "name": f"{instance.lease.tenant.first_name} {instance.lease.tenant.last_name}",
                "email": instance.lease.tenant.email,
            },
        }
        return representation


class PaymentSerializer(CamelCaseSerializer):
    class Meta:
        model = Payment
        fields = "__all__"
        read_only_fields = ["installment"]
        extra_kwargs = {
            "installment": {"required": False},
        }





class ChangeMaintanceRequestStatusSerializer(CamelCaseSerializer):
    class Meta:
        model = MaintenanceRequest
        fields = ["status"]


class ReportPropertySerializer(CamelCaseSerializer):
    class Meta:
        model = Report
        fields = ["property", "description"]
        # read_only_fields = ["tenant"]

    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user
        validated_data["tenant"] = user
        print(user)

        if user.groups.filter(name="landlord").exists():
            raise serializers.ValidationError(
                {"detail": ["Landlords are not allowed to report properties."]}
            )

        # Ensure that the tenant can only report a specific property once
        if Report.objects.filter(
            tenant=user, property=validated_data["property"]
        ).exists():
            raise serializers.ValidationError(
                {"detail": ["You have already reported this property."]}
            )

        return super().create(validated_data)


class ResolveReportSerializer(CamelCaseSerializer):
    class Meta:
        model = Report
        fields = ["status"]

    def update(self, instance, validated_data):
        new_status = validated_data.get("status")

        instance.status = new_status
        instance.save()
        return instance


class PaymentStatementSerializer(CamelCaseSerializer):
    class Meta:
        model = Payment
        fields = [
            "id",
            "utility",
            "installement",
            "amount",
            "status",
            "created_at",
            "updated_at",
            "stripe_payment_intent_id",
            "stripe_charge_id",
            "reciept_file",
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        # Handle both utility and installment payments
        lease_obj = None
        if instance.utility:
            lease_obj = instance.utility.lease
            representation["payment_type"] = "utility"
            representation["utility"] = {
                "id": instance.utility.id,
                "amount": str(instance.utility.amount),
                "type": instance.utility.type,
                "status": instance.utility.status,
                "due_date": instance.utility.due_date,
            }
        elif instance.installement:
            lease_obj = instance.installement.lease
            representation["payment_type"] = "installment"
            representation["installment"] = {
                "id": instance.installement.id,
                "amount": str(instance.installement.amount),
                "type": instance.installement.type,
                "status": instance.installement.status,
                "due_date": instance.installement.due_date,
            }
        
        # Add lease information
        if lease_obj:
            representation["lease"] = {
                "id": lease_obj.id,
                "property": {
                    "id": lease_obj.property_obj.id,
                    "name": lease_obj.property_obj.name,
                    "landlord": {
                        "id": lease_obj.property_obj.land_lord.id,
                        "name": f"{lease_obj.property_obj.land_lord.first_name} {lease_obj.property_obj.land_lord.last_name}",
                    },
                },
                "tenant": {
                    "id": lease_obj.tenant.id,
                    "name": f"{lease_obj.tenant.first_name} {lease_obj.tenant.last_name}",
                    "email": lease_obj.tenant.email,
                },
            }

        return representation


class DocumentSerializer(CamelCaseSerializer):
    class Meta:
        model = Document
        fields = ["id", "lease", "document_type", "file", "notes", "uploaded_at"]
        read_only_fields = ["id", "uploaded_at", "lease"]

    def validate_file(self, value):
        # Check file size (max 10MB)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("File size cannot exceed 10MB.")
        
        # Check file extension
        allowed_extensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']
        file_extension = value.name.lower().split('.')[-1]
        if f'.{file_extension}' not in allowed_extensions:
            raise serializers.ValidationError(
                "Invalid file type. Allowed types: PDF, DOC, DOCX, JPG, JPEG, PNG."
            )
        
        return value

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['document_type_display'] = instance.get_document_type_display()
        representation['file_url'] = instance.file.url if instance.file else None
        representation['file_name'] = instance.file.name.split('/')[-1] if instance.file else None
        return representation



class DirectDebitUtilitySerializer(CamelCaseSerializer):
    class Meta:
        model = DirectDebitUtility
        # Set dynamically to avoid import cycles - will be replaced below
        fields = "__all__"


class DirectDebitInstallmentSerializer(CamelCaseSerializer):
    class Meta:
        model = DirectDebitInstallment
        fields = "__all__"



class UtilitySerializer(CamelCaseSerializer):
    class Meta:
        model = Utility
        fields = "__all__"

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation["lease"] = {
            "id": instance.lease.id,
            "property": {
                "id": instance.lease.property_obj.id,
                "name": instance.lease.property_obj.name,
                "landlord": {
                    "id": instance.lease.property_obj.land_lord.id,
                    "name": f"{instance.lease.property_obj.land_lord.first_name} {instance.lease.property_obj.land_lord.last_name}",
                },
            },
            "tenant": {
                "id": instance.lease.tenant.id,
                "name": f"{instance.lease.tenant.first_name} {instance.lease.tenant.last_name}",
                "email": instance.lease.tenant.email,
            },
        }
        # Get first successful payment for this utility (if any)
        successful_payment = instance.payment_attempts.filter(status='success').first()
        if instance.status == 'pending_verification' and successful_payment:
            representation['payment'] = {
            "id": successful_payment.id,
            "amount": successful_payment.amount,
            "status": successful_payment.status,
            "receipt_file_url": successful_payment.reciept_file.url if getattr(successful_payment, "reciept_file", None) else None,
            }

        return representation


class RentersRightsAcknowledgmentSerializer(CamelCaseSerializer):
    class Meta:
        model = RentersRightsAcknowledgment
        fields = [
            "id",
            "pdf_version",
            "acknowledged_at",
            "ip_address",
            "user_agent",
            "device_info",
        ]
        read_only_fields = ["id", "acknowledged_at", "ip_address", "user_agent"]


class RentersRightsAcknowledgmentCreateSerializer(serializers.Serializer):
    pdf_version = serializers.CharField(max_length=64)
    device_info = serializers.JSONField(required=False, allow_null=True)
