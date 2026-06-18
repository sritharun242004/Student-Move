from rest_framework import serializers
from studentmove.serializers import CamelCaseSerializer
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from django.contrib.auth.models import Group
from .models import Profile, AgentLandlordRelationship
from datetime import datetime
from chat.models import ChatThread
from properties.models import Property


class ProfileSerializer(CamelCaseSerializer):
    class Meta:
        model = Profile
        fields = [
            "phone", "status", "bin_date", "open_for_agents",
            "company_name", "address", "bank_account_number", "sort_code",
            "commission_rate", "preferred_contact_method", "notes", "created_by_agent"
        ]


class UserAuthSerializer(CamelCaseSerializer):
    password = serializers.CharField(min_length=8, write_only=True, required=True)
    role = serializers.CharField(required=False)
    profile = ProfileSerializer()

    class Meta:
        model = User
        fields = ["id", "email", "password", "first_name", "last_name", "role", "profile"]
        extra_kwargs = {"password": {"write_only": True}}

    def validate(self, attrs):
        email = attrs.get("email", None)
        if email is None:
            raise serializers.ValidationError({"email": "Email is required"})

        # Generate username from email, handling duplicates
        base_username = email.split("@")[0]
        username = base_username
        counter = 1
        
        # If username already exists, append a number until we find a unique one
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
        
        attrs["username"] = username

        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "Email already exists"})

        if "role" not in attrs:
            raise serializers.ValidationError({"role": "Role is required"})

        if attrs["role"] not in ["landlord", "tenant", "agent", "merchant"]:
            raise serializers.ValidationError(
                {"role": "Role must be 'landlord', 'tenant', 'agent', or 'merchant'"}
            )

        return attrs

    def create(self, validated_data):
        # Extract the nested profile data before creating the user
        profile_data = None
        if "profile" in validated_data:
            profile_data = validated_data.pop("profile")

        password = validated_data.pop("password")
        role = validated_data.pop("role")

        # Create the user (username is already set in validate())
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()

        # Add user to the appropriate group
        group = Group.objects.get(name=role)
        group.user_set.add(user)

        # Create the profile if profile data was provided
        profile = None
        if profile_data:
            profile = Profile.objects.create(user=user, **profile_data)
        else:
            # Create an empty profile if no data was provided
            profile = Profile.objects.create(user=user)

        if role in ["landlord", "agent"]:
            profile.status = "inactive"
            profile.save()

        # Get the admin user and create a chat thread if admin exists
        admin_user = User.objects.filter(groups__name="admin").first()
        if admin_user:
            try:
                # Create a chat thread between the new user and the admin
                chat_thread = ChatThread.objects.create(
                    thread_type="admin_chat", lease=None
                )
                chat_thread.participants.set([user, admin_user])
                chat_thread.save()
            except Exception as e:
                # Log the error but don't fail user creation
                print(f"Error creating chat thread: {str(e)}")
        
        return user

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        user = instance
        refresh_token = RefreshToken.for_user(user)
        role = user.groups.first().name if user.groups.exists() else None
        if role:
            refresh_token["role"] = role

        access_token = refresh_token.access_token
        if role:
            access_token["role"] = role

        representation["access"] = str(access_token)
        representation["refresh"] = str(refresh_token)
        representation["expiresAt"] = (
            datetime.now() + access_token.lifetime
        ).isoformat() + "Z"

        if user.groups.exists():
            representation["role"] = user.groups.first().name

        chat_thread_with_admin = ChatThread.objects.filter(
            participants=user, thread_type="admin_chat"
        ).first()

        representation["chat_thread_id"] = (
            chat_thread_with_admin.id if chat_thread_with_admin else None
        )

        return representation


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        email = attrs["email"]
        try:
            user = User.objects.get(email=email)
            attrs["username"] = user.username
        except User.DoesNotExist:
            attrs["username"] = None
        return attrs


class UserSerializer(CamelCaseSerializer):
    profile = ProfileSerializer()
    properties_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "profile",
            "is_active",
            "properties_count",
            "date_joined",
        ]

    def get_properties_count(self, obj):
        # Only return count if the user is a landlord
        if obj.groups.filter(name="landlord").exists():
            return Property.objects.filter(land_lord=obj).count()
        return None

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        role = instance.groups.first().name if instance.groups.exists() else None
        representation["role"] = role
        if role != "landlord":
            representation.pop("properties_count", None)
        return representation


