from django.contrib import admin
from .models import Property, University, PropertyImage, SystemSettings
from .location_utils import LocationHelper

# Register your models here.


class SystemSettingsAdmin(admin.ModelAdmin):
    list_display = ("setting_key", "setting_value", "description", "updated_at")
    list_filter = ("setting_value",)
    search_fields = ("setting_key", "description")
    readonly_fields = ("created_at", "updated_at")
    
    def has_delete_permission(self, request, obj=None):
        # Prevent deletion of critical system settings
        if obj and obj.setting_key == "auto_approve_properties":
            return False
        return super().has_delete_permission(request, obj)


class UniversityAdmin(admin.ModelAdmin):
    list_display = ("id", "name")


class PropertyImageAdmin(admin.ModelAdmin):
    list_display = ("id", "property", "image")



class PropertyAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "get_city_name",
        "get_area_name",
        "land_lord",
        "address",
        "price",
    )
    
    list_filter = ("status", "city_index")
    search_fields = ("name", "address", "land_lord__username")
    
    def get_city_name(self, obj):
        """Display city name instead of index."""
        return LocationHelper.get_city_name(obj.city_index)
    get_city_name.short_description = "City"
    
    def get_area_name(self, obj):
        """Display area name instead of index."""
        return LocationHelper.get_area_name(obj.city_index, obj.area_index)
    get_area_name.short_description = "Area"


admin.site.register(Property, PropertyAdmin)
admin.site.register(University, UniversityAdmin)
admin.site.register(PropertyImage, PropertyImageAdmin)
admin.site.register(SystemSettings, SystemSettingsAdmin)
