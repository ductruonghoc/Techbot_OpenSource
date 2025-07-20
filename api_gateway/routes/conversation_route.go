package routes

import (
	"github.com/ductruonghoc/DATN_08_2025_Back-end/controllers"
	"github.com/ductruonghoc/DATN_08_2025_Back-end/middlewares"
	"github.com/ductruonghoc/DATN_08_2025_Back-end/models"
	"github.com/gin-gonic/gin"
)

// Register conversation-related routes
func ConversationRoutes(r *gin.Engine) {
    routeGroup := r.Group("/conversation")
    {
        routeGroup.POST("/rag_query",  middlewares.Authorization(nil), controllers.RagQueryHandler())
        routeGroup.POST("/storing", middlewares.Authorization([]string{models.UserPermission, models.AdminPermission}), controllers.ConversationStoringHandler())
        routeGroup.GET("/:id", middlewares.Authorization([]string{models.UserPermission, models.AdminPermission}), controllers.GetConversationInfoHandler())
        routeGroup.GET("/list", middlewares.Authorization([]string{models.UserPermission, models.AdminPermission}), controllers.ListConversationsHandler())
        routeGroup.POST("/note/take", middlewares.Authorization([]string{models.UserPermission, models.AdminPermission}), controllers.TakeNoteHandler())
        routeGroup.POST("/note/list", middlewares.Authorization([]string{models.UserPermission, models.AdminPermission}), controllers.NoteListHandler())
        routeGroup.POST("/note/delete", middlewares.Authorization([]string{models.UserPermission, models.AdminPermission}), controllers.DeleteNoteHandler())
        // Add more conversation routes here as needed
    }
}