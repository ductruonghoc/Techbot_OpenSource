package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// LoadEnv loads environment variables from a .env file
func LoadEnv() {
	err := godotenv.Load();
	if err != nil {
		log.Println("Warning: No .env file found, using system environment variables");
	}
}

// GetEnv fetches an environment variable or returns a fallback value
func GetEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value;
	}
	return fallback;
}