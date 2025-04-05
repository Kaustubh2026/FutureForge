import boto3
import bcrypt
from datetime import datetime

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
users_table = dynamodb.Table('Users')
ngos_table = dynamodb.Table('NGOs')

def create_test_credentials():
    # Create test user
    user_password = bcrypt.hashpw('user123'.encode('utf-8'), bcrypt.gensalt())
    user = {
        'user_id': 'test_user_1',
        'email': 'user@test.com',
        'password': user_password.decode('utf-8'),
        'full_name': 'Test User',
        'age': 25,
        'location': 'Mumbai',
        'created_at': datetime.now().isoformat()
    }
    users_table.put_item(Item=user)
    print("Created test user:")
    print(f"Email: user@test.com")
    print(f"Password: user123")

    # Create test NGO
    ngo_password = bcrypt.hashpw('ngo123'.encode('utf-8'), bcrypt.gensalt())
    ngo = {
        'ngo_id': 'test_ngo_1',
        'email': 'ngo@test.com',
        'password': ngo_password.decode('utf-8'),
        'organization_name': 'Test NGO',
        'location': 'Delhi',
        'description': 'Test NGO Organization',
        'created_at': datetime.now().isoformat()
    }
    ngos_table.put_item(Item=ngo)
    print("\nCreated test NGO:")
    print(f"Email: ngo@test.com")
    print(f"Password: ngo123")

if __name__ == '__main__':
    create_test_credentials() 