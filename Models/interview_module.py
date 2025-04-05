import google.generativeai as genai
from docx import Document
import pyttsx3
import sounddevice as sd
import scipy.io.wavfile as wav
import numpy as np
import speech_recognition as sr
import time
import os
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini AI - Explicitly set the API key with a fallback
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY', "AIzaSyDOFymoms9iHYOx3swnvkdxsVRSNQXaEok")
genai.configure(api_key=GOOGLE_API_KEY)

print(f"Using API key: {GOOGLE_API_KEY[:5]}...")  # Print first few characters to verify

def read_text_aloud(text, rate_increase=20):
    """
    Reads the given text aloud using pyttsx3.
    The 'rate_increase' parameter speeds up the speech rate by adding to the default rate.
    """
    try:
        engine = pyttsx3.init()
        rate = engine.getProperty('rate')
        engine.setProperty('rate', rate + rate_increase)
        engine.say(text)
        engine.runAndWait()
        return True
    except Exception as e:
        print(f"Error during text-to-speech: {str(e)}")
        return False

def extract_text_from_docx(file_path):
    """Extracts text from a DOCX file."""
    document = Document(file_path)
    return "\n".join(para.text for para in document.paragraphs if para.text.strip())

def generate_interview_questions(resume_text):
    """
    Uses the Gemini API to generate interview questions based on the resume text.
    """
    prompt = f"""Based on the following resume, generate a list of at least 10 interview questions that test the applicant's skills, experiences, and overall fit for the role.
Please provide only the numbered interview questions and do not include any extra comments or explanations.
Resume:
{resume_text}"""
    
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)
        return response.text if response.text else "No response received"
    except Exception as e:
        return json.dumps({"error": str(e)})

def record_audio(duration=30, sample_rate=44100):
    """
    Records audio from the microphone for a specified duration.
    Returns the recorded audio as a numpy array.
    """
    try:
        recording = sd.rec(int(duration * sample_rate), samplerate=sample_rate, channels=1, dtype='float32')
        sd.wait()
        return recording, sample_rate
    except Exception as e:
        print(f"Error during recording: {str(e)}")
        return None, None

def save_audio(recording, sample_rate, filename):
    """Saves the recorded audio to a WAV file."""
    try:
        # Ensure the audio data is in the correct format
        recording = np.int16(recording * 32767)
        wav.write(filename, sample_rate, recording)
        return True
    except Exception as e:
        print(f"Error saving audio: {str(e)}")
        return False

def speech_to_text(audio_file):
    """
    Converts speech from an audio file to text using Google Speech Recognition.
    Returns tuple (text, is_audible) where is_audible indicates if speech was clearly detected.
    """
    if not os.path.exists(audio_file):
        return "No audio recorded", False

    recognizer = sr.Recognizer()
    try:
        with sr.AudioFile(audio_file) as source:
            # Adjust recognition sensitivity
            audio = recognizer.record(source)
            recognizer.energy_threshold = 50  # Lower threshold for more sensitive detection
            recognizer.dynamic_energy_threshold = True
            
            try:
                text = recognizer.recognize_google(audio)
                return text, True
            except sr.UnknownValueError:
                # Try again with lower confidence threshold
                try:
                    text = recognizer.recognize_google(audio, show_all=True)
                    if text and 'alternative' in text:
                        return text['alternative'][0]['transcript'], True
                    return "Speech was not clear", False
                except:
                    return "Speech was not clear enough", False
    except sr.RequestError as e:
        return f"Could not request results from speech recognition service; {e}", False
    except Exception as e:
        return f"Error processing audio: {str(e)}", False

def evaluate_answer(question, answer, is_audible):
    """
    Evaluates the applicant's answer using Gemini AI and provides a score and feedback.
    Uses keyword-based scoring and allows partial credit for partially audible responses.
    """
    # If completely inaudible, still give a minimum score if some words are detected
    if not is_audible:
        words_detected = len(answer.split())
        if words_detected > 0:
            return {
                "score": min(3, words_detected/10),  # Give up to 3 points based on detected words
                "feedback": "The response was partially audible. Some keywords were detected.",
                "strengths": ["Attempted to answer the question"],
                "areas_for_improvement": ["Speak more clearly and at an appropriate volume"]
            }
        return {
            "score": 0,
            "feedback": "The response was completely inaudible.",
            "strengths": [],
            "areas_for_improvement": ["Ensure to speak clearly and at an appropriate volume"]
        }

    prompt = f"""Evaluate this interview answer based on the presence of essential keywords and concepts.
    
    Question: {question}
    Answer: {answer}
    
    Scoring Criteria:
    1. First identify 5-7 essential keywords/concepts that should be present in an ideal answer to this question
    2. Score 2 points for each essential keyword/concept mentioned
    3. Add 1 bonus point for proper context usage of keywords
    4. Maximum score is 10
    
    Please format your response as JSON with the following structure:
    {{
        "score": <score>,
        "keywords_found": ["<keyword1>", "<keyword2>", ...],
        "keywords_missing": ["<keyword1>", "<keyword2>", ...],
        "feedback": "<brief_feedback>",
        "strengths": ["<strength1>", "<strength2>", ...],
        "areas_for_improvement": ["<area1>", "<area2>", ...]
    }}"""
    
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)
        evaluation = json.loads(response.text)
        
        # Ensure score is between 0 and 10
        evaluation['score'] = min(10, max(0, evaluation['score']))
        
        # Add keyword-specific feedback
        if 'keywords_found' in evaluation:
            evaluation['strengths'].append(f"Successfully mentioned keywords: {', '.join(evaluation['keywords_found'])}")
        if 'keywords_missing' in evaluation:
            evaluation['areas_for_improvement'].append(f"Consider mentioning: {', '.join(evaluation['keywords_missing'])}")
        
        return evaluation
    except Exception as e:
        # Fallback to basic word count scoring if AI evaluation fails
        words = len(answer.split())
        base_score = min(7, words/20)  # Up to 7 points based on length
        return {
            "score": base_score,
            "feedback": f"Basic evaluation based on response length: {words} words",
            "strengths": ["Provided a response"],
            "areas_for_improvement": ["Technical error in detailed evaluation"]
        } 