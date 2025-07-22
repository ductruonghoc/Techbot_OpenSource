# Use the official Golang image as a build stage
FROM golang:1.23 AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy go.mod and go.sum files
COPY go.mod go.sum ./

COPY gcs.json ./gcs.json

# Download the dependencies
RUN go mod download

# Copy the entire project
COPY . .

# Build the Go application
RUN go build -o main .

# Use a smaller base image for the final stage
FROM gcr.io/distroless/base

# Copy the binary from the builder stage
COPY --from=builder /app/main .

# Expose the port the app runs on
EXPOSE 8080

# Command to run the executable
CMD ["./main"]