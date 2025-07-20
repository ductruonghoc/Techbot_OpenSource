# This module provides functions to extract text and images from a PDF file using OCR and YOLO detection.
# 1. Standard library imports
import datetime
import hashlib
import json
import os
import shutil
import time
import urllib.parse
import concurrent.futures

# 2. Third-party library imports
import fitz  # PyMuPDF for PDF handling
from PIL import Image
# from dotenv import load_dotenv

# 3. AI-related imports
from google import genai
from google.genai import types
from ultralytics import YOLO

# 4. Local application imports
from app.gcs import gcs_utils
from app import config
# Test only
# # Load environment variables
# load_dotenv()
# Configure the Gemini client with the API key for text extraction
client = genai.Client(api_key=config.APIKEYEXTRACT)

# This module provides a function to save a single-page PDF with retries if the file is in use.
def save_with_retries(single_page_doc, temp_pdf_path, retries=5, delay=0.5) -> bool:
    """Try to save a PDF file, waiting and retrying if it's in use."""
    for attempt in range(retries):
        try:
            single_page_doc.save(temp_pdf_path)
            return True
        except PermissionError as e:
            if attempt < retries - 1:
                print(f"File {temp_pdf_path} is in use, waiting to retry save ({attempt+1}/{retries})...")
                time.sleep(delay)
            else:
                print(f"Failed to save {temp_pdf_path} after {retries} attempts: {e}")
                raise
        except Exception as e:
            print(f"Error saving {temp_pdf_path}: {e}")
            raise


# This module provides a function to extract text from a PDF using the Gemini model.
def extract_text_with_gemini(pdf_path: str) -> str:
    """
    Extract text from a PDF using the Gemini model.
    Args:
        pdf_path (str): Path to the PDF file.
    Returns:
        str: Extracted text from the PDF.
    """
    try:
        # Upload the Image using the File API
        pdf_file = client.files.upload(
          file=pdf_path,
        )

        prompt_text = f"""Extract the all information from the pdf:"""

        response = client.models.generate_content(
            model="gemini-2.5-flash-preview-05-20",
            config=types.GenerateContentConfig(
                system_instruction="""
                  You are a highly accurate document data extraction specialist.
                  Your primary objective is to extract all information from the provided PDF document while **strictly preserving the original language of the document.** Do NOT translate any content.

                  1. Group related fragments into logical paragraphs (2-5 sentences each)
                  2. Merge short fragments (<10 words) with relevant paragraphs
                  3. Remove problematic special characters
                  4. Preserve original meaning and factual content
                  5. Output clean paragraphs only - no extra text
                  6. Seperate each paragraph with "\n"

                  Maintain the document's logical flow, original intent , and **uncompromised original language.**.
                  """
            ),
            contents=[
                pdf_file,
                prompt_text],
        )

        return response.text
    except Exception as e:
        print(f"An error occurred: {e}")
        return None


# This module provides a function to extract images from a PDF page using YOLO detection.
def extract_detected_images_with_YOLO(pdf_path, page_num, media_images_dir) -> list:
    """ 
    Extract images from a PDF page using YOLO detection.
    Args:
        pdf_path (str): Path to the PDF file.
        page_num (int): Page number to extract images from (0-indexed).
        media_images_dir (str): Directory to save extracted images.
    Returns:
        list: A list of dictionaries containing image metadata.
    """
    # Init the model (have to be here for safe multithreading)
    model = YOLO('weight.pt')  # load a pretrained model

    extracted_imgs = []
    doc = fitz.open(pdf_path)
    page = doc.load_page(page_num)

    # Render the page to an image and save it
    pix = page.get_pixmap(dpi=150)
    width, height = pix.width, pix.height

    media_temp_dir = "media/images"
    os.makedirs(media_temp_dir, exist_ok=True)
    img_path = os.path.join(media_temp_dir, f"page_{page_num+1}_{os.getpid()}.png")
    pix.save(img_path)

    try:
        # Run detection
        results = model(img_path)
        result = results[0]

        # Get normalized boxes and convert to pixel values
        boxes = result.boxes.xyxyn.cpu().numpy()
        boxes[:, [0, 2]] *= width
        boxes[:, [1, 3]] *= height

        # Open the image with PIL for cropping
        with Image.open(img_path) as full_image:
            for img_index, box in enumerate(boxes):
                x1, y1, x2, y2 = map(int, box.tolist())

                # Validate bounding box
                if x1 >= x2 or y1 >= y2:
                    print(f"Invalid bounding box for image {img_index + 1}: {box}")
                    continue

                cropped_image = full_image.crop((x1, y1, x2, y2))

                # Skip empty crops
                if cropped_image.width == 0 or cropped_image.height == 0:
                    print(f"Empty cropped image for box {img_index + 1}")
                    continue

                # Create output path
                os.makedirs(media_images_dir, exist_ok=True)
                image_filename = f"detected_image_page{page_num + 1}_order{img_index + 1}.png"
                image_path = os.path.join(media_images_dir, image_filename)

                # Save cropped image
                cropped_image.save(image_path)

                # Generate unique GCS-style name
                unique_string = f"detected_{page_num + 1}_{img_index + 1}_{datetime.datetime.now().isoformat()}"
                gcs_bucket_name = hashlib.sha256(unique_string.encode()).hexdigest()
                gcs_bucket_name_encoded = urllib.parse.quote_plus(gcs_bucket_name)

                # Append result
                extracted_imgs.append({
                    "gcs_bucket_name": gcs_bucket_name_encoded,
                    "order": img_index + 1,
                    "retrieved_path": image_path
                })

    except Exception as e:
        print(f"YOLO detection failed on page {page_num + 1}: {e}")

    finally:
        
        doc.close()

    return extracted_imgs


