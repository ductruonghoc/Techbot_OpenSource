package controllers

import (
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"

	"net/http"
	"net/url"
	"strconv"
	"time"
	"log"
	"strings"

	"github.com/ductruonghoc/DATN_08_2025_Back-end/internal"
	"github.com/ductruonghoc/DATN_08_2025_Back-end/models"
	"github.com/ductruonghoc/DATN_08_2025_Back-end/pb"

	"github.com/gin-gonic/gin"
	"github.com/pgvector/pgvector-go"
)

func NewDevice(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		label := c.Query("label")
		brandIDStr := c.Query("brand_id")
		deviceTypeIDStr := c.Query("device_type_id")

		if label == "" || brandIDStr == "" || deviceTypeIDStr == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Failed to process request.",
				"errors": gin.H{
					"code":    400,
					"details": "Invalid params.",
				}})
			return
		}

		brandID, err := strconv.Atoi(brandIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Failed to process request.",
				"errors": gin.H{
					"code":    400,
					"details": "Invalid params.",
				},
			})
			return
		}

		deviceTypeID, err := strconv.Atoi(deviceTypeIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Failed to process request.",
				"errors": gin.H{
					"code":    400,
					"details": "Invalid params.",
				},
			})
			return
		}

		device := models.Device{
			Label:        label,
			BrandID:      brandID,
			DeviceTypeID: deviceTypeID,
		}

		id, err := models.InsertDevice(db, device)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to insert device.",
				"errors": gin.H{
					"code":    500,
					"details": "Something wrong while trying to insert new device.",
				},
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Device inserted successfully",
			"data": gin.H{
				"device_id": id,
			},
		})
	}
}

func DeviceTypeAndBrandReceive(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		brands, err := models.SelectAllBrands(db)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to fetch brands.",
				"errors": gin.H{
					"code":    500,
					"details": err.Error(),
				},
			})
			return
		}

		deviceTypes, err := models.SelectAllDeviceTypes(db)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to fetch device types.",
				"errors": gin.H{
					"code":    500,
					"details": err.Error(),
				},
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Fetched brands and device types successfully.",
			"data": gin.H{
				"brands":      brands,
				"deviceTypes": deviceTypes,
			},
		})
	}
}

func PDFUpload() gin.HandlerFunc {
	return func(c *gin.Context) {
		deviceIDStr := c.Query("device_id")
		pdfName := c.Query("pdf_name")

		if deviceIDStr == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Missing device_id parameter",
				"errors": gin.H{
					"code":    400,
					"details": "device_id parameter is required",
				},
			})
			return
		}

		deviceID, err := strconv.Atoi(deviceIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid device_id parameter",
				"errors": gin.H{
					"code":    400,
					"details": "device_id must be a valid integer",
				},
			})
			return
		}

		// Retrieve device
		device, err := models.GetDeviceByID(deviceID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Device not found",
				"errors": gin.H{
					"code":    404,
					"details": "No device found with the provided device_id",
				},
			})
			return
		}

		// Generate gcs_bucket using bcrypt hash of device label
		gcsBucket := internal.BcryptHashing(device.Label)
		gcsBucket = url.PathEscape(gcsBucket) // Ensure the bucket name is URL-safe

		now := time.Now()

		// Determine FileName
		fileName := pdfName
		if fileName == "" {
			fileName = device.Label
		}

		// Insert new PDF record
		pdf := models.PDF{
			GCSBucket:  gcsBucket,
			DeviceID:   deviceID,
			OCRFlag:    false,
			FileName:   fileName,
			UploadedAt: now,
			LastAccess: now,
		}
		pdfID, err := models.InsertPDF(pdf)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to insert PDF record",
				"errors": gin.H{
					"code":    500,
					"details": err.Error(),
				},
			})
			return
		}

		// Generate signed URL for upload
		signedURL, err := internal.GenerateWriteSignedURL(
			internal.BucketNameDefault,
			gcsBucket,
			"application/pdf",
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to generate signed URL",
				"errors": gin.H{
					"code":    500,
					"details": err.Error(),
				},
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "PDF upload URL generated",
			"data": gin.H{
				"pdf_id":     pdfID,
				"signed_url": signedURL,
			},
		})
	}
}

