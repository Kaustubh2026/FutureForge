from google import genai
from google import generativea
from google.genai import types
genai.config(GOOGLE_API_KEY = "")

client = genai.Client(api_key=GOOGLE_API_KEY)
MODEL = "gemini-2.0-flash"

from IPython.display import Markdown

response = client.models.generate_content(
    model=MODEL,
    contents="What's the largest planet in our solar system?"
)

Markdown(response.text)
