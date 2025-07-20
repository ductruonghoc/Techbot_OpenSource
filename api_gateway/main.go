package main

import (
	"github.com/ductruonghoc/DATN_08_2025_Back-end/config"
	"github.com/ductruonghoc/DATN_08_2025_Back-end/internal"
	"github.com/ductruonghoc/DATN_08_2025_Back-end/models"
	"github.com/ductruonghoc/DATN_08_2025_Back-end/pb"
	"github.com/ductruonghoc/DATN_08_2025_Back-end/routes"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"log"
	"time"
)

func main() {
	//Config env
	config.LoadEnv()

	// Try to get DSN from environment variable
	dsn := config.GetEnv("POSTGRES_DSN", "")
	if dsn == "" {
		log.Println("POSTGRES_DSN environment variable not set. Using default DSN (ensure it's configured for your local setup).")
		dsn = "postgres://user:password@localhost:5432/dbname?sslmode=disable"
	}

	DB, err := models.InitDB(dsn)
	if err != nil {
		log.Fatalf("Could not initialize database connection: %v", err)
	}
	defer DB.Close() // Ensure the database connection is closed when main exits.
	//Google services intergrated
	internal.CreateStorageClient()
	//PBClient initialize
	pb.Init()
	defer pb.Close()

	r := gin.Default()

	// Allow all CORS (dev only)
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))
	// Register all routes
	routes.RegisterRoutes(r, DB)

	// Start server
	port := config.GetEnv("GATEWAY_PORT", "8080")
	r.Run(":" + port)
}
