package pb

import (
	"context"
	"fmt"
	"log"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials" // Added import for TLS credentials
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/keepalive"
	"google.golang.org/grpc/status"
)

var pb_Client ExtractPdfServiceClient
var pb_conn *grpc.ClientConn

const (
	LOCALIP   = "localhost:50051" // Default local IP for gRPC server
	GGCLOUDIP = "mdc-ai-agent-query-360694025581.asia-east1.run.app:443"
)

var localCredential = grpc.WithTransportCredentials(insecure.NewCredentials())
var cloudCredential = grpc.WithTransportCredentials(credentials.NewClientTLSFromCert(nil, ""))

var ip = LOCALIP // Change this to LOCALIP for local testing
var currentCredential = func() grpc.DialOption {
    if ip == LOCALIP {
        return localCredential
    }
    return cloudCredential
}()
//var ip = LOCALIP // Default to local IP for testing
var AgentIsExtracting = false

const (
	// Cấu hình thời gian chờ cho việc thiết lập kết nối (Dial Timeout)
	// Cần đủ lớn để container Cloud Run có thể khởi động (cold start)
	// Postman của bạn mất 1 phút 10 giây, vậy hãy đặt ít nhất là 2 phút
	dialTimeout = 2 * time.Minute // 2 phút = 120 giây.

	// Cấu hình cho logic retry khi khởi tạo kết nối
	maxInitRetries    = 5           // Số lần thử lại tối đa
	initRetryDelay    = 10 * time.Second // Bắt đầu với 10 giây giữa các lần thử lại
)

func Init() {
	// Đây là hàm khởi tạo kết nối gRPC.
	// Sử dụng logic retry để đối phó với cold start và các lỗi kết nối tạm thời.

	address := ip // Giả định `ip` là biến đã được khai báo và chứa địa chỉ gRPC server
	if address == "" {
		log.Fatalf("Error: gRPC server address (ip) is not set.")
	}

	var err error
	var conn *grpc.ClientConn

	// Vòng lặp thử lại để thiết lập kết nối
	for i := 0; i < maxInitRetries; i++ {
		log.Printf("Attempting to initialize gRPC connection to %s (retry %d/%d)...", address, i+1, maxInitRetries)

		// Context cho quá trình Dialing với timeout.
		ctx, cancel := context.WithTimeout(context.Background(), dialTimeout)

		// Vì grpc.NewClient với grpc.WithBlock() là một lời gọi blocking và không nhận trực tiếp context,
		// chúng ta cần tự quản lý timeout. Chạy NewClient trong một goroutine và dùng select
		// để chờ nó hoàn thành hoặc cho đến khi context timeout.
		ch := make(chan error, 1)

		go func() {
			var dialErr error
			// KẾT NỐI AN TOÀN VỚI TLS (KHUYẾN NGHỊ VỚI CLOUD RUN PUBLIC ENDPOINT)
			conn, dialErr = grpc.NewClient(address,
				//use for test
				currentCredential, // Sử dụng credential phù hợp với môi trường (local hoặc cloud)
				// grpc.WithBlock(), // Chặn cho đến khi kết nối thành công hoặc timeout
				grpc.WithKeepaliveParams(keepalive.ClientParameters{
					Time:                5 * time.Minute, // Gửi ping sau 10 giây không hoạt động
					Timeout:             60 * time.Second, // Chờ 60 giây cho phản hồi ping (tăng từ 5s)
					PermitWithoutStream: true,             // Cho phép ping ngay cả khi không có stream hoạt động
				}),
			)
			ch <- dialErr
		}()

		// Chờ kết quả từ channel hoặc cho đến khi context timeout.
		select {
		case err = <-ch:
			// grpc.NewClient đã trả về kết quả (thành công hoặc lỗi).
		case <-ctx.Done():
			// Context đã timeout.
			err = ctx.Err()
		}

		// Giải phóng context ngay sau khi select kết thúc, tránh rò rỉ tài nguyên.
		cancel()

		if err == nil {
			pb_conn = conn
			log.Println("gRPC connection initialized successfully.")
			return // Kết nối thành công, thoát hàm Init
		}

		// Xử lý lỗi: Kiểm tra xem lỗi có thể phục hồi hay không
		st, ok := status.FromError(err)
		if ok && (st.Code() == codes.Unavailable || // Server không khả dụng
			st.Code() == codes.DeadlineExceeded || // Timeout trong quá trình Dial
			st.Code() == codes.Internal ||       // Lỗi nội bộ của server/proxy
			st.Code() == codes.Canceled) {         // Context bị hủy trong quá trình dial
			
			log.Printf("Failed to connect with recoverable error: %v. Retrying in %v...", st.Message(), initRetryDelay)
			time.Sleep(initRetryDelay)
			// (Optional) Tăng thời gian chờ thử lại theo cấp số nhân (exponential backoff)
			// initRetryDelay *= 2
			continue // Thử lại
		} else {
			// Lỗi không thể phục hồi, hoặc không phải lỗi kết nối tạm thời
			log.Fatalf("Failed to initialize gRPC connection after %d retries. Unrecoverable error: %v", i+1, err)
		}
	}

	// Nếu thoát khỏi vòng lặp mà không kết nối được
	log.Fatalf("Failed to initialize gRPC connection after %d retries. Please check server status and network.", maxInitRetries)
}

