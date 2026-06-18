from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tenants", "0008_alter_lease_holding_fee"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="RentersRightsAcknowledgment",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "pdf_version",
                    models.CharField(
                        help_text="Versioned filename of the info sheet the tenant saw, e.g. renters-rights-2026-v1",
                        max_length=64,
                    ),
                ),
                ("acknowledged_at", models.DateTimeField(auto_now_add=True)),
                ("ip_address", models.GenericIPAddressField(blank=True, null=True)),
                ("user_agent", models.TextField(blank=True, default="")),
                (
                    "device_info",
                    models.JSONField(
                        blank=True,
                        help_text="Mobile-supplied context: platform, os version, app version, device model",
                        null=True,
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        related_name="renters_rights_acknowledgments",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-acknowledged_at"],
                "indexes": [
                    models.Index(
                        fields=["user", "-acknowledged_at"],
                        name="tenants_ren_user_id_acknow_idx",
                    )
                ],
            },
        ),
    ]
