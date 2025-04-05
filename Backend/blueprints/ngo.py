from flask import Blueprint, request, jsonify, session
import boto3
from botocore.exceptions import ClientError
from datetime import datetime
from .auth import login_required

ngo_bp = Blueprint('ngo', __name__)

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
ngos_table = dynamodb.Table('NGOs')
jobs_table = dynamodb.Table('Jobs')
videos_table = dynamodb.Table('Videos')

@ngo_bp.route('/dashboard', methods=['GET'])
@login_required
def get_dashboard():
    try:
        ngo_id = session.get('ngo_id')
        # Get NGO details
        ngo = ngos_table.get_item(Key={'ngo_id': ngo_id})['Item']
        
        # Get jobs posted by NGO
        jobs = jobs_table.scan(
            FilterExpression='ngo_id = :ngo_id',
            ExpressionAttributeValues={':ngo_id': ngo_id}
        )['Items']
        
        # Get videos posted by NGO
        videos = videos_table.scan(
            FilterExpression='ngo_id = :ngo_id',
            ExpressionAttributeValues={':ngo_id': ngo_id}
        )['Items']
        
        return jsonify({
            'ngo': ngo,
            'jobs': jobs,
            'videos': videos
        }), 200
    except ClientError as e:
        return jsonify({'message': str(e)}), 500

@ngo_bp.route('/post-job', methods=['POST'])
def post_job():
    try:
        # First check if user is logged in via session
        ngo_id = session.get('ngo_id')
        
        # If not in session, try to get from form data
        if not ngo_id:
            ngo_id = request.form.get('ngo_id')
            print(f"Using NGO ID from form data: {ngo_id}")
            
        if not ngo_id:
            return jsonify({'message': 'Authentication required. Please log in.'}), 401
            
        print(f"Session data: {dict(session)}")
        print(f"Request form: {request.form}")
        print(f"Request files: {request.files}")
        
        # Handle form data instead of JSON
        title = request.form.get('title')
        description = request.form.get('description')
        location = request.form.get('location')
        skills_required = request.form.get('skills_required', '[]')
        
        print(f"Extracted values: title={title}, description={description}, location={location}")
        
        # Handle file upload if present
        pdf_file = None
        if 'pdf' in request.files:
            pdf_file = request.files['pdf']
            print(f"PDF file received: {pdf_file.filename}")
            # In a real application, you would upload this file to S3 or similar
            # and store the URL in the job record
        
        if not all([title, description, location]):
            missing = []
            if not title: missing.append('title')
            if not description: missing.append('description')
            if not location: missing.append('location')
            print(f"Missing required fields: {', '.join(missing)}")
            return jsonify({'message': f"Missing required fields: {', '.join(missing)}"}), 400
            
        job = {
            'job_id': str(datetime.now().timestamp()),
            'ngo_id': ngo_id,
            'title': title,
            'description': description,
            'location': location,
            'skills_required': skills_required,
            'created_at': datetime.now().isoformat()
        }
        
        # Add PDF URL if file was uploaded
        if pdf_file:
            # In a real application, this would be the S3 URL
            job['pdf_url'] = f"uploads/{pdf_file.filename}"
            
        jobs_table.put_item(Item=job)
        return jsonify({'message': 'Job posted successfully', 'job_id': job['job_id']}), 201
    except Exception as e:
        print(f"Error posting job: {str(e)}")
        return jsonify({'message': str(e)}), 500

@ngo_bp.route('/post-video', methods=['POST'])
@login_required
def post_video():
    data = request.get_json()
    
    try:
        ngo_id = session.get('ngo_id')
        
        # Create the base video item with required fields
        video = {
            'video_id': str(datetime.now().timestamp()),
            'ngo_id': ngo_id,
            'title': data['title'],
            'description': data['description'],
            'url': data['url'],
            'created_at': datetime.now().isoformat()
        }
        
        # Add skills_covered if provided
        if 'skills_covered' in data:
            video['skills_covered'] = data['skills_covered']
        
        # Add additional fields if they exist in the data
        if 'skill' in data:
            video['skill'] = data['skill']
            
        if 'level' in data:
            # 'level' is a reserved keyword but directly adding to item is fine
            video['level'] = data['level']
            
        if 'thumbnail_url' in data:
            video['thumbnail_url'] = data['thumbnail_url']
            
        if 'duration' in data:
            # 'duration' is a reserved keyword but directly adding to item is fine
            video['duration'] = data['duration']
        
        # Put the item in DynamoDB
        videos_table.put_item(Item=video)
        
        return jsonify({'message': 'Video posted successfully', 'video': video}), 201
    except ClientError as e:
        return jsonify({'message': str(e)}), 500

@ngo_bp.route('/jobs', methods=['GET'])
def get_jobs():
    try:
        # First check if user is logged in via session
        ngo_id = session.get('ngo_id')
        
        # If not in session, try to get from form data or query params
        if not ngo_id:
            ngo_id = request.args.get('ngo_id') or request.form.get('ngo_id')
            print(f"Using NGO ID from request data: {ngo_id}")
            
        if not ngo_id:
            return jsonify({'message': 'Authentication required. Please log in.'}), 401
            
        jobs = jobs_table.scan(
            FilterExpression='ngo_id = :ngo_id',
            ExpressionAttributeValues={':ngo_id': ngo_id}
        )['Items']
        return jsonify(jobs), 200
    except ClientError as e:
        return jsonify({'message': str(e)}), 500

@ngo_bp.route('/videos', methods=['GET'])
def get_videos():
    try:
        # First check if user is logged in via session
        ngo_id = session.get('ngo_id')
        
        # If not in session, try to get from form data or query params
        if not ngo_id:
            ngo_id = request.args.get('ngo_id') or request.form.get('ngo_id')
            print(f"Using NGO ID from request data: {ngo_id}")
            
        if not ngo_id:
            return jsonify({'message': 'Authentication required. Please log in.'}), 401
            
        videos = videos_table.scan(
            FilterExpression='ngo_id = :ngo_id',
            ExpressionAttributeValues={':ngo_id': ngo_id}
        )['Items']
        return jsonify(videos), 200
    except ClientError as e:
        return jsonify({'message': str(e)}), 500 