from django.contrib.auth.models import User, Group
from rest_framework.test import APITestCase
from rest_framework import status
from properties.models import Property, University
from django.urls import reverse


class PropertyAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        # Create landlord group
        cls.landlord_group, _ = Group.objects.get_or_create(name="landlord")

        # Create a user and assign them to the landlord group
        cls.user = User.objects.create_user(username="landlord", password="password123")
        cls.user.groups.add(cls.landlord_group)

        # Create university
        cls.university = University.objects.create(name="Test University")

        # Create a property
        cls.property = Property.objects.create(
            land_lord=cls.user,
            name="Test Property",
            address="123 Test Street",
            city_index=0,
            area_index=0,
            price=1000.00,
            description="Test description",
            rooms=2,
            additional_details={"furnished": True},
            status=Property.AVAILABLE,
            latitude=7.8731,
            longitude=80.7718,
            location_url="https://maps.example.com",
        )
        cls.property.universities.add(cls.university)

        # URLs
        cls.list_url = reverse("property-list")
        cls.detail_url = reverse("property", args=[cls.property.id])

    def setUp(self):
        # Authenticate the user for all tests
        self.client.force_authenticate(user=self.user)

    def test_list_properties(self):
        """Test that authenticated users can list properties"""
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "success")
        self.assertIn("data", response.data)

    def test_retrieve_property(self):
        """Test that authenticated users can retrieve a specific property"""
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "success")
        self.assertEqual(response.data["data"]["name"], self.property.name)

    def test_delete_property(self):
        """Test that landlords can delete their own properties"""
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Property.objects.filter(id=self.property.id).exists())
