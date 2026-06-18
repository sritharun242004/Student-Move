from django.apps import apps
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.db.models.signals import post_migrate
from django.dispatch import receiver
from properties.models import Property, PropertyImage


@receiver(post_migrate)
def assign_permissions(sender, **kwargs):
    # Define the models for which you want to assign permissions
    models = [Property, PropertyImage]

    try:
        # Get the specific groups
        admin_group = Group.objects.get(name="admin")
        landlord_group = Group.objects.get(name="landlord")
        agent_group = Group.objects.get(name="agent")

        # List of groups to receive permissions
        allowed_groups = [admin_group, landlord_group, agent_group]

        for model in models:
            # Get the permissions for the model
            content_type = ContentType.objects.get_for_model(model)
            permissions = Permission.objects.filter(content_type=content_type)

            # Assign the permissions to admin, landlord, and agent groups
            for group in allowed_groups:
                for permission in permissions:
                    group.permissions.add(permission)

    except Group.DoesNotExist:
        print("One or more required groups (admin, landlord, agent) do not exist.")
    except Exception as e:
        print(f"An error occurred while assigning permissions: {e}")
