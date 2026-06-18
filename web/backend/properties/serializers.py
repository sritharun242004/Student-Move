from rest_framework import serializers
from .models import Property, PropertyImage, SystemSettings
from django.contrib.auth.models import User
from studentmove.serializers import CamelCaseSerializer
from studentmove.emailnotifier import EmailNotifier
from .location_utils import LocationValidator, LocationHelper, CITIES


class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ["id", "image"]



class PropertySerializer(CamelCaseSerializer):
    images = PropertyImageSerializer(many=True, read_only=True)
    image_files = serializers.ListField(
        child=serializers.ImageField(
            max_length=1000000, allow_empty_file=False, use_url=False
        ),
        write_only=True,
        required=False,
    )

    class Meta:
        model = Property
        fields = "__all__"
        extra_kwargs = {"land_lord": {"required": False}}

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        request = self.context.get('request')
        
        # Handle price display based on user role
        if request and request.user and not request.user.is_anonymous:
            # For agents acting as landlords they created, show base_price
            if (request.user.groups.filter(name="agent").exists() and 
                hasattr(request, 'acting_as_landlord') and 
                request.acting_as_landlord and
                hasattr(request.acting_as_landlord.profile, 'created_by_agent') and
                request.acting_as_landlord.profile.created_by_agent == request.user):
                # Agent sees their original base price
                representation['price'] = str(instance.base_price or instance.price)
                representation['display_price'] = str(instance.price)  # Final price with commission
                representation['commission_rate'] = instance.land_lord.profile.commission_rate if hasattr(instance.land_lord.profile, 'commission_rate') else None
                representation['is_agent_property'] = True
            # For landlords viewing their own properties created by agent
            elif (request.user.groups.filter(name="landlord").exists() and 
                  instance.land_lord == request.user and
                  hasattr(request.user.profile, 'created_by_agent') and
                  request.user.profile.created_by_agent):
                # Landlord sees the final price (with commission)
                representation['price'] = str(instance.price)
                representation['base_price'] = str(instance.base_price or instance.price)
                representation['commission_rate'] = instance.land_lord.profile.commission_rate if hasattr(instance.land_lord.profile, 'commission_rate') else None
                representation['is_agent_property'] = True
            # For admins, show both prices
            elif request.user.groups.filter(name="admin").exists():
                representation['price'] = str(instance.price)
                if instance.base_price and instance.base_price != instance.price:
                    representation['base_price'] = str(instance.base_price)
                    representation['commission_rate'] = instance.land_lord.profile.commission_rate if hasattr(instance.land_lord.profile, 'commission_rate') else None
                    representation['is_agent_property'] = True
                else:
                    representation['is_agent_property'] = False
            else:
                # Regular users see the final price only
                representation['price'] = str(instance.price)
                representation['is_agent_property'] = False
        else:
            # Unauthenticated users see the final price only
            representation['price'] = str(instance.price)
            representation['is_agent_property'] = False
        
        # Add landlord details
        if instance.land_lord:
            representation['land_lord'] = {
                'id': instance.land_lord.id,
                'username': instance.land_lord.username,
                'first_name': instance.land_lord.first_name,
                'last_name': instance.land_lord.last_name,
                'email': instance.land_lord.email,
            }
        
        # Add city and area details using indices
        representation['city'] = {
            'id': instance.city_index,
            'name': LocationHelper.get_city_name(instance.city_index),
        }
        
        representation['area'] = {
            'id': instance.area_index,
            'name': LocationHelper.get_area_name(instance.city_index, instance.area_index),
        }
        
        # Add universities details
        if instance.universities.exists():
            representation['universities'] = [
                {
                    'id': uni.id,
                    'name': uni.name,
                }
                for uni in instance.universities.all()
            ]
        else:
            representation['universities'] = []
        
        return representation

    def validate(self, data):
        """
        Validate that the selected area belongs to the selected city.
        This prevents data integrity issues where properties could be created
        with incorrect city-area combinations.
        """
        city_index = data.get('city_index')
        area_index = data.get('area_index')
        
        # Check if this is a partial update (when instance exists and not all required fields are provided)
        is_partial_update = hasattr(self, 'instance') and self.instance is not None
        
        # Validate city index
        if city_index is not None and not LocationValidator.validate_city_index(city_index):
            raise serializers.ValidationError({
                'city_index': f"City index {city_index} is invalid. Must be between 0 and {len(CITIES) - 1}."
            })
        
        # Validate area index
        if area_index is not None and city_index is not None:
            if not LocationValidator.validate_area_index(city_index, area_index):
                city_name = LocationHelper.get_city_name(city_index)
                valid_areas = LocationHelper.get_valid_areas_for_city(city_index)
                raise serializers.ValidationError({
                    'area_index': f"Area index {area_index} is invalid for {city_name}. "
                                f"Valid area indices are 0-{len(valid_areas) - 1}."
                })
        
        # Only require city and area for new property creation, not for partial updates
        if not is_partial_update:
            # Ensure both city and area are provided (make them required)
            if city_index is None:
                raise serializers.ValidationError({
                    'city_index': 'City is required.'
                })
            
            if area_index is None:
                raise serializers.ValidationError({
                    'area_index': 'Area is required.'
                })
        
        return data

    def create(self, validated_data):
        request = self.context.get("request")
        
        # Ensure user is authenticated
        if not request or not request.user or request.user.is_anonymous:
            raise serializers.ValidationError("Authentication required to create a property.")
        
        # Determine the landlord based on user role
        land_lord = request.user
        
        # If user is an agent, check if they're acting on behalf of a landlord
        if request.user.groups.filter(name="agent").exists():
            if hasattr(request, 'acting_as_landlord') and request.acting_as_landlord:
                land_lord = request.acting_as_landlord
                
                # Handle commission calculation for agent-created landlords
                if (hasattr(land_lord.profile, 'created_by_agent') and 
                    land_lord.profile.created_by_agent == request.user and
                    'price' in validated_data):
                    # Agent is setting property for landlord they created
                    # Store the agent's price as base_price
                    validated_data['base_price'] = validated_data['price']
                    # The price will be calculated with commission in the model's save method
            else:
                raise serializers.ValidationError("Agent must select a landlord to create properties on their behalf.")
        # If user is a landlord, use the user as landlord
        elif request.user.groups.filter(name="landlord").exists():
            land_lord = request.user
            # For regular landlords, base_price equals price
            if 'price' in validated_data and 'base_price' not in validated_data:
                validated_data['base_price'] = validated_data['price']
        else:
            raise serializers.ValidationError("Only landlords or agents can create properties.")
        
        validated_data["land_lord"] = land_lord
        
        # Check if auto-approval is enabled
        auto_approve = SystemSettings.get_setting("auto_approve_properties", default=False)
        if auto_approve:
            validated_data["status"] = Property.AVAILABLE
        else:
            validated_data["status"] = Property.PENDING
        
        image_files = validated_data.pop("image_files", [])
        universities = validated_data.pop("universities", [])
        
        # Ensure bills_included is always True
        validated_data["bills_included"] = True

        property = Property.objects.create(**validated_data)
        property.universities.set(universities)

        for image_file in image_files:
            PropertyImage.objects.create(property=property, image=image_file)

        # Send appropriate notification based on auto-approval status
        if auto_approve:
            EmailNotifier.notify_landlord_property_approved(
                land_lord.email, property.name
            )
        else:
            EmailNotifier.notify_admin_new_property(land_lord, property)

        return property

    def update(self, instance, validated_data):
        request = self.context.get("request")
        
        image_files = validated_data.pop("image_files", [])
        header_image = validated_data.pop("header_image", None)
        universities = validated_data.pop("universities", [])
        
        # Handle commission calculation for agent updates
        if (request and request.user and 
            request.user.groups.filter(name="agent").exists() and
            hasattr(request, 'acting_as_landlord') and 
            request.acting_as_landlord and
            hasattr(request.acting_as_landlord.profile, 'created_by_agent') and
            request.acting_as_landlord.profile.created_by_agent == request.user and
            'price' in validated_data):
            # Agent is updating property for landlord they created
            # Store the agent's price as base_price
            validated_data['base_price'] = validated_data['price']
            # The final price will be calculated with commission in the model's save method
        elif ('price' in validated_data and 
              instance.land_lord.groups.filter(name="landlord").exists() and
              not hasattr(instance.land_lord.profile, 'created_by_agent')):
            # Regular landlord updating their own property
            validated_data['base_price'] = validated_data['price']
        
        # Ensure bills_included is always True
        validated_data["bills_included"] = True

        if header_image:
            instance.header_image.delete()
            instance.header_image = header_image
            instance.save()

        if universities:
            instance.universities.set(universities)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        for image_file in image_files:
            PropertyImage.objects.create(property=instance, image=image_file)

        return instance


