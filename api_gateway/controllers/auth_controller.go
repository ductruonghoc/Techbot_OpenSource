package controllers

import (
	"fmt"
	"net/http"

	"database/sql"

	"github.com/ductruonghoc/DATN_08_2025_Back-end/internal"
	"github.com/ductruonghoc/DATN_08_2025_Back-end/models"
	"github.com/gin-gonic/gin"
)

func NonVerifiedRegistration(c *gin.Context) {
	//all middleware succesfully processes
	c.JSON(http.StatusOK, gin.H{"message": "Nonverified registration process completed successfully"})
}

func VerifiedRegistration(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		//Get middlewares results
		email, exists := c.Get("verified_email")
		if !exists {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not retrieve verified email"})
			return
		}

		//db query here
		query := `
			SELECT proc_create_account_and_user($1);
		`
		rows, err := db.Query(query, email) // Using a placeholder for the argument
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			c.Abort()
			return
		}
		defer rows.Close() // Important to close rows to free resources

		//Successful
		c.JSON(http.StatusOK, gin.H{"message": "User verified successfully", "email": email})
	}
}

func CanGoogleRegister(c *gin.Context) {
	//all middleware succesfully processes
	c.JSON(http.StatusOK, gin.H{"message": "Google Registration can process"})
}

func GoogleRegistration(c *gin.Context) {
	var req struct {
		GoogleID    string `json:"google_id"`
		GoogleEmail string `json:"google_email"`
	}

	// Bind JSON, form, or query parameter
	if err := c.ShouldBindBodyWithJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		c.Abort()
		return
	}

	user := models.User{
		Email: "",
	}

	id, err := models.InsertUser(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error"})
		c.Abort()
		return
	}

	google_user := models.GoogleUser{
		GoogleID:    req.GoogleID,
		GoogleEmail: req.GoogleEmail,
	}

	if _, err := models.InsertUserGoogleInfomation(google_user, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error"})
		c.Abort()
		return
	}

	//succesfully process
	c.JSON(http.StatusOK, gin.H{"message": "Google Registration process successfully"})
}

func UserLogin(c *gin.Context) {
	//Get middlewares results
	payload, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not retrieve account existed status"})
		return
	}

	userID, ok := payload.(int)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	token, err := internal.JWTGenerator(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token})
}

func GoogleLogin(c *gin.Context) {
	//Get middlewares results
	account_existed, exists := c.Get("account_existed")
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not retrieve account existed status"})
		return
	}
	//not existed yet
	if account_existed == false {
		c.JSON(http.StatusNotFound, gin.H{"error": "Could not retrieve account"})
		return
	}
	//db query here
	var userID int
	token, err := internal.JWTGenerator(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token})
}

func ResetPassword(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		//Get middlewares results
		_, exists := c.Get("verified_email")
		if !exists {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not retrieve verified email"})
			return
		}

		//db query here
		var req struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}

		// Bind JSON, form, or query parameter
		if err := c.ShouldBindBodyWithJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
			c.Abort()
			return
		}

		//password hashing
		hashed_password := internal.BcryptHashing(req.Password)
		email := req.Email

		//db query here
		query := `
			update "user"
			set password = $1
			where email = $2;
		`
		rows, err := db.Query(query, hashed_password, email) // Using a placeholder for the argument
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Can't query"})
			c.Abort()
			return
		}
		defer rows.Close() // Important to close rows to free resources

		//Successful
		c.JSON(http.StatusOK, gin.H{"message": "Password resets successfully."})
	}
}

func SendOTP(db *sql.DB, destination_table_index int) gin.HandlerFunc {
	destination_table_slice := []string{
		`"user"`,
		"temp_user",
	}
	return func(c *gin.Context) {
		//Get middlewares results
		otpVal, exists := c.Get("otp")
		if !exists {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Fail to read otp.",
				"errors": gin.H{
					"code":    500,
					"details": "Generate otp failed.",
				},
			})
			c.Abort()
			return
		}

		otp, ok := otpVal.(models.OTP) // type assertion
		if !ok {
			// handle type mismatch
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Fail to read otp",
				"errors": gin.H{
					"code":    500,
					"details": "Generate otp failed.",
				},
			})
			c.Abort()
			return
		}

		var req struct {
			Email string `json:"email"`
		}

		// Bind JSON, form, or query parameter
		if err := c.ShouldBindBodyWithJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Fail to bind the request.",
				"errors": gin.H{
					"code":    400,
					"details": "Invalid request structure.",
				},
			})
			c.Abort()
			return
		}
		//initial params
		email := req.Email
		hashed_otp := internal.BcryptHashing(otp.OTPCode)
		destination_table := destination_table_slice[destination_table_index]
		//db query here
		query := fmt.Sprintf(`
			UPDATE %s 
			SET otp = $1, otp_generated_time = $2
			WHERE email = $3;
		`, destination_table)

		rows, err := db.Query(query, hashed_otp, otp.OTPWasGeneratedAt, email) // Using a placeholder for the argument
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Fail to query.",
				"errors": gin.H{
					"code":    400,
					"details": "Can't query with the request' params.",
				},
			})
			c.Abort()
			return
		}
		defer rows.Close() // Important to close rows to free resources
		//Successful
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "OTP has been sent.",
		})
	}
}

func AdminLogin(c *gin.Context) {
	// Get middleware results
	payload, exists := c.Get("account_id")
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not retrieve admin account status",
			"error":   "Could not retrieve admin account status",
		})
		return
	}

	adminID, ok := payload.(int)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Internal server error",
			"error":   "Internal server error",
		})
		return
	}

	token, err := internal.JWTGenerator(adminID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not generate token",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Admin login successful",
		"data": gin.H{
			"token": token,
		}})
}

func AdminAuthorization(c *gin.Context) {
    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "message": "Admin authorization successful",
    })
}


func VerifyOTPAndRespondHandler() gin.HandlerFunc {
    return func(c *gin.Context) {
        // The VeirifyOTP middleware should be used before this handler in the route.
        // If it reaches here, OTP is verified.
        c.JSON(200, gin.H{
            "success": true,
            "message": "OTP verified successfully",
        })
    }
}