package controllers

import (
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
    "strings"
	"fmt"
	"net/http"
	"time"

	"github.com/ductruonghoc/DATN_08_2025_Back-end/models"
	"github.com/ductruonghoc/DATN_08_2025_Back-end/pb"
	"github.com/gin-gonic/gin"
)

func RagQueryHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Query          string  `json:"query" binding:"required"`
			ConversationID *string `json:"conversation_id"`
			DeviceID *int32 `json:"device_id"` // Optional
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{
				"success": false,
				"message": "Invalid request",
				"error":   err.Error(),
			})
			return
		}

		// Call gRPC RagService
		var (
            ragResp *pb.RagResponse
            err  error
        )
		if req.DeviceID != nil {
            ragResp, err = pb.CallRagQueryWithDeviceID(req.Query, *req.DeviceID)
        } else {
            ragResp, err = pb.CallRagQuery(req.Query)
        }
		if err != nil {
			c.JSON(500, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}

		// Only store if account_id is set in context (by Authorization middleware)
		accountIDVal, exists := c.Get("account_id")
		rrpID := -1
		if exists && accountIDVal != nil && req.ConversationID != nil {
			// Store request-response pair in DB
			rrp := models.RequestResponsePair{
				Request:        req.Query,
				Response:       ragResp.GetResponse(),
				ConversationID: *req.ConversationID,
                CreatedTime:  sql.NullTime{Time: time.Now(), Valid: true},
			}
			err = models.DB.QueryRow(
				`INSERT INTO request_response_pair (request, response, conversation_id, created_time) VALUES ($1, $2, $3, $4) RETURNING id`,
				rrp.Request, rrp.Response, rrp.ConversationID, rrp.CreatedTime.Time,
			).Scan(&rrpID)
            
			if err == nil {
				// If there are images, store them in request_response_pair_pdf_image
				imagesIds := ragResp.GetImagesIds()
				for _, imgID := range imagesIds {
					_, _ = models.DB.Exec(
						`INSERT INTO request_response_pair_pdf_image (request_response_pair_id, pdf_image_id) VALUES ($1, $2)`,
						rrpID, imgID,
					)
				}
                 // Update conversation's updated_time
                _, _ = models.DB.Exec(
                    `UPDATE conversation SET updated_time = $1 WHERE id = $2`,
                    time.Now(), *req.ConversationID,
                )
			}
		}

		c.JSON(200, gin.H{
			"success": true,
			"message": "LLM response fetched successfully",
			"data": gin.H{
				"response":   ragResp.GetResponse(),
				"images_ids": ragResp.GetImagesIds(),
				"pair_id":    rrpID,
			},
		})
	}
}
func ConversationStoringHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Parse optional device_id from JSON body
		var req struct {
			DeviceID *int `json:"device_id"`
			Query    string `json:"query"` // Optional, for summarizing title
		}
		_ = c.ShouldBindJSON(&req) // Ignore error, device_id is optional

		// Get account_id from context (set by Authorization middleware)
		accountIDVal, exists := c.Get("account_id")
		if !exists {
			c.JSON(401, gin.H{"success": false, "message": "Unauthorized: account_id not found in context"})
			return
		}
		accountID, ok := accountIDVal.(int)
		if !ok {
			c.JSON(500, gin.H{"success": false, "message": "Internal error: invalid account_id type"})
			return
		}

		// Generate conversation_id from account_id + current time
		now := time.Now()
		raw := fmt.Sprintf("%d%s", accountID, now.Format(time.RFC3339Nano))
		hash := sha256.Sum256([]byte(raw))
		conversationID := hex.EncodeToString(hash[:])

        // Summarize title if query is provided
        title := ""
        if strings.TrimSpace(req.Query) != "" {
            summary, err := pb.CallSummarizeQuery(req.Query)
            if err == nil && strings.TrimSpace(summary) != "" {
                title = summary
            }
        }

        // Store conversation_id, account_id, created_at, updated_at, title into DB
        db := models.DB
        _, err := db.Exec(
            "INSERT INTO conversation (id, account_id, created_time, updated_time, title) VALUES ($1, $2, $3, $4, $5)",
            conversationID, accountID, now, now, title,
        )
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to store conversation",
				"error":   err.Error(),
			})
			return
		}

		// If device_id is provided, insert into device_conversation
		deviceName := "Global Devices Scope"
		if req.DeviceID != nil {
			_, err := db.Exec(
				"INSERT INTO device_conversation (conversation_id, device_id) VALUES ($1, $2)",
				conversationID, *req.DeviceID,
			)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Failed to store device_conversation",
					"error":   err.Error(),
				})
				return
			}
			            // Try to get device label
            var label sql.NullString
            err = db.QueryRow("SELECT label FROM device WHERE id = $1", *req.DeviceID).Scan(&label)
            if err == nil && label.Valid && strings.TrimSpace(label.String) != "" {
                deviceName = strings.TrimSpace(label.String)
            }
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Conversation stored successfully",
			"data": gin.H{
				"conversation_id": conversationID,
				"title": title,
				"device_name":     deviceName,
				"conversation_updated_time": now.Format(time.RFC3339),
			},
		})
	}
}
func GetConversationInfoHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		conversationID := c.Param("id")
		db := models.DB

		// Get conversation title (and optionally other info)
		var title sql.NullString
		err := db.QueryRow(
			"SELECT title FROM conversation WHERE id = $1",
			conversationID,
		).Scan(&title)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Conversation not found",
				"error":   err.Error(),
			})
			return
		}

        titleStr := ""
        if title.Valid {
            titleStr = title.String
        }


		// Get device_id if exists
		var deviceID *int
		err = db.QueryRow(
			"SELECT device_id FROM device_conversation WHERE conversation_id = $1 LIMIT 1",
			conversationID,
		).Scan(&deviceID)
		if err != nil {
			deviceID = nil // Not found or error, set blank
		}

		// Get all request-response pairs for this conversation, ordered by id
		rows, err := db.Query(
			"SELECT id, request, response, created_time FROM request_response_pair WHERE conversation_id = $1 ORDER BY id ASC",
			conversationID,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to fetch request-response pairs",
				"error":   err.Error(),
			})
			return
		}
		defer rows.Close()

		var pairs []gin.H
		for rows.Next() {
			var pairID int
			var request, response string
            var createdTime sql.NullTime
            createdTimeStr := ""
			if err := rows.Scan(&pairID, &request, &response, &createdTime); err != nil {
				continue
			}
            if createdTime.Valid {
                createdTimeStr = createdTime.Time.Format(time.RFC3339)
            }

			// Get images for this pair
			imgRows, err := db.Query(
				"SELECT pdf_image_id FROM request_response_pair_pdf_image WHERE request_response_pair_id = $1",
				pairID,
			)
			var images []int
			if err == nil {
				for imgRows.Next() {
					var imgID int
					_ = imgRows.Scan(&imgID)
					images = append(images, imgID)
				}
				imgRows.Close()
			}

			pairs = append(pairs, gin.H{
				"id":       pairID,
				"request":  request,
				"response": response,
                "created_time": createdTimeStr,
				"images":   images,
			})
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data": gin.H{
                "title": titleStr,
				"device_id": deviceID,
				"pairs":     pairs,
			},
		})
	}
}

