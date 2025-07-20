# Use a Node.js base image for the frontend
FROM node:20-alpine AS node_builder

# Install Node.js dependencies for client_interfere
WORKDIR /app/client_interfere
COPY client_interfere/package.json client_interfere/package-lock.json ./
RUN npm install --force

# Final stage to combine everything
FROM node:20-alpine

# Copy the Node.js dependencies and files from the node_builder stage
WORKDIR /app/client_interfere
COPY --from=node_builder /app/client_interfere .

# Expose port 3000 internally
EXPOSE 3000

# Command to run the frontend
CMD ["npm", "run", "dev"]