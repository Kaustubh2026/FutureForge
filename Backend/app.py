from flask import Flask, request
from flask import Flask, request
from flask_cors import CORS
from config import Config
from blueprints.auth import auth_bp
from blueprints.ngo import ngo_bp
from blueprints.user import user_bp
from blueprints.video import video_bp
from blueprints.job import job_bp
from blueprints.interview import interview_bp
from blueprints.chatbot import chatbot_bp
import logging

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Configure session
    app.secret_key = app.config['SECRET_KEY']
    
    # Configure logging
    logging.basicConfig(level=logging.DEBUG)
    app.logger.setLevel(logging.DEBUG)
    
    # Set up chatbot logger
    chatbot_logger = logging.getLogger('chatbot')
    chatbot_logger.setLevel(logging.INFO)
    
    # Initialize CORS with comprehensive settings
    CORS(app, 
         resources={r"/api/*": {
             "origins": ["http://localhost:5174", "http://localhost:5173"],
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
             "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
             "expose_headers": ["Content-Type", "Authorization"],
             "supports_credentials": True,
             "max_age": 3600
         }},
         supports_credentials=True)
    
    # Add CORS headers to all responses
    @app.after_request
    def after_request(response):
        origin = request.headers.get('Origin', 'http://localhost:5173')
        if origin in ['http://localhost:5173', 'http://localhost:5174']:
            response.headers.add('Access-Control-Allow-Origin', origin)
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
        
        # Handle preflight OPTIONS requests
        if request.method == 'OPTIONS':
            response.status_code = 200
            
        return response
    
    # Debug route to check sessions
    @app.route('/api/debug/session', methods=['GET'])
    def debug_session():
        from flask import jsonify, session
        return jsonify(dict(session))
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(ngo_bp, url_prefix='/api/ngo')
    app.register_blueprint(user_bp, url_prefix='/api/user')
    app.register_blueprint(video_bp, url_prefix='/api/video')
    app.register_blueprint(job_bp, url_prefix='/api/job')
    app.register_blueprint(interview_bp, url_prefix='/api/interview')
    app.register_blueprint(chatbot_bp, url_prefix='/api/chatbot')
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