// ExtractPDFHandler handles requests to extract PDF info from a GCS bucket name.
func ExtractPDFHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		pdfIDStr := c.Query("pdf_id")
		if pdfIDStr == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Missing pdf_id parameter",
			})
			return
		}

		pdfID, err := strconv.Atoi(pdfIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid pdf_id parameter",
				"errors":  err.Error(),
			})
			return
		}

		// Retrieve PDF by id
		pdf, err := models.SelectPDFByID(pdfID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "PDF not found",
				"errors": gin.H{
					"code":    404,
					"details": err.Error(),
				},
			})
			return
		}

		// Call gRPC extract service with the pdf's gcs_bucket
		resultJson, err := pb.CallExtractPDF(pdf.GCSBucket)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to call ExtractPDF service",
				"error":   err.Error(),
			})
			return
		}

		// Parse the returned JSON
		var extractResult struct {
			Pages []struct {
				Page struct {
					Imgs []struct {
						GcsBucketName string `json:"gcs_bucket_name"`
						Order         int    `json:"order"`
						RetrievedPath string `json:"retrieved_path"`
					} `json:"imgs"`
					PageNumber int    `json:"page_number"`
					Paragraph  string `json:"paragraph"`
				} `json:"page"`
			} `json:"pages"`
			PDFNumberOfPages int `json:"pdf_number_of_pages"`
		}
		if err := json.Unmarshal([]byte(resultJson), &extractResult); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to parse result JSON",
				"error":   err.Error(),
				"data": gin.H{
					"result_json": resultJson,
				},
			})

			return
		}

		// Insert pages, paragraphs, and images
		for _, pageWrap := range extractResult.Pages {
			page := pageWrap.Page
			pdfPage := models.PDFPage{
				PDFID:  pdf.ID,
				Number: page.PageNumber,
			}
			pageID, err := models.InsertPDFPage(pdfPage)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Failed to insert PDF page",
					"error":   err.Error(),
				})
				return
			}

			// Insert paragraph
			paragraph := models.PDFParagraph{
				PageID:       pageID,
				Context:      page.Paragraph,
				LastModified: time.Now(),
			}
			_, err = models.InsertPDFParagraph(paragraph)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Failed to insert PDF paragraph",
					"error":   err.Error(),
				})
				return
			}

			// Insert images
			for _, img := range page.Imgs {
				pdfImg := models.PDFImage{
					PageID:       pageID,
					Sequence:     img.Order,
					GCSBucket:    img.GcsBucketName,
					LastModified: time.Now(),
				}
				_, err := models.InsertPDFImage(pdfImg)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{
						"success": false,
						"message": "Failed to insert PDF image",
						"error":   err.Error(),
					})
					return
				}
			}
		}

		// Update PDF: set ocr_flag = true and update number_of_pages
		err = models.UpdatePDF(pdf.ID, true, extractResult.PDFNumberOfPages)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to update PDF info",
				"error":   err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "PDF extraction and database update successful",
		})
	}
}

