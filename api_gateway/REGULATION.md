# Response Structure Regulation

## Purpose
This document establishes a standard response structure for all team members to follow when working on projects. Consistency in response structures ensures maintainability, readability, and ease of integration across different parts of the system.

## Standard Response Structure

All team members must use the following structure when handling extraction results:

extractResult:
  - pages (Array of Page objects)
    - page (Object)
      - imgs (Array of Image objects)
        - gcs_bucket_name (String): The Google Cloud Storage bucket name where the image is stored.
        - order (Integer): The order of the image on the page.
        - retrieved_path (String): The path where the image can be retrieved.
      - page_number (Integer): The page number in the document.
      - paragraph (String): The text content of the page.
  - pdf_number_of_pages (Integer): The total number of pages in the document.