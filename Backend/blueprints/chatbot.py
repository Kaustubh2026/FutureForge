from flask import Blueprint, request, jsonify
import boto3
from botocore.exceptions import ClientError
import logging
import json
from datetime import datetime
from .auth import login_required

chatbot_bp = Blueprint('chatbot', __name__)

# Initialize Lex Runtime client
lexv2_runtime = boto3.client('lexv2-runtime', region_name='ap-south-1')

@chatbot_bp.route('/message', methods=['POST'])
def process_message():
    """
    Process a user message through Amazon Lex and return the response
    """
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({'error': 'Message is required'}), 400
            
        user_message = data['message']
        user_id = data.get('user_id', 'anonymous-user-' + str(datetime.now().timestamp()))
        session_id = data.get('session_id', user_id)
        
        # Log the incoming message
        logger = logging.getLogger('chatbot')
        logger.info(f"Received message from {user_id}: {user_message}")
        
        # First try AWS Lex
        try:
            # Call Amazon Lex V2 Runtime to send user message
            response = lexv2_runtime.recognize_text(
                botId='YOUR_LEX_BOT_ID',      # Replace with your bot ID
                botAliasId='TSTALIASID',      # Replace with your bot alias ID
                localeId='en_US',             # Replace with your bot locale
                sessionId=session_id,
                text=user_message
            )
            
            # Extract the bot response
            messages = response.get('messages', [])
            if messages:
                bot_response = messages[0].get('content', '')
                message_type = messages[0].get('contentType', 'PlainText')
                
                # Log the bot response
                logger.info(f"Lex response to {user_id}: {bot_response}")
                
                return jsonify({
                    'response': bot_response,
                    'type': message_type,
                    'session_id': session_id,
                    'source': 'lex'
                }), 200
                
        except ClientError as e:
            # Log the error but don't fail - fall back to fallback responses
            logger.error(f"Error with Lex: {str(e)}")
        
        # Fallback to simple keyword matching (same logic as frontend)
        knowledge_base = {
            'video': 'You can find educational videos by navigating to the "Videos" section in the dashboard. You can filter videos by skill, level, or use the search function.',
            'skill': 'You can update your skills in your user profile. We use these skills to recommend videos and job opportunities that match your expertise.',
            'job': 'Available jobs can be found in the "Jobs" section. You can apply directly through our platform by clicking the "Apply" button on any job listing.',
            'interview': 'FutureForge offers mock interviews to help you prepare for real job interviews. Go to the "Mock Interview" section to practice your interview skills.',
            'recommendation': 'Our recommendation system suggests videos and jobs based on the skills in your profile. Make sure your skills are up to date for the best recommendations!',
            'login': 'To log in, use your email and password on the login page. If you forgot your password, you can reset it using the "Forgot Password" link.',
            'register': 'To create a new account, go to the registration page and fill out the required information. You\'ll need to provide your name, email, and create a password.',
            'upload': 'If you are an NGO user, you can upload educational videos through the "Post Videos" section in your dashboard.',
            'application': 'You can view the status of your job applications in the "My Applications" section of the dashboard.',
            'ngo': 'Non-Governmental Organizations (NGOs) can register to provide educational content and post job opportunities on our platform.'
        }
        
        # Check if user message contains keywords from knowledge base
        user_message_lower = user_message.lower()
        for keyword, response in knowledge_base.items():
            if keyword in user_message_lower:
                logger.info(f"Fallback response to {user_id} using keyword '{keyword}'")
                return jsonify({
                    'response': response,
                    'type': 'PlainText',
                    'session_id': session_id,
                    'source': 'fallback'
                }), 200
        
        # Default response if no keywords match
        default_responses = [
            "I'm here to help with questions about FutureForge. Try asking about videos, jobs, skills, or interviews.",
            "I don't have an answer for that specific query. You can ask about videos, jobs, or using the platform features.",
            "That's a great question! However, I'm focused on helping with FutureForge features. Ask me about videos, jobs, or skills instead.",
            "I'm still learning, but I can help with basic questions about FutureForge. Try asking about videos, jobs, or your profile."
        ]
        
        # Return a random default response
        import random
        default_response = random.choice(default_responses)
        
        logger.info(f"Default response to {user_id}: {default_response}")
        
        return jsonify({
            'response': default_response,
            'type': 'PlainText',
            'session_id': session_id,
            'source': 'default'
        }), 200
        
    except Exception as e:
        logger.error(f"Unexpected error in chatbot endpoint: {str(e)}")
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500

@chatbot_bp.route('/feedback', methods=['POST'])
@login_required
def submit_feedback():
    """
    Submit user feedback about chatbot responses for improving the system
    """
    try:
        data = request.get_json()
        
        if not data or 'message_id' not in data or 'feedback' not in data:
            return jsonify({'error': 'Message ID and feedback are required'}), 400
            
        # Store feedback in DynamoDB or other database
        # This is a placeholder for implementation
        logger = logging.getLogger('chatbot')
        logger.info(f"Feedback received: {json.dumps(data)}")
        
        return jsonify({'success': True, 'message': 'Feedback submitted successfully'}), 200
        
    except Exception as e:
        logger.error(f"Error submitting feedback: {str(e)}")
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500 