from flask import request, jsonify, Blueprint
import base64
import os
import logging
from dotenv import load_dotenv
from langchain_google_vertexai import ChatVertexAI
from langchain_core.messages import HumanMessage

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "backend/gemini_credentials.json"
llm = ChatVertexAI(model="gemini-2.5-flash", project="voicenav-ai", location="us-central1")


transcript_bp = Blueprint("transcript_bp", __name__)
print("Registering /transcribe route")
@transcript_bp.route('/transcribe', methods=['POST'])
def transcribe_audio():
    try:
        data = request.json
        audio_base64 = data.get('audio_base64')
        audio_mime_type = data.get('audio_mime_type', 'audio/wav')
        max_file_size_mb = 10

        if not audio_base64:
            return jsonify({'error': 'No audio data provided'}), 400

        audio_bytes = base64.b64decode(audio_base64)
        if len(audio_bytes) > max_file_size_mb * 1024 * 1024:
            return jsonify({'error': 'Audio file size exceeds maximum allowed size'}), 400

        # Optional: Save temp file if needed for debugging or logging
        filename = 'temp_received.wav'
        with open(filename, 'wb') as f:
            f.write(audio_bytes)

        message = HumanMessage(
            content=[
                {"type": "text", "text": "Transcribe the audio."},
                {"type": "media", "data": audio_base64, "mime_type": audio_mime_type}
            ]
        )

        response = llm.invoke([message])
        logger.info("Transcription successful.")

        # Clean up temporary file
        if os.path.exists(filename):
            os.remove(filename)
        
        print(response.content)

        return jsonify({'transcription': response.content}), 200

    except Exception as e:
        logger.error(f"Failed to transcribe audio: {e}")
        return jsonify({'error': str(e)}), 500
