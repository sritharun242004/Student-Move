from django.db import models
from django.contrib.auth.models import User
from properties.models import Property
import random
import string
from django.utils import timezone
import os
import uuid


def application_signature_path(instance, filename):
    """Generate unique path for application signatures"""
    ext = filename.split('.')[-1]
    unique_filename = f"application_{instance.id}_{instance.user.id}_signature_{uuid.uuid4().hex[:8]}.{ext}"
    return os.path.join('signatures', 'applications', unique_filename)


def application_nic_path(instance, filename):
    """Generate unique path for application NIC documents"""
    ext = filename.split('.')[-1]
    unique_filename = f"application_{instance.id}_{instance.user.id}_nic_{uuid.uuid4().hex[:8]}.{ext}"
    return os.path.join('nic', 'applications', unique_filename)


def guarantor_signature_path(instance, filename):
    """Generate unique path for guarantor signatures"""
    ext = filename.split('.')[-1]
    unique_filename = f"guarantor_{instance.application.id}_{instance.application.user.id}_signature_{uuid.uuid4().hex[:8]}.{ext}"
    return os.path.join('signatures', 'guarantors', unique_filename)


def witness_signature_path(instance, filename):
    """Generate unique path for witness signatures"""
    ext = filename.split('.')[-1]
    unique_filename = f"witness_{instance.application.id}_{instance.application.user.id}_signature_{uuid.uuid4().hex[:8]}.{ext}"
    return os.path.join('signatures', 'witnesses', unique_filename)


def tenant_signature_path(instance, filename):
    """Generate unique path for tenant signatures"""
    ext = filename.split('.')[-1]
    unique_filename = f"tenant_{instance.agreement.application.id}_{uuid.uuid4().hex[:8]}_signature.{ext}"
    return os.path.join('signatures', 'tenants', unique_filename)


def proof_of_employment_path(instance, filename):
    """Generate unique path for proof of employment documents"""
    ext = filename.split('.')[-1]
    unique_filename = f"guarantor_{instance.application.id}_{instance.application.user.id}_employment_{uuid.uuid4().hex[:8]}.{ext}"
    return os.path.join('documents', 'employment', unique_filename)


def landlord_signature_path(instance, filename):
    """Generate unique path for landlord signatures"""
    ext = filename.split('.')[-1]
    unique_filename = f"landlord_{instance.application.id}_{instance.application.user.id}_signature_{uuid.uuid4().hex[:8]}.{ext}"
    return os.path.join('signatures', 'landlords', unique_filename)


def admin_signature_path(instance, filename):
    """Generate unique path for admin signatures"""
    ext = filename.split('.')[-1]
    unique_filename = f"admin_{instance.application.id}_{uuid.uuid4().hex[:8]}_signature.{ext}"
    return os.path.join('signatures', 'admins', unique_filename)


class ApplicationForm(models.Model):
    STATUS_CHOICES = [
        ("Student", "Student"),
        ("Employee", "Employee"),
    ]

    CREDIT_CHECK_CHOICES = [
        ("Default", "Default"),
        ("Pass", "Pass"),
        ("Fail", "Fail"),
        ("Pending", "Pending"),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="application_forms"
    )
    property = models.ForeignKey(Property, on_delete=models.CASCADE)
    inquiry = models.ForeignKey(
        'tenants.Inquiries', on_delete=models.SET_NULL, related_name="application_forms", null=True, blank=True
    )
    dob = models.DateField()
    home_address = models.TextField()
    postcode = models.CharField(max_length=10)
    current_phone = models.CharField(max_length=20, blank=True, null=True)
    mobile = models.CharField(max_length=20, blank=True, null=True)
    work_email = models.EmailField(blank=True, null=True)
    personal_email = models.EmailField()
    rent_payer = models.CharField(max_length=100)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    how_heard = models.CharField(max_length=100, blank=True, null=True)
    credit_check = models.CharField(
        max_length=10, choices=CREDIT_CHECK_CHOICES, default="Default"
    )
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    amount_of_bond = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    date = models.DateField(blank=True,null=True)
    signature = models.ImageField(upload_to=application_signature_path, blank=True, null=True)
    nic = models.ImageField(upload_to=application_nic_path, blank=True, null=True)
    is_completed = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if self.signature and not self.date:
            self.date = timezone.now().date()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.user.first_name + " application form"


