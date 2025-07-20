package middlewares

import (
	"database/sql"
	"net/http"

	"fmt"
	"time"

	"github.com/ductruonghoc/DATN_08_2025_Back-end/internal"
	"github.com/ductruonghoc/DATN_08_2025_Back-end/models"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	//"github.com/gin-gonic/gin/binding"
)

func CheckVerifiedEmailExisted(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Email string `json:"email"`
		}
		// Bind JSON, form, or query parameter
		if err := c.ShouldBindBodyWithJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
			c.Abort()
			return
		}
		// Blank Email request
		if req.Email == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Email is required"})
			c.Abort()
			return
		}
		email := req.Email
		account_existed := false
		//db query here
		query := `
			select 1 as account_existed
			from "user" 
			where email = $1
			limit 1
		`
		rows, err := db.Query(query, email) // Using a placeholder for the argument
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Can't query"})
			c.Abort()
			return
		}
		defer rows.Close() // Important to close rows to free resources

		if rows.Next() {
			// A row exists, which means the account exists
			account_existed = true
		}

		c.Set("account_existed", account_existed)
		c.Next()
	}
}

func StoreTemporatoryUser(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		//Get middlewares results
		otpVal, exists := c.Get("otp")
		if !exists {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not retrieve otp existed status"})
			c.Abort()
			return
		}

		otp, ok := otpVal.(models.OTP) // type assertion
		if !ok {
			// handle type mismatch
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error with otp"})
			c.Abort()
			return
		}

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
		hashed_otp := internal.BcryptHashing(otp.OTPCode)
		req.Password = hashed_password

		email := req.Email
		//db query here
		query := `
			INSERT INTO temp_user (email, password, otp, otp_generated_time)
			VALUES ($1, $2, $3, $4)
			ON CONFLICT (email) DO UPDATE
			SET password = EXCLUDED.password,
				otp = EXCLUDED.otp,
				otp_generated_time = EXCLUDED.otp_generated_time;
		`
		rows, err := db.Query(query, email, hashed_password, hashed_otp, otp.OTPWasGeneratedAt) // Using a placeholder for the argument
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Can't query"})
			c.Abort()
			return
		}
		defer rows.Close() // Important to close rows to free resources
		// Successfully stored unverified user, continue processing
		c.Next()
	}
}

func SendOTP() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Email string `json:"email"`
		}

		// Bind JSON, form, or query parameter
		if err := c.ShouldBindBodyWithJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
			c.Abort()
			return
		}

		if req.Email == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Email is required"})
			c.Abort()
			return
		}

		var otp models.OTP

		otpCode := internal.Digit6Random()
		//expiration := time.Now().Add(5 * time.Minute);

		otp.OTPCode = otpCode
		otp.OTPWasGeneratedAt = time.Now()

		//email otp
		if err := internal.EmailOTP(req.Email, otp.OTPCode); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send OTP"})
			c.Abort()
			return
		}
		c.Set("otp", otp)
		//succesful
		c.Next()
	}
}

func VeirifyOTP(db *sql.DB, destination_table_index int) gin.HandlerFunc {
	destination_table_slice := []string{
		`"user"`,
		"temp_user",
	}
	return func(c *gin.Context) {
		var req struct {
			Email   string `json:"email"`
			OTPCode string `json:"otp_code"`
		}
		//try bind the request
		if err := c.ShouldBindBodyWithJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
			c.Abort()
			return
		}
		//db query here
		email := req.Email
		destination_table := destination_table_slice[destination_table_index]

		query := fmt.Sprintf(`
			select 
				otp as otp_code,
				otp_generated_time as generated_at
			from %s
			where email = $1;
		`, destination_table)
		rows, err := db.Query(query, email) // Using a placeholder for the argument
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Can't query"})
			c.Abort()
			return
		}
		defer rows.Close() // Important to close rows to free resources

		var otp models.OTP
		if rows.Next() { // Advances to the first (and expected only) row.
			// Could return false here if there's an immediate error fetching the first row.
			if err := rows.Scan(&otp.OTPCode, &otp.OTPWasGeneratedAt); err != nil {
				// This error is specific to scanning THIS row's data.
				// e.g., otp_code was NULL and OTPCode is a non-pointer string, or types are incompatible.
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process data"})
				c.Abort()
				return
			}
			// If Scan was successful, otp is populated.
		} else {
			// rows.Next() returned false. This could be because:
			// 1. No rows were found (sql.ErrNoRows if using QueryRow().Scan(), but with raw Next() it's just 'false').
			// 2. An error occurred trying to fetch the first row.
			// This 'else' block in your code assumes it's "No rows found".
			c.JSON(http.StatusNotFound, gin.H{"error": "OTP not found"})
			c.Abort()
			return
		}

		// Check for errors after the potential Next() call
		// This is where you catch the error if rows.Next() returned 'false' due to an error,
		// rather than just no rows.
		if err = rows.Err(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error processing results"})
			c.Abort()
			return
		}

		// Get the current time
		currentTime := time.Now()

		// Add 2 hours to the input time
		expirationTime := otp.OTPWasGeneratedAt.Add(2 * time.Hour)
		otp_is_expired := expirationTime.Before(currentTime)

		if otp_is_expired {
			c.JSON(http.StatusBadRequest, gin.H{"error": "OTP expired"})
			c.Abort()
			return
		}

		// Compare the hashed password with the plain text one
		err = bcrypt.CompareHashAndPassword([]byte(otp.OTPCode), []byte(req.OTPCode))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "OTP is not match"})
			c.Abort()
			return
		}

		//Successful
		c.Set("verified_email", req.Email)
		c.Next()
	}
}

