#!/usr/bin/env python
"""
Test script for the shared guarantor endpoint
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'studentmove.settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import User
from forms.models import ApplicationForm, Property, GuarantorShareToken
from properties.models import Property as PropertyModel

def test_shared_endpoint():
    """Test the shared guarantor endpoint"""
    
    # Create test client
    client = Client()
    
    # Create test user
    user = User.objects.create_user(
        username='testuser2',
        email='test2@example.com',
        password='testpass123'
    )
    
    # Get or create a property
    try:
        property_obj = PropertyModel.objects.first()
        if not property_obj:
            property_obj = PropertyModel.objects.create(
                title="Test Property",
                description="Test Description",
                price=1000,
                # Add other required fields based on your Property model
            )
    except Exception as e:
        print(f"Error with property: {e}")
        return
    
    # Create test application
    application = ApplicationForm.objects.create(
        user=user,
        property=property_obj,
        dob='1990-01-01',
        home_address='123 Test St',
        postcode='12345',
        personal_email='test2@example.com',
        rent_payer='Test User',
        status='Student'
    )
    
    # Create share token
    share_token = GuarantorShareToken.objects.create(
        application=application
    )
    
    print(f"Created share token: {share_token.token}")
    
    # Test GET request
    url = '/api/forms/shared/guarantor/'
    response = client.get(
        url,
        HTTP_X_GUARANTOR_TOKEN=share_token.token,
        content_type='application/json'
    )
    
    print(f"GET {url}")
    print(f"Status Code: {response.status_code}")
    if response.status_code < 500:
        try:
            print(f"Response: {response.json()}")
        except:
            print(f"Response (text): {response.content.decode()}")
    else:
        print(f"Response: {response.content}")
    
    if response.status_code == 200:
        print("✓ SUCCESS: Shared endpoint accessible!")
    else:
        print(f"✗ ERROR: Request failed with status {response.status_code}")
    
    # Test POST request
    test_data = {
        "guarantor_name": "Test Guarantor",
        "occupation": "Teacher",
        "home_address": "456 Guarantor St",
        "work_address": "789 Work Ave",
        "time_at_address": "2 years",
        "mobile": "1234567890",
        "personal_email": "guarantor@test.com",
        "work_email": "guarantor@work.com",
        "bank_name": "Test Bank",
        "branch_address": "Bank Street",
        "g_relationship": "Parent",
        "ws_relationship": "Friend"
    }
    
    response = client.post(
        url,
        data=test_data,
        HTTP_X_GUARANTOR_TOKEN=share_token.token,
        content_type='application/json'
    )
    
    print(f"\nPOST {url}")
    print(f"Status Code: {response.status_code}")
    if response.status_code < 500:
        try:
            print(f"Response: {response.json()}")
        except:
            print(f"Response (text): {response.content.decode()}")
    else:
        print(f"Response: {response.content}")
    
    # Cleanup
    share_token.delete()
    application.delete()
    user.delete()

if __name__ == '__main__':
    test_shared_endpoint()