class StudentDetails(models.Model):
    application = models.OneToOneField(ApplicationForm, on_delete=models.CASCADE, related_name="student_details")
    university = models.CharField(max_length=100)
    student_id = models.CharField(max_length=100)
    course_name = models.CharField(max_length=100)
    length = models.CharField(max_length=100)
    current_year = models.IntegerField()
    nin = models.CharField(max_length=100)
    loan_recieved = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return self.application.user.first_name + "student details"


class EmployeeDetails(models.Model):
    application = models.OneToOneField(ApplicationForm, on_delete=models.CASCADE, related_name="employee_details")
    employer = models.TextField()
    address = models.TextField()
    postcode = models.CharField(max_length=10)
    phone = models.CharField(max_length=20)
    years = models.IntegerField(default=0)
    months = models.IntegerField(default=0)
    job_title = models.CharField(max_length=100)

    def __str__(self):
        return self.application.user.first_name + "employee details"


class ParentDetails(models.Model):
    application = models.OneToOneField(ApplicationForm, on_delete=models.CASCADE, related_name="parent_details")
    name = models.CharField(max_length=100)
    address = models.TextField()
    postcode = models.CharField(max_length=10)
    phone = models.CharField(max_length=20)
    work_name = models.CharField(max_length=100)
    work_address = models.TextField()
    work_postcode = models.CharField(max_length=10)
    work_phone = models.CharField(max_length=20)
    relationship = models.CharField(max_length=50)

    def __str__(self):
        return self.application.user.first_name + "parent details"


class PreviousLandlord(models.Model):
    application = models.OneToOneField(ApplicationForm, on_delete=models.CASCADE, related_name="previous_landlord")
    property = models.ForeignKey(
        Property, on_delete=models.CASCADE, blank=True, null=True
    )
    name = models.CharField(max_length=100, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    property_address = models.TextField(blank=True, null=True)
    postcode = models.CharField(max_length=10, blank=True, null=True)
    property_postcode = models.CharField(max_length=10, blank=True, null=True)
    number_of_beds = models.IntegerField(blank=True, null=True)
    current_rent = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True
    )
    per_week = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True
    )
    bond = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)

    def __str__(self):
        return self.application.user.first_name + "previous landlord details"


class GuarantorForm(models.Model):
    CREDIT_CHECK_CHOICES = [
        ("Default", "Default"),
        ("Pass", "Pass"),
        ("Default", "Default"),
        ("Fail", "Fail"),
        ("Pending", "Pending"),
    ]

    application = models.OneToOneField(ApplicationForm, on_delete=models.CASCADE, related_name="guarantorform")
    guarantor_name = models.CharField(max_length=200)
    occupation = models.CharField(max_length=100)
    home_address = models.TextField()
    work_address = models.TextField()
    time_at_address = models.CharField(max_length=100)
    previous_address = models.TextField(null=True, blank=True)
    home_phone = models.CharField(max_length=20, null=True, blank=True)
    work_phone = models.CharField(max_length=20, null=True, blank=True)
    mobile = models.CharField(max_length=20)
    personal_email = models.EmailField(null=True, blank=True)
    work_email = models.EmailField(null=True, blank=True)
    bank_name = models.CharField(max_length=100)
    branch_address = models.TextField(blank=True, null=True)
    fax = models.CharField(max_length=20, blank=True, null=True)
    proof_of_employment = models.ImageField(upload_to=proof_of_employment_path, blank=True, null=True)
    # sign related
    guarantor_sign = models.ImageField(upload_to=guarantor_signature_path, blank=True, null=True)
    g_relationship = models.CharField(max_length=100, blank=True, null=True)
    gs_date = models.DateField(blank=True, null=True)
    witness_sign = models.ImageField(upload_to=witness_signature_path, blank=True, null=True)
    ws_date = models.DateField(blank=True, null=True)
    ws_relationship = models.CharField(max_length=100, blank=True, null=True)

    # credit check
    credit_check = models.CharField(
        max_length=10, choices=CREDIT_CHECK_CHOICES, default="Default"
    )
    completed = models.BooleanField(default=False)

    @property
    def is_form_complete(self):
        """Check if all required fields and signatures are present"""
        required_fields_filled = all([
            self.guarantor_name,
            self.occupation,
            self.home_address,
            self.work_address,
            self.time_at_address,
            self.mobile,
            self.bank_name,
        ])
        
        signatures_present = bool(self.guarantor_sign and self.witness_sign)
        
        return required_fields_filled and signatures_present

    def save(self, *args, **kwargs):
        if self.guarantor_sign and not self.gs_date:
            self.gs_date = timezone.now().date()
        if self.witness_sign and not self.ws_date:
            self.ws_date = timezone.now().date()
        
        # Auto-complete if all required fields and signatures are present
        if self.is_form_complete and not self.completed:
            self.completed = True
            
        super().save(*args, **kwargs)

    def __str__(self):
        return self.application.user.first_name + " guarantor form"


