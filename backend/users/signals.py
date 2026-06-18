from django.apps import apps
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.db.models.signals import post_migrate, post_save
from django.dispatch import receiver
from users.models import Profile


@receiver(post_migrate)
def assign_permissions(sender, **kwargs):
    # Define the models for which you want to assign permissions
    models = [Profile]

    try:
        # Get the specific groups
        admin_group = Group.objects.get(name="admin")
        landlord_group = Group.objects.get(name="landlord")
        tenant_group = Group.objects.get(name="tenant")
        agent_group = Group.objects.get(name="agent")

        # List of groups to receive permissions
        allowed_groups = [admin_group, landlord_group, tenant_group, agent_group]

        for model in models:
            # Get the permissions for the model
            content_type = ContentType.objects.get_for_model(model)
            permissions = Permission.objects.filter(content_type=content_type)

            # Assign the permissions to all groups
            for group in allowed_groups:
                for permission in permissions:
                    group.permissions.add(permission)

    except Group.DoesNotExist:
        print("One or more required groups (admin, landlord, tenant, agent) do not exist.")
    except Exception as e:
        print(f"An error occurred while assigning permissions: {e}")


@receiver(post_save, sender=Profile)
def handle_landlord_status_change(sender, instance, created, **kwargs):
    """
    Handle property visibility when landlord status changes.
    When a landlord is suspended or binned, their properties become unavailable to public.
    When reactivated or restored, properties are restored (if they were previously available).
    """
    if not created and instance.user.groups.filter(name='landlord').exists():
        # Import here to avoid circular imports
        from properties.models import Property
        
        # Check if status has changed
        if hasattr(instance, '_original_status') and instance._original_status != instance.status:
            user_properties = Property.objects.filter(land_lord=instance.user)
            
            if instance.status in ['suspended', 'binned']:
                # When suspended or binned, properties are hidden from public view
                for property_obj in user_properties.filter(status='available'):
                    # Properties are automatically hidden via view filtering
                    print(f"Landlord {instance.user.email} {instance.status} - properties hidden from public view")
                    
            elif instance.status == 'active' and instance._original_status in ['suspended', 'binned']:
                # When reactivated/restored from suspension or bin, properties are automatically visible again
                # since the view filters will no longer exclude them
                print(f"Landlord {instance.user.email} reactivated from {instance._original_status} - properties restored to public view")


def track_original_status(sender, instance, **kwargs):
    """Track original status for comparison"""
    if instance.pk:
        try:
            original = sender.objects.get(pk=instance.pk)
            instance._original_status = original.status
        except sender.DoesNotExist:
            pass


# Connect the tracking signal
from django.db.models.signals import pre_save
pre_save.connect(track_original_status, sender=Profile)
