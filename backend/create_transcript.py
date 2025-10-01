from google import genai
from dotenv import load_dotenv
import os
import logging
from upload_file_to_blob import upload_blob
from record_voice import record_audio
load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from langchain_google_vertexai import ChatVertexAI
from langchain_core.messages import HumanMessage
import base64

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "backend/gemini_credentials.json"
# client = genai.Client(vertexai=True, project="voicenav-ai", location="us-central1")

llm = ChatVertexAI(model="gemini-2.5-flash", project="voicenav-ai", location="us-central1")

def start_transcription(filename="temp.wav", duration=10, audio_mime_type="audio/wav", max_file_size_mb=10):
    """Record audio, replacing existing file if present, then transcribe using Gemini audio (media type) via LangChain."""
    try:
        if os.path.exists(filename):
            os.remove(filename)
            logger.info(f"Existing file '{filename}' found and removed before recording.")

        record_audio(filename=filename, duration=duration)
        logger.info(f"Audio recorded to '{filename}'.")

        if not os.path.exists(filename):
            logger.error(f"Audio file {filename} was not created.")
            return None

        file_size_mb = os.path.getsize(filename) / (1024 * 1024)
        if file_size_mb > max_file_size_mb:
            logger.warning(f"Audio file size {file_size_mb:.2f} MB exceeds recommended limit of {max_file_size_mb} MB.")

        with open(filename, "rb") as audio_file:
            encoded_audio = base64.b64encode(audio_file.read()).decode("utf-8")

        message = HumanMessage(
            content=[
                {"type": "text", "text": "Transcribe the audio."},
                {
                    "type": "media",
                    "data": encoded_audio,
                    "mime_type": audio_mime_type,
                },
            ]
        )

        response = llm.invoke([message])
        logger.info("Transcription successful.")
        return response.content

    except Exception as e:
        logger.error(f"Failed to transcribe audio: {e}")
        return None

