# DATN_08_2024_Back-end
 Master: Lê Minh Đức

## **👑 Master: Lê Minh Đức**  

This project follows a structured organization to ensure **maintainability, scalability, and readability**. Below is a breakdown of the directory structure and its purpose.  

---

## **📂 Directory Structure**  

### **1️⃣ `./controllers` – Logic Handlers**  
Contains all **handlers** responsible for processing logic.  
- Handlers that belong to the **same group** are placed in the same controller file.  

---

### **2️⃣ `./models` – Database Layer**  
- Establishes **database connections**.  
- Maps **Go structs** to database **tables**.  

---

### **3️⃣ `./routes` – API Routes**  
Defines **routing** and maps requests to their corresponding **handlers**.  
- `route.go` → Defines **global routes**.  
- Other files → Define **routes for specific groups**.  

---

### **4️⃣ `./middlewares` – Middleware Processing**  
Contains **middleware functions** that perform **pre-processing** before requests reach the handlers.  

---

### **5️⃣ `./config` – Configuration Files**  
Stores necessary **configuration files** required for **deployment and setup**.  

---

## **📜 Important Files**  

### **`go.mod` – Module & Dependencies**  
- Declares **project dependencies**.  
- Managed using terminal commands like:  
  ```sh
  go mod tidy

### **`go.sum` - Dependencies checksum (Do not reach)**


### **`main.go` - Only application entry point**

## **Set up**
### **Install Go**
Ensure you have Go 1.20+ installed: https://golang.org/dl/

### **Install Dependencies**
go mod tidy

### **Environment Setup**
Copy or create a .env file in the root directory for environment variables (not tracked by git).
Place your Google Cloud service account JSON in bin/ (e.g., extract-pdf-459510-78787998ac82.json).

### **Database Setup**
Configure your database connection in the .env file.
Run migrations if needed (see models/device_migration.go and models/user_migration.go).

### Run the Application
go run [main.go](http://_vscodecontentref_/0)

## Common Development Tasks
Run Unit Tests
go test ./...
Add a New API Route
1. Create a handler in controllers/.
2. Register the route in routes/.
Add a New Model
1. Define the struct in models/.
2. Add migration logic if needed.

## Useful Links
Go Documentation
Gin Web Framework
GORM ORM
Google Cloud Go SDK

## Notes
Do not commit sensitive files (e.g., .env, service account JSON).
Follow the directory structure for maintainability.
For gRPC changes, regenerate code in pb/ using:
```protoc --go_out=pb --go-grpc_out=pb grpc.proto```
Happy coding! 🚀
