from django.contrib import admin
from .models import Profile, AgentLandlordRelationship


class ProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user")


class AgentLandlordRelationshipAdmin(admin.ModelAdmin):
    list_display = ("id", "agent", "landlord", "status", "created_at", "removed_at")
    list_filter = ("status", "created_at", "removed_at", "removed_by")
    search_fields = ("agent__email", "landlord__email")
    readonly_fields = ("created_at", "removed_at")


admin.site.register(Profile, ProfileAdmin)
admin.site.register(AgentLandlordRelationship, AgentLandlordRelationshipAdmin)

