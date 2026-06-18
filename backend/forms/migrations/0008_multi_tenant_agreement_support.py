# Generated migration for multi-tenant agreement support

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('forms', '0007_agreementform_agent_filled_and_more'),
        ('properties', '0001_initial'),  # Adjust if needed
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Add linked_property field to AgreementForm
        migrations.AddField(
            model_name='agreementform',
            name='linked_property',
            field=models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='agreement_form', to='properties.property'),
        ),
        # Add allow_multiple_tenants field
        migrations.AddField(
            model_name='agreementform',
            name='allow_multiple_tenants',
            field=models.BooleanField(default=True),
        ),
        # Add created_at field
        migrations.AddField(
            model_name='agreementform',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
        # Update TenantSigns model with new fields
        migrations.AddField(
            model_name='tenantsigns',
            name='application',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='tenant_signs', to='forms.applicationform'),
        ),
        migrations.AddField(
            model_name='tenantsigns',
            name='tenant_user',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='tenant_agreement_signs', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='tenantsigns',
            name='email',
            field=models.EmailField(blank=True, max_length=254, null=True),
        ),
        migrations.AddField(
            model_name='tenantsigns',
            name='phone',
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
        # Add ordering to TenantSigns
        migrations.AlterModelOptions(
            name='tenantsigns',
            options={'ordering': ['-date'], 'verbose_name_plural': 'Tenant Signs'},
        ),
    ]
