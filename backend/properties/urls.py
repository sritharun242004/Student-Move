from django.urls import path
from .views import (
    PropertyViewSet,
    ApprovePropertyViewSet,
    PropertyImageViewSet,
    FlagPropertyViewSet,
    FeaturePropertyViewSet,
    PropertyListPublicAPIView,
    LandlordPropertiesAPIView,
    SystemSettingsAPIView,
    SystemSettingsUpdateAPIView,
)

urlpatterns = [
    path(
        "",
        PropertyViewSet.as_view(
            {
                "post": "create",
                "get": "list",
            }
        ),
        name="property-list",
    ),
    path(
        "all/",
        PropertyListPublicAPIView.as_view(),
        name="property-list-public",
    ),
    path(
        "pending/",
        PropertyViewSet.as_view(
            {
                "get": "pending",
            }
        ),
        name="pending-list-admin",
    ),
    path(
        "flagged/",
        PropertyViewSet.as_view(
            {
                "get": "flagged",
            }
        ),
        name="flagged-list-admin",
    ),
    path(
        "landlord/<int:landlord_id>/",
        LandlordPropertiesAPIView.as_view(),
        name="landlord-properties",
    ),
    path(
        "<int:pk>/",
        PropertyViewSet.as_view(
            {
                "delete": "destroy",
                "put": "update",
                "patch": "partial_update",
                "get": "retrieve",
            }
        ),
        name="property",
    ),
    path(
        "<int:pk>/approve/",
        ApprovePropertyViewSet.as_view(),
        name="property-approve",
    ),
    path(
        "<int:pk>/flag/",
        FlagPropertyViewSet.as_view(),
        name="property-flag",
    ),
    path(
        "<int:pk>/featured/",
        FeaturePropertyViewSet.as_view(),
        name="property-featured",
    ),
    path(
        "images/<int:property_id>/",
        PropertyImageViewSet.as_view(
            {
                "post": "create",
                "put": "update",
                "get": "list",
            }
        ),
        name="property-image",
    ),
    path(
        "settings/<str:setting_key>/",
        SystemSettingsAPIView.as_view(),
        name="system-settings",
    ),
    path(
        "settings/<str:setting_key>/update/",
        SystemSettingsUpdateAPIView.as_view(),
        name="system-settings-update",
    ),
]