// Optionally, add a function to close the connection when your app shuts down
func Close() {
	if pb_conn != nil {
		pb_conn.Close()
	}
}

// CallExtractPDF calls the Extract method and returns the result JSON.
func CallExtractPDF(pdfBucketName string) (string, error) {
	if pb_conn == nil {
		log.Fatal("pb_conn is not initialized")
	}

	// Ensure only one OCR request at a time per agent (by ip)
	if AgentIsExtracting {
		return "", fmt.Errorf("OCR resource is currently in use for this agent")
	}

	AgentIsExtracting = true
	defer func() {
		AgentIsExtracting = false
	}()

	pb_Client = NewExtractPdfServiceClient(pb_conn)
	req := &ExtractPdfRequest{
		GcsPdfBucketName: pdfBucketName,
	}
	ctx, cancel := context.WithTimeout(context.Background(), time.Hour)
	defer cancel()

	resp, err := pb_Client.Extract(ctx, req)
	if err != nil {
		return "", err
	}
	return resp.GetResultJson(), nil
}

// CallChunkAndEmbed calls the ChunkAndEmbed method and returns the result JSON.
func CallChunkAndEmbed(text string) (string, error) {
	if pb_conn == nil {
		log.Fatal("pb_conn is not initialized")
	}
	client := NewMbertChunkingServiceClient(pb_conn)
	req := &MbertChunkingRequest{
		Text: text,
	}
	ctx, cancel := context.WithTimeout(context.Background(), time.Hour)
	defer cancel()

	resp, err := client.ChunkAndEmbed(ctx, req)
	if err != nil {
		return "", err
	}
	return resp.GetResultJson(), nil
}

// CallRagQuery calls the Query method of RagService and returns the response.
func CallRagQuery(query string) (*RagResponse, error) {
	if pb_conn == nil {
		log.Fatal("pb_conn is not initialized")
	}
	client := NewRagServiceClient(pb_conn)
	req := &RagRequest{
		Query: query,
	}
	ctx, cancel := context.WithTimeout(context.Background(), time.Hour)
	defer cancel()

	resp, err := client.Query(ctx, req)
	if err != nil {
		return nil, err
	}
	return resp, nil
}

// CallRagQueryWithDeviceID calls the Query method of RagServiceWithDeviceID and returns the response.
func CallRagQueryWithDeviceID(query string, deviceID int32) (*RagResponse, error) {
    if pb_conn == nil {
        log.Fatal("pb_conn is not initialized")
    }
    client := NewRagServiceWithDeviceIDClient(pb_conn)
    req := &RagWithDeviceIDRequest{
        Query:    query,
        DeviceId: deviceID,
    }
    ctx, cancel := context.WithTimeout(context.Background(), time.Hour)
    defer cancel()

    resp, err := client.Query(ctx, req)
    if err != nil {
        return nil, err
    }
    return resp, nil
}

// CallSummarizeQuery calls the Summarize method of SummarizeQueryService and returns the summary.
func CallSummarizeQuery(query string) (string, error) {
    if pb_conn == nil {
        log.Fatal("pb_conn is not initialized")
    }
    client := NewSummarizeQueryServiceClient(pb_conn)
    req := &SummarizeRequest{
        Query: query,
    }
    ctx, cancel := context.WithTimeout(context.Background(), time.Hour)
    defer cancel()

    resp, err := client.Summarize(ctx, req)
    if err != nil {
        return "", err
    }
    return resp.GetSummary(), nil
}