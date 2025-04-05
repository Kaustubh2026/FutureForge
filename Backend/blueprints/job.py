from flask import Blueprint, request, jsonify, session
import boto3
from botocore.exceptions import ClientError
from datetime import datetime
from .auth import login_required

job_bp = Blueprint('job', __name__)

# Initialize DynamoDB and S3
dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
s3 = boto3.client('s3', region_name='ap-south-1')
jobs_table = dynamodb.Table('Jobs')

@job_bp.route('/list', methods=['GET'])
def list_jobs():
    try:
        jobs = jobs_table.scan()['Items']
        return jsonify(jobs), 200
    except ClientError as e:
        return jsonify({'message': str(e)}), 500

@job_bp.route('/<job_id>', methods=['GET'])
def get_job(job_id):
    try:
        job = jobs_table.get_item(Key={'job_id': job_id})['Item']
        return jsonify(job), 200
    except ClientError as e:
        return jsonify({'message': str(e)}), 500

@job_bp.route('/upload-pdf', methods=['POST'])
@login_required
def upload_job_pdf():
    try:
        ngo_id = session.get('ngo_id')
        # Get the file from the request
        file = request.files['pdf']
        job_id = request.form.get('job_id')
        
        if not file or not job_id:
            return jsonify({'message': 'Missing required fields'}), 400
        
        # Verify job ownership
        job = jobs_table.get_item(Key={'job_id': job_id})['Item']
        if job['ngo_id'] != ngo_id:
            return jsonify({'message': 'Unauthorized'}), 403
        
        # Generate a unique filename
        filename = f"{job_id}_{file.filename}"
        
        # Upload to S3
        s3.upload_fileobj(
            file,
            'riseup-job-pdfs',
            filename,
            ExtraArgs={'ContentType': 'application/pdf'}
        )
        
        # Generate the PDF URL
        pdf_url = f"https://riseup-job-pdfs.s3.ap-south-1.amazonaws.com/{filename}"
        
        # Update job with PDF URL
        jobs_table.update_item(
            Key={'job_id': job_id},
            UpdateExpression='SET pdf_url = :pdf_url',
            ExpressionAttributeValues={':pdf_url': pdf_url}
        )
        
        return jsonify({'message': 'PDF uploaded successfully'}), 200
    except ClientError as e:
        return jsonify({'message': str(e)}), 500

@job_bp.route('/search', methods=['GET'])
def search_jobs():
    try:
        # Get search parameters
        location = request.args.get('location')
        skills = request.args.getlist('skills')
        
        # Build filter expression
        filter_expressions = []
        expression_values = {}
        
        if location:
            filter_expressions.append('location = :location')
            expression_values[':location'] = location
        
        if skills:
            for i, skill in enumerate(skills):
                filter_expressions.append(f'contains(skills_required, :skill{i})')
                expression_values[f':skill{i}'] = skill
        
        # Combine filter expressions
        if filter_expressions:
            filter_expression = ' AND '.join(filter_expressions)
        else:
            filter_expression = None
        
        # Scan jobs table with filters
        if filter_expression:
            jobs = jobs_table.scan(
                FilterExpression=filter_expression,
                ExpressionAttributeValues=expression_values
            )['Items']
        else:
            jobs = jobs_table.scan()['Items']
        
        return jsonify(jobs), 200
    except ClientError as e:
        return jsonify({'message': str(e)}), 500

