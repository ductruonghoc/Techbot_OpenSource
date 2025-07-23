// For sub route groups
package routes

import (
	"database/sql"

	"github.com/ductruonghoc/DATN_08_2025_Back-end/controllers"
	"github.com/ductruonghoc/DATN_08_2025_Back-end/middlewares"
	"github.com/ductruonghoc/DATN_08_2025_Back-end/models"
	"github.com/gin-gonic/gin"
)

func PDFProcessRoutes(r *gin.Engine, db *sql.DB) {
	routeGroup := r.Group("/pdf_process")
	{
		routeGroup.GET("/new_device", controllers.NewDevice(db))
		routeGroup.GET("/get_brands_and_device_types", controllers.DeviceTypeAndBrandReceive(db))
		routeGroup.GET("/pdf_upload", controllers.PDFUpload())
		routeGroup.GET("/extract_pdf", controllers.ExtractPDFHandler())
		routeGroup.POST("/save_and_embed_paragraph", controllers.SaveAndEmbedParagraphHandler())
		routeGroup.POST("/save_and_embed_img_alt", controllers.SaveAndEmbedImgAltHandler())
		routeGroup.GET("/get_pdf_initial_state", controllers.GetPDFInitialStateHandler())
		routeGroup.GET("/get_pdf_state", controllers.GetPDFStateHandler())
		routeGroup.GET("/get_img_signed_url", controllers.GetImgSignedURLHandler())
		routeGroup.POST("/delete_chunk", controllers.DeleteChunkHandler())
		routeGroup.POST("/create_new_image", controllers.CreateNewImageHandler())
		routeGroup.GET("/devices", controllers.ListDevicesHandler(db))
		routeGroup.GET("/agent_is_extracting_status", controllers.GetAgentIsExtractingStatusHandler())
		routeGroup.GET("/devices_for_chat", controllers.ListDeviceForChatHandler(db))
		routeGroup.GET("/list_pdfs_states", controllers.ListPDFsStatesHandler(db))
		routeGroup.GET("/pdf_pages_embedding_status", controllers.PDFPagesEmbeddedStatusesHandler(db))
		routeGroup.POST("/add_brand", middlewares.Authorization([]string{models.AdminPermission}), controllers.AddBrandHandler(db))
		routeGroup.POST("/add_category", middlewares.Authorization([]string{models.AdminPermission}), controllers.AddCategoryHandler(db))
	
	}
}
