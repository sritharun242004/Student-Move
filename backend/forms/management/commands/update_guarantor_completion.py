from django.core.management.base import BaseCommand
from forms.models import GuarantorForm


class Command(BaseCommand):
    help = 'Update completion status for existing guarantor forms'

    def handle(self, *args, **options):
        guarantor_forms = GuarantorForm.objects.all()
        updated_count = 0
        
        for form in guarantor_forms:
            old_completed = form.completed
            
            # Check if form should be marked as completed
            if form.is_form_complete and not form.completed:
                form.completed = True
                form.save()
                updated_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Marked guarantor form {form.id} as completed (for {form.application.user.first_name} {form.application.user.last_name})'
                    )
                )
            elif form.completed and not form.is_form_complete:
                # Optionally mark as incomplete if data is missing
                form.completed = False
                form.save()
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(
                        f'Marked guarantor form {form.id} as incomplete (for {form.application.user.first_name} {form.application.user.last_name})'
                    )
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully updated {updated_count} guarantor forms')
        )