from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils import timezone
from dateutil.relativedelta import relativedelta
from properties.models import Property
import uuid
import os


class Lease(models.Model):
    INSTALLMENT_TYPES = [
        ("monthly", "Monthly"),
        ("weekly", "Weekly"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("rejected", "Rejected"),
        ("active", "Active"),
        ("tenant_closed", "Tenant Closed"),
        ("landlord_closed", "Landlord Closed"),
        ("terminated", "Terminated"),
        ("completed", "Completed"),
    ]

    tenant = models.ForeignKey(User, on_delete=models.CASCADE, related_name="leases")
    property_obj = models.ForeignKey(
        Property, on_delete=models.CASCADE, related_name="leases"
    )

    installment_type = models.CharField(
        max_length=20, choices=INSTALLMENT_TYPES, default="monthly"
    )

    lease_months = models.IntegerField()

    start_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    # Financial details from agreement (optional - for lease creation from agreements)
    monthly_rent = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, help_text="Monthly rent amount from agreement")
    holding_fee = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, help_text="Holding fee amount from application bond amount")

    # Source document references (optional - to preserve the application flow context)
    source_application = models.ForeignKey(
        'forms.ApplicationForm', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="leases_created",
        help_text="The application form this lease was created from"
    )
    source_inquiry = models.ForeignKey(
        'Inquiries', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="leases_created",
        help_text="The inquiry this lease originated from"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # One-to-one links to direct debit objects (created automatically)
    direct_debit_utility = models.OneToOneField(
        "DirectDebitUtility",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="lease_for_utility",
    )
    direct_debit_installment = models.OneToOneField(
        "DirectDebitInstallment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="lease_for_installment",
    )

    @property
    def end_date(self):
        """
        Calculate end date based on start date and lease months
        """
        return self.start_date + relativedelta(months=self.lease_months)

    def __str__(self):
        return f"{self.tenant.username} - {self.property_obj.name} - {self.lease_months} months - {self.property_obj.land_lord.username}"

    def clean(self):
        # Validate lease months
        if self.lease_months < 1 or self.lease_months > 12:
            raise ValidationError("Lease must be between 1 and 12 months")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
        self.generate_installments()
        self.generate_utilities()
        # Ensure direct-debit objects exist for this lease
        try:
            # Create DirectDebitUtility if not linked
            if not getattr(self, "direct_debit_utility", None):
                dd_util = DirectDebitUtility.objects.create(status=DirectDebitUtility.STATUS_PENDING)
                # attach and save the lease with the reference
                self.direct_debit_utility = dd_util
                super(Lease, self).save(update_fields=["direct_debit_utility"])

            # Create DirectDebitInstallment if not linked
            if not getattr(self, "direct_debit_installment", None):
                dd_inst = DirectDebitInstallment.objects.create(status=DirectDebitInstallment.STATUS_PENDING)
                self.direct_debit_installment = dd_inst
                super(Lease, self).save(update_fields=["direct_debit_installment"])
        except Exception:
            # Defensive: if models aren't ready yet (migrations), ignore
            pass

    def generate_installments(self):
        """
        Generate installment records based on lease terms
        Deletes existing non-paid installments and recreates
        """

        paid_installments = (
            self.installments.filter(status="paid", type="weekly").count() // 4
            + self.installments.filter(status="paid", type="monthly").count()
        )

        last_paid_installment = self.installments.filter(status="paid").last()
        if last_paid_installment and last_paid_installment.due_date:
            self.start_date = last_paid_installment.due_date + relativedelta(months=1)
        else:
            self.start_date = (
                self.start_date
            )  # Keep the original start date if no paid installments

        self.lease_months = self.lease_months - paid_installments
        # Clear existing non-paid installments
        self.installments.filter(status="pending").delete()

        # Calculate total property price for the entire lease duration
        total_price = self.property_obj.price * self.lease_months

        # Determine number of installments based on installment type
        if self.installment_type == "weekly":
            num_installments = self.lease_months * 4  # 4 weeks per month
        else:  # monthly
            num_installments = self.lease_months  # 1 installment per month

        # Calculate installment amount
        installment_amount = total_price / num_installments

        current_date = self.start_date
        for i in range(num_installments):
            # Calculate due date based on installment type
            if self.installment_type == "weekly":
                due_date = current_date + relativedelta(weeks=1)
            else:  # monthly
                due_date = current_date + relativedelta(months=1)

            Installment.objects.create(
                lease=self,
                amount=installment_amount,
                due_date=due_date,
                type=self.installment_type,
            )

            current_date = due_date

    def generate_utilities(self):
        """
        Generate utility records based on lease terms
        Deletes existing non-paid utilities and recreates
        """
        from tenants.models import Utility  # Avoid circular import if needed

        paid_utilities = (
            self.utilities.filter(status="paid", type="weekly").count() // 4
            + self.utilities.filter(status="paid", type="monthly").count()
        )
        last_paid_utility = self.utilities.filter(status="paid").last()
        if last_paid_utility and last_paid_utility.due_date:
            start_date = last_paid_utility.due_date + relativedelta(months=1)
        else:
            start_date = self.start_date
        lease_months = self.lease_months - paid_utilities
        self.utilities.filter(status="pending").delete()
        if self.installment_type == "weekly":
            num_utilities = lease_months * 4
        else:
            num_utilities = lease_months
        # utility_amount is stored as weekly fee in property, so multiply by 4 for monthly
        weekly_utility_amount = self.property_obj.utility_amount
        utility_amount = weekly_utility_amount * 4 if self.installment_type == "monthly" else weekly_utility_amount
        current_date = start_date
        for i in range(num_utilities):
            if self.installment_type == "weekly":
                due_date = current_date + relativedelta(weeks=1)
            else:
                due_date = current_date + relativedelta(months=1)
            Utility.objects.create(
                lease=self,
                amount=utility_amount,
                due_date=due_date,
                type=self.installment_type,
            )
            current_date = due_date

    def change_installment_type(self, new_type):
        """
        Method to change installment type and regenerate installments and utilities
        """
        self.installment_type = new_type
        self.save()  # This will trigger generate_installments and generate_utilities


class Installment(models.Model):
    INSTALLMENT_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("paid", "Paid"),
        ("overdue", "Overdue"),
    ]
    TYPE_CHOICES = [("weekly", "Weekly"), ("monthly", "Monthly")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    lease = models.ForeignKey(
        Lease, on_delete=models.CASCADE, related_name="installments"
    )

    amount = models.DecimalField(max_digits=10, decimal_places=2)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default="monthly")

    status = models.CharField(
        max_length=20, choices=INSTALLMENT_STATUS_CHOICES, default="pending"
    )

    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["due_date"]
        indexes = [
            models.Index(fields=["lease", "due_date", "status"]),
        ]

    def __str__(self):
        return f"{self.lease} - {self.get_status_display()} - Due: {self.due_date}"


