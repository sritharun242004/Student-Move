# Generated migration for agent-landlord system update

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0006_profile_bin_date_alter_profile_status'),
    ]

    operations = [
        # Add new fields to Profile
        migrations.AddField(
            model_name='profile',
            name='open_for_agents',
            field=models.BooleanField(default=True, help_text='Allow agents to select this landlord'),
        ),
        
        # Remove old fields from AgentLandlordRelationship
        migrations.RemoveField(
            model_name='agentlandlordrelationship',
            name='request_message',
        ),
        migrations.RemoveField(
            model_name='agentlandlordrelationship',
            name='response_message',
        ),
        migrations.RemoveField(
            model_name='agentlandlordrelationship',
            name='requested_at',
        ),
        migrations.RemoveField(
            model_name='agentlandlordrelationship',
            name='responded_at',
        ),
        
        # Add new fields to AgentLandlordRelationship
        migrations.AddField(
            model_name='agentlandlordrelationship',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='agentlandlordrelationship',
            name='removed_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='agentlandlordrelationship',
            name='removed_by',
            field=models.CharField(blank=True, choices=[('agent', 'Agent'), ('landlord', 'Landlord')], max_length=10, null=True),
        ),
        
        # Update status field choices
        migrations.AlterField(
            model_name='agentlandlordrelationship',
            name='status',
            field=models.CharField(choices=[('active', 'Active'), ('removed', 'Removed')], default='active', max_length=10),
        ),
        
        # Convert existing approved relationships to active
        migrations.RunSQL(
            "UPDATE users_agentlandlordrelationship SET status = 'active' WHERE status = 'approved';",
            reverse_sql="UPDATE users_agentlandlordrelationship SET status = 'approved' WHERE status = 'active';"
        ),
        
        # Remove non-approved relationships as they're no longer needed
        migrations.RunSQL(
            "DELETE FROM users_agentlandlordrelationship WHERE status IN ('pending', 'rejected', 'revoked');",
            reverse_sql="-- No reverse operation for deleted records"
        ),
    ]