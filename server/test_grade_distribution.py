#!/usr/bin/env python3
"""
Test script to verify the new grade distribution endpoint
"""

import sys
import os
import requests

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

def test_grade_distribution_endpoint():
    """Test the new grade distribution endpoint"""
    print("Testing grade distribution endpoint...")
    
    try:
        # Test the endpoint (assuming server is running on localhost:8001)
        url = "http://localhost:8001/api/instructor/courses/instructor/grade-distribution"
        print(f"Testing endpoint: {url}")
        
        # Since this endpoint requires authentication, we'll just check if it exists
        # by making a request and checking the response status
        try:
            response = requests.get(url, timeout=5)
            print(f"Response status code: {response.status_code}")
            print(f"Response headers: {response.headers}")
            
            if response.status_code == 401:
                print("✅ Endpoint exists and requires authentication (expected)")
                print("Response:", response.json() if response.content else "No content")
            elif response.status_code == 200:
                print("✅ Endpoint exists and is accessible")
                print("Response:", response.json())
            else:
                print(f"⚠️  Unexpected status code: {response.status_code}")
                print("Response:", response.text)
                
        except requests.exceptions.ConnectionError:
            print("❌ Could not connect to server. Make sure the server is running on localhost:8001")
            print("Start the server with: cd server && python3 main.py")
            return False
        except requests.exceptions.Timeout:
            print("❌ Request timed out")
            return False
            
        return True
        
    except Exception as e:
        print(f"❌ Error testing grade distribution endpoint: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return False

def main():
    """Main function"""
    print("🧪 Testing Grade Distribution Endpoint")
    print("=" * 40)
    
    if test_grade_distribution_endpoint():
        print("\n✅ Grade distribution endpoint test completed!")
        return True
    else:
        print("\n❌ Grade distribution endpoint test failed")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)