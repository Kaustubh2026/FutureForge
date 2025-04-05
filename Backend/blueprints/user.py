from flask import Blueprint, request, jsonify, session
import boto3
from botocore.exceptions import ClientError
from datetime import datetime
from .auth import login_required
import logging
import json

user_bp = Blueprint('user', __name__)

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
users_table = dynamodb.Table('Users')
jobs_table = dynamodb.Table('Jobs')
videos_table = dynamodb.Table('Videos')
user_skills_table = dynamodb.Table('UserSkills')
skills_table = dynamodb.Table('Skills')
user_quiz_scores_table = dynamodb.Table('UserQuizScores')

@user_bp.route('/dashboard', methods=['GET'])
@login_required
def get_dashboard():
    try:
        user_id = session.get('user_id')
        # Get user details
        user = users_table.get_item(Key={'user_id': user_id})['Item']
        
        # Get user skills
        skills = user_skills_table.scan(
            FilterExpression='user_id = :user_id',
            ExpressionAttributeValues={':user_id': user_id}
        )['Items']
        
        # Get all available jobs
        jobs = jobs_table.scan()['Items']
        
        # Get all available videos
        videos = videos_table.scan()['Items']
        
        # Get quiz scores
        quiz_scores = user_quiz_scores_table.scan(
            FilterExpression='user_id = :user_id',
            ExpressionAttributeValues={':user_id': user_id}
        )['Items']
        
        return jsonify({
            'user': user,
            'skills': skills,
            'jobs': jobs,
            'videos': videos,
            'quiz_scores': quiz_scores
        }), 200
    except ClientError as e:
        return jsonify({'message': str(e)}), 500

@user_bp.route('/update-skills', methods=['POST'])
@login_required
def update_skills():
    data = request.get_json()
    
    try:
        user_id = session.get('user_id')
        # Update user skills
        for skill in data['skills']:
            user_skill = {
                'user_id': user_id,
                'skill_id': skill['skill_id'],
                'level': skill['level'],
                'updated_at': datetime.now().isoformat()
            }
            user_skills_table.put_item(Item=user_skill)
        
        return jsonify({'message': 'Skills updated successfully'}), 200
    except ClientError as e:
        return jsonify({'message': str(e)}), 500

@user_bp.route('/learning-path', methods=['GET'])
@login_required
def get_learning_path():
    try:
        user_id = session.get('user_id')
        # Get user skills
        user_skills = user_skills_table.scan(
            FilterExpression='user_id = :user_id',
            ExpressionAttributeValues={':user_id': user_id}
        )['Items']
        
        # Get all skills
        all_skills = skills_table.scan()['Items']
        
        # Get all videos
        all_videos = videos_table.scan()['Items']
        
        # Create learning path based on user skills and available videos
        learning_path = []
        for skill in all_skills:
            if not any(user_skill['skill_id'] == skill['skill_id'] for user_skill in user_skills):
                # Find videos that cover this skill
                skill_videos = [video for video in all_videos if skill['skill_id'] in video.get('skills_covered', [])]
                if skill_videos:
                    learning_path.append({
                        'skill': skill,
                        'videos': skill_videos
                    })
        
        return jsonify(learning_path), 200
    except ClientError as e:
        return jsonify({'message': str(e)}), 500

@user_bp.route('/update-quiz-score', methods=['POST'])
@login_required
def update_quiz_score():
    data = request.get_json()
    
    try:
        user_id = session.get('user_id')
        quiz_score = {
            'user_id': user_id,
            'quiz_id': data['quiz_id'],
            'score': data['score'],
            'completed_at': datetime.now().isoformat()
        }
        user_quiz_scores_table.put_item(Item=quiz_score)
        
        return jsonify({'message': 'Quiz score updated successfully'}), 200
    except ClientError as e:
        return jsonify({'message': str(e)}), 500

