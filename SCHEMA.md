# Database Schema Description

This document provides an overview of the database schema, including tables, sequences, and relationships.

---

## Tables

### 1. `account`
- **Columns**:
  - `id` (integer, primary key, auto-incremented)
  - `username` (character varying(200), unique)
  - `role_id` (integer, foreign key)
  - `display_name` (character varying(200))
- **Constraints**:
  - Primary Key: `id`
  - Unique: `username`
  - Foreign Key: `role_id` → `role.id`

---

### 2. `admin`
- **Columns**:
  - `id` (integer, primary key, auto-incremented)
  - `password` (character varying(200))
- **Constraints**:
  - Primary Key: `id`
  - Foreign Key: `id` → `account.id`

---

### 3. `ai_agent_resources`
- **Columns**:
  - `id` (integer, primary key, auto-incremented)
  - `name` (character varying(100))
  - `ip` (character varying(20))
  - `ocr_in_used` (boolean)
- **Constraints**:
  - Primary Key: `id`

---

### 4. `brand`
- **Columns**:
  - `id` (integer, primary key, auto-incremented)
  - `label` (character varying(50))
  - `homepage_ref` (character varying(500))
  - `description` (text)
- **Constraints**:
  - Primary Key: `id`

---

### 5. `conversation`
- **Columns**:
  - `id` (text, primary key)
  - `account_id` (integer, foreign key)
  - `title` (text)
  - `created_time` (timestamp without time zone)
  - `updated_time` (timestamp without time zone)
- **Constraints**:
  - Primary Key: `id`
  - Foreign Key: `account_id` → `account.id`

---

### 6. `device`
- **Columns**:
  - `id` (integer, primary key, auto-incremented)
  - `description` (text)
  - `details_ref` (character varying(500))
  - `device_type_id` (integer, foreign key)
  - `brand_id` (integer, foreign key)
  - `label` (character varying(50), unique)
- **Constraints**:
  - Primary Key: `id`
  - Unique: `label`
  - Foreign Keys:
    - `device_type_id` → `device_type.id`
    - `brand_id` → `brand.id`

---

### 7. `device_conversation`
- **Columns**:
  - `device_id` (integer, primary key, foreign key)
  - `conversation_id` (text, primary key, foreign key)
- **Constraints**:
  - Primary Key: (`device_id`, `conversation_id`)
  - Foreign Keys:
    - `device_id` → `device.id`
    - `conversation_id` → `conversation.id`

---

### 8. `device_type`
- **Columns**:
  - `id` (integer, primary key, auto-incremented)
  - `description` (text)
  - `wiki_ref` (character varying(500))
  - `label` (character varying(50))
- **Constraints**:
  - Primary Key: `id`

---

### 9. `google_user`
- **Columns**:
  - `id` (integer, primary key, auto-incremented)
  - `google_id` (text)
- **Constraints**:
  - Primary Key: `id`
  - Foreign Key: `id` → `account.id`

---

### 10. `note`
- **Columns**:
  - `id` (integer, primary key, foreign key)
  - `title` (text)
- **Constraints**:
  - Primary Key: `id`
  - Foreign Key: `id` → `request_response_pair.id`

---

### 11. `pdf`
- **Columns**:
  - `id` (integer, primary key, auto-incremented)
  - `gcs_bucket` (character varying(100))
  - `device_id` (integer, foreign key)
  - `ocr_flag` (boolean)
  - `filename` (character varying(100))
  - `number_of_pages` (integer)
  - `uploaded_at` (timestamp without time zone)
  - `last_access` (timestamp without time zone)
- **Constraints**:
  - Primary Key: `id`
  - Foreign Key: `device_id` → `device.id`

---

### 12. `pdf_chunk`
- **Columns**:
  - `id` (integer, primary key, auto-incremented)
  - `embedding` (vector(768))
  - `context` (text)
- **Constraints**:
  - Primary Key: `id`

---

### 13. `pdf_chunk_pdf_image`
- **Columns**:
  - `id` (integer, primary key, auto-incremented)
  - `pdf_chunk_id` (integer, foreign key)
  - `pdf_image_id` (integer, foreign key)
