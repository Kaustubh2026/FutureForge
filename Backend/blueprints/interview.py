from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import os
import threading
import time
import numpy as np
import json
import sys
from pathlib import Path

# Add the project root directory to Python path
project_root = str(Path(__file__).parent.parent.parent)
sys.path.append(project_root)

from Models.interview_module import (
    extract_text_from_docx,
    generate_interview_questions,
    record_audio,
    save_audio,
    speech_to_text,
    evaluate_answer,
    read_text_aloud
)

interview_bp = Blueprint('interview', __name__)

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Global variables to manage recording state
recording_thread = None
is_recording = False
current_audio = None

@interview_bp.route('/generate-questions', methods=['POST'])
def generate_questions():
    if 'resume' not in request.files:
        return jsonify({'error': 'No resume file uploaded'}), 400
    
    file = request.files['resume']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        try:
            # Extract text from resume
            resume_text = extract_text_from_docx(filepath)
            
            # Generate questions
            questions = generate_interview_questions(resume_text)
            
            # Clean up the uploaded file
            os.remove(filepath)
            
            # Convert questions string to list
            questions_list = [q.strip() for q in questions.split('\n') if q.strip()]
            
            return jsonify({
                'questions': questions_list
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500
        
    return jsonify({'error': 'Failed to process file'}), 500

@interview_bp.route('/text-to-speech', methods=['POST'])
def text_to_speech():
    data = request.json
    if not data or 'text' not in data:
        return jsonify({'error': 'No text provided'}), 400
    
    text = data['text']
    
    # Start text-to-speech in a separate thread so it doesn't block the response
    threading.Thread(target=lambda: read_text_aloud(text)).start()
    
    return jsonify({'status': 'Text-to-speech started'})

@interview_bp.route('/start-recording', methods=['POST'])
def start_recording():
    global recording_thread, is_recording, current_audio
    
    if is_recording:
        return jsonify({'error': 'Recording already in progress'}), 400
    
    is_recording = True
    recording_thread = threading.Thread(target=record_audio_thread)
    recording_thread.start()
    
    return jsonify({'status': 'Recording started'})

@interview_bp.route('/stop-recording', methods=['POST'])
def stop_recording():
    global is_recording, current_audio
    
    if not is_recording:
        return jsonify({'error': 'No recording in progress'}), 400
    
    is_recording = False
    if recording_thread:
        recording_thread.join()
    
    if current_audio is None:
        return jsonify({'error': 'No audio recorded'}), 500
    
    try:
        # Save the audio temporarily
        temp_filename = "temp_answer.wav"
        save_audio(current_audio['recording'], current_audio['sample_rate'], temp_filename)
        
        # Convert speech to text
        answer_text, is_audible = speech_to_text(temp_filename)
        
        # Get the current question from the request
        question = request.json.get('question', '')
        
        # Evaluate the answer
        evaluation = evaluate_answer(question, answer_text, is_audible)
        
        # Add the answer text to the evaluation
        evaluation['answer'] = answer_text
        
        # Clean up
        os.remove(temp_filename)
        current_audio = None
        
        return jsonify(evaluation)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def record_audio_thread():
    global current_audio
    try:
        recording, sample_rate = record_audio()
        if recording is not None:
            current_audio = {
                'recording': recording,
                'sample_rate': sample_rate
            }
    except Exception as e:
        print(f"Error recording audio: {e}") 