@user_bp.route('/recommended-videos', methods=['GET'])
@login_required
def get_recommended_videos():
    try:
        user_id = session.get('user_id')
        logger = logging.getLogger('auth')
        logger.info(f"Getting recommendations for user: {user_id}")
        
        # Get user skills
        user_skills_response = user_skills_table.scan(
            FilterExpression='user_id = :user_id',
            ExpressionAttributeValues={':user_id': user_id}
        )
        user_skills = user_skills_response['Items']
        
        logger.info(f"User {user_id} skills found: {len(user_skills)}")
        logger.info(f"User {user_id} skills details: {user_skills}")
        
        if not user_skills:
            # No skills found, return empty list
            logger.warning(f"No skills found for user {user_id}")
            return jsonify({
                'recommended_videos': [],
                'user_skills': [],
                'message': 'No skills found for this user'
            }), 200
        
        # Extract skill IDs
        user_skill_ids = [skill.get('skill_id') for skill in user_skills]
        logger.info(f"User {user_id} skill IDs: {user_skill_ids}")
        
        # Get all videos
        all_videos = videos_table.scan()['Items']
        logger.info(f"Total videos: {len(all_videos)}")
        
        # Debug output with a clear table of skills for review
        skill_debug = ["SKILL COMPARISON TABLE:"]
        skill_debug.append(f"USER {user_id} SKILLS: {', '.join(user_skill_ids)}")
        skill_debug.append("-" * 50)
        skill_debug.append(f"{'VIDEO ID':<30} | {'SKILLS COVERED':<30}")
        skill_debug.append("-" * 50)
        
        # If a video doesn't have skills_covered attribute, add it to ensure they're all valid
        for video in all_videos:
            if 'skills_covered' not in video:
                video['skills_covered'] = []
        
        # Filter videos that match user skills
        recommended_videos = []
        for video in all_videos:
            video_id = video.get('video_id', 'unknown')
            skills_covered = video.get('skills_covered', [])
            
            # Convert skills_covered to list if it's a string (sometimes happens with JSON serialization)
            if isinstance(skills_covered, str):
                try:
                    skills_covered = json.loads(skills_covered)
                except:
                    skills_covered = []
            
            # Add to debug table
            skill_debug.append(f"{video_id:<30} | {str(skills_covered):<30}")
            
            # Check if any of the video's skills match user skills
            matched = False
            matched_skills = []
            for skill_id in user_skill_ids:
                if skill_id in skills_covered:
                    matched_skills.append(skill_id)
                    matched = True
            
            if matched:
                logger.info(f"Match found! User {user_id} skills {matched_skills} match video {video_id}")
                recommended_videos.append(video)
            elif skills_covered:
                logger.info(f"No match: User {user_id} skills {user_skill_ids} don't match video {video_id} skills {skills_covered}")
        
        # Log the entire comparison table
        for line in skill_debug:
            logger.info(line)
        
        logger.info(f"Recommended videos found for user {user_id}: {len(recommended_videos)}")
        
        # If no matches were found, add some default videos
        if not recommended_videos and all_videos:
            logger.info(f"No matches found for user {user_id}, adding default recommendations")
            # Add first 3 videos as default recommendations
            recommended_videos = all_videos[:min(3, len(all_videos))]
        
        return jsonify({
            'recommended_videos': recommended_videos,
            'user_skills': user_skills,
            'debug_info': {
                'user_id': user_id,
                'user_skills': user_skill_ids,
                'total_videos': len(all_videos),
                'matched_videos': len(recommended_videos)
            }
        }), 200
    except ClientError as e:
        logger.error(f"DynamoDB error for user {user_id}: {str(e)}")
        return jsonify({'message': str(e)}), 500
    except Exception as e:
        logger.error(f"Unexpected error for user {user_id}: {str(e)}")
        return jsonify({'message': str(e)}), 500

@user_bp.route('/seed-user-skills', methods=['POST'])
def seed_user_skills():
    try:
        logger = logging.getLogger('auth')
        data = request.get_json()
        
        # Check if required fields are provided
        if not data or 'user_id' not in data or 'skills' not in data:
            return jsonify({'message': 'user_id and skills are required'}), 400
        
        user_id = data['user_id']
        skills = data['skills']
        
        # Check if user exists
        try:
            user_response = users_table.get_item(Key={'user_id': user_id})
            if 'Item' not in user_response:
                return jsonify({'message': f'User {user_id} not found'}), 404
        except Exception as e:
            logger.error(f"Error checking user: {str(e)}")
            return jsonify({'message': 'Error checking user'}), 500
        
        # Clear existing skills for this user (optional)
        try:
            existing_skills = user_skills_table.scan(
                FilterExpression='user_id = :user_id',
                ExpressionAttributeValues={':user_id': user_id}
            )['Items']
            
            for skill in existing_skills:
                user_skills_table.delete_item(
                    Key={'user_id': user_id, 'skill_id': skill['skill_id']}
                )
        except Exception as e:
            logger.error(f"Error clearing existing skills: {str(e)}")
            # Continue even if this fails
        
        # Add new skills
        seeded_skills = []
        for skill_data in skills:
            skill_id = skill_data['skill_id']
            skill_name = skill_data.get('name', f'Skill {skill_id}')
            skill_level = skill_data.get('level', 'intermediate')
            
            user_skill = {
                'user_id': user_id,
                'skill_id': skill_id,
                'name': skill_name,
                'level': skill_level,
                'updated_at': datetime.now().isoformat()
            }
            
            user_skills_table.put_item(Item=user_skill)
            seeded_skills.append(user_skill)
        
        logger.info(f"Seeded skills for user {user_id}: {seeded_skills}")
        
        return jsonify({
            'message': 'User skills seeded successfully',
            'user_id': user_id,
            'skills': seeded_skills
        }), 200
    except Exception as e:
        logger.error(f"Error seeding user skills: {str(e)}")
        return jsonify({'message': str(e)}), 500 