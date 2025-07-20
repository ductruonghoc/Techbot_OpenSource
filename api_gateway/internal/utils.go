package internal;

import (
	"math/rand"
	"fmt"
	"log"

	"golang.org/x/crypto/bcrypt"
);

// generateOTP generates a 6-digit OTP
func Digit6Random() string {
	//Format the value to string
	return fmt.Sprintf("%06d", rand.Intn(1000000));
}

// bcrypt hash generator
func BcryptHashing(password string) string{
	// Generate Bcrypt hash
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost);
	if err != nil {
		log.Fatal(err);
	}

	return string(hashedPassword);
}