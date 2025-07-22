import os
# Test only
# from dotenv import load_dotenv

# # Load environment variables from .env file
# load_dotenv()

# Configuration for Google Cloud Storage (GCS)
gcs_pdf_bucket_name = os.getenv("GCS_PDF_BUCKET_NAME")

# Database configuration
db_connection_params = {
    "dbname": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "host": os.getenv("DB_HOST"),
    "port": os.getenv("DB_PORT")
}

# Gemini LLM API Key
APIKEYQUERY = os.getenv("GEMINI_API_KEY_QUERY")
APIKEYEXTRACT = os.getenv("GEMINI_API_KEY_EXTRACT")

# Port configuration
PORT = os.getenv("PORT", "8080")  # Default to 8080 if not set

# Path to Google Cloud service account key
service_account_key_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "gcs.json")

# Model name for multilingual BERT
MBERT_MODEL_NAME = 'bert-base-multilingual-cased'

