package models

import (
	"database/sql"
	"time"
    "github.com/pgvector/pgvector-go"
)

type Device struct {
	ID int `json:"id"`
	Label string `json:"label"`
	DeviceTypeID int `json:"device_type_id"`	
	BrandID int `json:"brand_id"`
};

type Brand struct {
	ID int `json:"id"`
	Label string `json:"label"`
};
type DeviceType struct {	
	ID int `json:"id"`
	Label string `json:"label"`
};

type PDF struct {
    ID         int       `json:"id"`
    GCSBucket  string    `json:"gcs_bucket"`
    DeviceID   int       `json:"device_id"`
    OCRFlag    bool      `json:"ocr_flag"`
    FileName   string    `json:"file_name"`
    UploadedAt time.Time `json:"uploaded_at"`
    LastAccess time.Time `json:"last_access"`
	NumberOfPages sql.NullInt32       `json:"number_of_pages"` // Total number of pages in the PDF
}

type PDFPage struct {
    ID      int `json:"id"`
    PDFID   int `json:"pdf_id"`
    Number  int `json:"page_number"` // Page number in the PDF
}

type PDFImage struct {
    ID              int            `json:"id"`
    PageID          int            `json:"pdf_page_id"`
    Sequence        int            `json:"sequence"`
    GCSBucket       string         `json:"gcs_bucket"`
    LastModified    time.Time      `json:"last_modified"`
    AlternativeText sql.NullString `json:"alt"`
}

type PDFParagraph struct {
    ID         int `json:"id"`
    PageID     int `json:"pdf_page_id"`
    Context string`json:"context"` // Context or reference to the paragraph
    LastModified time.Time `json:"last_modified"` // Last modified time of the paragraph
	// You can add more fields like content, position, etc.
}

type PDFChunk struct {
    ID         int `json:"id"`
    Context string `json:"context"` // Context or reference to the chunk
    Embedding pgvector.Vector `json:"embedding"` // Vector embedding for the chunk
}

type PDFChunkParagraph struct {
    ID         int `json:"id"`
    ChunkID    int `json:"pdf_chunk_id"` // Reference to the PDFChunk
    ParagraphID int `json:"pdf_paragraph_id"` // Reference to the PDFParagraph
}

type PDFChunkImage struct {
    ID         int `json:"id"`
    ChunkID    int `json:"pdf_chunk_id"` // Reference to the PDFChunk
    ImageID    int `json:"pdf_image_id"` // Reference to the PDFImage
}