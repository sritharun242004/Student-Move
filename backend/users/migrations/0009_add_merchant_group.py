from django.db import migrations
from django.contrib.auth.models import Group


def create_merchant_group(apps, schema_editor):
    Group.objects.get_or_create(name="merchant")


def remove_merchant_group(apps, schema_editor):
    Group.objects.filter(name="merchant").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0008_add_agent_landlord_fields"),
    ]

    operations = [
        migrations.RunPython(create_merchant_group, remove_merchant_group),
    ]
