from django.db import models


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
