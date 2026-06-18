#!/usr/bin/env python3

import requests
import json

# Base URL
BASE_URL = "http://localhost:8000/api"

def test_shared_form_navigation():
    """Test that the shared form can handle navigation between steps"""
    
    # First, get a valid token (you'll need to replace this with a real token)
    token = "YOUR_TOKEN_HERE"  # Replace with actual token from previous test
    
    print("Testing shared form navigation...")
    
    # Test retrieving the form (simulating page load)
    headers = {"X-Guarantor-Token": token}
    
    try:
        response = requests.get(f"{BASE_URL}/forms/shared/guarantor/", headers=headers)
        print(f"GET /forms/shared/guarantor/ - Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Form retrieval successful")
            data = response.json()
            
            # Test posting partial data (like what happens on "Next" button)
            test_data = {
                "guarantor_name": "Test Guarantor",
                "occupation": "Engineer",
                "home_address": "123 Test St",
                "work_address": "456 Work Ave",
                "time_at_address": "2 years",
                "previous_address": "789 Old St",
                "home_phone": "555-1234",
                "work_phone": "555-5678",
                "mobile": "555-9012",
                "personal_email": "test@example.com",
                "work_email": "test@work.com",
                "bank_name": "Test Bank",
                "branch_address": "Branch Address",
                "fax": "555-0000"
            }
            
            # Test POST (simulating form submission/next button)
            response = requests.post(
                f"{BASE_URL}/forms/shared/guarantor/",
                headers={**headers, "Content-Type": "application/json"},
                json=test_data
            )
            
            print(f"\nPOST /forms/shared/guarantor/ - Status: {response.status_code}")
            print(f"Response: {response.text}")
            
            if response.status_code in [200, 201]:
                print("✅ Form submission successful")
            else:
                print("❌ Form submission failed")
                
        else:
            print("❌ Form retrieval failed")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection failed. Is the Django server running?")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_shared_form_navigation()