func CheckGoogleUserExisted() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			GoogleID string `json:"google_id"`
		}
		//try binding the request
		if err := c.ShouldBindBodyWithJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
			c.Abort()
			return
		}

		account_existed := false
		//db query here
		c.Set("account_existed", account_existed)
		c.Next()
	}
}

func UserExistedIgnore() gin.HandlerFunc {
	return func(c *gin.Context) {
		//Get middlewares results
		account_existed, exists := c.Get("account_existed")
		if !exists {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not retrieve account existed status"})
			return
		}

		//account existed before will be ignored
		if account_existed == true {
			c.JSON(http.StatusConflict, gin.H{"error": "Account has already existed"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// Authenticate Middleware authenticates users based on username and password
func UserAuthenticate(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}
		//try bind the request
		if err := c.ShouldBindBodyWithJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
			c.Abort()
			return
		}

		var userID int
		//db query here
		email := req.Email

		query := `
			select password
			from "user"
			where email = $1;
		`
		rows, err := db.Query(query, email) // Using a placeholder for the argument
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Can't query"})
			c.Abort()
			return
		}
		defer rows.Close() // Important to close rows to free resources

		password := ""

		if rows.Next() { // Advances to the first (and expected only) row.
			// Could return false here if there's an immediate error fetching the first row.
			if err := rows.Scan(&password); err != nil {
				// This error is specific to scanning THIS row's data.
				// e.g., otp_code was NULL and OTPCode is a non-pointer string, or types are incompatible.
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process data"})
				c.Abort()
				return
			}
		} else {
			// rows.Next() returned false. This could be because:
			// 1. No rows were found (sql.ErrNoRows if using QueryRow().Scan(), but with raw Next() it's just 'false').
			// 2. An error occurred trying to fetch the first row.
			// This 'else' block in your code assumes it's "No rows found".
			c.JSON(http.StatusNotFound, gin.H{"error": "Password not found", "email": email})
			c.Abort()
			return
		}

		// Check for errors after the potential Next() call
		// This is where you catch the error if rows.Next() returned 'false' due to an error,
		// rather than just no rows.
		if err = rows.Err(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error processing results"})
			c.Abort()
			return
		}

		// Compare the hashed password with the plain text one
		err = bcrypt.CompareHashAndPassword([]byte(password), []byte(req.Password))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Password is not match"})
			c.Abort()
			return
		}

		query = `
			select id
			from "user"
			where email = $1;
		`
		rows, err = db.Query(query, email) // Using a placeholder for the argument
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Can't query"})
			c.Abort()
			return
		}
		defer rows.Close() // Important to close rows to free resources

		if rows.Next() { // Advances to the first (and expected only) row.
			// Could return false here if there's an immediate error fetching the first row.
			if err := rows.Scan(&userID); err != nil {
				// This error is specific to scanning THIS row's data.
				// e.g., otp_code was NULL and OTPCode is a non-pointer string, or types are incompatible.
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process data"})
				c.Abort()
				return
			}
			// If Scan was successful, otp is populated.
		} else {
			// rows.Next() returned false. This could be because:
			// 1. No rows were found (sql.ErrNoRows if using QueryRow().Scan(), but with raw Next() it's just 'false').
			// 2. An error occurred trying to fetch the first row.
			// This 'else' block in your code assumes it's "No rows found".
			c.JSON(http.StatusNotFound, gin.H{"error": "ID not found"})
			c.Abort()
			return
		}

		c.Set("user_id", userID)
		c.Next()
	}
}

func UserExistedFirst() gin.HandlerFunc {
	return func(c *gin.Context) {
		//Get middlewares results
		account_existed, exists := c.Get("account_existed")
		if !exists {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not retrieve account existed status"})
			return
		}

		//account existed before will be ignored
		if account_existed == false {
			c.JSON(http.StatusConflict, gin.H{"error": "Account has not existed yet."})
			c.Abort()
			return
		}

		c.Next()
	}
}

