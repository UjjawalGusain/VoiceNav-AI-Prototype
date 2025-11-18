# from google import genai
# from dotenv import load_dotenv
# import os
# load_dotenv()

# os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "backend/gemini_credentials.json"
# # os.environ["GEMINI_API_KEY"] = os.getenv("GOOGLE_GEMINI_API_KEY") 
# client = genai.Client(vertexai=True, project="voicenav-ai", location="us-central1")

# gcs_uri = "gs://voice_recording_bucket/recording_1.m4a"

# response = client.models.generate_content(
#     model="gemini-2.5-flash",
#     contents=[
#         "Generate a transcript of the speech from the audio file.",
#         {
#             "uri": gcs_uri,
#             "mime_type": "audio/mp4"
#         }
#     ]
# )

# print("Transcript:")
# print(response.text)
