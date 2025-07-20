package models

import (
	"database/sql"
)

func InsertDevice(db *sql.DB, device Device) (int, error) {
	id := 0
	//db query here
	query := `
        INSERT INTO device (label, brand_id, device_type_id)
        VALUES ($1, $2, $3)
        RETURNING id;
    `
	// Replace DB with your actual *sql.DB instance
	err := db.QueryRow(query, device.Label, device.BrandID, device.DeviceTypeID).Scan(&id)
	if err != nil {
		return 0, err
	}
	return id, nil
}

func SelectAllBrands(db *sql.DB) ([]Brand, error) {
	query := `SELECT id, label FROM brand`
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var brands []Brand
	for rows.Next() {
		var b Brand
		if err := rows.Scan(&b.ID, &b.Label); err != nil {
			return nil, err
		}
		brands = append(brands, b)
	}
	return brands, nil
}

func SelectAllDeviceTypes(db *sql.DB) ([]DeviceType, error) {
	query := `SELECT id, label FROM device_type`
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var types []DeviceType
	for rows.Next() {
		var t DeviceType
		if err := rows.Scan(&t.ID, &t.Label); err != nil {
			return nil, err
		}
		types = append(types, t)
	}
	return types, nil
}

func GetDeviceByID(id int) (Device, error) {
	query := `SELECT id, label, brand_id, device_type_id FROM device WHERE id = $1`
	var device Device
	err := DB.QueryRow(query, id).Scan(&device.ID, &device.Label, &device.BrandID, &device.DeviceTypeID)
	if err != nil {
		return device, err
	}
	return device, nil
}

func InsertPDF(pdf PDF) (int, error) {
	var id int
	query := `
        INSERT INTO pdf (gcs_bucket, device_id, ocr_flag, filename, uploaded_at, last_access)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id;
    `
	err := DB.QueryRow(query, pdf.GCSBucket, pdf.DeviceID, pdf.OCRFlag, pdf.FileName, pdf.UploadedAt, pdf.LastAccess).Scan(&id)
	if err != nil {
		return 0, err
	}
	return id, nil
}

// InsertPDFPage inserts a new PDFPage record and returns its ID.
func InsertPDFPage(page PDFPage) (int, error) {
	var id int
	query := `
        INSERT INTO pdf_page (pdf_id, page_number)
        VALUES ($1, $2)
        RETURNING id;
    `
	err := DB.QueryRow(query, page.PDFID, page.Number).Scan(&id)
	if err != nil {
		return 0, err
	}
	return id, nil
}

// InsertPDFImage inserts a new PDFImage record and returns its ID.
func InsertPDFImage(img PDFImage) (int, error) {
	var id int
	query := `
        INSERT INTO pdf_image (pdf_page_id, sequence, gcs_bucket, last_modified)
        VALUES ($1, $2, $3, $4)
        RETURNING id
    `
	err := DB.QueryRow(query, img.PageID, img.Sequence, img.GCSBucket, img.LastModified).Scan(&id)
	if err != nil {
		return 0, err
	}
	return id, nil
}

// InsertPDFParagraph inserts a new PDFParagraph record and returns its ID.
func InsertPDFParagraph(paragraph PDFParagraph) (int, error) {
	var id int
	query := `
        INSERT INTO pdf_paragraph (pdf_page_id, context, last_modified)
        VALUES ($1, $2, $3)
        RETURNING id;
    `
	err := DB.QueryRow(query, paragraph.PageID, paragraph.Context, paragraph.LastModified).Scan(&id)
	if err != nil {
		return 0, err
	}
	return id, nil
}

func UpdatePDF(pdfID int, ocrFlag bool, numberOfPages int) error {
	query := `
        UPDATE pdf
        SET ocr_flag = $1, number_of_pages = $2
        WHERE id = $3
    `
	_, err := DB.Exec(query, ocrFlag, numberOfPages, pdfID)
	return err
}

func SelectPDFByID(id int) (PDF, error) {
	var pdf PDF
	query := `
        SELECT id, gcs_bucket, device_id, ocr_flag, filename, uploaded_at, last_access, number_of_pages
        FROM pdf
        WHERE id = $1
    `
	err := DB.QueryRow(query, id).Scan(
		&pdf.ID,
		&pdf.GCSBucket,
		&pdf.DeviceID,
		&pdf.OCRFlag,
		&pdf.FileName,
		&pdf.UploadedAt,
		&pdf.LastAccess,
		&pdf.NumberOfPages,
	)
	if err != nil {
		return pdf, err
	}
	return pdf, nil
}

func DeletePDFChunk(chunkID int) error {
	// Assuming you have foreign key constraints with ON DELETE CASCADE set up in your DB schema,
	// deleting from the main chunk table will automatically delete related records.
	// If not, you need to manually delete from related tables first.

	// Example for a table named pdf_chunk:
	query := `DELETE FROM pdf_chunk WHERE id = $1`
	_, err := DB.Exec(query, chunkID)
	return err
}