// SaveAndEmbedHandler handles saving and embedding a paragraph.
func SaveAndEmbedParagraphHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Parse request parameters
		var req struct {
			ParagraphID int    `json:"pdf_paragraph_id" binding:"required"`
			Context     string `json:"context" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{"success": false, "message": "Invalid request", "error": err.Error()})
			return
		}

		// Update the paragraph with the incoming context
		_, err := models.DB.Exec(
			`UPDATE pdf_paragraph SET context = $1, last_modified = NOW() WHERE id = $2`,
			req.Context, req.ParagraphID,
		)
		if err != nil {
			c.JSON(500, gin.H{"success": false, "message": "Failed to update paragraph", "error": err.Error()})
			return
		}

		// Delete all chunks related to the paragraph ID
		rows, err := models.DB.Query(`SELECT pdf_chunk_id FROM pdf_chunk_pdf_paragraph WHERE pdf_paragraph_id = $1`, req.ParagraphID)
		if err != nil {
			c.JSON(500, gin.H{"success": false, "message": "Failed to query related chunks", "error": err.Error()})
			return
		}
		var chunkIDs []int
		for rows.Next() {
			var chunkID int
			if err := rows.Scan(&chunkID); err == nil {
				chunkIDs = append(chunkIDs, chunkID)
			}
		}
		rows.Close()

		for _, chunkID := range chunkIDs {
			if err := models.DeletePDFChunk(chunkID); err != nil {
				c.JSON(500, gin.H{"success": false, "message": "Failed to delete chunk", "error": err.Error()})
				return
			}
		}

		// Call gRPC to embed and chunk the incoming context
		resultJson, err := pb.CallChunkAndEmbed(req.Context)
		if err != nil {
			c.JSON(500, gin.H{"success": false, "message": "Failed to call embedding service", "error": err.Error()})
			return
		}

		// Parse the returned JSON
		var chunkResult struct {
			Chunks []struct {
				Context string    `json:"context"`
				Vector  []float32 `json:"vector"`
			} `json:"chunks"`
		}
		if err := json.Unmarshal([]byte(resultJson), &chunkResult); err != nil {
			c.JSON(500, gin.H{"success": false, "message": "Failed to parse embedding result", "error": err.Error()})
			return
		}

		// Insert new chunks and create relations
		for _, chunk := range chunkResult.Chunks {
			var chunkID int
			row := models.DB.QueryRow(
				`INSERT INTO pdf_chunk (context, embedding) VALUES ($1, $2) RETURNING id`,
				chunk.Context,
				pgvector.NewVector(chunk.Vector),
			)
			if err := row.Scan(&chunkID); err != nil {
				c.JSON(500, gin.H{"success": false, "message": "Failed to insert chunk", "error": err.Error()})
				return
			}
			_, err = models.DB.Exec(
				`INSERT INTO pdf_chunk_pdf_paragraph (pdf_chunk_id, pdf_paragraph_id) VALUES ($1, $2)`,
				chunkID, req.ParagraphID,
			)
			if err != nil {
				c.JSON(500, gin.H{"success": false, "message": "Failed to create chunk-paragraph relation", "error": err.Error()})
				return
			}
		}

		// Return success response
		c.JSON(200, gin.H{
			"success": true,
			"message": "Paragraph context saved and embedded successfully",
		})
	}
}

// SaveAndEmbedImgAltHandler handles saving and embedding a paragraph.
func SaveAndEmbedImgAltHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Parse request parameters
		var req struct {
			ImageID int    `json:"pdf_image_id" binding:"required"`
			ImgAlt  string `json:"img_alt" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{"success": false, "message": "Invalid request", "error": err.Error()})
			return
		}

		// 1. Delete related chunks (and relations) for this image alt
		rows, err := models.DB.Query(`SELECT pdf_chunk_id FROM pdf_chunk_pdf_image WHERE pdf_image_id = $1`, req.ImageID)
		if err != nil {
			c.JSON(500, gin.H{"success": false, "message": "Failed to query related chunks"})
			return
		}
		var chunkIDs []int

		for rows.Next() {
			var chunkID int
			if err := rows.Scan(&chunkID); err == nil {
				chunkIDs = append(chunkIDs, chunkID)
			}
		}
		rows.Close()

		for _, chunkID := range chunkIDs {
			_ = models.DeletePDFChunk(chunkID)
		}

		// 2. Update the image alt
		_, err = models.DB.Exec(`UPDATE pdf_image SET alt = $1, last_modified = NOW() WHERE id = $2`, req.ImgAlt, req.ImageID)
		if err != nil {
			c.JSON(500, gin.H{"success": false, "message": "Failed to update image alt"})
			return
		}

		// 3. Call gRPC to embed and chunk
		resultJson, err := pb.CallChunkAndEmbed(req.ImgAlt)
		if err != nil {
			c.JSON(500, gin.H{"success": false, "message": "Failed to call embedding service"})
			return
		}

		// 4. Parse the returned JSON
		var chunkResult struct {
			Chunks []struct {
				Context string    `json:"context"`
				Vector  []float32 `json:"vector"`
			} `json:"chunks"`
		}
		if err := json.Unmarshal([]byte(resultJson), &chunkResult); err != nil {
			c.JSON(500, gin.H{"success": false, "message": "Failed to parse embedding result"})
			return
		}

		// 5. Store chunks and create relations
		for _, chunk := range chunkResult.Chunks {
			var chunkID int
			row := models.DB.QueryRow(
				`INSERT INTO pdf_chunk (context, embedding) VALUES ($1, $2) RETURNING id`,
				chunk.Context,
				pgvector.NewVector(chunk.Vector),
			)
			if err := row.Scan(&chunkID); err != nil {
				c.JSON(500, gin.H{"success": false, "message": "Failed to get chunk id"})
				return
			}
			_, err = models.DB.Exec(`INSERT INTO pdf_chunk_pdf_image (pdf_chunk_id, pdf_image_id) VALUES ($1, $2)`, chunkID, req.ImageID)
			if err != nil {
				c.JSON(500, gin.H{"success": false, "message": "Failed to create chunk-image relation"})
				return
			}
		}

		c.JSON(200, gin.H{"success": true, "message": "Image alt saved and embedded successfully"})
	}
}

func GetPDFInitialStateHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		pdfIDStr := c.Query("pdf_id")
		if pdfIDStr == "" {
			c.JSON(400, gin.H{
				"success": false,
				"message": "Missing pdf_id parameter",
			})
			return
		}

		pdfID, err := strconv.Atoi(pdfIDStr)
		if err != nil {
			c.JSON(400, gin.H{
				"success": false,
				"message": "Invalid pdf_id parameter",
			})
			return
		}

		// Retrieve PDF
		pdf, err := models.SelectPDFByID(pdfID)
		if err != nil {
			c.JSON(404, gin.H{
				"success": false,
				"message": "PDF not found",
			})
			return
		}

		// Generate signed read URL for the PDF
		signedURL, err := internal.GenerateReadSignedURL(internal.BucketNameDefault, pdf.GCSBucket)
		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to generate signed URL",
			})
			return
		}

		// Get the first paragraph (page_number = 1)
		paragraph, err := models.SelectPDFParagraphByPDFIDAndPageNumber(pdfID, 1)
		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to get PDF paragraph",
			})
			return
		}

		// Check if the paragraph ID exists in the pdf_paragraph_pdf_chunk table
		paragraphModified, err := models.IsParagraphModified(paragraph.ID)
		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to check paragraph modification status",
			})
			return
		}

		// Get images for the first page
		images, err := models.SelectPDFImagesByPDFIDAndPageNumber(pdfID, 1)
		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to get PDF images",
				"error":   err.Error(),
			})
			return
		}

		// Prepare images data with modified attribute
		imgs := make([]gin.H, 0, len(images))
		for _, img := range images {
			imageModified, err := models.IsImageModified(img.ID)
			if err != nil {
				c.JSON(500, gin.H{
					"success": false,
					"message": "Failed to check image modification status",
				})
				return
			}
			imgs = append(imgs, gin.H{
				"id":       img.ID,
				"alt":      img.AlternativeText.String,
				"modified": imageModified,
			})
		}

		c.JSON(200, gin.H{
			"success": true,
			"message": "PDF initial state fetched successfully",
			"data": gin.H{
				"pdf_gcs_signed_read_url": signedURL,
				"images":                  imgs,
				"page_paragraph": gin.H{
					"id":       paragraph.ID,
					"context":  paragraph.Context,
					"modified": paragraphModified,
				},
				"pdf_ocr_flag":        pdf.OCRFlag,
				"pdf_name":            pdf.FileName,
				"pdf_number_of_pages": pdf.NumberOfPages.Int32,
			},
		})
	}
}

func GetPDFStateHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		pdfIDStr := c.Query("pdf_id")
		pageNumberStr := c.Query("page_number")

		if pdfIDStr == "" || pageNumberStr == "" {
			c.JSON(400, gin.H{
				"success": false,
				"message": "Missing pdf_id or page_number parameter",
			})
			return
		}

		pdfID, err := strconv.Atoi(pdfIDStr)
		if err != nil {
			c.JSON(400, gin.H{
				"success": false,
				"message": "Invalid pdf_id parameter",
			})
			return
		}

		pageNumber, err := strconv.Atoi(pageNumberStr)
		if err != nil {
			c.JSON(400, gin.H{
				"success": false,
				"message": "Invalid page_number parameter",
			})
			return
		}

		// Get the paragraph for the requested page
		paragraph, err := models.SelectPDFParagraphByPDFIDAndPageNumber(pdfID, pageNumber)
		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to get PDF paragraph",
			})
			return
		}

		// Check if the paragraph ID exists in the pdf_paragraph_pdf_chunk table
		paragraphModified, err := models.IsParagraphModified(paragraph.ID)
		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to check paragraph modification status",
			})
			return
		}

		// Get images for the requested page
		//Test
		images, err := models.SelectPDFImagesByPDFIDAndPageNumber(pdfID, pageNumber)
		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to get PDF images",
			})
			return
		}

		// Prepare images data with modified attribute
		imgs := make([]gin.H, 0, len(images))
		for _, img := range images {
			imageModified, err := models.IsImageModified(img.ID)
			if err != nil {
				c.JSON(500, gin.H{
					"success": false,
					"message": "Failed to check image modification status",
				})
				return
			}
			imgs = append(imgs, gin.H{
				"id":       img.ID,
				"alt":      img.AlternativeText.String,
				"modified": imageModified,
			})
		}

		c.JSON(200, gin.H{
			"success": true,
			"message": "PDF state fetched successfully",
			"data": gin.H{
				"images": imgs,
				"page_paragraph": gin.H{
					"id":       paragraph.ID,
					"context":  paragraph.Context,
					"modified": paragraphModified,
				},
			},
		})
	}
}

func GetImgSignedURLHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		imgIDStr := c.Query("img_id")
		if imgIDStr == "" {
			c.JSON(400, gin.H{
				"success": false,
				"message": "Missing img_id parameter",
			})
			return
		}

		imgID, err := strconv.Atoi(imgIDStr)
		if err != nil {
			c.JSON(400, gin.H{
				"success": false,
				"message": "Invalid img_id parameter",
			})
			return
		}

		// Retrieve image by id
		img, err := models.SelectPDFImageByID(imgID)
		if err != nil {
			c.JSON(404, gin.H{
				"success": false,
				"message": "Image not found",
				"errors": gin.H{
					"code":    404,
					"details": err.Error(),
				},
			})
			return
		}

		// Generate signed read URL for the image
		signedURL, err := internal.GenerateReadSignedURL(internal.BucketNameDefault, img.GCSBucket)
		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to generate signed URL",
			})
			return
		}

		c.JSON(200, gin.H{
			"success": true,
			"message": "Image signed URL fetched successfully",
			"data": gin.H{
				"signed_url": signedURL,
			},
		})
	}
}

func DeleteChunkHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			ChunkID int `json:"chunk_id" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{
				"success": false,
				"message": "Invalid request",
				"error":   err.Error(),
			})
			return
		}

		err := models.DeletePDFChunk(req.ChunkID)
		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to delete chunk",
				"error":   err.Error(),
			})
			return
		}

		c.JSON(200, gin.H{
			"success": true,
			"message": "Chunk deleted successfully",
		})
	}
}

func CreateNewImageHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			PDFID      int `json:"pdf_id" binding:"required"`
			PageNumber int `json:"page_number" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{
				"success": false,
				"message": "Invalid request",
				"error":   err.Error(),
			})
			return
		}

		// 1. Lấy pageID từ pdf_id và page_number
		page, err := models.SelectPDFPageByPDFIDAndPageNumber(req.PDFID, req.PageNumber)
		if err != nil {
			c.JSON(404, gin.H{
				"success": false,
				"message": "Page not found",
			})
			return
		}

		// 2. Lấy sequence lớn nhất hiện tại của các ảnh trong trang này
		maxSeq, err := models.GetMaxImageSequenceByPageID(page.ID)
		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to get max image sequence",
			})
			return
		}
		sequence := maxSeq + 1

		// 3. Sinh gcsbucketname bằng hash(pdfid+pagenumber+sequence+currenttime) và encode base64
		hashInput := fmt.Sprintf("%d_%d_%d_%d", req.PDFID, req.PageNumber, sequence, time.Now().UnixNano())
		hashed := internal.BcryptHashing(hashInput)
		encoded := base64.URLEncoding.EncodeToString([]byte(hashed))
		gcsBucketName := encoded

		// 4. Tạo ảnh mới
		img := models.PDFImage{
			PageID:       page.ID,
			Sequence:     sequence,
			GCSBucket:    gcsBucketName,
			LastModified: time.Now(),
		}
		imgID, err := models.InsertPDFImage(img)
		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to insert new image",
				"error":   err.Error(),
			})
			return
		}

		// 5. Sinh signed write URL cho gcsBucketName
		signedURL, err := internal.GenerateWriteSignedURL(
			internal.BucketNameDefault,
			gcsBucketName,
			"image/png",
		)
		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": "Failed to generate signed write URL",
				"error":   err.Error(),
			})
			return
		}

		c.JSON(200, gin.H{
			"success": true,
			"message": "Image created successfully",
			"data": gin.H{
				"image_id":   imgID,
				"sequence":   sequence,
				"signed_url": signedURL,
			},
		})
	}
}

func ListDevicesHandler(db *sql.DB) gin.HandlerFunc { //PDF Progress Track
	return func(c *gin.Context) {
		// Parse query params
		offsetStr := c.DefaultQuery("offset", "1")
		offset, err := strconv.Atoi(offsetStr)
		if err != nil || offset < 1 {
			offset = 1
		}
		name := c.Query("name")
		brand := c.Query("brand")
		category := c.Query("category")
		sort := c.DefaultQuery("sort", "id") // e.g., "id", "name", etc.

		// Build SQL query with filters
		query := `
            SELECT d.label, d.id,
                CASE 
                    WHEN p.id IS NULL THEN 0
                    WHEN p.ocr_flag = false THEN 1
                    WHEN p.ocr_flag = true AND (SELECT COUNT(*) 
					FROM pdf_chunk_pdf_paragraph cpp 
					JOIN pdf_paragraph pp ON cpp.pdf_paragraph_id = pp.id 
					WHERE pp.id IN (SELECT id FROM pdf_page WHERE pdf_id = p.id)) = 0 THEN 2
                    ELSE 3
                END as scoring
            FROM device d
            LEFT JOIN pdf p ON p.device_id = d.id
            LEFT JOIN brand b ON d.brand_id = b.id
            LEFT JOIN device_type dt ON d.device_type_id = dt.id
            WHERE 1=1
        `
		args := []interface{}{}
		argIdx := 1

		if name != "" {
			query += fmt.Sprintf(" AND d.label LIKE $%d", argIdx)
			args = append(args, "%"+name+"%")
			argIdx++
		}
		if brand != "" {
			query += fmt.Sprintf(" AND b.label LIKE $%d", argIdx)
			args = append(args, "%"+brand+"%")
			argIdx++
		}
		if category != "" {
			query += fmt.Sprintf(" AND dt.label LIKE $%d", argIdx)
			args = append(args, "%"+category+"%")
			argIdx++
		}

		// Sorting
		switch sort {
		case "name":
			query += " ORDER BY d.label"
		case "scoring":
			query += " ORDER BY scoring"
		default:
			query += " ORDER BY d.id"
		}

		// Pagination: 10 items per offset
		limit := 10
		query += fmt.Sprintf(" LIMIT %d OFFSET %d", limit, (offset-1)*limit)

		rows, err := db.Query(query, args...)
		if err != nil {
			c.JSON(500, gin.H{"success": false, "message": "Database error", "error": err.Error()})
			return
		}
		defer rows.Close()

		var result []gin.H
		for rows.Next() {
			var devicename string
			var scoring int
			var deviceID int
			if err := rows.Scan(&devicename, &deviceID, &scoring); err == nil {
				result = append(result, gin.H{
					"devicename": devicename,
					"scoring":    scoring,
					"device_id":  deviceID, // Assuming device ID is the same as devicename for simplicity
				})
			}
		}

		c.JSON(200, gin.H{
			"success": true,
			"message": "Image created successfully",
			"data":    result,
		})
	}
}

// Handler to get AgentIsExtracting status with retry logic
func GetAgentIsExtractingStatusHandler() gin.HandlerFunc {
    return func(c *gin.Context) {
        const maxDuration = time.Hour
        const interval = 5 * time.Second // Try every 5 seconds
        start := time.Now()

        // If agent is not extracting, return immediately
        if !pb.AgentIsExtracting {
            c.JSON(http.StatusOK, gin.H{
                "success":             true,
                "agent_is_extracting": false,
            })
            return
        }

        // If agent is extracting, return status and keep retrying in background
        c.JSON(http.StatusOK, gin.H{
            "success":             true,
            "agent_is_extracting": true,
            "message":             "Agent is extracting. Handler will keep checking in background.",
        })

        go func() {
            for time.Since(start) < maxDuration {
                time.Sleep(interval)
                if !pb.AgentIsExtracting {
                    return // Extraction finished, exit goroutine
                }
            }
            // After maxDuration, still extracting: log fatal to reset server
            log.Fatal("AgentIsExtracting stuck for 1 hour, server will reset.")
        }()
    }
}

