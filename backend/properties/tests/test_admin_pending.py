from django.contrib.auth.models import User, Group
from rest_framework.test import APITestCase
from rest_framework import status
from properties.models import (
    Property,
    University,
)  # Import necessary models
from django.urls import reverse


class AdminPropertyAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        # Create groups
        cls.admin_group, _ = Group.objects.get_or_create(name="admin")
        cls.landlord_group, _ = Group.objects.get_or_create(name="landlord")

        # Create admin user
        cls.admin_user = User.objects.create_user(
            username="admin_user",
            password="adminpass123",
        )
        cls.admin_user.groups.add(cls.admin_group)  # Assign to admin group

        # Create landlord user
        cls.landlord_user = User.objects.create_user(
            username="landlord_user",
            password="landlordpass123",
        )
        cls.landlord_user.groups.add(cls.landlord_group)  # Assign to landlord group

        # Create regular user with no special permissions
        cls.regular_user = User.objects.create_user(
            username="regular_user",
            password="regularpass123",
        )

        # Create university (no need for city/area as we use indexes now)
        cls.university = University.objects.create(name="Test University")

        # Create properties with different statuses
        # Available property
        cls.available_property = Property.objects.create(
            land_lord=cls.landlord_user,
            name="Available Property",
            address="123 Available Street",
            city_index=0,
            area_index=0,
            price=1000.00,
            description="Available property description",
            rooms=2,
            additional_details={"furnished": True},
            status=Property.AVAILABLE,
            latitude=7.8731,
            longitude=80.7718,
            location_url="https://maps.example.com",
        )
        cls.available_property.universities.add(cls.university)  # Add university

        # Rented out property
        cls.rented_property = Property.objects.create(
            land_lord=cls.landlord_user,
            name="Rented Property",
            address="456 Rented Street",
            city_index=0,
            area_index=0,
            price=1500.00,
            description="Rented property description",
            rooms=3,
            additional_details={"furnished": False},
            status=Property.RENTED_OUT,
            latitude=7.9731,
            longitude=80.8718,
            location_url="https://maps.example.com",
        )
        cls.rented_property.universities.add(cls.university)  # Add university

        # Pending property 1
        cls.pending_property1 = Property.objects.create(
            land_lord=cls.landlord_user,
            name="Pending Property 1",
            address="789 Pending Street",
            city_index=0,
            area_index=0,
            price=1200.00,
            description="Pending property description 1",
            rooms=1,
            additional_details={"furnished": True},
            status=Property.PENDING,
            latitude=7.7731,
            longitude=80.6718,
            location_url="https://maps.example.com",
        )
        cls.pending_property1.universities.add(cls.university)  # Add university

        # Pending property 2
        cls.pending_property2 = Property.objects.create(
            land_lord=cls.landlord_user,
            name="Pending Property 2",
            address="101 Pending Avenue",
            city_index=0,
            area_index=0,
            price=2000.00,
            description="Pending property description 2",
            rooms=4,
            additional_details={"furnished": True},
            status=Property.PENDING,
            latitude=7.6731,
            longitude=80.5718,
            location_url="https://maps.example.com",
        )
        cls.pending_property2.universities.add(cls.university)  # Add university

        # URLs for the API endpoints
        cls.property_list_url = reverse("property-list")
        cls.pending_list_url = reverse("pending-list-admin")
        cls.approve_url = reverse("property-approve", args=[cls.pending_property2.id])

    def test_landlord_property_list(self):
        """Test that landlords only see their own properties."""
        self.client.force_authenticate(user=self.landlord_user)
        response = self.client.get(self.property_list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "success")

        # Verify that the landlord only sees their own properties
        property_names = [prop["name"] for prop in response.data["data"]]
        self.assertIn("Available Property", property_names)
        self.assertIn("Rented Property", property_names)

    def test_regular_user_property_list(self):
        """Test that regular users see all non-pending properties."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(self.property_list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "success")

        # Verify that regular users only see non-pending properties
        property_names = [prop["name"] for prop in response.data["data"]]
        self.assertIn("Available Property", property_names)
        self.assertIn("Rented Property", property_names)
        self.assertNotIn("Pending Property 1", property_names)
        self.assertNotIn("Pending Property 2", property_names)

    def test_admin_property_list(self):
        """Test that admin users see all properties except pending in the regular list."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.property_list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "success")

        # Verify that admin users only see non-pending properties in the regular list
        property_names = [prop["name"] for prop in response.data["data"]]
        self.assertIn("Available Property", property_names)
        self.assertIn("Rented Property", property_names)
        self.assertNotIn("Pending Property 1", property_names)
        self.assertNotIn("Pending Property 2", property_names)

    def test_admin_pending_list(self):
        """Test that admin users can access the pending properties list."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.pending_list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "success")

        # Verify that only pending properties are included
        property_names = [prop["name"] for prop in response.data["data"]]
        self.assertEqual(len(property_names), 2)  # Should have 2 pending properties
        self.assertIn("Pending Property 1", property_names)
        self.assertIn("Pending Property 2", property_names)
        self.assertNotIn("Available Property", property_names)
        self.assertNotIn("Rented Property", property_names)
