from flask import Blueprint, request, jsonify, session
import boto3
from botocore.exceptions import ClientError
from datetime import datetime
from .auth import login_required
import logging
import json

video_bp = Blueprint('video', __name__)

# Initialize DynamoDB and S3
dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
s3 = boto3.client('s3', region_name='ap-south-1')
videos_table = dynamodb.Table('Videos')
video_skills_table = dynamodb.Table('VideoSkills')

@video_bp.route('/upload', methods=['POST'])
@login_required
def upload_video():
    try:
        ngo_id = session.get('ngo_id')
        logger = logging.getLogger('auth')
        
        # Get the file from the request
        file = request.files['video']
        title = request.form.get('title')
        description = request.form.get('description')
        skill = request.form.get('skill')
        level = request.form.get('level')
        thumbnail_url = request.form.get('thumbnail_url')
        
        # Get and parse skills_covered
        skills_covered = request.form.get('skills_covered')
        if skills_covered:
            try:
                skills_covered = json.loads(skills_covered)
                logger.info(f"Parsed skills_covered: {skills_covered}")
            except json.JSONDecodeError:
                logger.warning(f"Failed to parse skills_covered JSON: {skills_covered}")
                skills_covered = []
        else:
            skills_covered = []
        
        if not file or not title:
            return jsonify({'message': 'Missing required fields'}), 400
        
        # Generate a unique filename
        filename = f"{ngo_id}_{int(datetime.now().timestamp())}_{file.filename}"
        
        # Upload to S3
        s3.upload_fileobj(
            file,
            'riseup-videos',
            filename,
            ExtraArgs={'ContentType': file.content_type}
        )
        
        # Generate the video URL
        video_url = f"https://riseup-videos.s3.ap-south-1.amazonaws.com/{filename}"
        
        # Save video metadata to DynamoDB
        video = {
            'video_id': str(datetime.now().timestamp()),
            'ngo_id': ngo_id,
            'title': title,
            'description': description,
            'url': video_url,
            'created_at': datetime.now().isoformat()
        }
        
        # Add optional fields
        if skills_covered:
            video['skills_covered'] = skills_covered
            logger.info(f"Adding skills_covered to video: {skills_covered}")
        
        if skill:
            video['skill'] = skill
            
        if level:
            video['level'] = level
            
        if thumbnail_url:
            video['thumbnail_url'] = thumbnail_url
        
        videos_table.put_item(Item=video)
        logger.info(f"Video uploaded successfully with ID: {video['video_id']}")
        return jsonify({'message': 'Video uploaded successfully', 'video': video}), 201
    except ClientError as e:
        logger.error(f"ClientError in upload_video: {str(e)}")
        return jsonify({'message': str(e)}), 500
    except Exception as e:
        logger.error(f"Unexpected error in upload_video: {str(e)}")
        return jsonify({'message': str(e)}), 500

@video_bp.route('/list', methods=['GET'])
def list_videos():
    try:
        videos = videos_table.scan()['Items']
        return jsonify(videos), 200
    except ClientError as e:
        return jsonify({'message': str(e)}), 500

@video_bp.route('/user/list', methods=['GET'])
@login_required
def list_user_videos():
    try:
        # Get all videos
        all_videos = videos_table.scan()['Items']
        
        # Filter out videos that are not meant for users (e.g., internal NGO videos)
        # For now, we'll just return all videos, but in a real app, you might have a flag
        # to indicate which videos are meant for users
        user_videos = [video for video in all_videos if video.get('is_public', True)]
        
        return jsonify(user_videos), 200
    except ClientError as e:
        return jsonify({'message': str(e)}), 500

@video_bp.route('/<video_id>', methods=['GET'])
def get_video(video_id):
    try:
        video = videos_table.get_item(Key={'video_id': video_id})['Item']
        return jsonify(video), 200
    except ClientError as e:
        return jsonify({'message': str(e)}), 500

@video_bp.route('/<video_id>', methods=['PUT'])
@login_required
def update_video(video_id):
    try:
        ngo_id = session.get('ngo_id')
        data = request.get_json()
        
        # Verify video ownership
        video = videos_table.get_item(Key={'video_id': video_id})['Item']
        if video['ngo_id'] != ngo_id:
            return jsonify({'message': 'Unauthorized'}), 403
        
        # Update video metadata
        update_expression = 'SET title = :title, description = :description'
        expression_values = {
            ':title': data['title'],
            ':description': data['description']
        }
        
        # Define attribute names dictionary for reserved keywords
        expression_names = {}
        
        if 'skill' in data:
            update_expression += ', skill = :skill'
            expression_values[':skill'] = data['skill']
        
        if 'level' in data:
            # Use expression attribute names to handle the reserved keyword 'level'
            update_expression += ', #lvl = :level'
            expression_values[':level'] = data['level']
            expression_names['#lvl'] = 'level'
        
        if 'duration' in data:
            # Use expression attribute names to handle the reserved keyword 'duration'
            update_expression += ', #dur = :duration'
            expression_values[':duration'] = data['duration']
            expression_names['#dur'] = 'duration'
        
        if 'thumbnail_url' in data:
            update_expression += ', thumbnail_url = :thumbnail_url'
            expression_values[':thumbnail_url'] = data['thumbnail_url']
        
        update_params = {
            'Key': {'video_id': video_id},
            'UpdateExpression': update_expression,
            'ExpressionAttributeValues': expression_values
        }
        
        # Only add ExpressionAttributeNames if we have any
        if expression_names:
            update_params['ExpressionAttributeNames'] = expression_names
            
        videos_table.update_item(**update_params)
        
        return jsonify({'message': 'Video updated successfully'}), 200
    except ClientError as e:
        return jsonify({'message': str(e)}), 500

