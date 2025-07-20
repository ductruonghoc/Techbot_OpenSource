# Use a base image that has both Go and Python installed
FROM golang:1.23 AS go_builder
FROM python:3.9-slim-bullseye AS python_builder
FROM node:16 AS node_builder

# Load environment variables from .env file
RUN test -f .env && cp .env .env || echo ".env file not found, skipping"

# Install Go dependencies for api_gateway
WORKDIR /app/api_gateway
COPY api_gateway/go.mod api_gateway/go.sum ./
RUN go mod tidy

# Install Python dependencies for ai_service
WORKDIR /app/ai_service
COPY ai_service/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Install Node.js dependencies for client_interfere
WORKDIR /app/client_interfere
COPY client_interfere/package.json client_interfere/package-lock.json ./
RUN npm install

# Build and run the Docker containers for the backends
WORKDIR /app/api_gateway
RUN docker build -t api_gateway -f Dockerfile .
WORKDIR /app/ai_service
RUN docker build -t ai_service -f Dockerfile .

# Build and run the frontend
WORKDIR /app/client_interfere
RUN npm run build
CMD ["npm", "run", "dev"]