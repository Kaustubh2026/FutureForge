import google.generativeai as genai
import json
from docx import Document

# Set your API key directly (Replace with your actual API key)
GOOGLE_API_KEY = "AIzaSyDOFymoms9iHYOx3swnvkdxsVRSNQXaEok"

# Configure the google-generativeai module with your API key
genai.configure(api_key=GOOGLE_API_KEY)

def extract_text_from_docx(file_path):
    """Extracts text from a DOCX file."""
    document = Document(file_path)
    return "\n".join(para.text for para in document.paragraphs if para.text.strip())

def get_filtered_job_data(text):
    """Generates structured job data with only required fields using Gemini API."""
    prompt = f"""Extract and return only the following fields from the job description below in JSON format:
    - Company Name
    - Desired Skills
    - Stipend
    
    Job Description:
    {text}

    Return the output as a JSON object with only the requested fields."""
    
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)
        return response.text if response.text else "No response received"
    except Exception as e:
        return json.dumps({"error": str(e)})

# Example usage
if __name__ == "__main__":
    file_path = "Global Hope Initiative.docx"  # Update with your DOCX file path
    extracted_text = extract_text_from_docx(file_path)
    
    if extracted_text.strip():
        structured_data_str = get_filtered_job_data(extracted_text)
        
        try:
            structured_data = json.loads(structured_data_str)
        except json.JSONDecodeError:
            structured_data = {"raw_output": structured_data_str}
        
        print(json.dumps(structured_data, indent=4))
    else:
        print("Error: No text extracted from the document.")
