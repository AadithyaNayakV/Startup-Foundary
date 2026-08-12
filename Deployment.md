# Production Deployment & Docker Operations

## Overview
This document outlines production deployment strategies, environment configurations, and Docker containerization guidelines for the Foundry platform.

---

## Environment Variable Reference

### Backend Settings (`backend/.env`)

```ini
# Database Connection
DATABASE_URL=postgresql://postgres:postgre@postgres:5432/startup-foundary

# Kafka Event Backbone
KAFKA_BOOTSTRAP_SERVERS=kafka:9092
KAFKA_CLIENT_ID=foundry-backend
KAFKA_CONSUMER_GROUP_PREFIX=foundry-group

# Authentication & Security
JWT_SECRET_KEY=Rzi2GWsSNEZbUSJywszuh-_5g3FFgeaT96tYqqCC0BI
FIREBASE_CREDENTIALS=startup-foundary-firebase-adminsdk-fbsvc-bfee4ca3f8.json

# Environment
ENVIRONMENT=production
FRONTEND_URL=https://foundry.example.com

# System Admin Initialization
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

---

## Docker Compose Production Orchestration

The `backend/docker-compose.yml` launches the complete backend microservice stack:

```bash
# Start all containers in detached mode
docker-compose up -d --build

# View real-time logs for backend and workers
docker-compose logs -f backend ai-scorer-worker

# Stop all containers
docker-compose down
```

---

## Individual Container Roles

| Service | Container Name | Description |
|---|---|---|
| `postgres` | `foundry_postgres` | PostgreSQL 15 database instance |
| `kafka` | `foundry_kafka` | Bitnami Kafka 3.7 running in Zookeeper-less KRaft mode |
| `backend` | `foundry_backend` | FastAPI REST API web server (`uvicorn`) |
| `scraper-worker` | `foundry_scraper_worker` | Event worker for dual-stage web scraping (`ddgs` + Playwright) |
| `ai-scorer-worker` | `foundry_ai_scorer_worker` | Event worker for 100-pt VC rubric deal scoring (`qwen2.5:7b`) |
| `notification-worker` | `foundry_notification_worker` | Event worker for email & push notification dispatch |
| `matching-worker` | `foundry_matching_worker` | Event worker for investor-startup matching |
| `search-indexer-worker` | `foundry_search_indexer_worker` | Event worker for search index updates & cache invalidation |
| `audit-worker` | `foundry_audit_worker` | Event worker for compliance audit log persistence |

---

## Monitoring & Health Checks

- **FastAPI Healthcheck**: `GET /health` returns database and Kafka producer connectivity status.
- **Kafka Topic Inspection**:
  ```bash
  docker exec -it foundry_kafka kafka-topics.sh --bootstrap-server localhost:9092 --list
  ```
- **Consuming Events from CLI**:
  ```bash
  docker exec -it foundry_kafka kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic startup.approved --from-beginning
  ```
