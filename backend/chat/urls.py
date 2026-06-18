from django.urls import path
from .views import NotificationViewSet, ChatThreadViewSet, MessageViewSet

urlpatterns = [
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
        "notifications/<int:pk>/mark-as-seen/",
        NotificationViewSet.as_view({"post": "mark_as_seen"}),
        name="notification-mark-as-seen",
    ),
    path(
        "notifications/mark-all-as-seen/",
        NotificationViewSet.as_view({"post": "mark_all_as_seen"}),
        name="notification-mark-all-as-seen",
    ),
    path(
        "notifications/unread-count/",
        NotificationViewSet.as_view({"get": "unread_count"}),
        name="notification-unread-count",
    ),
    path(
        "thread/<int:pk>/",
        ChatThreadViewSet.as_view({"get": "retrieve"}),
        name="thread-detail",
    ),
    path(
        "thread/all/",
        ChatThreadViewSet.as_view(
            {
                "get": "list",
            }
        ),
        name="thread-with-admin",
    ),
    path(
        "thread/",
        ChatThreadViewSet.as_view(
            {
                "get": "retrieve",
            }
        ),
        name="thread-with-admin",
    ),
    path(
        "thread/<int:thread_id>/add-message/",
        MessageViewSet.as_view({"post": "create", "get": "list"}),
        name="add-message",
    ),
    path(
        "thread/<int:thread_id>/mark-as-read/",
        MessageViewSet.as_view({"patch": "mark_thread_read"}),
        name="add-message",
    ),
]
