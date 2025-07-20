# API Documentation

## /pdf_process/new_device [GET]

**Use:**  
Create a new device entry.

**Request:**  
Query Params:

- `label` (string, required): Device label/name.
- `brand_id` (int, required): Brand ID.
- `device_type_id` (int, required): Device type ID.

**Response:**

```json
{
  "success": true,
  "message": "Device inserted successfully",
  "data": {
    "device_id": 1
  }
}
```

---

## /pdf_process/get_brands_and_device_types [GET]

**Use:**  
Fetch all available brands and device types.

**Request:**  
No parameters.

**Response:**

```json
{
  "success": true,
  "message": "Fetched brands and device types successfully.",
  "data": {
    "brands": [
      /* array of brands */
    ],
    "deviceTypes": [
      /* array of device types */
    ]
  }
}
```

---

## /pdf_process/pdf_upload [GET]

**Use:**  
Register a new PDF for a device and get a signed upload URL.

**Request:**  
Query Params:

- `device_id` (int, required): Device ID.
- `pdf_name` (string, optional): Name for the PDF.

**Response:**

```json
{
  "success": true,
  "message": "PDF upload URL generated",
  "data": {
    "pdf_id": 1,
    "signed_url": "https://..."
  }
}
```

---

## /pdf_process/extract_pdf [GET]

**Use:**  
Extract PDF content from GCS and update database.

**Request:**  
Query Params:

- `pdf_id` (int, required): PDF ID.

**Response:**

```json
{
  "success": true,
  "message": "PDF extraction and database update successful"
}
```

---

## /pdf_process/save_and_embed_paragraph [POST]

**Use:**  
Update a paragraph's content and embed it.

**Request:**  
Body:

```json
{
  "pdf_paragraph_id": 1,
  "context": "string"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Paragraph context saved and embedded successfully"
}
```

---

## /pdf_process/save_and_embed_img_alt [POST]

**Use:**  
Update an image's alt text and embed it.

**Request:**  
Body:

```json
{
  "pdf_image_id": 1,
  "img_alt": "string"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Image alt saved and embedded successfully"
}
```

---

## /pdf_process/get_pdf_initial_state [GET]

