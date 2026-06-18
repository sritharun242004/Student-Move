from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth.models import User


class UserLoginViewTest(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.url = reverse("user-login")
        cls.user = User.objects.create_user(
            first_name="first",
            last_name="last",
            username="testuser",
            email="testuser@example.com",
            password="password123",
        )

    def setUp(self):
        self.data = {
            "email": "testuser@example.com",
            "password": "password123",
        }

    def post_request(self, data):
        return self.client.post(self.url, data, format="json")

    def test_login_user_success(self):
        response = self.post_request(self.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "success")
        self.assertEqual(response.data["message"], "User Loged In Successfully")
        self.assertIn("userData", response.data)

    def test_login_user_invalid_email(self):
        self.data["email"] = "invalid@example.com"
        response = self.post_request(self.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["status"], "fail")
        self.assertEqual(response.data["message"], ["Invalid email or password"])

    def test_login_user_invalid_password(self):
        self.data["password"] = "wrongpassword"
        response = self.post_request(self.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["status"], "fail")
        self.assertEqual(response.data["message"], ["Invalid email or password"])

    def test_login_user_missing_email(self):
        del self.data["email"]
        response = self.post_request(self.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["status"], "fail")
        self.assertEqual(response.data["message"], ["email field is required."])

    def test_login_user_missing_password(self):
        del self.data["password"]
        response = self.post_request(self.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["status"], "fail")
        self.assertEqual(response.data["message"], ["password field is required."])
