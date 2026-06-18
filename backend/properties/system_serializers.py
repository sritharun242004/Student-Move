from rest_framework import serializers
from .models import SystemSettings


class SystemSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSettings
        fields = ['setting_key', 'setting_value', 'description']
        read_only_fields = ['setting_key', 'description']


class SystemSettingsReadOnlySerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSettings
        fields = ['setting_key', 'setting_value', 'description']
        read_only_fields = ['setting_key', 'setting_value', 'description']
