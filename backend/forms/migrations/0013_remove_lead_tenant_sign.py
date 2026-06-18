# Generated migration to remove deprecated lead_tenant_sign field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('forms', '0012_merge_20251106_0519'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='agreementform',
            name='lead_tenant_sign',
        ),
    ]
