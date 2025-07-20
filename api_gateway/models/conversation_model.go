package models

import (
	"database/sql"
	"time"
)

type Conversation struct {
    ID        string `json:"id"`
    AccountID int `json:"account_id"`
    Title    string `json:"title"`
    CreatedAt time.Time `json:"created_time"`
    UpdatedAt time.Time `json:"updated_time"`
}

type RequestResponsePair struct {
    ID             int    `json:"id"`
    Request        string `json:"request"`
    Response       string `json:"response"`
    ConversationID string    `json:"conversation_id"`
    CreatedTime sql.NullTime `json:"created_time"`
}

type Note struct {
    ID    int    `json:"id"`
    Title string `json:"title"`
}

type RequestResponsePairPDFImage struct {
    RequestResponsePairID int `json:"request_response_pair_id"`
    PDFImageID            int `json:"pdf_image_id"`
}

type DeviceConversation struct {
    ConversationID string `json:"conversation_id"`
    DeviceID       int    `json:"device_id"`
}