class Utility(models.Model):
    UTILITY_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("paid", "Paid"),
        ("pending_verification", "Pending Verification"),
        ("overdue", "Overdue"),
    ]
    TYPE_CHOICES = [("weekly", "Weekly"), ("monthly", "Monthly")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    lease = models.ForeignKey(
        Lease, on_delete=models.CASCADE, related_name="utilities"
    )

    amount = models.DecimalField(max_digits=10, decimal_places=2)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default="monthly")

    status = models.CharField(
        max_length=20, choices=UTILITY_STATUS_CHOICES, default="pending"
    )

    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["due_date"]
        indexes = [
            models.Index(fields=["lease", "due_date", "status"]),
        ]

    def __str__(self):
        return f"{self.lease} - {self.get_status_display()} - Due: {self.due_date}"

class Payment(models.Model):
    PAYMENT_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("success", "Successful"),
        ("failed", "Failed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    utility = models.ForeignKey(
        Utility, on_delete=models.CASCADE, related_name="payment_attempts", null=True, blank=True
    )
    installement = models.ForeignKey(
        Installment, on_delete=models.CASCADE, related_name="payment_attempts", null=True, blank=True
    )

    amount = models.DecimalField(max_digits=10, decimal_places=2)

    status = models.CharField(
        max_length=20, choices=PAYMENT_STATUS_CHOICES, default="pending"
    )

    

    # Stripe-related fields
    stripe_payment_intent_id = models.CharField(max_length=255, null=True, blank=True)
    stripe_charge_id = models.CharField(max_length=255, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    reciept_file = models.FileField(upload_to='payment_receipts/', null=True, blank=True)

    def save(self, *args, **kwargs):
        # If payment is successful, mark utility as paid
        if self.status == "success":
            self.utility.status = "paid"
            self.utility.paid_date = timezone.now().date()
            self.utility.save()

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Payment for {self.utility} - {self.get_status_display()}"


class MaintenanceRequest(models.Model):
    status_choices = [
        ("pending", "Pending"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("confirmed", "Confirmed"),
    ]
    priority_choices = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
    ]

    lease = models.ForeignKey(
        Lease, on_delete=models.CASCADE, related_name="maintenance_requests"
    )
    issue_title = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    priority = models.CharField(max_length=20, default="normal")
    description = models.TextField()

    status = models.CharField(max_length=20, default="pending", choices=status_choices)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Maintenance Request for {self.lease}"


class MaintenanceRequestImage(models.Model):
    maintenance_request = models.ForeignKey(
        MaintenanceRequest, on_delete=models.CASCADE, related_name="images"
    )
    image = models.ImageField(upload_to="maintenance_requests/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.maintenance_request.issue_title}"


class Inspection(models.Model):
    status_choices = [
        ("scheduled", "Scheduled"),
        ("completed", "Completed"),
        ("canceled", "Canceled"),
    ]

    lease = models.ForeignKey(
        Lease, on_delete=models.CASCADE, related_name="inspections"
    )

    inspection_date = models.DateField()
    notes = models.TextField(null=True, blank=True)
    status = models.CharField(
        max_length=20, choices=status_choices, default="scheduled"
    )
    type = models.CharField(max_length=20, default="Routine")
    date = models.DateField(null=True, blank=True)
    time = models.TimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Inspection for {self.lease} on {self.inspection_date}"


class Inquiries(models.Model):
    STATUS_CHOICES = [
        ("under_discussion", "Under Discussion"),
        ("resolved", "Resolved"),
        ("closed", "Closed"),
    ]

    property = models.ForeignKey(
        Property, on_delete=models.CASCADE, related_name="inquiries"
    )
    tenant = models.ForeignKey(User, on_delete=models.CASCADE, related_name="inquiries")

    subject = models.CharField(max_length=255,blank=True,null=True)
    chat = models.JSONField(null=True, blank=True)
    status = models.CharField(max_length=20, default="under_discussion", choices=STATUS_CHOICES)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def delete(self, *args, **kwargs):
        """
        Override delete to conditionally handle form deletion based on lease existence.
        If leases exist for this inquiry, preserve the forms by setting inquiry to null.
        If no leases exist, delete the forms along with the inquiry.
        """
        # Check if any leases are linked to this inquiry
        has_leases = self.leases_created.exists()
        
        if has_leases:
            # Leases exist - preserve forms by setting inquiry reference to null
            # This prevents cascade deletion of ApplicationForm and related forms
            self.application_forms.all().update(inquiry=None)
        else:
            # No leases exist - allow normal cascade deletion of forms
            # ApplicationForm will be deleted due to its own relationships
            pass
        
        # Proceed with normal deletion
        super().delete(*args, **kwargs)

    def __str__(self):
        return f"Inquiry for {self.property} - {self.subject}"


class Report(models.Model):
    status_choices = [
        ("pending", "Pending"),
        ("resolved", "Resolved"),
    ]

    property = models.ForeignKey(
        Property, on_delete=models.CASCADE, related_name="reports"
    )
    tenant = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reports")

    status = models.CharField(max_length=20, choices=status_choices, default="pending")
    description = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Report for {self.property}"


class Document(models.Model):
    DOCUMENT_TYPES = [
        ("proof_of_income", "Proof of Income"),
        ("bank_statement", "Bank Statement"),
        ("employment_letter", "Employment Letter"),
        ("reference_letter", "Reference Letter"),
        ("identification", "Identification"),
        ("utility_bill", "Utility Bill"),
        ("other", "Other"),
    ]

    lease = models.ForeignKey(Lease, on_delete=models.CASCADE, related_name="documents")
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPES)
    file = models.FileField(upload_to="documents/")
    notes = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"{self.get_document_type_display()} - {self.lease.tenant.username}"



class DirectDebitBase(models.Model):
    """Abstract base for direct debit records."""
    STATUS_PENDING = "pending"
    STATUS_CONFIGURED = "configured"
    STATUS_CONFIRMED = "confirmed"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_CONFIGURED, "Payment Configured"),
        (STATUS_CONFIRMED, "Confirmed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default=STATUS_PENDING)
    proof_file = models.FileField(upload_to="direct_debit_proofs/", null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class DirectDebitUtility(DirectDebitBase):
    """Direct-debit setup for utilities. Linked to a lease via Lease.direct_debit_utility."""
    def __str__(self):
        return f"DirectDebitUtility {self.id} - {self.get_status_display()}"


class DirectDebitInstallment(DirectDebitBase):
    """Direct-debit setup for installments. Linked to a lease via Lease.direct_debit_installment."""
    def __str__(self):
        return f"DirectDebitInstallment {self.id} - {self.get_status_display()}"



