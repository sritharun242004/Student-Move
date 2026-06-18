from django.contrib.auth.models import User, Group
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.urls import reverse


class UserListAPITestCase(APITestCase):
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
        cls.admin_user.groups.add(cls.admin_group)

        # Create landlord user
        cls.landlord_user = User.objects.create_user(
            username="landlord_user",
            password="landlordpass123",
        )
        cls.landlord_user.groups.add(cls.landlord_group)

        # Create tenant user
        cls.tenant_user = User.objects.create_user(
            username="tenant_user",
            password="tenantpass123",
        )
        cls.tenant_user.groups.add(cls.tenant_group)

        # Create a regular user (not in any group)
        cls.regular_user = User.objects.create_user(
            username="regular_user",
            password="regularpass123",
        )

    def test_admin_can_access_user_list(self):
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("user-list", kwargs={"role": "admin"})
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "success")

        # Ensure that 'data' is a list
        self.assertIsInstance(response.data["users"], list)

        # Extract emails instead of usernames (since 'username' is missing)
        emails = [user["email"] for user in response.data["users"]]

        # Ensure there's at least one user in the response
        self.assertGreater(len(emails), 0)

    def test_landlord_can_access_user_list(self):
        """Test that landlord users can access the user list API."""
        self.client.force_authenticate(user=self.landlord_user)
        url = reverse("user-list", kwargs={"role": "landlord"})
        response = self.client.get(url)

        # Should return 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "success")

        # Ensure that 'data' is a list
        self.assertIsInstance(response.data["users"], list)

        # Extract emails instead of usernames (since 'username' is missing)
        emails = [user["email"] for user in response.data["users"]]

        # Ensure there's at least one user in the response
        self.assertGreater(len(emails), 0)

    def test_tenant_cannot_access_user_list(self):
        """Test that tenant users cannot access the user list API."""
        self.client.force_authenticate(user=self.tenant_user)
        url = reverse("user-list", kwargs={"role": "admin"})
        response = self.client.get(url)

        # Should return 403 Forbidden
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_user_cannot_access_user_list(self):
        """Test that unauthenticated users cannot access the user list API."""
        url = reverse("user-list", kwargs={"role": "admin"})
        response = self.client.get(url)

        # Should return 401 Unauthorized
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
