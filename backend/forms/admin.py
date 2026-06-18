from django.contrib import admin
from forms.models import (
    ApplicationForm,
    StudentDetails,
    AgreementForm,
    EmployeeDetails,
    ParentDetails,
    PreviousLandlord,
    Otp,
    GuarantorForm,
    AgreementForm,
)


class ApplicationFormAdmin(admin.ModelAdmin):
    list_display = ("id","user", "property")


class StudentDetailsAdmin(admin.ModelAdmin):
    list_display = ("application", "university")


class EmployeeDetailsAdmin(admin.ModelAdmin):
    list_display = ("application", "employer")


class ParentDetailsAdmin(admin.ModelAdmin):
    list_display = ("application", "name")


class PreviousLandlordAdmin(admin.ModelAdmin):
    list_display = ("application", "name")


class OtpAdmin(admin.ModelAdmin):
    list_display = ("id","otp", "form", "role")


class GuarangerAdmin(admin.ModelAdmin):
    list_display = ("id", "application")

class AgreementFormAdmin(admin.ModelAdmin):
    list_display = ('get_user', 'get_property', 'date', 'agent', 'amount', 'completed')

    # Method to get the related 'user' field from ApplicationForm
    def get_user(self, obj):
        return obj.application.user  # Assuming 'user' is a field in ApplicationForm

    # Method to get the related 'property' field from ApplicationForm
    def get_property(self, obj):
        return obj.application.property  # Assuming 'property' is a field in ApplicationForm

    # Set the column names in the admin display
    get_user.short_description = 'User'
    get_property.short_description = 'Property'
    
admin.site.register(ApplicationForm, ApplicationFormAdmin)
admin.site.register(StudentDetails, StudentDetailsAdmin)
admin.site.register(EmployeeDetails, EmployeeDetailsAdmin)
admin.site.register(ParentDetails, ParentDetailsAdmin)
admin.site.register(PreviousLandlord, PreviousLandlordAdmin)
admin.site.register(Otp, OtpAdmin)
admin.site.register(GuarantorForm, GuarangerAdmin)
admin.site.register(AgreementForm, AgreementFormAdmin)