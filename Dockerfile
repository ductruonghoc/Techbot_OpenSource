# Use a Node.js base image for the frontend
FROM node:20-alpine AS node_builder

# Set the working directory
WORKDIR /app

# Copy the client_interfere directory into the container
COPY client_interfere/ .

# Install Node.js dependencies
RUN npm install --force

# Final stage to combine everything
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy the built files from the node_builder stage
COPY --from=node_builder /app .

# Expose port 3000 internally
EXPOSE 3000

# Command to run the frontend
CMD ["npm", "run", "dev"]