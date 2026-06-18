"""
Management command to update existing properties with correct city/area indices.
This helps migrate data from the old City/Area model system to the new index-based system.
"""

from django.core.management.base import BaseCommand
from properties.models import Property
from properties.location_utils import LocationHelper


class Command(BaseCommand):
    help = 'Update existing properties with correct city/area indices'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be updated without making changes'
        )
        parser.add_argument(
            '--reset-to-london',
            action='store_true',
            help='Reset all properties to London (index 0) and Camden (index 0)'
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        reset_to_london = options['reset_to_london']
        
        properties = Property.objects.all()
        self.stdout.write(f'Found {properties.count()} properties to process')
        
        updated_count = 0
        
        for prop in properties:
            old_city_index = prop.city_index
            old_area_index = prop.area_index
            
            if reset_to_london:
                new_city_index = 0  # London
                new_area_index = 0  # Camden
            else:
                # Keep existing indices but validate them
                new_city_index = old_city_index
                new_area_index = old_area_index
                
                # If indices are invalid, default to London/Camden
                if not LocationHelper.get_city_name(new_city_index) or LocationHelper.get_city_name(new_city_index) == "Unknown City":
                    new_city_index = 0
                    new_area_index = 0
                elif not LocationHelper.get_area_name(new_city_index, new_area_index) or LocationHelper.get_area_name(new_city_index, new_area_index) == "Unknown Area":
                    new_area_index = 0
            
            if old_city_index != new_city_index or old_area_index != new_area_index:
                old_city_name = LocationHelper.get_city_name(old_city_index)
                old_area_name = LocationHelper.get_area_name(old_city_index, old_area_index)
                new_city_name = LocationHelper.get_city_name(new_city_index)
                new_area_name = LocationHelper.get_area_name(new_city_index, new_area_index)
                
                self.stdout.write(
                    f'Property "{prop.name}" (ID: {prop.id}): '
                    f'{old_city_name}/{old_area_name} -> {new_city_name}/{new_area_name}'
                )
                
                if not dry_run:
                    prop.city_index = new_city_index
                    prop.area_index = new_area_index
                    prop.save()
                
                updated_count += 1
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(f'DRY RUN: Would update {updated_count} properties')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'Successfully updated {updated_count} properties')
            )
