from django.apps import apps
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.db.models.signals import post_migrate
from django.dispatch import receiver
from tenants.models import (
    Lease,
    Payment,
    Installment,
    MaintenanceRequest,
    Inspection,
    Inquiries,
    MaintenanceRequestImage,
    Report,
    Utility
)


@receiver(post_migrate)
def assign_permissions(sender, **kwargs):
    # Define the models for which you want to assign permissions
    models = [
        Lease,
        Payment,
        Installment,
        MaintenanceRequest,
        Inspection,
        Inquiries,
        MaintenanceRequestImage,
        Report,
        Utility
    ]

    try:
        # Get the specific groups
        landlord_group = Group.objects.get(name="landlord")
        tenant_group = Group.objects.get(name="tenant")
        agent_group = Group.objects.get(name="agent")

        # List of groups to receive permissions
        allowed_groups = [tenant_group, landlord_group, agent_group]

        for model in models:
            # Get the permissions for the model
            content_type = ContentType.objects.get_for_model(model)
            permissions = Permission.objects.filter(content_type=content_type)

            # Assign the permissions to tenant, landlord, and agent groups
            for group in allowed_groups:
                for permission in permissions:
                    group.permissions.add(permission)

    except Group.DoesNotExist:
        print("One or more required groups (landlord, tenant, agent) do not exist.")
    except Exception as e:
        print(f"An error occurred while assigning permissions: {e}")