class AgreementForm(models.Model):
    # Changed from OneToOne with ApplicationForm to support multi-tenant per property
    application = models.OneToOneField(ApplicationForm, on_delete=models.CASCADE, related_name="agreementform")  # Keep for backward compatibility
    linked_property = models.OneToOneField(Property, on_delete=models.CASCADE, related_name="agreement_form", null=True, blank=True)  # New: property-level agreement
    
    date = models.DateField(blank=True, null=True)
    agent = models.CharField(max_length=200, blank=True, null=True)
    agent_address = models.TextField(blank=True, null=True)
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    payment_description = models.TextField(blank=True, null=True)
    
    # First Agreement Signatures (Step 1)
    land_lord_sign_1 = models.ImageField(upload_to=landlord_signature_path, blank=True, null=True)
    admin_sign_1 = models.ImageField(upload_to=admin_signature_path, blank=True, null=True)
    admin_name_1 = models.CharField(max_length=200, blank=True, null=True)
    lls_date_1 = models.DateField(blank=True, null=True)
    admin_sign_date_1 = models.DateField(blank=True, null=True)
    
    # Final Agreement Signatures (Step 2)
    land_lord_sign = models.ImageField(upload_to=landlord_signature_path, blank=True, null=True)
    admin_sign = models.ImageField(upload_to=admin_signature_path, blank=True, null=True)
    admin_name = models.CharField(max_length=200, blank=True, null=True)
    lls_date = models.DateField(blank=True, null=True)
    admin_sign_date = models.DateField(blank=True, null=True)
    completed = models.BooleanField(default=False)
    # New fields to track who filled what
    agent_filled = models.BooleanField(default=False)  # True when agent/landlord fills first part
    tenant_filled = models.BooleanField(default=False)  # True when tenant fills remaining part
    admin_filled = models.BooleanField(default=False)  # True when admin signs
    filled_by_agent = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="filled_agreements")
    
    # Multi-tenant support fields
    allow_multiple_tenants = models.BooleanField(default=True)  # Allow multiple tenants to sign same agreement
    created_at = models.DateTimeField(auto_now_add=True)  # Track when agreement was created

    @property
    def status_for_tenant(self):
        """Get the status of agreement form from tenant perspective"""
        # Check if application and guarantor are completed first
        if not self.application.is_completed:
            return "locked"
            
        if not hasattr(self.application, 'guarantorform'):
            return "locked"
            
        if not self.application.guarantorform.completed:
            return "locked"
        
        # If agent hasn't filled the initial details, show as locked
        if not self.agent_filled:
            return "locked"
        
        # Check if ANY tenant has signed (use TenantSigns table instead of deprecated lead_tenant_sign)
        has_tenant_signatures = self.tenant_signs.exists()
        
        # New 4-step workflow:
        # Step 1: Agent filled details, but no tenant signatures yet
        if self.agent_filled and not has_tenant_signatures:
            return "waiting_for_tenant"  # Tenant can sign
        
        # Step 2: At least one tenant signed, waiting for landlord signature
        if has_tenant_signatures and not self.land_lord_sign:
            return "pending_landlord_signature"
        
        # Step 3: Landlord signed, waiting for admin signature and name
        if self.land_lord_sign and not (self.admin_sign and self.admin_name):
            return "pending_admin_signature"
        
        # Step 4: All signatures complete
        if self.completed:
            return "completed"
        
        # Default fallback
        return "pending"

    @property
    def status_for_agent(self):
        """Get the status of agreement form from agent/landlord perspective"""
        # Check if application and guarantor are completed first
        if not self.application.is_completed or not hasattr(self.application, 'guarantorform') or not self.application.guarantorform.completed:
            return "locked"
        
        # If agent hasn't filled initial details, allow creation/editing
        if not self.agent_filled:
            return "can_edit"
        
        # Check if ANY tenant has signed (use TenantSigns table)
        has_tenant_signatures = self.tenant_signs.exists()
        
        # If agent filled but no tenants have signed yet, waiting for tenant
        if self.agent_filled and not has_tenant_signatures:
            return "waiting_for_tenant"
        
        # If tenants have signed but agent hasn't signed yet, allow agent to sign
        if has_tenant_signatures and not self.land_lord_sign:
            return "pending_landlord_signature"
        
        # If agent signed but admin hasn't signed and provided name yet, waiting for admin
        if self.land_lord_sign and not (self.admin_sign and self.admin_name):
            return "pending_admin_signature"
        
        # If all signatures complete
        if self.completed:
            return "completed"
        
        # Default fallback
        return "can_edit"

    @property
    def is_agent_details_complete(self):
        """Check if agent has filled the minimum required details"""
        return all([
            self.agent,
            self.agent_address,
            self.start_date,
            self.end_date,
            self.amount,
        ])

    def save(self, *args, **kwargs):
        # Auto-set agent_filled if agent details are complete
        if self.is_agent_details_complete and not self.agent_filled:
            self.agent_filled = True
        
        # Auto-set tenant_filled if ANY tenant has signed (only check for existing records with pk)
        # We check for existing pk because new records won't have tenant_signs yet
        if self.pk and self.tenant_signs.exists() and not self.tenant_filled:
            self.tenant_filled = True
            
        # Auto-set admin_filled if admin signature and name exist
        if self.admin_sign and self.admin_name and not self.admin_filled:
            self.admin_filled = True
            self.admin_sign_date = timezone.now().date()
            
        
        # Check if all signatures exist before marking completed
        # Only check tenant_signs if record already exists (has pk)
        has_tenant_signatures = self.pk and self.tenant_signs.exists()
        
        # Agreement is ONLY complete when ALL of these conditions are met:
        # 1. Agent has filled initial details
        # 2. At least one tenant has signed
        # 3. Landlord/Agent has signed
        # 4. Admin has signed (signature file must exist AND admin_name must be provided)
        # 5. Admin filled flag is set
        has_valid_admin_signature = bool(self.admin_sign) and bool(self.admin_name)
        
        if (self.agent_filled and has_tenant_signatures and self.land_lord_sign and 
            has_valid_admin_signature and self.admin_filled and not self.completed):
            self.completed = True

        if self.completed and not self.date:
            self.date = timezone.now().date()
        if self.land_lord_sign and not self.lls_date:
            self.lls_date = timezone.now().date()
        if self.admin_sign and not self.admin_sign_date:
            self.admin_sign_date = timezone.now().date()
        super().save(*args, **kwargs)

        # After saving, if agreement is completed, automatically create Leases for all tenants
        try:
            if self.completed and self.application and self.application.property:
                # Import here to avoid circular imports at module load
                from tenants.models import Lease
                from dateutil.relativedelta import relativedelta

                # Get all tenants who signed the agreement via TenantSigns
                tenant_signatures = self.tenant_signs.all()
                
                # If no tenant signatures found, fall back to primary application tenant
                if not tenant_signatures.exists():
                    tenant_signatures = []
                    if self.application.user:
                        # Create a placeholder object-like structure for backward compatibility
                        class TenantPlaceholder:
                            def __init__(self, user):
                                self.tenant_user = user
                        tenant_signatures = [TenantPlaceholder(self.application.user)]

                # Determine start_date and months (shared across all leases)
                start_date = self.start_date or self.application.start_date or timezone.now().date()
                months = 12
                if self.start_date and self.end_date and self.end_date > self.start_date:
                    months = max(1, min(12, (self.end_date.year - self.start_date.year) * 12 + (self.end_date.month - self.start_date.month)))

                # Create a lease for each tenant who signed the agreement
                for tenant_sig in tenant_signatures:
                    tenant_user = tenant_sig.tenant_user
                    # Get the tenant's application form (from TenantSigns.application if available)
                    tenant_application = tenant_sig.application if hasattr(tenant_sig, 'application') and tenant_sig.application else self.application
                    
                    # Check if lease already exists for this tenant
                    existing = Lease.objects.filter(
                        tenant=tenant_user,
                        property_obj=self.application.property,
                        source_application=tenant_application
                    ).first()
                    
                    if existing:
                        continue  # Skip if lease already exists

                    # Create the lease for this tenant
                    Lease.objects.create(
                        tenant=tenant_user,
                        property_obj=self.application.property,
                        installment_type="monthly",
                        lease_months=months,
                        start_date=start_date,
                        monthly_rent=self.amount,  # Monthly rent from agreement
                        holding_fee=tenant_application.amount_of_bond,  # Holding fee from tenant's application bond amount
                        source_application=tenant_application,  # Link to tenant's specific application
                        source_inquiry=tenant_application.inquiry,  # Link to tenant's specific inquiry
                        status="active",
                    )
        except Exception as e:
            # Avoid crashing save flow; optionally log
            print(f"AgreementForm post-save lease creation failed: {e}")

