from django.core.management.base import BaseCommand
from properties.models import SystemSettings


class Command(BaseCommand):
    help = 'Initialize default system settings for property management'

    def handle(self, *args, **options):
        # Create or update the auto-approval setting
        setting, created = SystemSettings.objects.get_or_create(
            setting_key="auto_approve_properties",
            defaults={
                'setting_value': False,
                'description': 'Automatically approve property listings when enabled. When disabled, properties require manual admin approval.'
            }
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(
                    'Successfully created auto_approve_properties setting (default: disabled)'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f'auto_approve_properties setting already exists (current: {"enabled" if setting.setting_value else "disabled"})'
                )
            )
