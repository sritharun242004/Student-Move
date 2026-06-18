from django.urls import path
from .views import (
    LeaseViewSet,
    MaintananceRequestViewSet,
    InspectionViewSet,
    InspectionStatusUpdateViewSet,
    InspectionScheduleUpdateViewSet,
    InquiriesViewSet,
    RespondToInquiryViewSet,
    ChangeInstallementType,
    InstallmentViewSet,
    LeaseCloseViewSet,
    ApproveLeaseViewSet,
    ReportPropertyViewSet,
    PropertyReportResolveViewSet,
    DocumentUploadView,
    DocumentListView,
    DocumentDownloadView,
    DocumentDeleteView,
    UtilityViewSet,
    DirectDebitUtilityViewSet,
    DirectDebitInstallmentViewSet,
)
from .report_views import LandlordLeaseReportView
from .dashboard_views import landlord_dashboard_stats
from .debug_views import debug_relationships, create_test_relationship
from .paymentview import InitPaymentView, stripe_webhook, VerifyPaymentView ,PayementListView,ManualPaymentView,VerifyManualPaymentView,PaymentsByLeaseView,RentPaymentHistoryView

urlpatterns = [
    path(
        "requests/",
        LeaseViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="tenantrequest-list",
    ),
    path(
        "requests/<int:pk>/",
        LeaseViewSet.as_view(
            {
                "get": "retrieve",
                "delete": "destroy",
            }
        ),
        name="tenantrequest-detail",
    ),
    path(
        "requests/active/",
        LeaseViewSet.as_view(
            {
                "get": "get_active_lease",
            }
        ),
        name="tenantrequest-detail",
    ),
    path(
        "requests/<int:pk>/close/",
        LeaseCloseViewSet.as_view(),
        name="lease-close",
    ),
    path(
        "requests/<int:pk>/approve/",
        ApproveLeaseViewSet.as_view(),
        name="lease-approve",
    ),
    path(
        "maintanance-requests/",
        MaintananceRequestViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="maintanance-request-list",
    ),
    path(
        "maintanance-requests/<int:pk>/",
        MaintananceRequestViewSet.as_view({"delete": "destroy", "put": "update"}),
        name="maintanance-request-detail",
    ),
    path(
        "maintanance-requests/<int:lease_id>/",
        MaintananceRequestViewSet.as_view(
            {
                "get": "filter_by_lease",
            }
        ),
        name="maintainence-list",
    ),
    path(
        "maintanance-requests/<int:pk>/update-status/<str:status>/",
        MaintananceRequestViewSet.as_view(
            {
                "patch": "update_status",
            }
        ),
        name="maintanance-request-update-status",
    ),
    path(
        "inspections/",
        InspectionViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="inspection-list",
    ),
    path(
        "inspections/<int:pk>/",
        InspectionViewSet.as_view(
            {
                "delete": "destroy",
            }
        ),
        name="inspection-detail",
    ),
    path(
        "inspections/<int:pk>/update-status/",
        InspectionStatusUpdateViewSet.as_view(),
        name="inspection-update-status",
    ),
    path(
        "inspections/<int:pk>/update-schedule/",
        InspectionScheduleUpdateViewSet.as_view(),
        name="inspection-update-schedule",
    ),
    path(
        "inquiries/",
        InquiriesViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="inquiries-list",
    ),
    path(
        "inquiries/<int:pk>/",
        InquiriesViewSet.as_view(
            {
                "get": "retrieve",
                "delete": "destroy",
                "put": "update",
            }
        ),
        name="inquiries-detail",
    ),
    path(
        "inquiries/<int:pk>/resolve/",
        InquiriesViewSet.as_view(
            {
                "patch": "resolve",
            }
        ),
        name="inquiries-resolve",
    ),
    path(
        "change-installement-type/<int:pk>/",
        ChangeInstallementType.as_view(),
        name="change-installement-type",
    ),
    path(
        "installments-list/<int:lease_id>/",
        InstallmentViewSet.as_view(
            {
                "get": "list",
            }
        ),
        name="installment-list",
    ),
    path(
        "installments/<str:pk>/",
        InstallmentViewSet.as_view(
            {
                "get": "retrieve",
                "delete": "destroy",
                "patch": "partial_update",
            }
        ),
        name="installment-detail",
    ),
    path(
        "inspection-list/<int:lease_id>/",
        InspectionViewSet.as_view(
            {
                "get": "filter_by_lease",
            }
        ),
        name="inspection-list",
    ),
    path(
        "inquiries-list/<int:property_id>/",
        InquiriesViewSet.as_view(
            {
                "get": "filter_by_property",
            }
        ),
        name="inquiries-list",
    ),
    path(
        "payments/init/",
        InitPaymentView.as_view(),
        name="init-payment",
    ),
    path(
        "payments/webhook/",
        stripe_webhook,
        name="stripe-webhook",
    ),
    path(
        "report-property/",
        ReportPropertyViewSet.as_view(
            {
                "post": "create",
                "get": "list",
            }
        ),
        name="report-property",
    ),
    path(
        "report-property/<int:pk>/",
        ReportPropertyViewSet.as_view(
            {
                "get": "retrieve",
            }
        ),
        name="report-property-detail",
    ),
    path(
        "report-property/<int:pk>/resolve/",
        PropertyReportResolveViewSet.as_view(),
        name="report-property-resolve",
    ),
        path(
        "payments/manual/verify/<str:pk>/",
        VerifyManualPaymentView.as_view(),
        name="verify-manual-payment",
    ),
    path(
        "payments/manual/record/<str:pk>/",
        ManualPaymentView.as_view(),
        name="record-manual-payment",
    ),

    path(
        "payments/list/",
        PayementListView.as_view(),
        name="payment-list",
    ),
    path(
        "payments/lease/<int:lease_id>/",
        PaymentsByLeaseView.as_view(),
        name="payment-by-lease",
    ),
    path(
        "payments/lease/<int:lease_id>/rent-history/",
        RentPaymentHistoryView.as_view(),
        name="rent-payment-history",
    ),
    path(
    "payments/<str:id>/verify/",
    VerifyPaymentView.as_view(),
    name="verify-payment-status",
),
    path(
        "requests/report/download/",
        LandlordLeaseReportView.as_view(),
        name="landlord-lease-report",
    ),
    path(
        "dashboard/stats/",
        landlord_dashboard_stats,
        name="landlord-dashboard-stats",
    ),
    path(
        "upload-document/",
        DocumentUploadView.as_view(),
        name="document-upload",
    ),
    path(
        "documents/",
        DocumentListView.as_view(),
        name="document-list",
    ),
    path(
        "documents/<int:lease_id>/",
        DocumentListView.as_view(),
        name="document-list-by-lease",
    ),
    path(
        "documents/download/<int:document_id>/",
        DocumentDownloadView.as_view(),
        name="document-download",
    ),
    path(
        "documents/delete/<int:document_id>/",
        DocumentDeleteView.as_view(),
        name="document-delete",
    ),
    path(
        "utilities-list/<int:lease_id>/",
        UtilityViewSet.as_view({"get": "list"}),
        name="utility-list",
    ),
    path(
        "utilities/<str:pk>/",
        UtilityViewSet.as_view({
            "get": "retrieve",
            "delete": "destroy",
            "patch": "partial_update",
        }),
        name="utility-detail",
    ),
    path(
        "direct-debit-utility/<int:lease_id>/",
        DirectDebitUtilityViewSet.as_view({"get": "list", "patch": "create_or_update"}),
        name="direct-debit-utility-list",
    ),
    path(
        "direct-debit-utility/<str:pk>/",
        DirectDebitUtilityViewSet.as_view({
            "get": "retrieve",
            "delete": "destroy",
            "patch": "partial_update",
            "post": "create",
        }),
        name="direct-debit-utility-detail",
    ),
    path(
        "direct-debit-installment/<int:lease_id>/",
        DirectDebitInstallmentViewSet.as_view({"get": "list", "patch": "create_or_update"}),
        name="direct-debit-installment-list",
    ),
    path(
        "direct-debit-installment/<str:pk>/",
        DirectDebitInstallmentViewSet.as_view({
            "get": "retrieve",
            "delete": "destroy",
            "patch": "partial_update",
            "post": "create",
        }),
        name="direct-debit-installment-detail",
    ),
    
    # Debug endpoints (for development only)
    path(
        "debug/relationships/",
        debug_relationships,
        name="debug-relationships",
    ),
    path(
        "debug/create-relationship/",
        create_test_relationship,
        name="create-test-relationship",
    ),

]