@video_bp.route('/<video_id>', methods=['DELETE'])
@login_required
def delete_video(video_id):
    try:
        ngo_id = session.get('ngo_id')
        print(f"Attempting to delete video {video_id} for NGO {ngo_id}")
        
        # Verify video ownership
        try:
            video = videos_table.get_item(Key={'video_id': video_id})['Item']
            print(f"Found video: {video}")
            
            if video['ngo_id'] != ngo_id:
                print(f"Unauthorized: Video belongs to NGO {video['ngo_id']}, not {ngo_id}")
                return jsonify({'message': 'Unauthorized'}), 403
            
            # Delete video from S3
            try:
                filename = video['url'].split('/')[-1]
                print(f"Deleting file {filename} from S3")
                s3.delete_object(
                    Bucket='riseup-videos',
                    Key=filename
                )
            except Exception as e:
                print(f"Error deleting from S3: {str(e)}")
                # Continue with DynamoDB deletion even if S3 deletion fails
            
            # Delete video from DynamoDB
            print(f"Deleting video {video_id} from DynamoDB")
            videos_table.delete_item(Key={'video_id': video_id})
            
            print(f"Video {video_id} deleted successfully")
            return jsonify({'message': 'Video deleted successfully'}), 200
        except KeyError:
            print(f"Video {video_id} not found")
            return jsonify({'message': 'Video not found'}), 404
    except ClientError as e:
        print(f"DynamoDB error: {str(e)}")
        return jsonify({'message': str(e)}), 500
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return jsonify({'message': 'An unexpected error occurred'}), 500

@video_bp.route('/<video_id>/skills', methods=['POST'])
@login_required
def add_video_skills(video_id):
    data = request.get_json()
    
    try:
        ngo_id = session.get('ngo_id')
        # Verify that the video belongs to the NGO
        video = videos_table.get_item(Key={'video_id': video_id})['Item']
        if video['ngo_id'] != ngo_id:
            return jsonify({'message': 'Unauthorized'}), 403
        
        # Add skills to the video
        for skill_id in data['skills']:
            video_skill = {
                'video_id': video_id,
                'skill_id': skill_id
            }
            video_skills_table.put_item(Item=video_skill)
        
        return jsonify({'message': 'Skills added successfully'}), 200
    except ClientError as e:
        return jsonify({'message': str(e)}), 500

@video_bp.route('/<video_id>/skills', methods=['GET'])
def get_video_skills(video_id):
    try:
        skills = video_skills_table.scan(
            FilterExpression='video_id = :video_id',
            ExpressionAttributeValues={':video_id': video_id}
        )['Items']
        return jsonify(skills), 200
    except ClientError as e:
        return jsonify({'message': str(e)}), 500

@video_bp.route('/<video_id>/viewers', methods=['GET'])
@login_required
def get_video_viewers(video_id):
    try:
        # Check if the video exists
        try:
            video = videos_table.get_item(Key={'video_id': video_id})['Item']
        except KeyError:
            return jsonify({'message': 'Video not found'}), 404
        
        # Check if the NGO owns this video
        ngo_id = session.get('ngo_id')
        if video['ngo_id'] != ngo_id:
            return jsonify({'message': 'Unauthorized access'}), 403
            
        # Get all users who watched this video
        try:
            # You may need to create a video_views table or similar in your DynamoDB
            # For demonstration, we'll create a mock response
            mock_viewers = [
                {
                    'user_id': 'user123',
                    'view_date': '2023-06-15',
                    'completed_quiz': True,
                    'quiz_score': 85
                },
                {
                    'user_id': 'user456',
                    'view_date': '2023-06-16',
                    'completed_quiz': True,
                    'quiz_score': 92
                },
                {
                    'user_id': 'user789',
                    'view_date': '2023-06-17',
                    'completed_quiz': False,
                    'quiz_score': None
                },
                {
                    'user_id': 'user101',
                    'view_date': '2023-06-18',
                    'completed_quiz': True,
                    'quiz_score': 78
                }
            ]
            return jsonify(mock_viewers), 200
        except Exception as e:
            print(f"Error fetching viewers: {str(e)}")
            return jsonify({'message': str(e)}), 500
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return jsonify({'message': 'An unexpected error occurred'}), 500

