# Generated migration for is_featured field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('properties', '0012_add_base_price_for_commission'),
    ]

    operations = [
        migrations.AddField(
            model_name='property',
            name='is_featured',
            field=models.BooleanField(default=False, help_text='Mark property as featured'),
        ),
    ]
