// command: go test ./test/unit --v
package _test

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/ductruonghoc/DATN_08_2025_Back-end/controllers"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

// TestGetUsers - Unit test for GetUsers function
func TemplateAPITest(t *testing.T) {
	// Set up a Gin router
	gin.SetMode(gin.TestMode);
	router := gin.Default();
	router.GET("/test", controllers.TemplateHandler);

	// Create a test request
	jsonPayload := `{}`;
	req, _ := http.NewRequest("GET", "/test", strings.NewReader(jsonPayload));
	w := httptest.NewRecorder();

	// Perform the request
	router.ServeHTTP(w, req);

	// Assert the response (result matches demand)
	assert.Equal(t, http.StatusOK, w.Code);              // Check status code
	assert.Contains(t, w.Body.String(), `"result":`);    // Check response contains "users"
}