func ListConversationsHandler() gin.HandlerFunc {
    return func(c *gin.Context) {
        accountIDVal, exists := c.Get("account_id")
        if !exists {
            c.JSON(401, gin.H{"status": false, "message": "Unauthorized: account_id not found in context"})
            return
        }
        accountID, ok := accountIDVal.(int)
        if !ok {
            c.JSON(500, gin.H{"status": false, "message": "Internal error: invalid account_id type"})
            return
        }

        db := models.DB
        // Query 10 most recently updated conversations for this account
        rows, err := db.Query(`
            SELECT c.id, COALESCE(c.title, ''), c.updated_time, d.label
            FROM conversation c
            LEFT JOIN device_conversation dc ON c.id = dc.conversation_id
            LEFT JOIN device d ON dc.device_id = d.id
            WHERE c.account_id = $1 AND c.updated_time IS NOT NULL
            ORDER BY c.updated_time DESC
            LIMIT 10
        `, accountID)
        if err != nil {
            c.JSON(500, gin.H{"status": false, "message": "Failed to fetch conversations", "error": err.Error()})
            return
        }
        defer rows.Close()

        var conversations []gin.H
        for rows.Next() {
            var conversationID, title, deviceName sql.NullString
            var updatedTime sql.NullTime

            if err := rows.Scan(&conversationID, &title, &updatedTime, &deviceName); err != nil {
                continue
            }

            devName := "Global Devices Scope"
            if deviceName.Valid && strings.TrimSpace(deviceName.String) != "" {
                devName = strings.TrimSpace(deviceName.String)
            }

            conversations = append(conversations, gin.H{
                "device_name":                devName,
                "conversation_id":            conversationID.String,
                "conversation_title":         title.String,
                "conversation_updated_time":  func() string {
                    if updatedTime.Valid {
                        return updatedTime.Time.Format(time.RFC3339)
                    }
                    return ""
                }(),
            })
        }

        c.JSON(200, gin.H{
            "status":  true,
            "message": "Fetched conversations successfully",
            "data": gin.H{
                "conversations": conversations,
            },
        })
    }
}