// ListDeviceForChatHandler returns a paginated list of devices for chat with category and brand info.
func ListDeviceForChatHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		name := c.Query("name")
		brand := c.Query("brand")
		category := c.Query("category")
		offsetStr := c.DefaultQuery("offset", "1")
		offset, err := strconv.Atoi(offsetStr)
		if err != nil || offset < 1 {
			offset = 1
		}
		limit := 6

		// Build base query and count query
		baseQuery := `
            FROM device d
            LEFT JOIN brand b ON d.brand_id = b.id
            LEFT JOIN device_type dt ON d.device_type_id = dt.id
            WHERE 1=1
        `
		args := []interface{}{}
		argIdx := 1

		if name != "" {
			baseQuery += fmt.Sprintf(" AND LOWER(TRIM(d.label)) LIKE $%d", argIdx)
    		args = append(args,  "%"+strings.ToLower(strings.ReplaceAll(name, " ", ""))+"%")
			argIdx++
		}
		if brand != "" {
			baseQuery += fmt.Sprintf(" AND b.label LIKE $%d", argIdx)
			args = append(args, "%"+brand+"%")
			argIdx++
		}
		if category != "" {
			baseQuery += fmt.Sprintf(" AND dt.label LIKE $%d", argIdx)
			args = append(args, "%"+category+"%")
			argIdx++
		}

		// Get total count for pagination
		countQuery := "SELECT COUNT(*) " + baseQuery
		var total int
		if err := db.QueryRow(countQuery, args...).Scan(&total); err != nil {
			c.JSON(500, gin.H{
				"status":  false,
				"message": "Database error",
				"data":    nil,
			})
			return
		}

		// Get paginated data
		selectQuery := "SELECT d.id, d.label, dt.label as category, b.label as brand " + baseQuery +
			" ORDER BY d.id" +
			fmt.Sprintf(" LIMIT %d OFFSET %d", limit, (offset-1)*limit)

		rows, err := db.Query(selectQuery, args...)
		if err != nil {
			c.JSON(500, gin.H{
				"status":  false,
				"message": "Database error",
				"data":    nil,
			})
			return
		}
		defer rows.Close()

		devices := []gin.H{}
		for rows.Next() {
			var deviceID int
			var deviceName, categoryLabel, brandLabel string
			if err := rows.Scan(&deviceID, &deviceName, &categoryLabel, &brandLabel); err == nil {
				devices = append(devices, gin.H{
					"device_id":   deviceID,
					"device_name": deviceName,
					"category":    categoryLabel,
					"brand":       brandLabel,
				})
			}
		}

		// Calculate PrevPageExisted and NextPageExisted
		prevPage := offset > 1
		nextPage := offset*limit < total

		c.JSON(200, gin.H{
			"status":  true,
			"message": "Fetched devices for chat successfully",
			"data": gin.H{
				"devices":         devices,
				"PrevPageExisted": prevPage,
				"NextPageExisted": nextPage,
			},
		})
	}
}

