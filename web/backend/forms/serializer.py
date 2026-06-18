from django.contrib.auth.models import User
from rest_framework import serializers
import uuid
import base64
from django.core.files.base import ContentFile
from .models import (
    ApplicationForm,
    StudentDetails,
    EmployeeDetails,
    ParentDetails,
    PreviousLandlord,
    GuarantorForm,
    AgreementForm,
    TenantSigns,
    Otp,
    GuarantorShareToken,
)
from rest_framework_simplejwt.tokens import AccessToken
import base64
from django.core.files.base import ContentFile


class ApplicationFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationForm
        fields = "__all__"

    def create(self, validated_data):
        """
        Ensure we don't reuse an application across different inquiries.
        Reuse only when an application exists for the same inquiry (if provided),
        otherwise for the same (user, property) with no inquiry.
        """
        request = self.context.get("request")
        user = getattr(request, "user", None)

        # Safeguard: if user is not available, fall back to create
        if user is None:
            return super().create(validated_data)

        inquiry = validated_data.get("inquiry")
        property_obj = validated_data.get("property")

        qs = ApplicationForm.objects.filter(user=user)
        if inquiry is not None:
            # Only reuse if there is already an application for this same inquiry
            qs = qs.filter(inquiry=inquiry)
        else:
            # Only reuse an application for the same property with no inquiry
            if property_obj is not None:
                qs = qs.filter(property=property_obj, inquiry__isnull=True)
            else:
                qs = qs.none()

        existing = qs.first()
        if existing:
            return super().update(existing, validated_data)

        # No matching existing record; create a new one
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if "signature" in validated_data:
            if instance.signature:
                instance.signature.delete()
            instance.save()

        if "nic" in validated_data and instance.nic:
            instance.nic.delete()
            instance.save()

        return super().update(instance, validated_data)
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Add full name as a separate field instead of overriding user
        representation["full_name"] = f"{instance.user.first_name} {instance.user.last_name}"
        representation["first_name"] = instance.user.first_name
        representation["last_name"] = instance.user.last_name

        if hasattr(instance, 'student_details'):
            representation["student_details"] = StudentDetailsSerializer(instance.student_details).data
        if hasattr(instance, 'employee_details'):
            representation["employee_details"] = EmployeeDetailsSerializer(instance.employee_details).data
        if hasattr(instance, 'parent_details'):
            representation["parent_details"] = ParentDetailsSerializer(instance.parent_details).data
        if hasattr(instance, 'previous_landlord'):
            representation["previous_landlord"] = PreviousLandlordSerializer(instance.previous_landlord).data

        return representation


class StudentDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentDetails
        fields = "__all__"



class EmployeeDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeDetails
        fields = "__all__"


class ParentDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParentDetails
        fields = "__all__"


class PreviousLandlordSerializer(serializers.ModelSerializer):
    class Meta:
        model = PreviousLandlord
        fields = "__all__"


