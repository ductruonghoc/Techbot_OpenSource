# Use a base image that has both Go and Python installed
FROM golang:1.23 AS go_builder

# Install Go dependencies for api_gateway
WORKDIR /app/api_gateway
COPY api_gateway/go.mod api_gateway/go.sum ./
RUN go mod tidy

# Use a Python base image for the AI service
FROM python:3.9-slim-bullseye AS python_builder

# Install Python dependencies for ai_service
WORKDIR /app/ai_service
COPY ai_service/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Use a Node.js base image for the frontend
FROM node:16 AS node_builder

# Install Node.js dependencies for client_interfere
WORKDIR /app/client_interfere
COPY client_interfere/package.json client_interfere/package-lock.json ./
RUN npm install --force

# Final stage to combine everything
FROM node:16

# Copy the built Go binary from the go_builder stage
WORKDIR /app/api_gateway
COPY --from=go_builder /app/api_gateway .

# Copy the Python dependencies and files from the python_builder stage
WORKDIR /app/ai_service
COPY --from=python_builder /app/ai_service .

# Copy the Node.js dependencies and files from the node_builder stage
WORKDIR /app/client_interfere
COPY --from=node_builder /app/client_interfere .

EXPOSE 3000

# Command to run the frontend
CMD ["npm", "run", "dev"]