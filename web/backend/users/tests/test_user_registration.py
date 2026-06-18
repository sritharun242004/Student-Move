from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from django.contrib.auth.models import Group


class UserRegisterViewTest(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.url = reverse("user-registration")

    def setUp(self):
        self.data = {
            "firstName": "first",
            "role": "tenant",
            "lastName": "last",
            "email": "test@gmail.com",
            "password": "password",
            "phone": "1234567890",
        }

    def create_user(self, email):
        return User.objects.create_user(
            first_name="existing",
            last_name="user",
            username=email,
            email=email,
            password="password123",
        )

    def post_request(self, data):
        return self.client.post(self.url, data, format="json")

    def test_create_user_success(self):
        response = self.post_request(self.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created_user = User.objects.get(email=self.data["email"])
        self.assertEqual(created_user.email, self.data["email"])

        group = Group.objects.get(name="tenant")
        self.assertTrue(created_user.groups.filter(name=group.name).exists())

    def test_create_user_wrong_email_format(self):
        self.data["email"] = "testgmail.com"
        response = self.post_request(self.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["message"], ["Enter a valid email address."])

    def test_email_uniqueness(self):
        self.create_user("existing@example.com")
        self.data["email"] = "existing@example.com"
        response = self.post_request(self.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["message"], ["Email already exists"])

    def test_email_and_not_provided(self):
        del self.data["email"]
        response = self.post_request(self.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        messages = ["Email is required"]
        self.assertTrue(
            any(message in response.data["message"] for message in messages)
        )

    def test_password_not_provided(self):
        del self.data["password"]
        response = self.post_request(self.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["message"], ["password field is required."])

    def test_cannot_be_added_to_admin_group(self):
        self.data["role"] = "admin"
        response = self.post_request(self.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data["message"], ["Role must be 'landlord', 'tenant', 'agent', or 'merchant'"]
        )