- **Constraints**:
  - Primary Key: `id`
  - Foreign Keys:
    - `pdf_chunk_id` → `pdf_chunk.id`
    - `pdf_image_id` → `pdf_image.id`

---

### 14. `pdf_chunk_pdf_paragraph`
- **Columns**:
  - `id` (integer, primary key, auto-incremented)
  - `pdf_chunk_id` (integer, foreign key)
  - `pdf_paragraph_id` (integer, foreign key)
- **Constraints**:
  - Primary Key: `id`
  - Foreign Keys:
    - `pdf_chunk_id` → `pdf_chunk.id`
    - `pdf_paragraph_id` → `pdf_paragraph.id`

---

### 15. `pdf_image`
- **Columns**:
  - `id` (integer, primary key, auto-incremented)
  - `pdf_page_id` (integer, foreign key)
  - `gcs_bucket` (character varying(100))
  - `alt` (text)
  - `sequence` (integer)
  - `last_modified` (timestamp without time zone)
- **Constraints**:
  - Primary Key: `id`
  - Foreign Key: `pdf_page_id` → `pdf_page.id`

---

### 16. `pdf_page`
- **Columns**:
  - `id` (integer, primary key, auto-incremented)
  - `page_number` (integer)
  - `pdf_id` (integer, foreign key)
- **Constraints**:
  - Primary Key: `id`
  - Foreign Key: `pdf_id` → `pdf.id`

---

### 17. `pdf_paragraph`
- **Columns**:
  - `id` (integer, primary key, auto-incremented)
  - `context` (text)
  - `pdf_page_id` (integer, foreign key)
  - `last_modified` (timestamp without time zone)
- **Constraints**:
  - Primary Key: `id`
  - Foreign Key: `pdf_page_id` → `pdf_page.id`

---

### 18. `request_response_pair`
- **Columns**:
  - `id` (integer, primary key, auto-incremented)
  - `request` (text)
  - `response` (text)
  - `conversation_id` (text, foreign key)
  - `created_time` (timestamp without time zone)
- **Constraints**:
  - Primary Key: `id`
  - Foreign Key: `conversation_id` → `conversation.id`

---

### 19. `request_response_pair_pdf_image`
- **Columns**:
  - `request_response_pair_id` (integer, primary key, foreign key)
  - `pdf_image_id` (integer, primary key, foreign key)
- **Constraints**:
  - Primary Key: (`request_response_pair_id`, `pdf_image_id`)
  - Foreign Keys:
    - `request_response_pair_id` → `request_response_pair.id`
    - `pdf_image_id` → `pdf_image.id`

---

### 20. `role`
- **Columns**:
  - `id` (integer, primary key, auto-incremented)
  - `label` (character varying(50))
- **Constraints**:
  - Primary Key: `id`

---

### 21. `temp_user`
- **Columns**:
  - `email` (character varying(200), unique)
  - `password` (character(60))
  - `otp` (character(60))
  - `otp_generated_time` (timestamp without time zone)
- **Constraints**:
  - Unique: `email`

---

### 22. `user`
- **Columns**:
  - `id` (integer, primary key, auto-incremented)
  - `email` (character varying(200), unique)
  - `password` (character(60))
  - `otp` (character(60))
  - `otp_generated_time` (timestamp without time zone)
- **Constraints**:
  - Primary Key: `id`
  - Unique: `email`
  - Foreign Key: `id` → `account.id`

---

## Sequences

Each table with an auto-incremented primary key has an associated sequence. These sequences are used to generate unique values for the primary key columns.

---

## Relationships

- **Foreign Keys**:
  - Defined for relationships between tables, ensuring referential integrity.
  - Example: `account.role_id` references `role.id`.

- **Cascade Deletes**:
  - Some foreign keys are defined with `ON DELETE CASCADE`, ensuring related rows are deleted automatically.

---

schema provides a robust structure for managing data relationships and ensuring data integrity.This 