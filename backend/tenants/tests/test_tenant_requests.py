from django.contrib.auth.models import User, Group
from rest_framework.test import APITestCase
from rest_framework import status
from properties.models import Property, University
from tenants.models import Lease,Inquiries
from django.urls import reverse
from users.models import Profile
from chat.models import ChatThread


class LeaseAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        # Create groups
        cls.admin_group, _ = Group.objects.get_or_create(name="admin")
        cls.landlord_group, _ = Group.objects.get_or_create(name="landlord")
        cls.tenant_group, _ = Group.objects.get_or_create(name="tenant")

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
        cls.landlord_user_profile = Profile.objects.create(
            user=cls.landlord_user,
            phone="0987654321",
        )
        cls.landlord_user.groups.add(cls.landlord_group)  # Assign to landlord group

        # Create tenant user
        cls.tenant_user = User.objects.create_user(
            username="tenant_user",
            password="tenantpass123",
        )

        cls.tenant_user.groups.add(cls.tenant_group)  # Assign to tenant group

        # Create regular user with no special permissions
        cls.regular_user = User.objects.create_user(
            username="regular_user",
            password="regularpass123",
        )

        # Create a university
        cls.university = University.objects.create(name="Test University")

        # Create a property
        cls.property = Property.objects.create(
            name="New Property",
            address="456 New Street",
            city_index=0,
            area_index=0,
            price=2000.00,
            description="Nice place to live",
            rooms=3,
            additional_details='{"parking": true}',  # Send as JSON string
            status=Property.AVAILABLE,
            land_lord=cls.landlord_user,
        )

        # URLs for the API endpoints
        cls.tenant_request_list_url = reverse("tenantrequest-list")
        cls.tenant_request_detail_url = lambda pk: reverse(
            "tenantrequest-detail", args=[pk]
        )

    def test_create_tenant_request(self):
        """Test that a tenant can create a tenant request."""
        self.client.force_authenticate(user=self.tenant_user)

        data = {"property_obj": self.property.id, "start_date": "2025-04-01","lease_months":3}

        inqury = Inquiries.objects.create(
            tenant=self.tenant_user,
            property=self.property,
            status="resolved",
        )
        response = self.client.post(self.tenant_request_list_url, data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], "success")
        self.assertEqual(response.data["data"]["propertyObj"], self.property.id)
        # self.assertEqual(response.data["data"]["status"], "requested")

    def test_create_duplicate_tenant_request(self):
        """Test that a tenant cannot create a duplicate tenant request for the same property."""
        self.client.force_authenticate(user=self.tenant_user)
        inqury = Inquiries.objects.create(
            tenant=self.tenant_user,
            property=self.property,
            status="resolved",
        )
        data = {"property_obj": self.property.id, "start_date": "2025-04-01","lease_months":3}
        self.client.post(self.tenant_request_list_url, data)  # First request
        response = self.client.post(
            self.tenant_request_list_url, data
        )  # Duplicate request
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["status"], "fail")
        self.assertEqual(
            response.data["message"][0], "You have already requested this property."
        )

    def test_list_tenant_requests_as_landlord(self):
        """Test that a landlord can list all tenant requests."""
        self.client.force_authenticate(user=self.landlord_user)
        response = self.client.get(self.tenant_request_list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "success")

    def test_list_tenant_requests_as_admin(self):
        """Test that an admin can list all tenant requests."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.tenant_request_list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "success")

    def test_list_tenant_requests_as_tenant(self):
        """Test that a tenant can list only their own tenant requests."""
        self.client.force_authenticate(user=self.tenant_user)
        response = self.client.get(self.tenant_request_list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "success")

    def test_retrieve_tenant_request(self):
        """Test that a tenant can retrieve their own tenant request."""
        self.client.force_authenticate(user=self.tenant_user)
        tenant_request = Lease.objects.create(
            tenant=self.tenant_user, property_obj=self.property, start_date="2025-04-01",lease_months=2
        )
        chat_thread = ChatThread.objects.create(
            thread_type="tenant_request",
            lease=tenant_request,
        )
        chat_thread.participants.set([self.tenant_user, self.landlord_user])
        url = self.tenant_request_detail_url(tenant_request.id)
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "success")
        self.assertEqual(response.data["data"]["id"], tenant_request.id)

    def test_delete_tenant_request(self):
        """Test that a tenant can delete their own tenant request."""
        self.client.force_authenticate(user=self.tenant_user)
        tenant_request = Lease.objects.create(
            tenant=self.tenant_user, property_obj=self.property, start_date="2025-04-01",lease_months=2
        )
        url = self.tenant_request_detail_url(tenant_request.id)
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Lease.objects.filter(id=tenant_request.id).exists())
