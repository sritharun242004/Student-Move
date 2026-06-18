from django.urls import path
from .views import NotificationViewSet, NotificationPreferenceViewSet

urlpatterns = [
    # Notifications
    path(
        "notifications/",
        NotificationViewSet.as_view({"get": "list"}),
        name="notification-list",
    ),
    path(
        "notifications/<int:pk>/",
        NotificationViewSet.as_view({"get": "retrieve"}),
        name="notification-detail",
    ),
    path(
        "notifications/<int:pk>/mark-as-read/",
        NotificationViewSet.as_view({"post": "mark_as_read"}),
        name="notification-mark-as-read",
    ),
    path(
        "notifications/mark-all-as-read/",
        NotificationViewSet.as_view({"post": "mark_all_as_read"}),
        name="notification-mark-all-as-read",
    ),
    path(
        "notifications/unread-count/",
        NotificationViewSet.as_view({"get": "unread_count"}),
        name="notification-unread-count",
    ),
    path(
        "notifications/summary/",
        NotificationViewSet.as_view({"get": "summary"}),
        name="notification-summary",
    ),
    path(
        "notifications/create/",
        NotificationViewSet.as_view({"post": "create_notification"}),
        name="notification-create",
    ),
    path(
        "notifications/create-public/",
        NotificationViewSet.as_view({"post": "create_public_notification"}),
        name="notification-create-public",
    ),
    
    # Notification Preferences
    path(
        "notification-preferences/",
        NotificationPreferenceViewSet.as_view({"get": "list", "put": "update", "patch": "update"}),
        name="notification-preferences",
    ),
]