func SelectPDFParagraphByPDFIDAndPageNumber(pdfID int, pageNumber int) (PDFParagraph, error) {
	var paragraph PDFParagraph
	query := `
        SELECT p.id, p.pdf_page_id, p.context, p.last_modified
        FROM pdf_paragraph p
        JOIN pdf_page pg ON p.pdf_page_id = pg.id
        WHERE pg.pdf_id = $1 AND pg.page_number = $2
        LIMIT 1
    `
	err := DB.QueryRow(query, pdfID, pageNumber).Scan(
		&paragraph.ID,
		&paragraph.PageID,
		&paragraph.Context,
		&paragraph.LastModified,
	)
	if err != nil {
		return paragraph, err
	}
	return paragraph, nil
}

func SelectPDFImagesByPDFIDAndPageNumber(pdfID int, pageNumber int) ([]PDFImage, error) {
	var images []PDFImage
	query := `
        SELECT img.id, img.pdf_page_id, img.sequence, img.gcs_bucket, img.last_modified, img.alt
        FROM pdf_image img
        JOIN pdf_page pg ON img.pdf_page_id = pg.id
        WHERE pg.pdf_id = $1 AND pg.page_number = $2
        ORDER BY img.sequence
    `
	rows, err := DB.Query(query, pdfID, pageNumber)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var img PDFImage
		if err := rows.Scan(&img.ID, &img.PageID, &img.Sequence, &img.GCSBucket, &img.LastModified, &img.AlternativeText); err != nil {
			return nil, err
		}
		images = append(images, img)
	}
	return images, nil
}

func SelectPDFImageByID(imgID int) (PDFImage, error) {
	var img PDFImage
	query := `
        SELECT id, pdf_page_id, sequence, gcs_bucket, last_modified, alt
        FROM pdf_image
        WHERE id = $1
    `
	err := DB.QueryRow(query, imgID).Scan(
		&img.ID,
		&img.PageID,
		&img.Sequence,
		&img.GCSBucket,
		&img.LastModified,
		&img.AlternativeText,
	)
	if err != nil {
		return img, err
	}
	return img, nil
}

func SelectChunksByParagraphID(paragraphID int) ([]PDFChunk, error) {
	var chunks []PDFChunk
	query := `
        SELECT c.id, c.context
        FROM pdf_chunk c
        JOIN pdf_chunk_pdf_paragraph rel ON c.id = rel.pdf_chunk_id
        WHERE rel.pdf_paragraph_id = $1
    `
	rows, err := DB.Query(query, paragraphID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var chunk PDFChunk
		if err := rows.Scan(&chunk.ID, &chunk.Context); err != nil {
			return nil, err
		}
		chunks = append(chunks, chunk)
	}
	return chunks, nil
}

// SelectPDFPageByPDFIDAndPageNumber returns a PDFPage by pdf_id and page_number.
func SelectPDFPageByPDFIDAndPageNumber(pdfID, pageNumber int) (PDFPage, error) {
	var page PDFPage
	query := `
        SELECT id, pdf_id, page_number
        FROM pdf_page
        WHERE pdf_id = $1 AND page_number = $2
        LIMIT 1
    `
	err := DB.QueryRow(query, pdfID, pageNumber).Scan(
		&page.ID,
		&page.PDFID,
		&page.Number,
	)
	if err != nil {
		return page, err
	}
	return page, nil
}

// GetMaxImageSequenceByPageID returns the max sequence of images in a page, or 0 if none.
func GetMaxImageSequenceByPageID(pageID int) (int, error) {
	var maxSeq sql.NullInt64
	query := `SELECT MAX(sequence) FROM pdf_image WHERE pdf_page_id = $1`
	err := DB.QueryRow(query, pageID).Scan(&maxSeq)
	if err != nil {
		return 0, err
	}
	if maxSeq.Valid {
		return int(maxSeq.Int64), nil
	}
	return 0, nil
}

func IsParagraphModified(paragraphID int) (bool, error) {
    query := `SELECT EXISTS (SELECT 1 FROM pdf_chunk_pdf_paragraph WHERE pdf_paragraph_id = $1)`
    var exists bool
    err := DB.QueryRow(query, paragraphID).Scan(&exists)
    if err != nil {
        return false, err
    }
    return exists, nil
}

func IsImageModified(imageID int) (bool, error) {
    query := `SELECT EXISTS (SELECT 1 FROM pdf_chunk_pdf_image WHERE pdf_image_id = $1)`
    var exists bool
    err := DB.QueryRow(query, imageID).Scan(&exists)
    if err != nil {
        return false, err
    }
    return exists, nil
}