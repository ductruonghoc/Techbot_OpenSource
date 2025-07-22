# Use a slim Python image for smaller size
FROM python:3.9-slim-bullseye

# Install system dependencies (libgl, etc.)
# Combine RUN commands to reduce image layers
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libgl1-mesa-glx \
        libglib2.0-0 \
        build-essential \
        poppler-utils \
        # Add any other missing dependencies if 'weight.pt' is part of a larger model
        # that requires specific libraries not covered by the above.
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file and install dependencies
# Install dependencies before copying application code to leverage Docker layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# --- IMPORTANT: Address 'weight.pt' missing file issue ---
# If 'weight.pt' is a local file, ensure it's copied into the image.
# Replace 'path/to/your/weight.pt' with the actual path on your local machine
# relative to your Dockerfile. If it's downloaded by a script, ensure that script
# is run and the file is placed in a location accessible by your server.py.
# Assuming 'weight.pt' is in the same directory as your Dockerfile:
COPY weight.pt .

# If 'weight.pt' is inside a subdirectory, e.g., 'models/weight.pt':
# COPY models/weight.pt ./models/
# And ensure your application expects it at './models/weight.pt'
COPY gcs.json ./gcs.json
# Copy your protobuf files and generated Python gRPC files
COPY server.proto .
COPY server_pb2.py .
COPY server_pb2_grpc.py .

# Copy your server implementation
COPY server.py .

# Copy the app package (add this line)
COPY app/ app/

# Expose the port your gRPC server listens on (Cloud Run will set this via PORT env var)
# Cloud Run injects the PORT environment variable. Your application should listen on it.
# For gRPC, it's common to listen on 0.0.0.0:PORT.
EXPOSE 50051

# Command to run your gRPC server
# Ensure your server.py is configured to listen on the PORT environment variable
# provided by Cloud Run, typically process.env.PORT in Node.js, or os.environ.get('PORT') in Python.
CMD ["python", "server.py"]
