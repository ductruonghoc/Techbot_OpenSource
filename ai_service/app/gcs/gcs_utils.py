# This module provides utility functions for downloading and uploading files to Google Cloud Storage (GCS).
from google.cloud import storage
import os


# GCS Download Function
def download_gcs_file(bucket_name, source_blob_name, destination_file_name):
    """
    Downloads a blob from the bucket.
    Args:
        bucket_name (str): Name of the GCS bucket.
        source_blob_name (str): Name of the blob to download.
        destination_file_name (str): Local path to save the downloaded file.
    Returns:
        None
    """

    # The storage.Client() will automatically use the credentials
    # specified by the GOOGLE_APPLICATION_CREDENTIALS environment variable
    storage_client = storage.Client()

    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(source_blob_name)

    try:
        blob.download_to_filename(destination_file_name)
        print(f"Downloaded {source_blob_name} from bucket {bucket_name} to {destination_file_name}")
    except Exception as e:
        print(f"Error downloading {source_blob_name} from bucket {bucket_name}: {e}")


# Function to upload a file to Google Cloud Storage (GCS)
def upload_gcs_file(bucket_name, source_file_name, destination_blob_name):
    """
    Uploads a file to the bucket.
    Args:
        bucket_name (str): Name of the GCS bucket.
        source_file_name (str): Local path of the file to upload.
        destination_blob_name (str): Name of the blob in the bucket.
    Returns:
        bool: True if upload was successful, False otherwise.
    """
    # The storage.Client() will automatically use the credentials
    # specified by the GOOGLE_APPLICATION_CREDENTIALS environment variable
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(destination_blob_name)

    try:
        blob.upload_from_filename(source_file_name)
        print(f"Uploaded {source_file_name} to {destination_blob_name} in bucket {bucket_name}")
        return True # Indicate success
    except Exception as e:
        print(f"Error uploading {source_file_name} to {destination_blob_name} in bucket {bucket_name}: {e}")
        return False # Indicate failure


# Function to upload PDF images to GCS
def upload_pdf_images_to_gcs(gcs_bucket_name, page):
    """
    Uploads a list of files to the bucket.
    Args:
        gcs_bucket_name (str): Name of the GCS bucket to upload images to.
        page (dict): Dictionary containing page data with image metadata.
    Returns:
        None
    """
    # --- Upload Images to GCS ---
    print("\n--- Uploading Extracted Images to GCS ---")
    upload_count = 0
    for page_data in page.get("pages", []):
      for img_data in page_data.get("page", {}).get("imgs", []):
        local_image_path = img_data.get("retrieved_path")
        # The gcs_bucket_name from the image data is the desired object name in the bucket
        gcs_object_name = img_data.get("gcs_bucket_name")

        if local_image_path and gcs_object_name and os.path.exists(local_image_path):
        # Use the same bucket name for uploading as for downloading the PDF
          success = upload_gcs_file(gcs_bucket_name, local_image_path, gcs_object_name)
        if success:
          upload_count += 1
        elif not os.path.exists(local_image_path):
          print(f"Warning: Local image file not found at {local_image_path}. Skipping upload.")
        elif not gcs_object_name:
          print(f"Warning: GCS object name not found for image at {local_image_path}. Skipping upload.")

        print(f"Finished uploading {upload_count} images to GCS.")