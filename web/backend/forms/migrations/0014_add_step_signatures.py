from django.db import migrations, models
import django.db.models.deletion
import forms.models


class Migration(migrations.Migration):

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
        ('forms', '0013_remove_lead_tenant_sign'),
    ]

    operations = [
        # Add new fields for first agreement signatures to AgreementForm
        migrations.AddField(
            model_name='agreementform',
            name='land_lord_sign_1',
            field=models.ImageField(blank=True, null=True, upload_to=forms.models.landlord_signature_path),
        ),
        migrations.AddField(
            model_name='agreementform',
            name='admin_sign_1',
            field=models.ImageField(blank=True, null=True, upload_to=forms.models.admin_signature_path),
        ),
        migrations.AddField(
            model_name='agreementform',
            name='admin_name_1',
            field=models.CharField(blank=True, max_length=200, null=True),
        ),
        migrations.AddField(
            model_name='agreementform',
            name='lls_date_1',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='agreementform',
            name='admin_sign_date_1',
            field=models.DateField(blank=True, null=True),
        ),
        # Create new TenantSigns1 model for first step signatures
        migrations.CreateModel(
            name='TenantSigns1',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('full_name', models.CharField(max_length=200)),
                ('sign', models.ImageField(upload_to=forms.models.tenant_signature_path)),
                ('date', models.DateField(auto_now_add=True)),
                ('email', models.EmailField(blank=True, max_length=254, null=True)),
                ('phone', models.CharField(blank=True, max_length=20, null=True)),
                ('agreement', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tenant_signs_1', to='forms.agreementform')),
                ('application', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='tenant_signs_1', to='forms.applicationform')),
                ('tenant_user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='tenant_agreement_signs_1', to='auth.user')),
            ],
            options={
                'verbose_name_plural': 'Tenant Signs Step 1',
                'ordering': ['-date'],
            },
        ),
    ]
