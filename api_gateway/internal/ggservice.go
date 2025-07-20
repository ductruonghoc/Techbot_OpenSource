package internal

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"cloud.google.com/go/storage"
	"github.com/ductruonghoc/DATN_08_2025_Back-end/config"
	"google.golang.org/api/option"
)

var bucketClient *storage.Client
var BucketNameDefault = "extract_pdf_22_05_2025"

// ServiceAccountKey represents the structure of your service account JSON key
type ServiceAccountKey struct {
	Type         string `json:"type"` // Thêm trường "type"
	PrivateKeyID string `json:"private_key_id"`
	PrivateKey   string `json:"private_key"`
	ClientEmail  string `json:"client_email"`
	ClientID     string `json:"client_id"`
	// ... other fields you might have
}

var serviceAccountKey ServiceAccountKey

func CreateStorageClient() {
	ctx := context.Background()
	// Lấy thông tin từ biến môi trường
    serviceAccountKey = ServiceAccountKey{
		Type:         "service_account", // Giá trị mặc định cho trường "type"
        PrivateKeyID: config.GetEnv("GOOGLE_PRIVATE_KEY_ID", ""),
        PrivateKey:   config.GetEnv("GOOGLE_PRIVATE_KEY", ""),
        ClientEmail:  config.GetEnv("GOOGLE_CLIENT_EMAIL", ""),
		ClientID:     config.GetEnv("GOOGLE_CLIENT_ID", ""),
	}

    // Kiểm tra các giá trị cần thiết
    if 	serviceAccountKey.PrivateKeyID == "" || 
		serviceAccountKey.PrivateKey == "" || 
		serviceAccountKey.ClientEmail == "" ||
		serviceAccountKey.ClientID == "" {
        log.Fatalf("Missing required environment variables for Google Cloud authentication")
    }
	serviceAccountKey.PrivateKey = strings.ReplaceAll(serviceAccountKey.PrivateKey, "\\n", "\n") // Chuyển đổi ký tự \n thành dòng mới
	// Chuyển đổi ServiceAccountKey thành JSON
    credentialsJSON, err := json.Marshal(serviceAccountKey)
    if err != nil {
        log.Fatalf("Không thể chuyển đổi ServiceAccountKey thành JSON: %v", err)
    }
	// Khởi tạo client.
	// Thư viện sẽ tự động tìm thông tin xác thực nếu bạn đã cấu hình ADC
	// hoặc đặt biến môi trường GOOGLE_APPLICATION_CREDENTIALS.
	client, err := storage.NewClient(ctx, option.WithCredentialsJSON(credentialsJSON))
	if err != nil {
		log.Fatalf("Creating Client Fails: %v", err)
	}
	defer client.Close()

	bucketClient = client
}

// generateReadSignedURL tạo một Signed URL để đọc (GET) một đối tượng.
func GenerateReadSignedURL(bucketName, objectName string) (string, error) {
	// Cấu hình các tùy chọn cho Signed URL
	opts := &storage.SignedURLOptions{
		Scheme:         storage.SigningSchemeV4,
		Method:         "GET",
		Expires:        time.Now().Add(15 * time.Minute),
		GoogleAccessID: serviceAccountKey.ClientEmail,
		PrivateKey:     []byte(serviceAccountKey.PrivateKey),
	}

	u, err := bucketClient.Bucket(bucketName).SignedURL(objectName, opts)
	if err != nil {
		return "", fmt.Errorf("Bucket(%q).SignedURL: %v", bucketName, err)
	}
	return u, nil
}

// generateWriteSignedURL tạo một Signed URL để ghi (PUT) một đối tượng.
func GenerateWriteSignedURL(bucketName, objectName, contentType string) (string, error) {
	// Cấu hình các tùy chọn cho Signed URL
	opts := &storage.SignedURLOptions{
		Scheme:         storage.SigningSchemeV4,
		Method:         "PUT",
		Expires:        time.Now().Add(15 * time.Minute),
		Headers:        []string{fmt.Sprintf("Content-Type: %s", contentType)}, // Content-Type phải khớp khi tải lên
		GoogleAccessID: serviceAccountKey.ClientEmail,
		PrivateKey:     []byte(serviceAccountKey.PrivateKey),
		// GoogleAccessID và PrivateKey: tương tự như với GET
	}

	u, err := bucketClient.Bucket(bucketName).SignedURL(objectName, opts)
	if err != nil {
		return "", fmt.Errorf("Bucket(%q).SignedURL for PUT: %v", bucketName, err)
	}
	return u, nil
}

// setBucketCORSConfiguration sets a CORS configuration on a bucket.
func SetBucketCORSConfiguration() error {
	ctx := context.Background()
	corsConfig := []storage.CORS{
		{
			MaxAge:          time.Hour * 24 / time.Second, // 24 hours in seconds
			Methods:         []string{"GET", "PUT", "POST", "DELETE", "OPTIONS"},
			Origins:         []string{"*"}, // Allow all origins (use specific origins in production)
			ResponseHeaders: []string{"Content-Type", "X-Requested-With"},
		},
		// You can add more CORS entries if needed for different origins/methods
		// {
		// 	MaxAge:          3600,
		// 	Methods:         []string{"GET"},
		// 	Origins:         []string{"https://my-specific-domain.com"},
		// 	ResponseHeaders: []string{"Content-Type"},
		// },
	}
	// Get a handle to the bucket
	bucket := bucketClient.Bucket(BucketNameDefault)

	// Update the bucket's CORS configuration
	// The BucketAttrsToUpdate struct is used to specify which attributes to update.
	// We only need to set the CORS field here.
	bucketAttrsToUpdate := storage.BucketAttrsToUpdate{
		CORS: corsConfig,
	}

	// Perform the update operation
	_, err := bucket.Update(ctx, bucketAttrsToUpdate)
	if err != nil {
		return fmt.Errorf("Bucket(%q).Update: %w", BucketNameDefault, err)
	}

	fmt.Printf("CORS configuration successfully set for bucket %q.\n", BucketNameDefault)
	return nil
}

