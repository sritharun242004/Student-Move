from django.urls import path
from .views import (
    ApplicationFormViewSet,
    StudentDetailsViewSet,
    EmployeeDetailsViewSet,
    ParentDetailsViewSet,
    PreviousLandlordViewSet,
    GuaranterFormViewSet,
    AgreementFormViewSet,
    OtpTokenApiView,
    InviteViewSet,
    SignApiView,
    AddTenantSignApiView,
    ViewFormApiview,
    GuarantorShareTokenViewSet,
    SharedGuarantorFormViewSet,
    CreateGuarantorShareTokenView,
    LeaseFormDataViewSet,
)


urlpatterns = [
    path(
        "application/<int:pk>/sign/",
        ApplicationFormViewSet.as_view({"put": "signature"}),
    ),
    path(
        "application/<int:pk>/add-nic/",
        ApplicationFormViewSet.as_view({"put": "nic"}),
    ),
    path(
        "application/<int:pk>/completed/",
        ApplicationFormViewSet.as_view({"patch": "mark_completed"}),
    ),
    # Guarantor share token URLs - placed before generic status pattern
    path(
        "application/<int:application_id>/share-token/",
        CreateGuarantorShareTokenView.as_view(),
        name="guarantor-share-token"
    ),
    path(
        "application/<int:pk>/<str:status>/",
        ApplicationFormViewSet.as_view({"patch": "approve"}),
    ),
     
    path(
        "apply/<int:property_id>/",
        ApplicationFormViewSet.as_view({"get": "list", "post": "create"}),
        name="application-form",
    ),
     
    path(
        "applications/",
        ApplicationFormViewSet.as_view({"get": "list"}),
    ),
    path(
        "application/<int:pk>/",
        ApplicationFormViewSet.as_view({"get": "retrieve", "put": "update"}),
    ),
    
    path(
        "<int:form_id>/student/",
        StudentDetailsViewSet.as_view({"get": "retrieve", "post": "create"}),
        name="student-details",
    ),
    path(
        "<int:form_id>/employee/",
        EmployeeDetailsViewSet.as_view({"get": "retrieve", "post": "create"}),
        name="employee-details",
    ),
    path(
        "<int:form_id>/parent/",
        ParentDetailsViewSet.as_view({"get": "retrieve", "post": "create"}),
        name="parent-details",
    ),
    path(
        "<int:form_id>/landlord/",
        PreviousLandlordViewSet.as_view({"get": "retrieve", "post": "create"}),
        name="previous-landlord",
    ),
    path(
        "guarantor/add-details/",
        GuaranterFormViewSet.as_view({"get": "retrieve", "post": "add_guarantor"}),
        name="guarantor",
    ),
    path("<int:form_id>/guarantor/", GuaranterFormViewSet.as_view({"get": "retrieve"})),

    # Guarantor signature upload URLs
    path(
        "application/<int:form_id>/guarantor/signature/",
        GuaranterFormViewSet.as_view({"post": "upload_guarantor_signature"}),
        name="guarantor_signature",
    ),
    path(
        "application/<int:form_id>/guarantor/witness-signature/",
        GuaranterFormViewSet.as_view({"post": "upload_witness_signature"}),
        name="witness_signature",
    ),

    path(
        "<int:form_id>/guarantor/add-details/",
        GuaranterFormViewSet.as_view(
            {
                "post": "add_owner",
                "put": "update",
                "patch": "approve",
            }
        ),
        name="guarantor",
    ),
    path(
        "guarantor/<int:form_id>/completed/",
        GuaranterFormViewSet.as_view({"patch": "mark_completed"}),
        name="completed",
    ),
    path(
        "guarantor/<int:form_id>/<str:status>/",
        GuaranterFormViewSet.as_view({"patch": "approve"}),
        name="approve",
    ),
    path(
        "agreement/add-details",
        AgreementFormViewSet.as_view({ "get":"retrieve","post": "add_guarantor"}),
        name="agreement",
    ),
    path(
        "<int:form_id>/agreement/",
        AgreementFormViewSet.as_view({"get": "retrieve"}),
        name="agreement",
    ),
    path(
        "<int:form_id>/agreement/add-details",
        AgreementFormViewSet.as_view(
            { "post": "add_owner", "put": "add_owner", "patch": "add_owner"}
        ),
        name="agreement",
    ),
    path(
        "<int:form_id>/agreement/completed",
        AgreementFormViewSet.as_view(
            { "patch": "mark_completed"}
        ),
        name="agreement",
    ),
    path(
        "<int:form_id>/agreement/status",
        AgreementFormViewSet.as_view(
            { "get": "get_status"}
        ),
        name="agreement-status",
    ),
    path(
        "<int:form_id>/agreement/tenant-signatures/",
        AgreementFormViewSet.as_view(
            { "get": "get_tenant_signatures"}
        ),
        name="agreement-tenant-signatures",
    ),
    path(
        "<int:form_id>/agreement/tenant-signatures-1/",
        AgreementFormViewSet.as_view(
            { "get": "get_tenant_signatures_1"}
        ),
        name="agreement-tenant-signatures-1",
    ),
    # Agreement signature upload URLs
    path(
        "<int:form_id>/agreement/landlord-signature/",
        AgreementFormViewSet.as_view({"post": "upload_landlord_signature"}),
        name="agreement-landlord-signature",
    ),
    path(
        "<int:form_id>/agreement/landlord-signature-1/",
        AgreementFormViewSet.as_view({"post": "upload_landlord_signature_1"}),
        name="agreement-landlord-signature-1",
    ),
    path(
        "<int:form_id>/agreement/tenant-signature/",
        AgreementFormViewSet.as_view({"post": "upload_tenant_signature"}),
        name="agreement-tenant-signature",
    ),
    path(
        "<int:form_id>/agreement/tenant-signature-1/",
        AgreementFormViewSet.as_view({"post": "upload_tenant_signature_1"}),
        name="agreement-tenant-signature-1",
    ),
    path(
        "<int:form_id>/agreement/admin-signature/",
        AgreementFormViewSet.as_view({"post": "upload_admin_signature"}),
        name="agreement-admin-signature",
    ),
    path(
        "<int:form_id>/agreement/admin-signature-1/",
        AgreementFormViewSet.as_view({"post": "upload_admin_signature_1"}),
        name="agreement-admin-signature-1",
    ),
    path(
        "agreements/pending-admin-signature/",
        AgreementFormViewSet.as_view({"get": "pending_admin_signature"}),
        name="pending-admin-signature",
    ),
    path("<int:form_id>/otp/validate/", OtpTokenApiView.as_view(), name="token"),
    path(
        "<int:form_id>/invite/",
        InviteViewSet.as_view({"post": "create","get":"list"}),
        name="invite",
    ),
    path(
        "sign/",
        SignApiView.as_view(),
        name="sign",
    ),
    path(
        "view/",
        ViewFormApiview.as_view(),
        name="view-form",
    ),
    path(
        "<int:form_id>/add-tenant/", AddTenantSignApiView.as_view(), name="add-tenant"
    ),
    
    path(
        "share-token/<int:pk>/deactivate/",
        GuarantorShareTokenViewSet.as_view({"delete": "destroy"}),
        name="deactivate-share-token"
    ),
    
    # Shared guarantor form URLs (accessed via token)
    path(
        "shared/guarantor/",
        SharedGuarantorFormViewSet.as_view({
            "get": "retrieve",
            "post": "create"
        }),
        name="shared-guarantor-form"
    ),
    # Lease-based form data retrieval endpoints (read-only)
    path(
        "lease/<int:lease_id>/application/",
        LeaseFormDataViewSet.as_view({"get": "retrieve_application_form"}),
        name="lease-application-form"
    ),
    path(
        "lease/<int:lease_id>/guarantor/",
        LeaseFormDataViewSet.as_view({"get": "retrieve_guarantor_form"}),
        name="lease-guarantor-form"
    ),
    path(
        "lease/<int:lease_id>/agreement/",
        LeaseFormDataViewSet.as_view({"get": "retrieve_agreement_form"}),
        name="lease-agreement-form"
    ),
]
