from django.db.models.signals import post_save
from django.dispatch import receiver
from tenants.models import Lease, MaintenanceRequest, Inspection
from properties.models import Property
from .models import Notification
from django.contrib.auth import get_user_model

User = get_user_model()


@receiver(post_save, sender=Lease)
def create_lease_notifications(sender, instance, created, **kwargs):
    """Create notifications for lease-related events"""
    
    if created:
        # Notify landlord about new lease request
        if instance.property_obj and instance.property_obj.land_lord:
            Notification.create_notification(
                recipient=instance.property_obj.land_lord,
                notification_type='lease_request',
                title='New Lease Request',
                message=f'New lease request from {instance.tenant.get_full_name() or instance.tenant.username} for {instance.property_obj.name}',
                priority='medium',
                related_object=instance,
                action_url=f'/dashboard/tenant-management',
                metadata={
                    'tenant_id': instance.tenant.id,
                    'property_id': instance.property_obj.id,
                    'lease_id': instance.id
                }
            )
    else:
        # Handle status changes
        if hasattr(instance, '_original_status') and instance._original_status != instance.status:
            if instance.status == 'active':
                # Notify tenant about lease approval
                Notification.create_notification(
                    recipient=instance.tenant,
                    notification_type='lease_approval',
                    title='Lease Approved',
                    message=f'Your lease request for {instance.property_obj.name} has been approved!',
                    priority='high',
                    related_object=instance,
                    action_url=f'/dashboard/tenant-lease-management',
                    metadata={
                        'property_id': instance.property_obj.id,
                        'lease_id': instance.id
                    }
                )
            elif instance.status == 'rejected':
                # Notify tenant about lease rejection
                Notification.create_notification(
                    recipient=instance.tenant,
                    notification_type='lease_rejection',
                    title='Lease Request Rejected',
                    message=f'Your lease request for {instance.property_obj.name} has been rejected.',
                    priority='medium',
                    related_object=instance,
                    action_url=f'/dashboard/properties',
                    metadata={
                        'property_id': instance.property_obj.id,
                        'lease_id': instance.id
                    }
                )


@receiver(post_save, sender=MaintenanceRequest)
def create_maintenance_notifications(sender, instance, created, **kwargs):
    """Create notifications for maintenance requests"""
    
    if created:
        # Notify landlord about new maintenance request
        if instance.lease and instance.lease.property_obj and instance.lease.property_obj.land_lord:
            Notification.create_notification(
                recipient=instance.lease.property_obj.land_lord,
                notification_type='maintenance_request',
                title='New Maintenance Request',
                message=f'New {instance.priority} priority maintenance request: {instance.issue_title}',
                priority='high' if instance.priority == 'high' else 'medium',
                related_object=instance,
                action_url=f'/dashboard/maintenance-view',
                metadata={
                    'tenant_id': instance.lease.tenant.id,
                    'property_id': instance.lease.property_obj.id,
                    'lease_id': instance.lease.id,
                    'maintenance_id': instance.id,
                    'priority': instance.priority
                }
            )
    else:
        # Handle status changes
        if hasattr(instance, '_original_status') and instance._original_status != instance.status:
            if instance.status in ['in_progress', 'completed']:
                # Notify tenant about maintenance update
                Notification.create_notification(
                    recipient=instance.lease.tenant,
                    notification_type='maintenance_update',
                    title='Maintenance Update',
                    message=f'Your maintenance request "{instance.issue_title}" status: {instance.status.replace("_", " ").title()}',
                    priority='medium',
                    related_object=instance,
                    action_url=f'/dashboard/tenant-maintenance',
                    metadata={
                        'maintenance_id': instance.id,
                        'status': instance.status,
                        'priority': instance.priority
                    }
                )


@receiver(post_save, sender=Inspection)
def create_inspection_notifications(sender, instance, created, **kwargs):
    """Create notifications for inspections"""
    
    if created:
        # Notify tenant about new inspection
        if instance.lease and instance.lease.tenant:
            Notification.create_notification(
                recipient=instance.lease.tenant,
                notification_type='inspection_schedule',
                title='Inspection Scheduled',
                message=f'An inspection has been scheduled for {instance.inspection_date} at {instance.time}',
                priority='medium',
                related_object=instance,
                action_url=f'/dashboard/tenant-inspections',
                metadata={
                    'inspection_id': instance.id,
                    'inspection_date': instance.inspection_date.isoformat() if instance.inspection_date else None,
                    'time': instance.time,
                    'property_id': instance.lease.property_obj.id
                }
            )
    else:
        # Handle status changes
        if hasattr(instance, '_original_status') and instance._original_status != instance.status:
            if instance.status in ['completed', 'cancelled']:
                # Notify tenant about inspection update
                Notification.create_notification(
                    recipient=instance.lease.tenant,
                    notification_type='inspection_update',
                    title='Inspection Update',
                    message=f'Your inspection scheduled for {instance.inspection_date} has been {instance.status}',
                    priority='medium',
                    related_object=instance,
                    action_url=f'/dashboard/tenant-inspections',
                    metadata={
                        'inspection_id': instance.id,
                        'status': instance.status,
                        'inspection_date': instance.inspection_date.isoformat() if instance.inspection_date else None
                    }
                )


@receiver(post_save, sender=Property)
def create_property_notifications(sender, instance, created, **kwargs):
    """Create notifications for property approvals"""
    
    if not created:
        # Handle status changes
        if hasattr(instance, '_original_status') and instance._original_status != instance.status:
            if instance.status == 'approved':
                # Notify landlord about property approval
                Notification.create_notification(
                    recipient=instance.land_lord,
                    notification_type='property_approval',
                    title='Property Approved',
                    message=f'Your property "{instance.name}" has been approved and is now live!',
                    priority='high',
                    related_object=instance,
                    action_url=f'/dashboard/my-properties',
                    metadata={
                        'property_id': instance.id,
                        'property_name': instance.name
                    }
                )
            elif instance.status == 'rejected':
                # Notify landlord about property rejection
                Notification.create_notification(
                    recipient=instance.land_lord,
                    notification_type='property_rejection',
                    title='Property Rejected',
                    message=f'Your property "{instance.name}" has been rejected. Please review and resubmit.',
                    priority='medium',
                    related_object=instance,
                    action_url=f'/dashboard/my-properties',
                    metadata={
                        'property_id': instance.id,
                        'property_name': instance.name
                    }
                )


def create_original_tracking(sender, instance, **kwargs):
    """Track original values for comparison"""
    if instance.pk:
        try:
            original = sender.objects.get(pk=instance.pk)
            instance._original_status = original.status
        except sender.DoesNotExist:
            pass


# Connect the tracking signal
from django.db.models.signals import pre_save

pre_save.connect(create_original_tracking, sender=Lease)
pre_save.connect(create_original_tracking, sender=MaintenanceRequest)
pre_save.connect(create_original_tracking, sender=Inspection)
pre_save.connect(create_original_tracking, sender=Property)
