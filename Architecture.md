# System Architecture & Event-Driven Design

## Overview
The Foundry Platform is designed as an asynchronous, event-driven microservice architecture with FastAPI handling HTTP REST requests, PostgreSQL managing system state, and Apache Kafka handling distributed message streaming and background task coordination.

---

## System Architecture Diagram

```mermaid
flowchart TB
    subgraph ClientLayer[Frontend & Clients]
        Web[Next.js 16 Web App]
    end

    subgraph APILayer[API Gateway / Microservice]
        FastAPI[FastAPI Backend Server]
    end

    subgraph EventLayer[Kafka Event Bus]
        Kafka[Apache Kafka Broker]
    end

    subgraph ProcessingLayer[Asynchronous Workers]
        Scorer[AI Scorer & Scraper Worker]
        Matcher[Investor Matching Worker]
        Notif[Notification Worker]
        Indexer[Search & Cache Worker]
        Audit[Audit Logger Worker]
    end

    subgraph DataLayer[Persistence Storage]
        DB[(PostgreSQL Database)]
    end

    Web <-->|HTTP / Cookie Session| FastAPI
    FastAPI <-->|SQLAlchemy ORM| DB
    FastAPI -->|Publish Events| Kafka
    Kafka -->|Consume Topics| ProcessingLayer
    ProcessingLayer <-->|Read / Write State| DB
```

---

## Detailed Sequence & Flow Diagrams

### 1. Startup Approval, Dual-Stage Scraping & AI Scoring Sequence
```mermaid
sequenceDiagram
    autonumber
    actor Admin as Platform Admin
    participant API as FastAPI Backend
    participant DB as PostgreSQL DB
    participant Kafka as Apache Kafka
    participant Scraper as Scraper Worker (DDGS + Playwright)
    participant Scorer as AI Scoring Worker (qwen2.5:7b)

    Admin->>API: POST /admin/startups/{id}/approve
    API->>DB: Update Startup status = 'approved'
    API->>Kafka: Publish 'startup.approved' & 'startup.scrape_requested'
    API-->>Admin: HTTP 200 OK Response

    Kafka->>Scraper: Consume 'startup.scrape_requested'
    Scraper->>Scraper: Stage 1: DDGS Top-10 Market Search
    Scraper->>Scraper: Stage 2: Parallel Playwright Headless Tab Scraping
    Scraper->>Kafka: Publish 'startup.scraped' (top_sites_scraped, competitors_found)

    Kafka->>Scorer: Consume 'startup.scraped'
    Scorer->>Scorer: Run 100-Pt Weighted VC Rubric via qwen2.5:7b
    Scorer->>DB: Save ai_score, ai_verdict, breakdown, market_radar
    Scorer->>Kafka: Publish 'startup.scored'
```

### 2. Notification Pipeline Flow
```mermaid
sequenceDiagram
    autonumber
    participant Router as API Routers
    participant Kafka as Kafka Broker
    participant NotifWorker as Notification Worker
    participant Provider as Email Provider / Push

    Router->>Kafka: Publish 'notification.email' / 'user.registered'
    Kafka->>NotifWorker: Consume Event
    NotifWorker->>Provider: Send Email / Push Payload
    alt Delivery Success
        NotifWorker->>Kafka: Commit Offset
    else Delivery Failure (After Retries)
        NotifWorker->>Kafka: Forward to 'notification.failed' DLQ
    end
```

### 3. Startup-Investor Matching Pipeline
```mermaid
flowchart TD
    E1[startup.scored Event] --> MatchWorker[Matching Worker]
    E2[investor.updated Event] --> MatchWorker
    MatchWorker --> DBQuery[Query Approved Investors & Startups]
    DBQuery --> Compute[Calculate Match Vectors & Overlap]
    Compute --> EmitMatch[Emit 'investor.matched' Event]
    EmitMatch --> NotifWorker[Notification Worker]
    NotifWorker --> Push[Send Investor Match Digest Alert]
```

---

## Domain Boundaries & Microservices

1. **Authentication & Identity**: Firebase ID token validation, HTTP-Only session creation, system admin authentication.
2. **Startup Management**: Company profile submission, pitch deck storage, review revision pipelines.
3. **AI Deal Evaluation**: Web metadata extraction, financial unit economics scoring, valuation multiple assessment.
4. **Investor Match Engine**: Investment domain preference filtering, match scoring vector generation.
5. **Feed & Discussion**: Community forum posts, threaded discussions, real-time unread state tracking.
6. **Messaging System**: Direct 1-on-1 investor-founder inquiry channels.
7. **Audit & Compliance**: System change audit logging for admin decision transparency.
