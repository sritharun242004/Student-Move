from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.groups.filter(name="admin").exists()


class IsAdminOrLandlord(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and (
            request.user.groups.filter(name="admin").exists()
            or request.user.groups.filter(name="landlord").exists()
        )


class IsAdminOrLandlordOrAgent(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and (
            request.user.groups.filter(name="admin").exists()
            or request.user.groups.filter(name="landlord").exists()
            or request.user.groups.filter(name="agent").exists()
        )


class IsAgent(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.groups.filter(name="agent").exists()