@job_bp.route('/<job_id>', methods=['PUT'])
def update_job(job_id):
    try:
        # Job ID is already available from the URL parameter
        print(f"Updating job with ID: {job_id}")
        
        # First check if user is logged in via session
        ngo_id = session.get('ngo_id')
        
        # If not in session, try to get from query params
        if not ngo_id:
            ngo_id = request.args.get('ngo_id')
            print(f"Using NGO ID from query params: {ngo_id}")
            
        if not ngo_id:
            return jsonify({'message': 'Authentication required. Please log in.'}), 401
            
        # Get the updated data
        data = request.get_json()
        print(f"Update data received: {data}")
        
        # Fetch current job to verify ownership
        job = jobs_table.get_item(Key={'job_id': job_id})
        
        if 'Item' not in job:
            return jsonify({'message': 'Job not found'}), 404
            
        if job['Item']['ngo_id'] != ngo_id:
            return jsonify({'message': 'Unauthorized. You do not own this job.'}), 403
            
        # Update the job
        update_expression = 'SET '
        expression_values = {}
        
        if 'title' in data:
            update_expression += 'title = :title, '
            expression_values[':title'] = data['title']
            
        if 'description' in data:
            update_expression += 'description = :description, '
            expression_values[':description'] = data['description']
            
        if 'location' in data:
            update_expression += 'location = :location, '
            expression_values[':location'] = data['location']
            
        if 'skills_required' in data:
            update_expression += 'skills_required = :skills_required, '
            expression_values[':skills_required'] = data['skills_required']
            
        # Add updated_at timestamp
        update_expression += 'updated_at = :updated_at'
        expression_values[':updated_at'] = datetime.now().isoformat()
        
        # Update the item in DynamoDB
        response = jobs_table.update_item(
            Key={'job_id': job_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values,
            ReturnValues='ALL_NEW'
        )
        
        return jsonify(response['Attributes']), 200
    except ClientError as e:
        print(f"Error updating job: {str(e)}")
        return jsonify({'message': str(e)}), 500
    except Exception as e:
        print(f"Error updating job: {str(e)}")
        return jsonify({'message': str(e)}), 500

@job_bp.route('/<job_id>', methods=['DELETE'])
def delete_job(job_id):
    try:
        # Job ID is already available from the URL parameter
        print(f"Deleting job with ID: {job_id}")
        
        # First check if user is logged in via session
        ngo_id = session.get('ngo_id')
        
        # If not in session, try to get from query params
        if not ngo_id:
            ngo_id = request.args.get('ngo_id')
            print(f"Using NGO ID from query params: {ngo_id}")
            
        if not ngo_id:
            return jsonify({'message': 'Authentication required. Please log in.'}), 401
            
        # Fetch current job to verify ownership
        job = jobs_table.get_item(Key={'job_id': job_id})
        
        if 'Item' not in job:
            return jsonify({'message': 'Job not found'}), 404
            
        if job['Item']['ngo_id'] != ngo_id:
            return jsonify({'message': 'Unauthorized. You do not own this job.'}), 403
        
        # Delete the job
        jobs_table.delete_item(Key={'job_id': job_id})
        
        return jsonify({'message': 'Job deleted successfully'}), 200
    except ClientError as e:
        print(f"Error deleting job: {str(e)}")
        return jsonify({'message': str(e)}), 500
    except Exception as e:
        print(f"Error deleting job: {str(e)}")
        return jsonify({'message': str(e)}), 500

@job_bp.route('/<job_id>/apply', methods=['POST'])
def apply_to_job(job_id):
    try:
        # Add debug printing
        print(f"Received application request for job: {job_id}")
        print(f"Request data: {request.get_json()}")
        
        # Get user ID from session or request data
        user_id = session.get('user_id')
        print(f"User ID from session: {user_id}")
        
        # If not in session, try to get from request data
        if not user_id:
            data = request.get_json()
            print(f"Request JSON data: {data}")
            user_id = data.get('user_id')
            print(f"User ID from request data: {user_id}")
            
        if not user_id:
            print("No user ID found in session or request data")
            return jsonify({'message': 'Authentication required. Please log in.'}), 401
        
        print(f"Proceeding with application for user ID: {user_id}, job ID: {job_id}")
        
        # Check if job exists
        job = jobs_table.get_item(Key={'job_id': job_id})
        print(f"Job data: {job.get('Item')}")
        
        if 'Item' not in job:
            print(f"Job not found: {job_id}")
            return jsonify({'message': 'Job not found'}), 404
        
        # Initialize DynamoDB table for applications if not already done
        applications_table = dynamodb.Table('Applications')
        
        # Check if user already applied for this job
        try:
            existing_application = applications_table.scan(
                FilterExpression='job_id = :job_id AND user_id = :user_id',
                ExpressionAttributeValues={
                    ':job_id': job_id,
                    ':user_id': user_id
                }
            )['Items']
            
            print(f"Existing applications found: {len(existing_application)}")
            
            if existing_application:
                print(f"User already applied for this job: {existing_application}")
                return jsonify({'message': 'You have already applied for this job'}), 400
        except Exception as e:
            print(f"Error checking existing application: {str(e)}")
            # If table doesn't exist, we'll create it with the first application
            pass
        
        # Create application record
        application_id = str(datetime.now().timestamp())
        application = {
            'application_id': application_id,
            'job_id': job_id,
            'user_id': user_id,
            'application_date': datetime.now().isoformat(),
            'status': 'pending',
            'job_title': job['Item'].get('title', 'Unknown Job'),
            'ngo_id': job['Item'].get('ngo_id', 'Unknown NGO')
        }
        
        # Create Applications table if it doesn't exist
        try:
            applications_table.put_item(Item=application)
        except Exception as e:
            print(f"Error creating application: {str(e)}")
            # Create the table if it doesn't exist
            applications_table = dynamodb.create_table(
                TableName='Applications',
                KeySchema=[
                    {'AttributeName': 'application_id', 'KeyType': 'HASH'}
                ],
                AttributeDefinitions=[
                    {'AttributeName': 'application_id', 'AttributeType': 'S'}
                ],
                ProvisionedThroughput={'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
            )
            # Wait for table creation
            applications_table.meta.client.get_waiter('table_exists').wait(TableName='Applications')
            # Now add the application
            applications_table.put_item(Item=application)
        
        return jsonify({
            'message': 'Application submitted successfully',
            'application_id': application_id
        }), 201
    except ClientError as e:
        print(f"Error processing job application: {str(e)}")
        return jsonify({'message': str(e)}), 500
    except Exception as e:
        print(f"Error processing job application: {str(e)}")
        return jsonify({'message': str(e)}), 500

@job_bp.route('/applications', methods=['GET'])
def get_user_applications():
    try:
        # Get user ID from session or query parameters
        user_id = session.get('user_id')
        
        # If not in session, try to get from query params
        if not user_id:
            user_id = request.args.get('user_id')
            print(f"Using user ID from query params: {user_id}")
            
        if not user_id:
            return jsonify({'message': 'Authentication required. Please log in.'}), 401
            
        # Initialize DynamoDB table for applications
        applications_table = dynamodb.Table('Applications')
        
        try:
            # Get all applications for this user
            applications = applications_table.scan(
                FilterExpression='user_id = :user_id',
                ExpressionAttributeValues={':user_id': user_id}
            )['Items']
            
            # Sort applications by date (newest first)
            applications.sort(key=lambda x: x.get('application_date', ''), reverse=True)
            
            return jsonify(applications), 200
        except ClientError as e:
            # If the table doesn't exist yet, return empty list
            if 'ResourceNotFoundException' in str(e):
                return jsonify([]), 200
            raise e
            
    except ClientError as e:
        print(f"Error retrieving job applications: {str(e)}")
        return jsonify({'message': str(e)}), 500
    except Exception as e:
        print(f"Error retrieving job applications: {str(e)}")
        return jsonify({'message': str(e)}), 500

@job_bp.route('/<job_id>/applicants', methods=['GET'])
def get_job_applicants(job_id):
    try:
        # First check if user is logged in via session
        ngo_id = session.get('ngo_id')
        
        # If not in session, try to get from query params
        if not ngo_id:
            ngo_id = request.args.get('ngo_id')
            print(f"Using NGO ID from query params: {ngo_id}")
            
        if not ngo_id:
            return jsonify({'message': 'Authentication required. Please log in.'}), 401
        
        # Check if job exists and belongs to this NGO
        job = jobs_table.get_item(Key={'job_id': job_id})
        
        if 'Item' not in job:
            return jsonify({'message': 'Job not found'}), 404
            
        if job['Item']['ngo_id'] != ngo_id:
            return jsonify({'message': 'Unauthorized. You do not own this job.'}), 403
        
        # Initialize DynamoDB table for applications
        applications_table = dynamodb.Table('Applications')
        
        try:
            # Get all applications for this job
            applications = applications_table.scan(
                FilterExpression='job_id = :job_id',
                ExpressionAttributeValues={':job_id': job_id}
            )['Items']
            
            # Sort applications by date (newest first)
            applications.sort(key=lambda x: x.get('application_date', ''), reverse=True)
            
            return jsonify(applications), 200
        except ClientError as e:
            # If the table doesn't exist yet, return empty list
            if 'ResourceNotFoundException' in str(e):
                return jsonify([]), 200
            raise e
            
    except ClientError as e:
        print(f"Error retrieving job applicants: {str(e)}")
        return jsonify({'message': str(e)}), 500
    except Exception as e:
        print(f"Error retrieving job applicants: {str(e)}")
        return jsonify({'message': str(e)}), 500

@job_bp.route('/applications/<application_id>/withdraw', methods=['POST'])
def withdraw_application(application_id):
    try:
        # Get user ID from session or request data
        user_id = session.get('user_id')
        
        # If not in session, try to get from request data
        if not user_id:
            data = request.get_json()
            user_id = data.get('user_id')
            print(f"Using user ID from request data: {user_id}")
            
        if not user_id:
            return jsonify({'message': 'Authentication required. Please log in.'}), 401
        
        # Initialize DynamoDB table for applications
        applications_table = dynamodb.Table('Applications')
        
        # Get the application to verify ownership
        try:
            application = applications_table.get_item(Key={'application_id': application_id})
            
            if 'Item' not in application:
                return jsonify({'message': 'Application not found'}), 404
                
            if application['Item']['user_id'] != user_id:
                return jsonify({'message': 'Unauthorized. This is not your application.'}), 403
            
            # Delete the application
            applications_table.delete_item(Key={'application_id': application_id})
            
            return jsonify({'message': 'Application withdrawn successfully'}), 200
            
        except ClientError as e:
            return jsonify({'message': str(e)}), 500
            
    except ClientError as e:
        print(f"Error withdrawing application: {str(e)}")
        return jsonify({'message': str(e)}), 500
    except Exception as e:
        print(f"Error withdrawing application: {str(e)}")
        return jsonify({'message': str(e)}), 500

@job_bp.route('/applications/<application_id>/status', methods=['PUT'])
def update_application_status(application_id):
    try:
        # First check if NGO is logged in via session
        ngo_id = session.get('ngo_id')
        
        # If not in session, try to get from query params
        if not ngo_id:
            ngo_id = request.args.get('ngo_id')
            print(f"Using NGO ID from query params: {ngo_id}")
            
        if not ngo_id:
            return jsonify({'message': 'Authentication required. Please log in.'}), 401
        
        # Get the status update data
        data = request.get_json()
        new_status = data.get('status')
        feedback = data.get('feedback', '')
        
        if not new_status or new_status not in ['accepted', 'rejected', 'pending']:
            return jsonify({'message': 'Invalid status value. Must be one of: accepted, rejected, pending'}), 400
        
        # Initialize DynamoDB table for applications
        applications_table = dynamodb.Table('Applications')
        
        # Get the application to verify NGO ownership of the job
        try:
            application = applications_table.get_item(Key={'application_id': application_id})
            
            if 'Item' not in application:
                return jsonify({'message': 'Application not found'}), 404
                
            # Get the job to verify NGO ownership
            job_id = application['Item']['job_id']
            job = jobs_table.get_item(Key={'job_id': job_id})
            
            if 'Item' not in job or job['Item'].get('ngo_id') != ngo_id:
                return jsonify({'message': 'Unauthorized. You do not own this job.'}), 403
            
            # Update the application status
            update_expr = 'SET #status = :status'
            expr_names = {'#status': 'status'}
            expr_values = {':status': new_status}
            
            # Add feedback if provided
            if feedback:
                update_expr += ', feedback = :feedback'
                expr_values[':feedback'] = feedback
            
            # Add response date
            update_expr += ', response_date = :response_date'
            expr_values[':response_date'] = datetime.now().isoformat()
            
            applications_table.update_item(
                Key={'application_id': application_id},
                UpdateExpression=update_expr,
                ExpressionAttributeNames=expr_names,
                ExpressionAttributeValues=expr_values
            )
            
            return jsonify({
                'message': f'Application status updated to {new_status}',
                'application_id': application_id
            }), 200
            
        except ClientError as e:
            return jsonify({'message': str(e)}), 500
            
    except ClientError as e:
        print(f"Error updating application status: {str(e)}")
        return jsonify({'message': str(e)}), 500
    except Exception as e:
        print(f"Error updating application status: {str(e)}")
        return jsonify({'message': str(e)}), 500

@job_bp.route('/video/<video_id>/viewers', methods=['GET'])
def get_video_viewers(video_id):
    try:
        # First check if NGO is logged in via session
        ngo_id = session.get('ngo_id')
        
        # If not in session, try to get from query params
        if not ngo_id:
            ngo_id = request.args.get('ngo_id')
            print(f"Using NGO ID from query params: {ngo_id}")
            
        if not ngo_id:
            return jsonify({'message': 'Authentication required. Please log in.'}), 401
        
        # Initialize DynamoDB tables
        videos_table = dynamodb.Table('Videos')
        video_views_table = dynamodb.Table('VideoViews')
        quiz_results_table = dynamodb.Table('QuizResults')
        
        # Check if video exists and belongs to this NGO
        try:
            video = videos_table.get_item(Key={'video_id': video_id})
            
            if 'Item' not in video:
                return jsonify({'message': 'Video not found'}), 404
                
            if video['Item'].get('ngo_id') != ngo_id:
                return jsonify({'message': 'Unauthorized. You do not own this video.'}), 403
            
            # Get all views for this video
            try:
                views = video_views_table.scan(
                    FilterExpression='video_id = :video_id',
                    ExpressionAttributeValues={':video_id': video_id}
                )['Items']
                
                # Get all quiz results for this video
                quiz_results = quiz_results_table.scan(
                    FilterExpression='video_id = :video_id',
                    ExpressionAttributeValues={':video_id': video_id}
                )['Items']
                
                # Combine views with quiz results
                for view in views:
                    user_id = view.get('user_id')
                    matching_quiz = next((quiz for quiz in quiz_results if quiz.get('user_id') == user_id), None)
                    if matching_quiz:
                        view['quiz_score'] = matching_quiz.get('score', 0)
                        view['quiz_completed'] = True
                    else:
                        view['quiz_score'] = 0
                        view['quiz_completed'] = False
                
                return jsonify(views), 200
                
            except ClientError as e:
                # If the tables don't exist yet, return empty list
                if 'ResourceNotFoundException' in str(e):
                    return jsonify([]), 200
                raise e
                
        except ClientError as e:
            return jsonify({'message': str(e)}), 500
            
    except ClientError as e:
        print(f"Error retrieving video viewers: {str(e)}")
        return jsonify({'message': str(e)}), 500
    except Exception as e:
        print(f"Error retrieving video viewers: {str(e)}")
        return jsonify({'message': str(e)}), 500 