class GuarantorFormSerializer(serializers.ModelSerializer):
    guarantor_signature = serializers.CharField(write_only=True, required=False, allow_blank=True)
    witness_signature = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = GuarantorForm
        fields = "__all__"
        extra_kwargs = {
            'credit_check': {'read_only': True},
            'guarantor_sign': {'read_only': True},  # Exclude from validation
            'witness_sign': {'read_only': True},   # Exclude from validation
            'proof_of_employment': {'required': False},  # Make it optional
        }

    def to_internal_value(self, data):
        print("GuarantorFormSerializer.to_internal_value called with data keys:", list(data.keys()) if hasattr(data, 'keys') else type(data))
        
        # Handle proof_of_employment field specifically - remove if empty or null
        if 'proof_of_employment' in data:
            if data['proof_of_employment'] is None or data['proof_of_employment'] == '':
                data = data.copy() if hasattr(data, 'copy') else dict(data)
                data.pop('proof_of_employment')
        
        try:
            result = super().to_internal_value(data)
            print("Successfully processed internal value with keys:", list(result.keys()))
            return result
        except Exception as e:
            print("Error in to_internal_value:", str(e))
            print("Problematic data:", data)
            raise

    def create(self, validated_data):
        print("Creating guarantor form with data keys:", list(validated_data.keys()))
        print("Full validated_data:", validated_data)
        
        # Extract signature data before creating instance
        guarantor_sig_data = validated_data.pop('guarantor_signature', None)
        witness_sig_data = validated_data.pop('witness_signature', None)
        
        print("Guarantor signature data:", guarantor_sig_data[:50] if guarantor_sig_data else None)
        print("Witness signature data:", witness_sig_data[:50] if witness_sig_data else None)
        
        # Create the instance
        instance = super().create(validated_data)
        
        # Handle base64 signatures after instance creation
        if guarantor_sig_data and guarantor_sig_data.strip():
            print("Converting guarantor signature from base64")
            try:
                if ';base64,' in guarantor_sig_data:
                    format, imgstr = guarantor_sig_data.split(';base64,')
                    ext = format.split('/')[-1]
                    # Generate unique filename with application ID and UUID
                    unique_id = uuid.uuid4().hex[:8]
                    unique_filename = f'guarantor_{instance.application.id}_signature_{unique_id}.{ext}'
                    instance.guarantor_sign = ContentFile(base64.b64decode(imgstr), name=unique_filename)
                    print("Successfully converted guarantor signature")
                else:
                    print("Guarantor signature data is not in expected base64 format")
            except Exception as e:
                print("Error converting guarantor signature:", e)

        if witness_sig_data and witness_sig_data.strip():
            print("Converting witness signature from base64")
            try:
                if ';base64,' in witness_sig_data:
                    format, imgstr = witness_sig_data.split(';base64,')
                    ext = format.split('/')[-1]
                    # Generate unique filename with application ID and UUID
                    unique_id = uuid.uuid4().hex[:8]
                    unique_filename = f'witness_{instance.application.id}_signature_{unique_id}.{ext}'
                    instance.witness_sign = ContentFile(base64.b64decode(imgstr), name=unique_filename)
                    print("Successfully converted witness signature")
                else:
                    print("Witness signature data is not in expected base64 format")
            except Exception as e:
                print("Error converting witness signature:", e)
        
        instance.save()
        return instance

    def update(self, instance, validated_data):
        print("Updating guarantor form with data keys:", list(validated_data.keys()))
        print("Full validated_data:", validated_data)
        
        # Extract signature data before updating
        guarantor_sig_data = validated_data.pop('guarantor_signature', None)
        witness_sig_data = validated_data.pop('witness_signature', None)
        
        print("Guarantor signature data:", guarantor_sig_data[:50] if guarantor_sig_data else None)
        print("Witness signature data:", witness_sig_data[:50] if witness_sig_data else None)
        
        # Update the instance
        instance = super().update(instance, validated_data)
        
        # Handle base64 signatures after instance update
        if guarantor_sig_data and guarantor_sig_data.strip():
            print("Converting guarantor signature from base64")
            try:
                if ';base64,' in guarantor_sig_data:
                    format, imgstr = guarantor_sig_data.split(';base64,')
                    ext = format.split('/')[-1]
                    # Generate unique filename with application ID and UUID
                    unique_id = uuid.uuid4().hex[:8]
                    unique_filename = f'guarantor_{instance.application.id}_signature_{unique_id}.{ext}'
                    instance.guarantor_sign = ContentFile(base64.b64decode(imgstr), name=unique_filename)
                    print("Successfully converted guarantor signature")
                else:
                    print("Guarantor signature data is not in expected base64 format")
            except Exception as e:
                print("Error converting guarantor signature:", e)

        if witness_sig_data and witness_sig_data.strip():
            print("Converting witness signature from base64")
            try:
                if ';base64,' in witness_sig_data:
                    format, imgstr = witness_sig_data.split(';base64,')
                    ext = format.split('/')[-1]
                    # Generate unique filename with application ID and UUID
                    unique_id = uuid.uuid4().hex[:8]
                    unique_filename = f'witness_{instance.application.id}_signature_{unique_id}.{ext}'
                    instance.witness_sign = ContentFile(base64.b64decode(imgstr), name=unique_filename)
                    print("Successfully converted witness signature")
                else:
                    print("Witness signature data is not in expected base64 format")
            except Exception as e:
                print("Error converting witness signature:", e)
        
        instance.save()
        return instance

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Include signature URLs in the response for frontend display
        representation["guarantor_signature"] = instance.guarantor_sign.url if instance.guarantor_sign else None
        representation["witness_signature"] = instance.witness_sign.url if instance.witness_sign else None
        return representation


