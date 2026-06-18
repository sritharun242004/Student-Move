# core/serializers.py
from rest_framework import serializers


class CamelCaseSerializer(serializers.ModelSerializer):
    def to_representation(self, instance):
        rep = super().to_representation(instance)
        return {self.convert_to_js(key): value for key, value in rep.items()}

    def to_internal_value(self, data):
        converted_data = {
            self.convert_to_python(key): value for key, value in data.items()
        }
        return super().to_internal_value(converted_data)

    def convert_to_js(self, key):
        return "".join(
            [
                word.capitalize() if i > 0 else word
                for i, word in enumerate(key.split("_"))
            ]
        )

    def convert_to_python(self, key):
        return "".join(["_" + c.lower() if c.isupper() else c for c in key]).lstrip("_")
