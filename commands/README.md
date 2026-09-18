# 🛠️ Startup Foundry - System Execution & Docker Commands Guide

This directory contains execution guides, terminal command references, and script shortcuts for running the Startup Foundry ecosystem via **Docker Compose** or **Local Development**.

---

## 📌 Table of Contents
1. [⚡ One-Line Docker Commands](#1-one-line-docker-commands)
2. [🏗️ Individual Service Commands](#2-individual-service-commands)
3. [🗄️ Database Migrations Inside Container](#3-database-migrations-inside-container)
4. [⚙️ Running Background Workers](#4-running-background-workers)
5. [🖥️ Local Development (Non-Docker)](#5-local-development-non-docker)
6. [🔍 Health Checks & Troubleshooting](#6-health-checks--troubleshooting)

---

## 1. ⚡ One-Line Docker Commands

### Start All Services (PostgreSQL + Kafka + FastAPI + Outbox Worker + AI Worker + Next.js)
```bash
# From the project root directory:
docker-compose up --build -d
```

### Stop All Running Containers
```bash
docker-compose down
```

### View Live Aggregated Logs
```bash
docker-compose logs -f
```

---

## 2. 🏗️ Individual Service Commands

### Build & Start Infrastructure Only (PostgreSQL & Kafka)
```bash
docker-compose up -d postgres kafka
```

### Build & Start Backend API Only
```bash
docker-compose up --build -d backend
```

### Build & Start Frontend Only
```bash
docker-compose up --build -d frontend
```

---

## 3. 🗄️ Database Migrations Inside Container

### Run Alembic Database Migrations Inside `foundry_backend`
```bash
docker exec -it foundry_backend alembic upgrade head
```

### Reset / Seed Database inside Container
```bash
docker exec -it foundry_backend python reset_db.py
```

### Access PostgreSQL Interactive CLI (psql)
```bash
docker exec -it foundry_postgres psql -U postgres -d startup-foundary
```

---

## 4. ⚙️ Running Background Workers

### Start Outbox Relay Worker (Container)
```bash
docker exec -it foundry_backend python workers/outbox_worker.py
```

### Start AI Valuation Scoring Worker (Container)
```bash
docker exec -it foundry_backend python workers/ai_scoring_worker.py
```

### Start Scraper Worker (Container)
```bash
docker exec -it foundry_backend python workers/scraper_worker.py
```

### Start Investor Matchmaker Worker (Container)
```bash
docker exec -it foundry_backend python workers/matching_worker.py
```

---

## 5. 🖥️ Local Development (Non-Docker)

### Step 1: Start Postgres & Kafka Infrastructure
```bash
docker-compose up -d postgres kafka
```

### Step 2: Start Backend Server
```bash
cd backend
# Windows:
.\venv\Scripts\activate
# Linux / macOS:
source venv/bin/activate

pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload --port 8000
```

### Step 3: Start Frontend Server
```bash
cd frontend
npm install
npm run dev
```

---

## 6. 🔍 Health Checks & Troubleshooting

### Check Container Status & Ports
```bash
docker ps
```

### Check Specific Container Logs
```bash
# View backend logs:
docker logs -f foundry_backend

# View frontend logs:
docker logs -f foundry_frontend

# View Kafka logs:
docker logs -f foundry_kafka
```

### Verify Endpoints
- **FastAPI Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Next.js Web Portal**: [http://localhost:3000](http://localhost:3000)
- **PostgreSQL Database**: `localhost:5432` (`user: postgres`, `pass: postgre`, `db: startup-foundary`)
- **Kafka Bootstrap Server**: `localhost:9092`
