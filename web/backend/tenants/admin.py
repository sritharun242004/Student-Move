from django.contrib import admin

# Register your models here.
from .models import (
    Lease,
    Installment,
    MaintenanceRequest,
    Inspection,
    Inquiries,
    MaintenanceRequestImage,
    Report,
    Document,
    Payment,
    Utility,
)

# Register your models here.


class LeaseAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "tenant",
        "property_obj",
        "status",
        "start_date",
        "end_date",
    )  # Add the fields you want to display


class InstallmentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "lease",
        "amount",
        "due_date",
    )  # Add the fields you want to display


class MaintenanceRequestAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "lease",
        "description",
        "status",
        "created_at",
    )  # Add the fields you want to display


class InspectionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "lease",
        "notes",
        "status",
        "created_at",
    )  # Add the fields you want to display


class InquiriesAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "property",
        "subject",
        "status",
        "created_at",
    )  # Add the fields you want to display


class MaintenanceRequestImageAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "maintenance_request",
        "image",
        "uploaded_at",
    )  # Add the fields you want to display


class ReportAdmin(admin.ModelAdmin):
    list_display = ("property", "tenant", "status", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("property__name", "tenant__username", "description")


class DocumentAdmin(admin.ModelAdmin):
    list_display = ("lease", "document_type", "file", "uploaded_at")
    list_filter = ("document_type", "uploaded_at")
    search_fields = ("lease__tenant__username", "lease__property_obj__name", "notes")
    readonly_fields = ("uploaded_at",)


class PaymentAdmin(admin.ModelAdmin):
    list_display = ("id","status")

class UtilityAdmin(admin.ModelAdmin):
    list_display = ("id","lease","amount","due_date","status")



admin.site.register(Lease, LeaseAdmin)
admin.site.register(Installment, InstallmentAdmin)
admin.site.register(MaintenanceRequest, MaintenanceRequestAdmin)
admin.site.register(Inspection, InspectionAdmin)
admin.site.register(Inquiries, InquiriesAdmin)
admin.site.register(MaintenanceRequestImage, MaintenanceRequestImageAdmin)
admin.site.register(Report, ReportAdmin)
admin.site.register(Document, DocumentAdmin)
admin.site.register(Payment,PaymentAdmin)
admin.site.register(Utility,UtilityAdmin)
