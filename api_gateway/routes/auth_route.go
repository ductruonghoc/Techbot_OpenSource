// For sub route groups
package routes

import (
	"database/sql"
	"github.com/ductruonghoc/DATN_08_2025_Back-end/controllers"
	"github.com/ductruonghoc/DATN_08_2025_Back-end/middlewares"
	"github.com/gin-gonic/gin"
)

func UserRoutes(r *gin.Engine, db *sql.DB) {
	routeGroup := r.Group("/auth")
	{
		routeGroup.POST(
			"/unverified_register",
			middlewares.CheckVerifiedEmailExisted(db),
			middlewares.UserExistedIgnore(),
			middlewares.SendOTP(),
			middlewares.StoreTemporatoryUser(db),
			controllers.NonVerifiedRegistration,
		)
		routeGroup.POST(
			"/verify_registration",
			middlewares.VeirifyOTP(db, 1),
			controllers.VerifiedRegistration(db),
		)
		routeGroup.POST(
			"/can_google_register",
			middlewares.CheckGoogleUserExisted(),
			middlewares.UserExistedIgnore(),
			controllers.CanGoogleRegister,
		)
		routeGroup.POST(
			"/google_registration",
			controllers.GoogleRegistration,
		)
		routeGroup.POST(
			"/login",
			middlewares.UserAuthenticate(db),
			controllers.UserLogin,
		)
		routeGroup.POST(
			"/google_login",
			middlewares.CheckGoogleUserExisted(),
			controllers.GoogleLogin,
		)
		routeGroup.POST(
			"/can_reset_password",
			middlewares.CheckVerifiedEmailExisted(db),
			middlewares.UserExistedFirst(),
			middlewares.SendOTP(),
			controllers.SendOTP(db, 0),
		)
		routeGroup.POST(
			"/reset_password",
			middlewares.VeirifyOTP(db, 0),
			controllers.ResetPassword(db),
		)

		routeGroup.POST(
			"/resend_otp_registration",
			middlewares.SendOTP(),
			controllers.SendOTP(db, 1),
		)
		routeGroup.POST(
			"/resend_otp_reset_password",
			middlewares.SendOTP(),
			controllers.SendOTP(db, 0),
		)
		routeGroup.POST(
			"/admin_login",
			middlewares.AdminAuthenticate(db),
			controllers.AdminLogin,
		)
		routeGroup.POST(
			"/admin_authorize",
			middlewares.Authorization([]string{"admin"}), // Use the Authorization middleware with "admin" permission
			controllers.AdminAuthorization,
		)
		routeGroup.POST(
			"/client_authorize",
			middlewares.Authorization([]string{"user"}), // Use the Authorization middleware with "admin" permission
			controllers.AdminAuthorization,
		)
		routeGroup.POST(
			"/verify_otp",
			middlewares.VeirifyOTP(db, 0),
			controllers.VerifyOTPAndRespondHandler(),
		)
		routeGroup.GET(
            "/display_name",
            middlewares.Authorization([]string{"user", "admin"}),
            controllers.GetAccountDisplayNameHandler(db),
        )
	}
}
