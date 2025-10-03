import os
from flask import Flask
from flask_cors import CORS 
from backend.controllers.create_transcript import transcript_bp
from backend.controllers.foreman_agent import foreman_bp

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "backend/gemini_credentials.json"
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

app.register_blueprint(transcript_bp)
app.register_blueprint(foreman_bp)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
