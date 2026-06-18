from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    UserRegistrationApiView,
    UserLoginApiView,
    UserProfileViewSet,
    dashboard_stats,
    download_monthly_report,
    PasswordResetView,
    UpdatePasswordViewWithOTP,
    UpdatePasswordViewWithToken,
    AgentLandlordViewSet,
    LandlordListView,
    ApprovedLandlordsView,
    AvailableLandlordsView,
    AgentLandlordManagementViewSet,
)

urlpatterns = [
    path("register/", UserRegistrationApiView.as_view(), name="user-registration"),
    path("login/", UserLoginApiView.as_view(), name="user-login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("profile/<int:pk>/", UserProfileViewSet.as_view({"get": "retrieve_profile"}), name="user-profile"),
    path("dashboard/stats/", dashboard_stats, name="dashboard-stats"),
    path(
        "dashboard/report/download/",
        download_monthly_report,
        name="download-monthly-report",
    ),
    path(
        "reset-password-otp/",
        PasswordResetView.as_view(),
        name="password-reset",
    ),
    path(
        "update-password-otp/",
        UpdatePasswordViewWithOTP.as_view(),
        name="update-password-otp",
    ),
    path(
        "update-password-token/",
        UpdatePasswordViewWithToken.as_view(),
        name="update-password-token",
    ),
    path(
        "profile/update/",
        UserProfileViewSet.as_view({"patch": "update_profile"}),
        name="user-profile-update",
    ),
    path(
        "profile/my-agent/",
        UserProfileViewSet.as_view({"get": "my_agent"}),
        name="landlord-current-agent",
    ),
    path(
        "profile/remove-agent/",
        UserProfileViewSet.as_view({"post": "remove_my_agent"}),
        name="landlord-remove-agent",
    ),
    path(
        "approve/<int:pk>/",
        UserProfileViewSet.as_view({"patch": "approve"}),
        name="user-approve",
    ),
    path(
        "suspend/<int:pk>/",
        UserProfileViewSet.as_view({"patch": "suspend"}),
        name="user-reject",
    ),
    path(
        "deactivate/",
        UserProfileViewSet.as_view({"put": "deactivate", "patch": "deactivate"}),
        name="user-deactivate",
    ),
    path(
        "<str:role>/",
        UserProfileViewSet.as_view({"get": "list"}),
        name="user-list",
    ),
    # Agent-Landlord relationship endpoints
    path(
        "agent/landlords/",
        LandlordListView.as_view(),
        name="landlord-list-for-agents",
    ),
    path(
        "agent/active-landlords/",
        ApprovedLandlordsView.as_view(),
        name="agent-active-landlords",
    ),
    path(
        "agent/available-landlords/",
        AvailableLandlordsView.as_view(),
        name="agent-available-landlords",
    ),
    path(
        "agent/relationships/",
        AgentLandlordViewSet.as_view({"get": "list", "post": "create"}),
        name="agent-relationships",
    ),
    path(
        "agent/relationships/<int:pk>/",
        AgentLandlordViewSet.as_view({"get": "retrieve"}),
        name="agent-relationship-detail",
    ),
    path(
        "agent/relationships/<int:pk>/remove/",
        AgentLandlordViewSet.as_view({"post": "remove_relationship"}),
        name="agent-relationship-remove",
    ),
    # Enhanced landlord management endpoints
    path(
        "landlord/<int:pk>/remove/",
        UserProfileViewSet.as_view({"delete": "remove_landlord"}),
        name="remove-landlord",
    ),
    path(
        "landlord/<int:pk>/restore/",
        UserProfileViewSet.as_view({"patch": "restore_landlord"}),
        name="restore-landlord",
    ),
    path(
        "landlord/<int:pk>/stats/",
        UserProfileViewSet.as_view({"get": "landlord_stats"}),
        name="landlord-stats",
    ),
    # Agent management endpoints
    path(
        "agent/<int:pk>/remove/",
        UserProfileViewSet.as_view({"delete": "remove_agent"}),
        name="remove-agent",
    ),
    path(
        "agent/<int:pk>/restore/",
        UserProfileViewSet.as_view({"patch": "restore_agent"}),
        name="restore-agent",
    ),
    path(
        "agent/<int:pk>/stats/",
        UserProfileViewSet.as_view({"get": "agent_stats"}),
        name="agent-stats",
    ),
    # Agent Landlord Management endpoints
    path(
        "agent/landlord-management/my-landlords/",
        AgentLandlordManagementViewSet.as_view({"get": "my_landlords"}),
        name="agent-my-landlords",
    ),
    path(
        "agent/landlord-management/create-landlord/",
        AgentLandlordManagementViewSet.as_view({"post": "create_landlord"}),
        name="agent-create-landlord",
    ),
    path(
        "agent/landlord-management/update-landlord/<int:pk>/",
        AgentLandlordManagementViewSet.as_view({"put": "update_landlord", "patch": "update_landlord"}),
        name="agent-update-landlord",
    ),
    path(
        "agent/landlord-management/available-landlords/",
        AgentLandlordManagementViewSet.as_view({"get": "available_landlords"}),
        name="agent-available-landlords",
    ),
]