func ListPDFsStatesHandler(db *sql.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        offsetStr := c.DefaultQuery("offset", "1")
        offset, err := strconv.Atoi(offsetStr)
        if err != nil || offset < 1 {
            offset = 1
        }
        name := c.Query("nameQuery")
        brand := c.Query("brand")
        category := c.Query("category")
        sort := c.DefaultQuery("sort", "scoring") // Default: largest scoring to smallest
		        // New: min_scoring and max_scoring
        minScoringStr := c.DefaultQuery("min_scoring", "0")
        maxScoringStr := c.DefaultQuery("max_scoring", "3")
        var minScoring, maxScoring *int
        if minScoringStr != "" {
            if v, err := strconv.Atoi(minScoringStr); err == nil {
                minScoring = &v
            }
        }
        if maxScoringStr != "" {
            if v, err := strconv.Atoi(maxScoringStr); err == nil {
                maxScoring = &v
            }
        }

        // Build SQL query with filters
        query := `
            SELECT d.id as device_id, p.id as pdf_id, p.last_access as pdf_last_modified, p.filename as pdf_label,
                CASE 
                    WHEN p.id IS NULL THEN 0
                    WHEN p.ocr_flag = false THEN 1
                    WHEN p.ocr_flag = true THEN (
                        SELECT 
                            CASE 
                                WHEN COUNT(DISTINCT pp.id) = 0 THEN 2
                                WHEN COUNT(DISTINCT pp.id) = (
                                    SELECT COUNT(DISTINCT cpp.pdf_paragraph_id)
                                    FROM pdf_chunk_pdf_paragraph cpp
                                    JOIN pdf_paragraph pp2 ON cpp.pdf_paragraph_id = pp2.id
                                    WHERE pp2.pdf_page_id IN (SELECT id FROM pdf_page WHERE pdf_id = p.id)
                                ) THEN 3
                                ELSE 2
                            END
                        FROM pdf_paragraph pp
                        WHERE pp.pdf_page_id IN (SELECT id FROM pdf_page WHERE pdf_id = p.id)
                    )
                    ELSE 2
                END as pdf_scoring,
                b.label as brand,
                dt.label as category
            FROM pdf p
            LEFT JOIN device d ON p.device_id = d.id
            LEFT JOIN brand b ON d.brand_id = b.id
            LEFT JOIN device_type dt ON d.device_type_id = dt.id
            WHERE 1=1
        `
        args := []interface{}{}
        argIdx := 1

        if name != "" {
            query += fmt.Sprintf(" AND LOWER(TRIM(p.filename)) LIKE $%d", argIdx)
    		args = append(args,  "%"+strings.ToLower(strings.ReplaceAll(name, " ", ""))+"%")
            argIdx++
        }
        if brand != "" {
            query += fmt.Sprintf(" AND b.label LIKE $%d", argIdx)
            args = append(args, "%"+brand+"%")
            argIdx++
        }
        if category != "" {
            query += fmt.Sprintf(" AND dt.label LIKE $%d", argIdx)
            args = append(args, "%"+category+"%")
            argIdx++
        }
		        // Add scoring filter
        if minScoring != nil {
            query += fmt.Sprintf(" AND (CASE WHEN p.id IS NULL THEN 0 WHEN p.ocr_flag = false THEN 1 WHEN p.ocr_flag = true AND (SELECT COUNT(*) FROM pdf_chunk_pdf_paragraph cpp JOIN pdf_paragraph pp ON cpp.pdf_paragraph_id = pp.id WHERE pp.pdf_page_id IN (SELECT id FROM pdf_page WHERE pdf_id = p.id)) = 0 THEN 2 ELSE 3 END) >= $%d", argIdx)
            args = append(args, *minScoring)
            argIdx++
        }
        if maxScoring != nil {
            query += fmt.Sprintf(" AND (CASE WHEN p.id IS NULL THEN 0 WHEN p.ocr_flag = false THEN 1 WHEN p.ocr_flag = true AND (SELECT COUNT(*) FROM pdf_chunk_pdf_paragraph cpp JOIN pdf_paragraph pp ON cpp.pdf_paragraph_id = pp.id WHERE pp.pdf_page_id IN (SELECT id FROM pdf_page WHERE pdf_id = p.id)) = 0 THEN 2 ELSE 3 END) <= $%d", argIdx)
            args = append(args, *maxScoring)
            argIdx++
        }

        // Count total for pagination
        countQuery := "SELECT COUNT(*) FROM pdf p JOIN device d ON p.device_id = d.id LEFT JOIN brand b ON d.brand_id = b.id LEFT JOIN device_type dt ON d.device_type_id = dt.id WHERE 1=1"
        countArgs := []interface{}{}
        countArgIdx := 1
        if name != "" {
            countQuery += fmt.Sprintf(" AND LOWER(TRIM(d.label)) LIKE $%d", countArgIdx)
            countArgs = append(countArgs,  "%"+strings.ToLower(strings.ReplaceAll(name, " ", ""))+"%")
            countArgIdx++
        }
        if brand != "" {
            countQuery += fmt.Sprintf(" AND b.label LIKE $%d", countArgIdx)
            countArgs = append(countArgs, "%"+brand+"%")
            countArgIdx++
        }
        if category != "" {
            countQuery += fmt.Sprintf(" AND dt.label LIKE $%d", countArgIdx)
            countArgs = append(countArgs, "%"+category+"%")
            countArgIdx++
        }
        if minScoring != nil {
            countQuery += fmt.Sprintf(" AND (CASE WHEN p.id IS NULL THEN 0 WHEN p.ocr_flag = false THEN 1 WHEN p.ocr_flag = true AND (SELECT COUNT(*) FROM pdf_chunk_pdf_paragraph cpp JOIN pdf_paragraph pp ON cpp.pdf_paragraph_id = pp.id WHERE pp.pdf_page_id IN (SELECT id FROM pdf_page WHERE pdf_id = p.id)) = 0 THEN 2 ELSE 3 END) >= $%d", countArgIdx)
            countArgs = append(countArgs, *minScoring)
            countArgIdx++
        }
        if maxScoring != nil {
            countQuery += fmt.Sprintf(" AND (CASE WHEN p.id IS NULL THEN 0 WHEN p.ocr_flag = false THEN 1 WHEN p.ocr_flag = true AND (SELECT COUNT(*) FROM pdf_chunk_pdf_paragraph cpp JOIN pdf_paragraph pp ON cpp.pdf_paragraph_id = pp.id WHERE pp.pdf_page_id IN (SELECT id FROM pdf_page WHERE pdf_id = p.id)) = 0 THEN 2 ELSE 3 END) <= $%d", countArgIdx)
            countArgs = append(countArgs, *maxScoring)
            countArgIdx++
        }
        var total int
        _ = db.QueryRow(countQuery, countArgs...).Scan(&total)

        // Sorting
        switch sort {
        case "name":
            query += " ORDER BY p.file_name"
        case "scoring":
            query += " ORDER BY pdf_scoring DESC"
        case "last_modified":
            query += " ORDER BY p.last_access DESC"
        default:
            query += " ORDER BY d.id"
        }

        // Pagination: 10 items per offset
        limit := 10
        query += fmt.Sprintf(" LIMIT %d OFFSET %d", limit, (offset-1)*limit)

        rows, err := db.Query(query, args...)
        if err != nil {
            c.JSON(500, gin.H{"status": false, "message": "Database error", "error": err.Error()})
            return
        }
        defer rows.Close()

        var pdfs []gin.H
        for rows.Next() {
            var deviceID, pdfID, pdfScoring int
            var pdfLastModified sql.NullTime
            var pdfLabel, brandLabel, categoryLabel string
            if err := rows.Scan(&deviceID, &pdfID, &pdfLastModified, &pdfLabel, &pdfScoring, &brandLabel, &categoryLabel); err == nil {
                var lastModifiedStr string
                if pdfLastModified.Valid {
                    lastModifiedStr = pdfLastModified.Time.Format(time.RFC3339)
                }
                pdfs = append(pdfs, gin.H{
                    "device_id":        deviceID,
                    "pdf_id":           pdfID,
                    "pdf_lastModified": lastModifiedStr,
                    "pdf_label":        pdfLabel,
                    "pdf_scoring":      pdfScoring,
					"brand":            brandLabel,
					"category":         categoryLabel,
                })
            }
        }

        prevPage := offset > 1
        nextPage := offset*limit < total

        c.JSON(200, gin.H{
            "status":  true,
            "message": "Fetched PDFs states successfully",
            "data": gin.H{
                "pdfs":     pdfs,
                "prevPage": prevPage,
                "nextPage": nextPage,
            },
        })
    }
}

