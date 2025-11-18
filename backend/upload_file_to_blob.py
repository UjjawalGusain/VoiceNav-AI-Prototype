# from google.cloud import storage
# import os
# os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "backend/gemini_credentials.json"

# def upload_blob(bucket_name, source_file_name, destination_blob_name):
#     """Uploads a file to the bucket."""

#     storage_client = storage.Client()
#     bucket = storage_client.bucket(bucket_name)
#     blob = bucket.blob(destination_blob_name)

#     generation_match_precondition = 0

#     blob.upload_from_filename(source_file_name, if_generation_match=generation_match_precondition)

#     print(
#         f"File {source_file_name} uploaded to {destination_blob_name}."
#     )

#     return f'gs://{bucket_name}/{destination_blob_name}'

# if __name__ == "__main__":
#     bucket_name = "voice_recording_bucket"
#     source_file_name = "backend/recording_2.m4a"
#     destination_blob_name = "recording_2.m4a"
#     upload_blob(bucket_name, source_file_name, destination_blob_name)