// AuthorizationMiddleware returns a gin.HandlerFunc with required permission as input
func Authorization(requiredPermissions []string) gin.HandlerFunc {
	db := models.DB
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")


		// Special case: No permission required and no token provided
        if (len(requiredPermissions) == 0) && authHeader == "" {
            c.Next()
            return
        }

		if authHeader == "" {
			c.JSON(401, gin.H{"success": false, "message": "Missing Authorization header"})
			c.Abort()
			return
		}

		var tokenString string
		if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
			tokenString = authHeader[7:]
		} else {
			c.JSON(401, gin.H{"success": false, "message": "Invalid Authorization header"})
			c.Abort()
			return
		}

		accountID, err := internal.JWTValidator(tokenString)
		if err != nil {
			c.JSON(401, gin.H{"success": false, "message": "Invalid or expired token", "error": err.Error()})
			c.Abort()
			return
		}


		// If requiredPermissions is not empty, check role from DB
		
		if requiredPermissions != nil || len(requiredPermissions) > 0 {
			var roleLabel string
			query := `
				SELECT r.label
				FROM account a
				JOIN role r ON a.role_id = r.id
				WHERE a.id = $1
				LIMIT 1
			`
			err := db.QueryRow(query, accountID).Scan(&roleLabel)
			if err != nil {
				c.JSON(403, gin.H{"success": false, "message": "Permission denied: cannot retrieve role", "error": err.Error()}, )
				c.Abort()
				return
			}
			// Check if roleLabel is in requiredPermissions
			allowed := false
			for _, perm := range requiredPermissions {
				if roleLabel == perm {
					allowed = true
					break
				}
			}
			if !allowed {
				c.JSON(403, gin.H{"success": false, "message": "Forbidden: insufficient permissions"})
				c.Abort()
				return
			}
		}

		// Set accountID and role to context for downstream handlers
		c.Set("account_id", accountID)
		c.Next()
	}
}

func AdminAuthenticate(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Username   string `json:"username"`
			Password string `json:"password"`
		}
		//try bind the request
		if err := c.ShouldBindBodyWithJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid request format",
				"error": err.Error(),
			})
			c.Abort()
			return
		}

		var accountID int
		//db query here
		username := req.Username

		query := `
			select a.password 
			from "admin" a 
			left join account acc on a.id = acc.id 
			where username = $1;
		`
		rows, err := db.Query(query, username) // Using a placeholder for the argument
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Can't query",
				"error": err.Error(),
			})
			c.Abort()
			return
		}
		defer rows.Close() // Important to close rows to free resources

		password := ""

		if rows.Next() { // Advances to the first (and expected only) row.
			// Could return false here if there's an immediate error fetching the first row.
			if err := rows.Scan(&password); err != nil {
				// This error is specific to scanning THIS row's data.
				// e.g., otp_code was NULL and OTPCode is a non-pointer string, or types are incompatible.
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Failed to process data",
					"error": err.Error(),
				})
				c.Abort()
				return
			}
		} else {
			// rows.Next() returned false. This could be because:
			// 1. No rows were found (sql.ErrNoRows if using QueryRow().Scan(), but with raw Next() it's just 'false').
			// 2. An error occurred trying to fetch the first row.
			// This 'else' block in your code assumes it's "No rows found".
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Password not found",
				"error": "Password not found",
			})
			c.Abort()
			return
		}

		// Check for errors after the potential Next() call
		// This is where you catch the error if rows.Next() returned 'false' due to an error,
		// rather than just no rows.
		if err = rows.Err(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Error processing results",
				"error": err.Error(),
			})
			c.Abort()
			return
		}

		// Compare the hashed password with the plain text one
		err = bcrypt.CompareHashAndPassword([]byte(password), []byte(req.Password))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Password is not match",
				"error": err.Error(),
			})
			c.Abort()
			return
		}

		query = `
			select id
			from account
			where username = $1;
		`
		rows, err = db.Query(query, username) // Using a placeholder for the argument
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Can't query",
				"error": err.Error(),
			})
			c.Abort()
			return
		}
		defer rows.Close() // Important to close rows to free resources

		if rows.Next() { // Advances to the first (and expected only) row.
			// Could return false here if there's an immediate error fetching the first row.
			if err := rows.Scan(&accountID); err != nil {
				// This error is specific to scanning THIS row's data.
				// e.g., otp_code was NULL and OTPCode is a non-pointer string, or types are incompatible.
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Failed to process data",
					"error": err.Error(),
				})
				c.Abort()
				return
			}
			// If Scan was successful, otp is populated.
		} else {
			// rows.Next() returned false. This could be because:
			// 1. No rows were found (sql.ErrNoRows if using QueryRow().Scan(), but with raw Next() it's just 'false').
			// 2. An error occurred trying to fetch the first row.
			// This 'else' block in your code assumes it's "No rows found".
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "ID not found",
				"error": "ID not found",
			})
			c.Abort()
			return
		}

		c.Set("account_id", accountID)
		c.Next()
	}
}