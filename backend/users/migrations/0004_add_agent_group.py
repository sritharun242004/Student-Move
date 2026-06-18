# Generated migration to add agent group

from django.db import migrations
from django.contrib.auth.models import Group


def create_agent_group(apps, schema_editor):
    Group.objects.get_or_create(name="agent")


def remove_agent_group(apps, schema_editor):
    Group.objects.filter(name="agent").delete()


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_profile_otp_profile_otp_expiry'),
    ]

    operations = [
        migrations.RunPython(create_agent_group, remove_agent_group),
    ]