class AgreementFormSerializer(serializers.ModelSerializer):
    tenants = serializers.SerializerMethodField()
    
    class Meta:
        model = AgreementForm
        fields = "__all__"

    def get_tenants(self, obj):
        """Get all tenants who have signed the agreement"""
        tenant_signatures = obj.tenant_signs.all()
        serializer = TenantSignsSerializer(tenant_signatures, many=True, context=self.context)
        return serializer.data

    def update(self, instance, validated_data):
        # Handle file deletion for signature fields before updating
        if "land_lord_sign" in validated_data:
            if instance.land_lord_sign:
                instance.land_lord_sign.delete()
            instance.save()

        if "lead_tenant_sign" in validated_data:
            if instance.lead_tenant_sign:
                instance.lead_tenant_sign.delete()
            instance.save()

        return super().update(instance, validated_data)

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation["land_lord_sign"] = instance.land_lord_sign.url if instance.land_lord_sign else None
        representation["land_lord_sign_1"] = instance.land_lord_sign_1.url if instance.land_lord_sign_1 else None
        representation["admin_sign"] = instance.admin_sign.url if instance.admin_sign else None
        representation["admin_sign_1"] = instance.admin_sign_1.url if instance.admin_sign_1 else None
        representation["admin_name"] = instance.admin_name
        representation["admin_name_1"] = instance.admin_name_1
        
        # Add status fields (both are now properties)
        representation["status_for_tenant"] = instance.status_for_tenant
        representation["status_for_agent"] = instance.status_for_agent
        representation["is_agent_details_complete"] = instance.is_agent_details_complete

        # Add application and property information
        if instance.application:
            representation["tenant_name"] = f"{instance.application.user.first_name} {instance.application.user.last_name}"
            representation["tenant_email"] = instance.application.user.email
            if instance.application.property:
                representation["property_address"] = instance.application.property.address
                representation["property_name"] = instance.application.property.name
            representation["deposit_amount"] = instance.application.amount_of_bond

        return representation


class TokenSerializer(serializers.Serializer):
    otp = serializers.CharField(max_length=6)
    form_id = serializers.IntegerField()
    role = serializers.CharField(max_length=50)

    def validate(self, attrs):
        otp = attrs.get("otp")
        form_id = attrs.get("form_id")
        if not otp or not form_id:
            raise serializers.ValidationError("OTP and form_id are required")

        form = ApplicationForm.objects.filter(id=form_id).first()
        if not form:
            raise serializers.ValidationError("Invalid form_id")

        otp_instance = Otp.objects.filter(otp=otp, form=form).first()
        if not otp_instance:
            raise serializers.ValidationError("Invalid OTP")

        if otp_instance.role != attrs.get("role"):
            raise serializers.ValidationError("Invalid role")

        return attrs

    def create(self, validated_data):
        form_id = validated_data.get("form_id")
        otp_instance = Otp.objects.filter(
            otp=validated_data.get("otp"), form_id=form_id
        ).first()
        otp_instance.otp = None
        otp_instance.save()
        return otp_instance

    def to_representation(self, instance):
        token = AccessToken()
        token["otp_id"] = instance.id
        return {"access": str(token)}


class OtpSerializer(serializers.ModelSerializer):
    class Meta:
        model = Otp
        fields = "__all__"


class SignTenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgreementForm
        fields = ["lead_tenant_sign"]
        extra_kwargs = {
            'lead_tenant_sign': {'required': False},
        }


class SignGuarantorSerializer(serializers.ModelSerializer):
    class Meta:
        model = GuarantorForm
        fields = ["guarantor_sign", "g_relationship", "gs_date"]

    def validate(self, attrs):
        sign = attrs.get("guarantor_sign")
        # Signature is required when using this endpoint, but relationship is optional
        if not sign:
            raise serializers.ValidationError("guarantor_sign is required")
        return super().validate(attrs)


class SignWitnessSerializer(serializers.ModelSerializer):
    class Meta:
        model = GuarantorForm
        fields = ["witness_sign", "ws_date", "ws_relationship"]

    def validate(self, attrs):
        sign = attrs.get("witness_sign")
        # Signature is required when using this endpoint, but relationship is optional
        if not sign:
            raise serializers.ValidationError("witness_sign is required")
        return super().validate(attrs)


class SignLandlordSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgreementForm
        fields = ["land_lord_sign", "lls_date"]
        extra_kwargs = {
            'land_lord_sign': {'required': False},
            'lls_date': {'required': False},
        }


class SignAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgreementForm
        fields = ["admin_sign", "admin_name", "admin_sign_date"]
        extra_kwargs = {
            'admin_sign': {'required': False},
            'admin_name': {'required': False},
            'admin_sign_date': {'required': False},
        }


class TenantSignsSerializer(serializers.ModelSerializer):
    """Serializer for TenantSigns model - handles multiple tenant signatures per agreement"""
    tenant_user_name = serializers.SerializerMethodField()
    sign_url = serializers.SerializerMethodField()
    
    class Meta:
        model = TenantSigns
        fields = [
            'id', 'agreement', 'application', 'tenant_user', 'tenant_user_name',
            'full_name', 'email', 'phone', 'sign', 'sign_url', 'date'
        ]
        read_only_fields = ['id', 'date']
    
    def get_tenant_user_name(self, obj):
        if obj.tenant_user:
            return f"{obj.tenant_user.first_name} {obj.tenant_user.last_name}"
        return None
    
    def get_sign_url(self, obj):
        if obj.sign:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.sign.url)
            return obj.sign.url
        return None


class FormsListSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationForm
        fields = ["id", "date", "credit_check","user","is_completed"]

    def to_representation(self, instance):
        data = super().to_representation(instance)



        data["user"] =  f"{instance.user.first_name} {instance.user.last_name}"
        # Keep existing misspelled key for backward compatibility
        data["propety"] = instance.property.id
        # Add correctly spelled key and inquiry id for reliable client filtering
        data["property_id"] = instance.property.id
        data["inquiry_id"] = instance.inquiry.id if instance.inquiry_id else None
        data["guarantor"] = None
        data["agreement"] = None

        # Check if guarantorform exists
        if hasattr(instance, 'guarantorform'):
            data["guarantor"] = {
                "id": instance.guarantorform.id,
                "guarantor_name": instance.guarantorform.guarantor_name,
                "credit_check": instance.guarantorform.credit_check,
                "completed": instance.guarantorform.completed,
            }

        # Check if agreementform exists
        if hasattr(instance, 'agreementform'):
            data["agreement"] = {
                "id": instance.agreementform.id,
                "rent_amount": instance.agreementform.amount,
                "completed": instance.agreementform.completed,
            }

        return data


class GuarantorShareTokenSerializer(serializers.ModelSerializer):
    share_url = serializers.SerializerMethodField()
    
    class Meta:
        model = GuarantorShareToken
        fields = ['id', 'token', 'created_at', 'expires_at', 'is_active', 'accessed_at', 'share_url']
        read_only_fields = ['token', 'created_at', 'accessed_at']
    
    def get_share_url(self, obj):
        # You can customize this URL based on your frontend domain
        return f"/guarantor/shared/{obj.token}"