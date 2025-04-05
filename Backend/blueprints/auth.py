from flask import Blueprint, request, jsonify, session
import boto3
from botocore.exceptions import ClientError
from datetime import datetime
from functools import wraps
import logging

auth_bp = Blueprint('auth', __name__)

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
users_table = dynamodb.Table('Users')
ngos_table = dynamodb.Table('NGOs')

# Configure basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('auth')

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        logger.info(f"Session contents: {dict(session)}")
        logger.info(f"Request cookies: {request.cookies}")
        logger.info(f"Request headers: {dict(request.headers)}")
        
        # Check if user is logged in
        if 'user_id' not in session and 'ngo_id' not in session:
            logger.warning("Access denied: No user_id or ngo_id in session")
            return jsonify({'message': 'Authentication required. Please log in.'}), 401
            
        # Add debug information about which user/ngo is accessing
        if 'user_id' in session:
            logger.info(f"User access: user_id={session.get('user_id')}")
        else:
            logger.info(f"NGO access: ngo_id={session.get('ngo_id')}")
            
        return f(*args, **kwargs)
    return decorated_function

@auth_bp.route('/register/user', methods=['POST'])
def register_user():
    data = request.get_json()
    
    # Check if user already exists
    try:
        response = users_table.scan(
            FilterExpression='email = :email',
            ExpressionAttributeValues={':email': data['email']}
        )
        if response['Items']:
            return jsonify({'message': 'User already exists'}), 400
    except ClientError as e:
        return jsonify({'message': str(e)}), 500
    
    # Create user
    try:
        user = {
            'user_id': str(datetime.now().timestamp()),
            'email': data['email'],
            'password': data['password'],
            'full_name': data['full_name'],
            'age': int(data['age']),
            'location': data['location'],
            'created_at': datetime.now().isoformat()
        }
        users_table.put_item(Item=user)
        return jsonify({'message': 'User registered successfully'}), 201
    except ClientError as e:
        return jsonify({'message': str(e)}), 500

@auth_bp.route('/register/ngo', methods=['POST'])
def register_ngo():
    data = request.get_json()
    
    # Check if NGO already exists
    try:
        response = ngos_table.scan(
            FilterExpression='email = :email',
            ExpressionAttributeValues={':email': data['email']}
        )
        if response['Items']:
            return jsonify({'message': 'NGO already exists'}), 400
    except ClientError as e:
        return jsonify({'message': str(e)}), 500
    
    # Create NGO
    try:
        ngo = {
            'ngo_id': str(datetime.now().timestamp()),
            'email': data['email'],
            'password': data['password'],
            'organization_name': data['organization_name'],
            'location': data['location'],
            'description': data['description'],
            'created_at': datetime.now().isoformat()
        }
        ngos_table.put_item(Item=ngo)
        return jsonify({'message': 'NGO registered successfully'}), 201
    except ClientError as e:
        return jsonify({'message': str(e)}), 500

@auth_bp.route('/login/user', methods=['POST'])
def login_user():
    data = request.get_json()
    
    try:
        response = users_table.scan(
            FilterExpression='email = :email AND password = :password',
            ExpressionAttributeValues={
                ':email': data['email'],
                ':password': data['password']
            }
        )
        if not response['Items']:
            return jsonify({'message': 'Invalid email or password'}), 401
        
        user = response['Items'][0]
        # Set session data
        session['user_id'] = user['user_id']
        session['user_type'] = 'user'
        
        return jsonify({
            'user_id': user['user_id'],
            'email': user['email'],
            'full_name': user['full_name']
        }), 200
    except ClientError as e:
        return jsonify({'message': str(e)}), 500

@auth_bp.route('/login/ngo', methods=['POST'])
def login_ngo():
    data = request.get_json()
    
    try:
        response = ngos_table.scan(
            FilterExpression='email = :email AND password = :password',
            ExpressionAttributeValues={
                ':email': data['email'],
                ':password': data['password']
            }
        )
        if not response['Items']:
            return jsonify({'message': 'Invalid email or password'}), 401
        
        ngo = response['Items'][0]
        # Set session data
        session['ngo_id'] = ngo['ngo_id']
        session['user_type'] = 'ngo'
        
        return jsonify({
            'ngo_id': ngo['ngo_id'],
            'email': ngo['email'],
            'organization_name': ngo['organization_name']
        }), 200
    except ClientError as e:
        return jsonify({'message': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'}), 200 