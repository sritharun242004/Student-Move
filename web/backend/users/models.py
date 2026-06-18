from django.db import models
from django.contrib.auth.models import User

# Create your models here.


class Profile(models.Model):
    status_choices = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('suspended', 'Suspended'),
        ('binned', 'Binned'),
        ('deleted', 'Deleted')
    ]

    CONTACT_METHOD_CHOICES = [
        ('email', 'Email'),
        ('phone', 'Phone'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    phone = models.CharField(max_length=12)
    status = models.CharField(max_length=10, choices=status_choices, default='active')
    bin_date = models.DateTimeField(blank=True, null=True, help_text="Date when user was moved to bin status")
    otp = models.CharField(max_length=6, blank=True, null=True)
    otp_expiry = models.DateTimeField(blank=True, null=True)
    
    # Landlord settings
    open_for_agents = models.BooleanField(default=True, help_text="Allow agents to select this landlord")
    
    # Additional fields for agent-created landlords (optional)
    company_name = models.CharField(max_length=255, blank=True, null=True, help_text="Company name for landlord")
    address = models.TextField(blank=True, null=True, help_text="Landlord address")
    bank_account_number = models.CharField(max_length=20, blank=True, null=True, help_text="Bank account number")
    sort_code = models.CharField(max_length=8, blank=True, null=True, help_text="Bank sort code")
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True, help_text="Commission rate percentage")
    preferred_contact_method = models.CharField(max_length=10, choices=CONTACT_METHOD_CHOICES, blank=True, null=True, help_text="Preferred contact method")
    notes = models.TextField(blank=True, null=True, help_text="Additional notes about the landlord")
    created_by_agent = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name='created_landlords', help_text="Agent who created this landlord")


class AgentLandlordRelationship(models.Model):
    status_choices = [
        ('active', 'Active'),  # Changed from pending/approved to just active 
        ('removed', 'Removed')  # Simplified - either active or removed
    ]

    agent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='landlord_relationships')
    landlord = models.ForeignKey(User, on_delete=models.CASCADE, related_name='agent_relationships')
    status = models.CharField(max_length=10, choices=status_choices, default='active')
    created_at = models.DateTimeField(auto_now_add=True)  # When agent selected landlord
    removed_at = models.DateTimeField(blank=True, null=True)  # When relationship was removed
    removed_by = models.CharField(max_length=10, choices=[('agent', 'Agent'), ('landlord', 'Landlord')], blank=True, null=True)

    class Meta:
        unique_together = ('agent', 'landlord')

    def __str__(self):
        return f"{self.agent.email} -> {self.landlord.email} ({self.status})"

    