class LandlordListSerializer(CamelCaseSerializer):
    """Serializer for listing landlords that agents can request access to"""
    profile = ProfileSerializer()
    properties_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            "id",
            "email", 
            "first_name",
            "last_name",
            "profile",
            "properties_count"
        ]
    
    def get_properties_count(self, obj):
        return Property.objects.filter(land_lord=obj).count()


class AgentLandlordRelationshipSerializer(CamelCaseSerializer):
    agent = UserSerializer(read_only=True)
    landlord = LandlordListSerializer(read_only=True)
    
    class Meta:
        model = AgentLandlordRelationship
        fields = [
            "id",
            "agent",
            "landlord", 
            "status",
            "created_at",
            "removed_at",
            "removed_by"
        ]


class AgentLandlordSelectSerializer(CamelCaseSerializer):
    """Serializer for agent selecting a landlord"""
    landlord_id = serializers.IntegerField()
    
    class Meta:
        model = AgentLandlordRelationship
        fields = ["landlord_id"]
    
    def validate_landlord_id(self, value):
        try:
            landlord = User.objects.get(id=value)
            if not landlord.groups.filter(name="landlord").exists():
                raise serializers.ValidationError("User is not a landlord")
            
            # Check if landlord is open for agents
            if not landlord.profile.open_for_agents:
                raise serializers.ValidationError("This landlord is not accepting new agents")
            
            # Check if landlord already has an agent (one-to-one relationship)
            existing_relationship = AgentLandlordRelationship.objects.filter(
                landlord=landlord,
                status='active'
            ).first()
            
            if existing_relationship:
                raise serializers.ValidationError("This landlord already has an agent assigned")
            
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("Landlord not found")


class AgentCreateLandlordSerializer(CamelCaseSerializer):
    """Serializer for agents creating new landlords"""
    password = serializers.CharField(read_only=True)  # Auto-generated
    
    class Meta:
        model = User
        fields = [
            "email", "first_name", "last_name", "password"
        ]
        extra_kwargs = {
            "email": {"required": True},
            "first_name": {"required": True},
            "last_name": {"required": True},
        }
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists")
        return value


class AgentCreateLandlordProfileSerializer(CamelCaseSerializer):
    """Serializer for the profile data when creating landlords"""
    class Meta:
        model = Profile
        fields = [
            "phone", "company_name", "address", "bank_account_number",
            "sort_code", "commission_rate", "preferred_contact_method", "notes"
        ]
        extra_kwargs = {
            "phone": {"required": True},
        }


class AgentCreateLandlordCompleteSerializer(CamelCaseSerializer):
    """Complete serializer for agent creating landlord with profile data"""
    user = AgentCreateLandlordSerializer()
    profile = AgentCreateLandlordProfileSerializer()
    
    class Meta:
        model = User
        fields = ["user", "profile"]
    
    def create(self, validated_data):
        from django.contrib.auth.models import Group
        import secrets
        import string
        
        user_data = validated_data.pop('user')
        profile_data = validated_data.pop('profile')
        
        # Generate random password
        password = ''.join(secrets.choice(string.ascii_letters + string.digits + string.punctuation) for _ in range(16))
        
        # Set username from email
        user_data['username'] = user_data['email'].split('@')[0]
        
        # Create user
        user = User.objects.create(**user_data)
        user.set_password(password)
        user.save()
        
        # Add to landlord group
        landlord_group = Group.objects.get(name='landlord')
        landlord_group.user_set.add(user)
        
        # Create profile with agent reference
        profile_data['created_by_agent'] = self.context['request'].user
        profile_data['status'] = 'active'  # Auto-activate for agent-created landlords
        profile_data['open_for_agents'] = False  # Only open to the creating agent
        
        profile = Profile.objects.create(user=user, **profile_data)
        
        # Create automatic relationship with creating agent
        from .models import AgentLandlordRelationship
        AgentLandlordRelationship.objects.create(
            agent=self.context['request'].user,
            landlord=user,
            status='active'
        )
        
        # Set generated password for response
        user.temp_password = password
        
        return user
