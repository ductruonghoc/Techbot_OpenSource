//For sub route groups
package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/ductruonghoc/DATN_08_2025_Back-end/controllers"
);

func TemplateRoutes(r *gin.Engine) {
	templateGroup := r.Group("/template")
	{
		templateGroup.POST("/template", controllers.TemplateHandler);
	}
}