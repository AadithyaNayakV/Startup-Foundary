# ==============================================================================
# Startup Foundry Backend Dockerfile
# FastAPI REST Service + Async Workers + Playwright Headless Browser Environment
# ==============================================================================

FROM python:3.10-slim

# Set system environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on

# Install system dependencies required for PostgreSQL, C extensions, and Playwright
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    git \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Set working directory inside container
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Install Playwright Chromium headless browser binaries & OS dependencies
RUN playwright install-deps chromium && \
    playwright install chromium

# Copy backend source code into container
COPY . /app/

# Create uploads directory if not present
RUN mkdir -p /app/uploads

# Expose FastAPI HTTP server port
EXPOSE 8000

# Start FastAPI application server bound to 0.0.0.0
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