**Use:**  
Get the initial state of a PDF (first page's images and paragraph).

**Request:**  
Query Params:

- `pdf_id` (int, required): PDF ID.

**Response:**

```json
{
  "success": true,
  "message": "PDF initial state fetched successfully",
  "data": {
    "pdf_gcs_signed_read_url": "string",
    "images": [
      {
        "id": 1,
        "alt": "string",
        "modified": true
      }
    ],
    "page_paragraph": {
      "id": 1,
      "context": "string",
      "modified": true
    },
    "pdf_ocr_flag": true,
    "pdf_name": "string"
  }
}
```

---

## /pdf_process/get_pdf_state [GET]

**Use:**  
Get images and paragraph for a specific page of a PDF.

**Request:**  
Query Params:

- `pdf_id` (int, required): PDF ID.
- `page_number` (int, required): Page number.

**Response:**

```json
{
  "success": true,
  "message": "PDF state fetched successfully",
  "data": {
    "images": [
      {
        "id": 1,
        "alt": "string",
        "modified": true
      }
    ],
    "page_paragraph": {
      "id": 1,
      "context": "string",
      "modified": true
    }
  }
}
```

---

## /pdf_process/get_img_signed_url [GET]

**Use:**  
Get a signed URL to access an image.

**Request:**  
Query Params:

- `img_id` (int, required): Image ID.

**Response:**

```json
{
  "success": true,
  "message": "Image signed URL fetched successfully",
  "data": {
    "signed_url": "string"
  }
}
```

---

## /pdf_process/delete_chunk [POST]

**Use:**  
Delete a chunk by its ID.

**Request:**  
Body:

```json
{
  "chunk_id": 1
}
```

**Response:**

```json
{
  "success": true,
  "message": "Chunk deleted successfully"
}
```

---

## /pdf_process/create_new_image [POST]

**Use:**  
Create a new image for a page and get a signed upload URL.

**Request:**  
Body:

```json
{
  "pdf_id": 1,
  "page_number": 1
}
```

**Response:**

```json
{
  "success": true,
  "message": "Image created successfully",
  "data": {
    "image_id": 1,
    "sequence": 2,
    "signed_url": "string"
  }
}
```

---

## /pdf_process/devices [GET]

**Use:**  
List devices with progress tracking.

**Request:**  
Query Params (all optional except `offset`):

- `offset` (int, default 1): Pagination offset.
- `name` (string): Filter by device name.
- `brand` (string): Filter by brand.
- `category` (string): Filter by device type.
- `sort` (string): Sort by "id", "name", or "scoring".

**Response:**

```json
{
  "success": true,
  "message": "Image created successfully",
  "data": [
    {
      "devicename": "string",
      "scoring": 1,
      "device_id": 1
    }
  ]
}
```

---

## /pdf_process/agent_is_extracting_status [GET]

**Use:**  
Get the current extracting status of the agent.

**Request:**  
No parameters.

**Response:**

```json
{
  "success": true,
  "agent_is_extracting": true
}
```

## /pdf_process/list_pdfs_states [GET]

**Use:**  
Get a paginated list of PDFs with their processing states, supporting filtering by device name, brand, category, and scoring range.

**Request:**  
Query Params (all optional unless noted):

- `offset` (int, default 1): Page number for pagination (10 items per page).
- `nameQuery` (string): Filter by device name (partial match, case-insensitive).
- `brand` (string): Filter by brand name (partial match, case-insensitive).
- `category` (string): Filter by device type/category (partial match, case-insensitive).
- `sort` (string, default "scoring"): Sort by `"scoring"`, `"name"`, or `"last_modified"`.
- `min_scoring` (int): Minimum scoring value to filter PDFs (0-3).
- `max_scoring` (int): Maximum scoring value to filter PDFs (0-3).

**Scoring values:**
- `0`: PDF not present
- `1`: PDF uploaded, not OCR processed
- `2`: PDF OCR processed, not embedded
- `3`: PDF fully processed (embedded)

**Response:**

```json
{
  "status": true,
  "message": "Fetched PDFs states successfully",
  "data": {
    "pdfs": [
      {
        "device_id": 1,
        "pdf_id": 10,
        "pdf_lastModified": "2024-07-10T12:34:56Z",
        "pdf_label": "User Manual",
        "pdf_scoring": 3
      }
      // ...more items
    ],
    "prevPage": false,
    "nextPage": true
  }
}
```

**Fields:**
- `pdfs`: Array of PDF objects.
  - `device_id`: ID of the device.
  - `pdf_id`: ID of the PDF.
  - `pdf_lastModified`: Last modified timestamp (RFC3339 format).
  - `pdf_label`: Name of the PDF file.
  - `pdf_scoring`: Processing state (see scoring values above).
- `prevPage`: Boolean, true if previous page exists.
- `nextPage`: Boolean, true if next page exists.

**Example Request:**

```
GET /pdf_process/list_pdfs_states?offset=2&brand=Samsung&min_scoring=2&sort=last_modified
```

**Example Response:**

```json
{
  "status": true,
  "message": "Fetched PDFs states successfully",
  "data": {
    "pdfs": [
      {
        "device_id": 5,
        "pdf_id": 42,
        "pdf_lastModified": "2024-07-09T15:00:00Z",
        "pdf_label": "Samsung Guide",
        "pdf_scoring": 3
      }
    ],
    "prevPage": true,
    "nextPage": false
  }
}
```

**Errors:**
- `500`: Database error or internal error.
- `400`: Invalid query parameters.

**Notes:**
- All filters are optional.
- Pagination is 10 items per page.
- Use `min_scoring` and `max_scoring` to filter by processing state.

---

## /pdf_process/pdf_pages_embedding_status [GET]

**Use:**  
Get the embedding status for each page of a PDF.

**Request:**  
Query Params:

- `pdf_id` (int, required): PDF ID.

**Response:**

```json
{
  "status": true,
  "message": "Fetched embedded statuses successfully",
  "data": {
    "embedded_statuses": [
      {
        "page_number": 1,
        "done": true
      },
      {
        "page_number": 2,
        "done": false
      }
      // ...more pages
    ]
  }
}
```

**Fields:**
- `embedded_statuses`: Array of objects, each representing a page.
  - `page_number`: The page number in the PDF.
  - `done`: Boolean, true if the page has at least one embedded chunk, false otherwise.

**Errors:**
- `400`: Missing or invalid `pdf_id` parameter.
- `500`: Database error or internal error.

**Example Request:**

```
GET /pdf_process/pdf_pages_embedding_status?pdf_id=1
```

**Example Response:**

```json
{
  "status": true,
  "message": "Fetched embedded statuses successfully",
  "data": {
    "embedded_statuses": [
      { "page_number": 1, "done": true },
      { "page_number": 2, "done": false }
    ]
  }
}
```

---

## /auth/unverified_register [POST]

**Use:**  
Start registration for a new user (email/password). Sends OTP to email if not registered.

**Request:**  
Body:

```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**

```json
{
  "message": "Nonverified registration process completed successfully"
}
```

---

## /auth/verify_registration [POST]

**Use:**  
Verify OTP for registration and create user account.

**Request:**  
Body:

```json
{
  "email": "string",
  "otp_code": "string"
}
```

**Response:**

```json
{
  "message": "User verified successfully",
  "email": "string"
}
```

---

## /auth/can_google_register [POST]

**Use:**  
Check if a Google account can register (not already registered).

**Request:**  
Body:

```json
{
  "google_id": "string"
}
```

**Response:**

```json
{
  "message": "Google Registration can process"
}
```

---

## /auth/google_registration [POST]

**Use:**  
Register a new user with Google account.

**Request:**  
Body:

```json
{
  "google_id": "string",
  "google_email": "string"
}
```

**Response:**

```json
{
  "message": "Google Registration process successfully"
}
```

---

## /auth/login [POST]

**Use:**  
Login with email and password.

**Request:**  
Body:

```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**

```json
{
  "token": "string"
}
```

---

## /auth/google_login [POST]

**Use:**  
Login with Google account.

**Request:**  
Body:

```json
{
  "google_id": "string"
}
```

**Response:**

```json
{
  "token": "string"
}
```

---

## /auth/can_reset_password [POST]

**Use:**  
Request OTP for password reset if email exists.

**Request:**  
Body:

```json
{
  "email": "string"
}
```

**Response:**

```json
{
  "success": true,
  "message": "OTP has been sent."
}
```

---

## /auth/reset_password [POST]

**Use:**  
Reset password after verifying OTP.

**Request:**  
Body:

```json
{
  "email": "string",
  "otp_code": "string",
  "password": "string"
}
```

**Response:**

```json
{
  "message": "Password resets successfully."
}
```

---

## /auth/resend_otp_registration [POST]

**Use:**  
Resend OTP for registration.

**Request:**  
Body:

```json
{
  "email": "string"
}
```

**Response:**

```json
{
  "success": true,
  "message": "OTP has been sent."
}
```

---

## /auth/resend_otp_reset_password [POST]

**Use:**  
Resend OTP for password reset.

**Request:**  
Body:

```json
{
  "email": "string"
}
```

**Response:**

```json
{
  "success": true,
  "message": "OTP has been sent."
}
```

---

## /auth/admin_login [POST]

**Use:**  
Login as admin.

**Request:**  
Body:

```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "token": "string"
  }
}
```

---

## /auth/admin_authorize [POST]

**Use:**  
Check admin authorization (requires admin token).

**Request:**  
Header:

- `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "message": "Admin authorization successful"
}
```

---

## /conversation/rag_query [POST]

**Use:**  
Send a user query to the RAG (Retrieval-Augmented Generation) system and receive an LLM response, optionally storing the request-response pair if authenticated.

**Request:**  
Body:

```json
{
  "query": "string", // Required. The user's question or prompt.
  "conversation_id": "string" // Optional. Existing conversation ID.
}
```

**Response:**

```json
{
  "success": true,
  "message": "LLM response fetched successfully",
  "data": {
    "response": "string", // The generated response from the LLM.
    "images_ids": [1, 2], // (Optional) Array of related PDF image IDs.
    "pair_id": 123 // (Optional) ID of the stored request-response pair, -1 if not stored.
  }
}
```

---

## /conversation/storing [POST]

**Use:**  
Create a new conversation and store its ID for the authenticated user. Optionally associate the conversation with a device.

**Request:**  
Header:

- `Authorization: Bearer <token>`

Body (JSON):

```json
{
  "device_id": 123 // Optional, integer
}
```

**Response (Success: 200):**

```json
{
  "success": true,
  "message": "Conversation stored successfully",
  "conversation_id": "string"
}
```

**Response (Error Example):**

```json
{
  "success": false,
  "message": "Failed to store conversation",
  "error": "..."
}
```

---

## /conversation/:id [GET]

**Use:**  
Get information about a conversation, including its title, all request-response pairs (with images if any), and the related device id if exists.

**Request:**  
Header:

- `Authorization: Bearer <token>` (if required by your middleware)

Path Parameter:

- `id` (string): The conversation ID.

**Response (Success: 200):**

```json
{
  "success": true,
  "data": {
    "title": "Conversation Title",
    "device_id": 123, // integer if exists, null if not
    "pairs": [
      {
        "id": 1,
        "request": "User question",
        "response": "LLM answer",
        "images": [11, 12] // array of image IDs, empty if none
      }
      // ...
    ]
  }
}
```

**Response (Error Example - Not Found):**

```json
{
  "success": false,
  "message": "Conversation not found",
  "error": "sql: no rows in result set"
}
```

**Response (Error Example - Internal Error):**

```json
{
  "success": false,
  "message": "Failed to fetch request-response pairs",
  "error": "..."
}
```

**Notes:**
- `title` is the conversation's title as stored in the database.
- `device_id` is `null` if the conversation is not linked to any device.
- Each `pair` contains the request, response, and an array of image IDs (can be empty).

---

## /conversation/list [GET]

**Use:**  
Get the 10 most recently updated conversations for the authenticated user.

**Authentication:**  
Requires JWT token in the `Authorization` header.

**Request:**  
Header:

- `Authorization: Bearer <token>`

No body or query parameters required.

**Response (Success: 200):**
```json
{
  "status": true,
  "message": "Fetched conversations successfully",
  "data": {
    "conversations": [
      {
        "device_name": "Device A",
        "conversation_id": "036624b6a889395a673a7b037cf59d071355b5fcc65f8746b345d2772fd38d6d",
        "conversation_title": "My Conversation",
        "conversation_updated_time": "2024-07-08T12:34:56Z"
      },
      {
        "device_name": "Global Devices Scope",
        "conversation_id": "b1e2c3d4...",
        "conversation_title": "",
        "conversation_updated_time": "2024-07-07T10:20:30Z"
      }
      // ...up to 10 items
    ]
  }
}
```

**Response (Unauthorized Example):**
```json
{
  "status": false,
  "message": "Unauthorized: account_id not found in context"
}
```

**Notes:**
- `device_name` will be `"Global Devices Scope"` if the conversation is not linked to any device.
- Returns at most 10 conversations, ordered by most recently updated.
- `conversation_title` may be an empty string if not set.
- `conversation_updated_time` is in RFC3339 format.

---