import firebase_admin
from firebase_admin import credentials, firestore
import hashlib

# Initialize Firebase (update path to your service account key)
cred = credentials.Certificate("/Users/dulajupananda/Documents/Projects/Multi-Dimensional-Course-Performance-Analytics-Dashboard/server/serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# Test credentials
test_email = "cis.ad1@hct.ac.ae"
test_password = "_lh;O1^>"

print(f"Testing login for: {test_email}")

# Check if user exists in departmentHeads collection (with capital H and B)
print("Checking departmentHeads collection...")
dept_heads_query = db.collection('departmentHeads').where('email', '==', test_email).stream()
user_found = False

for doc in dept_heads_query:
    user_found = True
    dept_head_data = doc.to_dict()
    print(f"Found user in departmentHeads collection:")
    print(f"  Document ID: {doc.id}")
    print(f"  Data: {dept_head_data}")
    
    # Check password
    if dept_head_data.get('password') == test_password:
        print("Password matches!")
        print("Login should work.")
    else:
        print(f"Password mismatch. Expected: {test_password}, Got: {dept_head_data.get('password')}")

if not user_found:
    print("User not found in departmentHeads collection")

# Also check other collections for completeness
print("\nChecking other collections...")

# Check instructors collection
print("Checking instructors collection...")
instructors_query = db.collection('instructors').where('email', '==', test_email).stream()
for doc in instructors_query:
    print(f"Found user in instructors collection: {doc.id}")

# Check admins collection
print("Checking admins collection...")
admins_query = db.collection('admins').where('email', '==', test_email).stream()
for doc in admins_query:
    print(f"Found user in admins collection: {doc.id}")

# Check students collection
print("Checking students collection...")
student_id = test_email.split('@')[0]
students_query = db.collection('students').where('studentId', '==', student_id).stream()
for doc in students_query:
    print(f"Found user in students collection: {doc.id}")

print("Test completed.")