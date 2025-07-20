package internal

import (
	"github.com/ductruonghoc/DATN_08_2025_Back-end/config"
	"github.com/golang-jwt/jwt/v4"

	"time"
	"errors"
)

// Claims struct for JWT payload
type UserIDClaims struct {
	UserID int `json:"user_id"`
	jwt.RegisteredClaims
}

func JWTGenerator(userID int) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &UserIDClaims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}

	//new token gen
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims);

	jwtKey := config.GetEnv("JWT_KEY", "");

	return token.SignedString([]byte(jwtKey));
}

// JWTValidator parses a JWT string and returns the user ID if valid
func JWTValidator(tokenString string) (int, error) {
	jwtKey := config.GetEnv("JWT_KEY", "")

	claims := &UserIDClaims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(jwtKey), nil
	})

	if err != nil || !token.Valid {
		return 0, errors.New("invalid token")
	}

	return claims.UserID, nil
}