func PDFPagesEmbeddedStatusesHandler(db *sql.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        pdfIDStr := c.Query("pdf_id")
        if pdfIDStr == "" {
            c.JSON(400, gin.H{
                "status":  false,
                "message": "Missing pdf_id parameter",
            })
            return
        }
        pdfID, err := strconv.Atoi(pdfIDStr)
        if err != nil {
            c.JSON(400, gin.H{
                "status":  false,
                "message": "Invalid pdf_id parameter",

            })
            return
        }

        // Get all pages for the PDF
        rows, err := db.Query(`
            SELECT pg.page_number, 
                EXISTS (
                    SELECT 1 FROM pdf_paragraph pp
                    JOIN pdf_chunk_pdf_paragraph cpp ON cpp.pdf_paragraph_id = pp.id
                    WHERE pp.pdf_page_id = pg.id
                    LIMIT 1
                ) as done
            FROM pdf_page pg
            WHERE pg.pdf_id = $1
            ORDER BY pg.page_number
        `, pdfID)
        if err != nil {
            c.JSON(500, gin.H{
                "status":  false,
                "message": "Database error",
                "error":   err.Error(),
            })
            return
        }
        defer rows.Close()

        var statuses []gin.H
        for rows.Next() {
            var pageNumber int
            var done bool
            if err := rows.Scan(&pageNumber, &done); err == nil {
                statuses = append(statuses, gin.H{
                    "page_number": pageNumber,
                    "done":        done,
                })
            }
        }

        c.JSON(200, gin.H{
            "status":  true,
            "message": "Fetched embedded statuses successfully",
            "data": gin.H{
                "embedded_statuses": statuses,
            },
        })
    }
}

// AddBrandHandler handles adding a new brand and returns its ID.
func AddBrandHandler(db *sql.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        var req struct {
            BrandName string `json:"brand_name" binding:"required"`
        }
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(400, gin.H{
                "success": false,
                "message": "Invalid request",
                "error":   err.Error(),
            })
            return
        }

        // Insert new brand into the database
        var brandID int
        err := db.QueryRow(
            `INSERT INTO brand (label) VALUES ($1) RETURNING id`,
            req.BrandName,
        ).Scan(&brandID)
        if err != nil {
            c.JSON(500, gin.H{
                "success": false,
                "message": "Failed to create brand",
                "error":   err.Error(),
            })
            return
        }

        c.JSON(200, gin.H{
            "success": true,
            "message": "Brand created successfully",
            "data": gin.H{
                "brand_id": brandID,
            },
        })
    }
}

// AddCategoryHandler handles adding a new device category and returns its ID.
func AddCategoryHandler(db *sql.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        var req struct {
            CategoryName string `json:"category_name" binding:"required"`
        }
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(400, gin.H{
                "success": false,
                "message": "Invalid request",
                "error":   err.Error(),
            })
            return
        }

        // Insert new category into the database
        var categoryID int
        err := db.QueryRow(
            `INSERT INTO device_type (label) VALUES ($1) RETURNING id`,
            req.CategoryName,
        ).Scan(&categoryID)
        if err != nil {
            c.JSON(500, gin.H{
                "success": false,
                "message": "Failed to create category",
                "error":   err.Error(),
            })
            return
        }

        c.JSON(200, gin.H{
            "success": true,
            "message": "Category created successfully",
            "data": gin.H{
                "category_id": categoryID,
            },
        })
    }
}