class ApprovePropertySerializer(serializers.Serializer):
    class Meta:
        model = Property
        fields = ["id"]

    def update(self, instance, validated_data):
        status = "available"  # Change to available when approved
        instance.status = status
        instance.save()

        EmailNotifier.notify_landlord_property_approved(
            instance.land_lord.email, instance.name
        )
        return instance


class FlagPropertySerializer(serializers.Serializer):
    class Meta:
        model = Property
        fields = ["id"]

    def update(self, instance, validated_data):
        status = "flagged"
        instance.status = status
        instance.save()

        EmailNotifier.notify_admin_property_flagged(
            instance.land_lord.email, instance.name
        )
        return instance


class FeaturePropertySerializer(serializers.Serializer):
    class Meta:
        model = Property
        fields = ["id"]

    def update(self, instance, validated_data):
        # Toggle the is_featured field
        instance.is_featured = not instance.is_featured
        instance.save()
        return instance


class PropertyImageSerializer(serializers.ModelSerializer):
    images = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=False
    )
    keep = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False
    )

    class Meta:
        model = PropertyImage
        fields = ["id", "property", "images", "keep"]
        read_only_fields = ["id"]

    def create(self, validated_data):
        images = validated_data.pop("images", [])
        property_id = validated_data.get("property")

        # For multiple image upload
        created_images = []
        for image in images:
            image_data = {"property": property_id, "image": image}
            created_images.append(PropertyImage.objects.create(**image_data))

        return created_images[0] if created_images else None


class ImageListSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ["id", "image"]