class TenantSigns(models.Model):
    agreement = models.ForeignKey(
        AgreementForm, on_delete=models.CASCADE, related_name="tenant_signs"
    )
    application = models.ForeignKey(ApplicationForm, on_delete=models.CASCADE, related_name="tenant_signs", null=True, blank=True)  # New: link to specific application
    tenant_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tenant_agreement_signs", null=True, blank=True)  # New: track which tenant signed
    full_name = models.CharField(max_length=200)
    sign = models.ImageField(upload_to=tenant_signature_path)
    date = models.DateField(auto_now_add=True)
    # Additional fields for multi-tenant agreement
    email = models.EmailField(blank=True, null=True)  # Optional: tenant email
    phone = models.CharField(max_length=20, blank=True, null=True)  # Optional: tenant phone
    
    class Meta:
        ordering = ['-date']  # Most recent signatures first
        verbose_name_plural = "Tenant Signs"
    
    def __str__(self):
        return f"{self.full_name} - {self.agreement.id}"


class TenantSigns1(models.Model):
    """First step tenant signatures"""
    agreement = models.ForeignKey(
        AgreementForm, on_delete=models.CASCADE, related_name="tenant_signs_1"
    )
    application = models.ForeignKey(ApplicationForm, on_delete=models.CASCADE, related_name="tenant_signs_1", null=True, blank=True)
    tenant_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tenant_agreement_signs_1", null=True, blank=True)
    full_name = models.CharField(max_length=200)
    sign = models.ImageField(upload_to=tenant_signature_path)
    date = models.DateField(auto_now_add=True)
    # Additional fields for multi-tenant agreement
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    
    class Meta:
        ordering = ['-date']  # Most recent signatures first
        verbose_name_plural = "Tenant Signs Step 1"
    
    def __str__(self):
        return f"{self.full_name} - {self.agreement.id} (Step 1)"