@video_bp.route('/<video_id>/update-skills', methods=['POST'])
@login_required
def update_video_skills_covered(video_id):
    try:
        ngo_id = session.get('ngo_id')
        data = request.get_json()
        
        # Verify video ownership
        try:
            video = videos_table.get_item(Key={'video_id': video_id})['Item']
            if video['ngo_id'] != ngo_id:
                return jsonify({'message': 'Unauthorized'}), 403
        except KeyError:
            return jsonify({'message': 'Video not found'}), 404
        
        # Update video with skills_covered
        if 'skills_covered' not in data:
            return jsonify({'message': 'skills_covered field is required'}), 400
            
        # Define attribute names dictionary for reserved keywords
        expression_names = {}
        update_expression = 'SET #sc = :skills_covered'
        expression_values = {
            ':skills_covered': data['skills_covered']
        }
        expression_names['#sc'] = 'skills_covered'
            
        update_params = {
            'Key': {'video_id': video_id},
            'UpdateExpression': update_expression,
            'ExpressionAttributeValues': expression_values,
            'ExpressionAttributeNames': expression_names
        }
            
        videos_table.update_item(**update_params)
        
        logger = logging.getLogger('auth')
        logger.info(f"Updated skills_covered for video {video_id}: {data['skills_covered']}")
        
        return jsonify({'message': 'Video skills updated successfully'}), 200
    except ClientError as e:
        return jsonify({'message': str(e)}), 500

@video_bp.route('/seed-video-skills', methods=['POST'])
def seed_video_skills():
    try:
        logger = logging.getLogger('auth')
        data = request.get_json()
        
        # Check if required fields are provided
        if not data or 'video_id' not in data or 'skills' not in data:
            return jsonify({'message': 'video_id and skills are required'}), 400
        
        video_id = data['video_id']
        skills = data['skills'] 
        
        # Get the video to check if it exists
        try:
            video_response = videos_table.get_item(Key={'video_id': video_id})
            if 'Item' not in video_response:
                return jsonify({'message': f'Video {video_id} not found'}), 404
            
            video = video_response['Item']
        except Exception as e:
            logger.error(f"Error fetching video: {str(e)}")
            return jsonify({'message': 'Error fetching video'}), 500
        
        # Update the video with skills_covered
        update_expression = 'SET skills_covered = :skills'
        expression_values = {
            ':skills': skills
        }
        
        videos_table.update_item(
            Key={'video_id': video_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values
        )
        
        logger.info(f"Seeded skills for video {video_id}: {skills}")
        
        return jsonify({
            'message': 'Video skills seeded successfully',
            'video_id': video_id,
            'skills': skills
        }), 200
    except Exception as e:
        logger.error(f"Error seeding video skills: {str(e)}")
        return jsonify({'message': str(e)}), 500

@video_bp.route('/assign-test-skills', methods=['GET'])
def assign_test_skills():
    try:
        logger = logging.getLogger('auth')
        logger.info("Starting video skill assignment process")
        
        # Get all videos
        videos_response = videos_table.scan()
        all_videos = videos_response['Items']
        
        if not all_videos:
            return jsonify({'message': 'No videos found to assign skills'}), 404
        
        # Sort videos by created_at (if available) or video_id to ensure consistent ordering
        sorted_videos = sorted(all_videos, 
                              key=lambda x: x.get('created_at', x.get('video_id', '')), 
                              reverse=True)
        
        # Set skills for videos in order, with deliberate patterns
        updated_videos = []
        for i, video in enumerate(sorted_videos):
            video_id = video['video_id']
            
            # Create distinct skill sets for different videos
            if i % 3 == 0:  # First, fourth, seventh video, etc.
                # For first user (programming, design)
                skills = ['programming', 'design']
                logger.info(f"Assigning programming/design skills to video {video_id}")
            elif i % 3 == 1:  # Second, fifth, eighth video, etc.
                # For second user (marketing, data_analysis)
                skills = ['marketing', 'data_analysis']
                logger.info(f"Assigning marketing/data_analysis skills to video {video_id}")
            else:  # Third, sixth, ninth video, etc.
                # For third user (web_dev)
                skills = ['web_dev']
                logger.info(f"Assigning web_dev skills to video {video_id}")
            
            try:
                # Update the video with the assigned skills
                update_expression = 'SET skills_covered = :skills'
                expression_values = {
                    ':skills': skills
                }
                
                videos_table.update_item(
                    Key={'video_id': video_id},
                    UpdateExpression=update_expression,
                    ExpressionAttributeValues=expression_values
                )
                
                updated_videos.append({
                    'video_id': video_id,
                    'title': video.get('title', 'Unknown'),
                    'skills_covered': skills
                })
                
                logger.info(f"Successfully updated video {video_id} with skills: {skills}")
            except Exception as e:
                logger.error(f"Error updating video {video_id}: {str(e)}")
                # Continue with other videos even if one fails
        
        return jsonify({
            'message': f'Successfully assigned skills to {len(updated_videos)} videos',
            'updated_videos': updated_videos
        }), 200
    except Exception as e:
        logger.error(f"Error in assign_test_skills: {str(e)}")
        return jsonify({'message': str(e)}), 500 