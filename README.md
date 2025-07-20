# Techbot Open Source

## HƯỚNG DẪN CÀI ĐẶT

1. **Cài đặt Docker**
   - Tải và cài đặt Docker Desktop từ: https://www.docker.com/products/docker-desktop
   - Kiểm tra Docker đã hoạt động:
     ```bash
     docker --version
     ```

2. **Cài đặt Docker Compose**
   - Docker Compose thường được tích hợp sẵn trong Docker Desktop. Để kiểm tra, chạy lệnh:
     ```bash
     docker-compose --version
     ```
   - Nếu Docker Compose chưa được cài đặt, tải và cài đặt từ: https://docs.docker.com/compose/install/
   - Kiểm tra lại phiên bản Docker Compose:
     ```bash
     docker-compose --version
     ```

3. **Cài đặt Node.js**
   - Tải và cài đặt Node.js từ: https://nodejs.org/
   - Kiểm tra phiên bản Node.js và npm:
     ```bash
     node --version
     npm --version
     ```

4. **Cài đặt Python**
   - Tải và cài đặt Python từ: https://www.python.org/
   - Đảm bảo chọn tùy chọn "Add Python to PATH" khi cài đặt.
   - Kiểm tra phiên bản Python và pip:
     ```bash
     python --version
     pip --version
     ```

5. **Cài đặt Go**
   - Tải và cài đặt Go từ: https://go.dev/dl/
   - Kiểm tra phiên bản Go:
     ```bash
     go version
     ```

6. **Cài đặt Git**
   - Tải và cài đặt Git từ: https://git-scm.com/
   - Kiểm tra phiên bản Git:
     ```bash
     git --version
     ```

Nếu gặp lỗi, hãy kiểm tra lại các bước hoặc liên hệ với nhóm phát triển để được hỗ trợ, xin cám ơn.

---

## HƯỚNG DẪN SỬ DỤNG / DEPLOY VỚI DOCKER COMPOSE

1. **Yêu cầu hệ thống**
   - Đã cài đặt Docker và Docker Compose trên máy. Nếu chưa, tham khảo hướng dẫn cài đặt tại phần trên.

2. **Tạo file .env**
   - Trước khi chạy dự án, hãy tạo file [.env](http://_vscodecontentref_/1) trong thư mục gốc dự án dựa trên file mẫu [.env.sample](http://_vscodecontentref_/2).
   - Ví dụ:
     ```bash
     cp .env.sample .env
     ```
   - Sau đó, chỉnh sửa file [.env](http://_vscodecontentref_/3) và điền các thông tin cần thiết (như mật khẩu, khóa API, thông tin cơ sở dữ liệu, v.v.).

3. **Clone mã nguồn**
   - Clone dự án từ GitHub:
     ```bash
     git clone https://github.com/ductruonghoc/Techbot_OpenSource.git
     cd techbot
     ```

4. **Chạy các dịch vụ bằng Docker Compose**
   - Sử dụng lệnh sau để xây dựng và chạy tất cả các container:
     ```bash
     docker-compose up --build
     ```

5. **Truy cập các dịch vụ**
   - **Frontend**: Mở trình duyệt và truy cập vào địa chỉ:
     ```
     http://localhost:8080
     ```
   - **API Gateway**: Truy cập API Gateway tại:
     ```
     http://localhost:8081
     ```
   - **AI Service**: AI Service hoạt động trên cổng 8082 (gRPC).

6. **Kiểm tra logs**
   - Nếu cần kiểm tra logs của các container, sử dụng lệnh:
     ```bash
     docker-compose logs -f
     ```

7. **Dừng các container**
   - Để dừng tất cả các container đang chạy, sử dụng lệnh:
     ```bash
     docker-compose down
     ```

8. **Xóa container và image (nếu cần)**
   - Nếu cần xóa toàn bộ container và image, sử dụng lệnh:
     ```bash
     docker-compose down --rmi all
     ```

Nếu gặp lỗi trong quá trình sử dụng, hãy kiểm tra lại các bước hoặc liên hệ với nhóm phát triển để được hỗ trợ, xin cám ơn.