class Otp(models.Model):
    Roles_CHOICES = [
        ("Tenant", "Tenant"),
        ("Guarantor", "Guarantor"),
        ("Landlord", "Landlord"),
        ("Witness", "Witness"),
    ]

    form = models.ForeignKey(ApplicationForm, on_delete=models.CASCADE)
    name = models.CharField(max_length=300,blank=True,null=True)
    otp = models.CharField(max_length=6, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    role = models.CharField(max_length=10, choices=Roles_CHOICES)
    signed = models.BooleanField(default=False)


    def save(self, *args, **kwargs):
        if not self.otp:
            self.otp = "".join(random.choices(string.digits[1:], k=1) + random.choices(string.digits, k=5))
        super().save(*args, **kwargs)

    def __str__(self):
        return self.form.user.first_name + " OTP"


class GuarantorShareToken(models.Model):
    """Token for sharing guarantor forms with external guarantors"""
    application = models.OneToOneField(ApplicationForm, on_delete=models.CASCADE, related_name="guarantor_share_token")
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    accessed_at = models.DateTimeField(null=True, blank=True)
    
    def save(self, *args, **kwargs):
        if not self.token:
            # Generate a secure random token
            import secrets
            self.token = secrets.token_urlsafe(48)
        
        if not self.expires_at:
            # Set expiration to 30 days from now
            from datetime import timedelta
            self.expires_at = timezone.now() + timedelta(days=30)
        
        super().save(*args, **kwargs)
    
    @property
    def is_expired(self):
        return timezone.now() > self.expires_at
    
    @property
    def is_valid(self):
        return self.is_active and not self.is_expired
    
    def __str__(self):
        return f"Guarantor token for {self.application.user.first_name}'s application"
