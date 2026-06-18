from django.db import models
from django.contrib.auth.models import User


class SystemSettings(models.Model):
    """
    Model to store system-wide settings for property management
    """
    setting_key = models.CharField(max_length=100, unique=True)
    setting_value = models.BooleanField(default=False)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "System Setting"
        verbose_name_plural = "System Settings"

    def __str__(self):
        return f"{self.setting_key}: {self.setting_value}"

    @classmethod
    def get_setting(cls, key, default=False):
        """Get a setting value by key, return default if not found"""
        try:
            setting = cls.objects.get(setting_key=key)
            return setting.setting_value
        except cls.DoesNotExist:
            return default

    @classmethod
    def set_setting(cls, key, value, description=None):
        """Set or update a setting value"""
        setting, created = cls.objects.get_or_create(
            setting_key=key,
            defaults={'setting_value': value, 'description': description}
        )
        if not created:
            setting.setting_value = value
            if description:
                setting.description = description
            setting.save()
        return setting


class University(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name





class Property(models.Model):
    AVAILABLE = "available"
    RENTED_OUT = "rented_out"
    PENDING = "pending"
    FLAGGED = "flagged"

    STATUS_CHOICES = [
        (AVAILABLE, "Available"),
        (RENTED_OUT, "Rented Out"),
        (PENDING, "Pending"),
        (FLAGGED, "Flagged"),
    ]
    EPC_RATING_CHOICES = [
        ("A", "A - Excellent"),
        ("B", "B - Very Good"),
        ("C", "C - Good"),
        ("D", "D - Average"),
        ("E", "E - Poor"),
        ("F", "F - Very Poor"),
        ("G", "G - Extremely Poor"),
    ]

    city_index = models.IntegerField(help_text="Index of the city in the frontend locations array (0-based)")
    area_index = models.IntegerField(help_text="Index of the area within the selected city (0-based)")
    universities = models.ManyToManyField(University)
    rooms = models.IntegerField(default=0)
    bathrooms = models.IntegerField(default=0)
    available_after = models.DateField(blank=True, null=True)
    available_to = models.DateField(blank=True, null=True, help_text="Property available until date")
    price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Final price shown to users (including commission)")
    base_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, help_text="Agent's original price before commission")
    key_features = models.JSONField(blank=True, null=True)  # TODO: list strings
    additional_details = models.JSONField(blank=True, null=True)
    description = models.TextField()
    security_deposit = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True
    )
    holding_deposit = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True
    )
    epc_rating = models.CharField(
        max_length=1,
        choices=EPC_RATING_CHOICES,
        default="C",
    )
    zip_code = models.CharField(max_length=10, blank=True, null=True)
    bills_included = models.BooleanField(default=True, editable=False, help_text="Bills are always included")
    utility_amount = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True, default=30
    )

    land_lord = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100, blank=True, null=True)
    address = models.TextField()

    # Safety certificate date ranges
    gas_from_date = models.DateField(blank=True, null=True, help_text="Gas safety certificate start date")
    gas_to_date = models.DateField(blank=True, null=True, help_text="Gas safety certificate expiry date")
    electric_from_date = models.DateField(blank=True, null=True, help_text="Electrical safety certificate start date")
    electric_to_date = models.DateField(blank=True, null=True, help_text="Electrical safety certificate expiry date")

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=PENDING,
    )

    # Google Maps API Location
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, blank=True, null=True
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, blank=True, null=True
    )
    location_url = models.URLField(blank=True, null=True)

    is_featured = models.BooleanField(default=False, help_text="Mark property as featured")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def calculate_commission_price(self, base_price=None):
        """
        Calculate the final price including commission for agent-created landlords
        """
        if base_price is None:
            base_price = self.base_price or self.price
        
        # Check if this property belongs to an agent-created landlord
        if (hasattr(self.land_lord, 'profile') and 
            hasattr(self.land_lord.profile, 'created_by_agent') and 
            self.land_lord.profile.created_by_agent and
            hasattr(self.land_lord.profile, 'commission_rate') and 
            self.land_lord.profile.commission_rate):
            
            commission_rate = self.land_lord.profile.commission_rate / 100  # Convert percentage to decimal
            final_price = base_price * (1 + commission_rate)
            return round(final_price, 2)
        
        return base_price
    
    def save(self, *args, **kwargs):
        """
        Override save to automatically calculate commission price
        """
        # If base_price is set and this is an agent-created landlord property, calculate commission
        if (self.base_price and 
            hasattr(self.land_lord, 'profile') and 
            hasattr(self.land_lord.profile, 'created_by_agent') and 
            self.land_lord.profile.created_by_agent):
            self.price = self.calculate_commission_price(self.base_price)
        elif self.base_price and not self.price:
            # If no commission, set price equal to base_price
            self.price = self.base_price
        elif not self.base_price and self.price:
            # If base_price is not set, use price as base_price
            self.base_price = self.price
        
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class PropertyImage(models.Model):
    property = models.ForeignKey(
        Property, related_name="images", on_delete=models.CASCADE
    )
    image = models.ImageField(upload_to="properties/")

    def __str__(self):
        return f"Image for {self.property.name}"
