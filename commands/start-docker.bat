@echo off
echo ==============================================================================
echo 🚀 Starting Startup Foundry Platform via Docker Compose
echo ==============================================================================
echo.

cd ..
docker-compose up --build -d

echo.
echo ==============================================================================
echo ✅ Startup Foundry Platform Services Launched!
echo.
echo 🖥️ Frontend Web Application:  http://localhost:3000
echo ⚡ FastAPI Backend API:       http://localhost:8000/docs
echo 🗄️ PostgreSQL Database:      localhost:5432 (user: postgres, db: startup-foundary)
echo 📨 Apache Kafka Broker:      localhost:9092
echo ==============================================================================
pause
