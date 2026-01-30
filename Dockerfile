# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package.json frontend/package-lock.json ./

# Install dependencies
RUN npm ci

# Copy frontend source code
COPY frontend/ ./

# Build frontend
RUN npm run build

# Stage 2: Setup Backend
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
# libmagic1 is required for python-magic
RUN apt-get update && apt-get install -y \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY backend/requirements.txt ./backend/

# Install Python dependencies
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend source code
COPY backend/ ./backend/

# Copy built frontend assets from stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Set environment variables
ENV PERFORMANCE_MANAGER_DATA_DIR=/data
ENV FLASK_APP=backend/app.py

# Create data directory
RUN mkdir -p /data

# Expose port
EXPOSE 5000

# Run the application
CMD ["python", "backend/app.py", "--host", "0.0.0.0"]