func TakeNoteHandler() gin.HandlerFunc {
    return func(c *gin.Context) {
        var req struct {
            RequestResponsePairID int    `json:"requestresponsepairid" binding:"required"`
            Title                 string `json:"title"`
        }
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(400, gin.H{
                "success": false,
                "message": "Invalid request",
                "error":   err.Error(),
            })
            return
        }

        db := models.DB

        // Upsert note for the given request_response_pair_id
        var noteID int
        err := db.QueryRow(
            `INSERT INTO note (id, title) VALUES ($1, $2)
             ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title
             RETURNING id`,
            req.RequestResponsePairID, req.Title,
        ).Scan(&noteID)
        if err != nil {
            c.JSON(500, gin.H{
                "success": false,
                "message": "Failed to store note",
                "error":   err.Error(),
            })
            return
        }

        c.JSON(200, gin.H{
            "success": true,
            "message": "Note stored successfully",
            "data": gin.H{
                "note_id":                noteID,
                "title":                  req.Title,
            },
        })
    }
}

func NoteListHandler() gin.HandlerFunc {
    return func(c *gin.Context) {
        var req struct {
            ConversationID string `json:"conversation_id" binding:"required"`
        }
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(400, gin.H{
                "success": false,
                "message": "Invalid request",
                "error":   err.Error(),
            })
            return
        }

        db := models.DB

        // Join request_response_pair and note, get all notes for the conversation
        rows, err := db.Query(`
            SELECT rrp.id, COALESCE(n.title, rrp.request), rrp.response
            FROM request_response_pair rrp
            RIGHT JOIN note n ON rrp.id = n.id
            WHERE rrp.conversation_id = $1
            ORDER BY rrp.id ASC
        `, req.ConversationID)
        if err != nil {
            c.JSON(500, gin.H{
                "success": false,
                "message": "Failed to fetch notes",
                "error":   err.Error(),
            })
            return
        }
        defer rows.Close()

        var notes []gin.H
        for rows.Next() {
            var noteID int
            var title, response string
            if err := rows.Scan(&noteID, &title, &response); err != nil {
                continue
            }
            notes = append(notes, gin.H{
                "note_id":         noteID,
                "title":           title,
                "response_context": response,
            })
        }

        c.JSON(200, gin.H{
            "success": true,
            "message": "Fetched notes successfully",
            "data": gin.H{
                "notes": notes,
            },
		})
	}
}

func DeleteNoteHandler() gin.HandlerFunc {
    return func(c *gin.Context) {
        var req struct {
            ID int `json:"id" binding:"required"`
        }
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(400, gin.H{
                "success": false,
                "message": "Invalid request",
                "error":   err.Error(),
            })
            return
        }

        db := models.DB
        _, err := db.Exec(`DELETE FROM note WHERE id = $1`, req.ID)
        if err != nil {
            c.JSON(500, gin.H{
                "success": false,
                "message": "Failed to delete note",
                "error":   err.Error(),
            })
            return
        }

        c.JSON(200, gin.H{
            "success": true,
			"message": "ok",
        })
    }
}