package routes

import (
	"database/sql"

	"github.com/gin-gonic/gin"
);

func RegisterRoutes(r *gin.Engine, db *sql.DB) {
	// Add route groups here
	UserRoutes(r, db);
	PDFProcessRoutes(r, db);
	ConversationRoutes(r);
};