# This module provides functions to extract text and images from a page in PDF file using OCR and YOLO detection.
def ocr_single_page(page_data) -> dict:
    """
    Extract text and images from a single page of a PDF file.
    Args:
        page_data (tuple): A tuple containing the PDF path, page number, and media images directory.
    Returns:
        dict: A dictionary containing the extracted text and images for the page.
    """
    pdf_path, page_num, media_images_dir = page_data
    page_content = {
        "page": {
            "imgs": [],
            "page_number": page_num + 1,
            "paragraph": "",
        }
    }
    doc = None

    try:
        doc = fitz.open(pdf_path)

        # --- 1. Text extraction using Gemini Model ---
        try:
            # Use media/temp for temp PDF
            media_temp_dir = "media/pdfs"
            os.makedirs(media_temp_dir, exist_ok=True)
            temp_pdf_path = os.path.join(media_temp_dir, f"page_{page_num+1}_{os.getpid()}.pdf")
            # If the file already exists, just use it
            if not os.path.exists(temp_pdf_path):
                single_page_doc = fitz.open()  # New blank PDF
                single_page_doc.insert_pdf(doc, from_page=page_num, to_page=page_num)
                save_with_retries(single_page_doc, temp_pdf_path)

            page_ocr_text = extract_text_with_gemini(temp_pdf_path)

            page_content["page"]["paragraph"] = page_ocr_text
            
        except Exception as e:
            print(f"Error performing OCR on page {page_num + 1}: {e}")
            page_content["page"]["paragraph"] = ""
            

        # --- 2. Extract images ---
        try:
            page_content["page"]["imgs"].extend(
                extract_detected_images_with_YOLO(pdf_path, page_num, media_images_dir)
            )
        except Exception as e:
            print(f"Could not process embedded image on page {page_num + 1}: {e}")

    except fitz.FileNotFoundError:
        print(f"Error: PDF file not found at {pdf_path} in worker process.")
        return None
    except Exception as e:
        print(f"An unexpected error occurred in worker process for page {page_num + 1}: {e}")
        return None
    finally:
        if doc:
            doc.close()

    return page_content


# This module provides a function to extract data from a PDF file using multiprocessing for page-level OCR and image extraction.
def extract_pdf_data(pdf_path, gcs_pdf_bucket_name):
    """
    Extract data from a PDF file using multiprocessing for page-level OCR and image extraction.
    Args:
        pdf_path (str): Path to the PDF file.
        gcs_pdf_bucket_name (str): Name of the GCS bucket to upload images.
    Returns:
        str: JSON string containing the extracted data, including text and images.
    """
    try:
        """
        Scans a PDF file using multiprocessing for page-level OCR and image extraction.
        """
        output_data = {
            "pages": [],
            "pdf_number_of_pages": 0,
        }

        if not os.path.exists(pdf_path):
            print(f"Error: PDF file not found at {pdf_path}")
            return json.dumps(output_data, indent=2)

        doc = None # Initialize doc to None in the main process
        try:
            doc = fitz.open(pdf_path)
            num_pages = doc.page_count
            output_data["pdf_number_of_pages"] = num_pages

            media_images_dir = "media/images"
            """Clears all contents of the specified directory."""
            if os.path.exists(media_images_dir):
                print(f"Clearing directory: {media_images_dir}")
                shutil.rmtree(media_images_dir)
            os.makedirs(media_images_dir, exist_ok=True)


            # Prepare the data for each worker process
            # Each element in page_data_list will be passed to ocr_single_page
            page_data_list = [(pdf_path, page_num, media_images_dir) for page_num in range(num_pages)]

            # Use ProcessPoolExecutor for a convenient way to manage processes
            # You can adjust max_workers based on your system's CPU cores
            # Setting it to None uses the number of cores on your machine
            with concurrent.futures.ProcessPoolExecutor(max_workers=None) as executor:
                # Map the worker function to the list of page data
                # As completed, the results will be added to the results list
                results = list(executor.map(ocr_single_page, page_data_list))

            # Collect and process the results from the workers
            # Ensure the pages are in the correct order
            # The results list from executor.map will be in the order the tasks were submitted
            for page_content in results:
                if page_content: # Check if the worker function returned valid data
                    output_data["pages"].append(page_content)
                # Handle cases where a worker might have failed (returned None) if necessary

        except fitz.FileNotFoundError:
            print(f"Error: PDF file not found at {pdf_path}")
            return None
        except Exception as e:
            print(f"An unexpected error occurred in the main process: {e}")
            return None
        finally:
            if doc:
                doc.close() # Close the document in the main process

        # Sort pages by page number to ensure correct order in the final JSON
        output_data["pages"].sort(key=lambda x: x["page"]["page_number"])

         # --- Upload detected images to GCS before cleaning up temp dirs ---
        gcs_utils.upload_pdf_images_to_gcs(gcs_pdf_bucket_name, output_data)

        # Clean up temp directories after all actions succeed
        # clean up
        for temp_dir in ["media/images", "media/pdfs"]:
            if os.path.exists(temp_dir):
                try:
                    shutil.rmtree(temp_dir)
                except Exception as e:
                    print(f"Warning: Could not remove temp dir {temp_dir}: {e}")

        return json.dumps(output_data, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"An error occurred: {e}")
        return None