# Generated migration to add agent-landlord relationship model

from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('users', '0004_add_agent_group'),
    ]

    operations = [
        migrations.CreateModel(
            name='AgentLandlordRelationship',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(
                    choices=[
                        ('pending', 'Pending'),
                        ('approved', 'Approved'),
                        ('rejected', 'Rejected'),
                        ('revoked', 'Revoked')
                    ],
                    default='pending',
                    max_length=10
                )),
                ('request_message', models.TextField(blank=True, null=True)),
                ('response_message', models.TextField(blank=True, null=True)),
                ('requested_at', models.DateTimeField(auto_now_add=True)),
                ('responded_at', models.DateTimeField(blank=True, null=True)),
                ('agent', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='landlord_relationships',
                    to=settings.AUTH_USER_MODEL
                )),
                ('landlord', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='agent_relationships',
                    to=settings.AUTH_USER_MODEL
                )),
            ],
            options={
                'unique_together': {('agent', 'landlord')},
            },
        ),
    ]
