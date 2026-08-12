# Asynchronous Kafka Workers Guide

## Overview
Foundry uses dedicated event-driven workers to process background workflows asynchronously. Each worker belongs to a designated Kafka Consumer Group and listens to specific topics.

---

## Worker Specifications

### 1. Dual-Stage Web Scraper Worker (`backend/workers/scraper_worker.py`)
- **Consumer Group**: `scraper-worker-group`
- **Topics Consumed**: `startup.scrape_requested`, `startup.approved`
- **Topics Published**: `startup.scraped`
- **DLQ Topic**: `scraping.failed`
- **Responsibilities**:
  1. Consumes scrape request events.
  2. **Stage 1 (DDGS)**: Executes free DuckDuckGo search queries for top 10 market results.
  3. **Stage 2 (Playwright)**: Concurrently opens top 10 URLs across parallel headless Chromium tabs with resource aborts (`.png`, `.jpg`, `.css`, `.woff`) and 8-second hard timeouts.
  4. Aggregates direct and indirect competitors found across search results and domain databases.
  5. Publishes consolidated market intelligence payload to `startup.scraped`.
- **Command**:
  ```bash
  python workers/scraper_worker.py
  ```

---

### 2. Multi-Parameter AI Scoring Worker (`backend/workers/ai_scoring_worker.py` / `ai_scorer_worker.py`)
- **Consumer Group**: `ai-scorer-worker-group`
- **Topics Consumed**: `startup.scraped`, `startup.approved`, `startup.scrape_requested`, `startup.score_requested`
- **Topics Published**: `startup.scored`
- **DLQ Topic**: `scraping.failed`
- **Responsibilities**:
  1. Consumes `startup.scraped` events containing rich market intelligence.
  2. Aggregates founder pitch inputs, financial traction metrics, and live team profiles (`StartupMember` + `User`).
  3. Evaluates the deal using the local Ollama `qwen2.5:7b` model across the 4-category 100-point weighted VC rubric (Problem-Market Fit 30 pts, Competitive Moat 25 pts, Market Opportunity 20 pts, Execution Viability 25 pts).
  4. Persists `ai_score`, `ai_verdict`, `ai_score_breakdown`, and `market_radar_data` to PostgreSQL.
  5. Emits `startup.scored` event.
- **Command**:
  ```bash
  python workers/ai_scoring_worker.py
  ```

---

### 2. Notification Worker (`backend/workers/notification_worker.py`)
- **Consumer Group**: `notification-worker-group`
- **Topics Consumed**: `notification.email`, `notification.push`, `startup.approved`, `startup.rejected`, `user.registered`, `message.sent`
- **DLQ Topic**: `notification.failed`
- **Responsibilities**:
  1. Handles email and push notification dispatches.
  2. Formats transactional email templates for approvals, rejections, welcome emails, and chat messages.
- **Command**:
  ```bash
  python workers/notification_worker.py
  ```

---

### 3. Matching Pipeline Worker (`backend/workers/matching_worker.py`)
- **Consumer Group**: `matching-worker-group`
- **Topics Consumed**: `startup.scored`, `startup.approved`, `investor.updated`, `investor.registered`
- **Topics Published**: `investor.matched`
- **DLQ Topic**: `matching.failed`
- **Responsibilities**:
  1. Calculates domain overlap and investment criteria vectors between startups and investors.
  2. Emits `investor.matched` events for downstream push notifications.
- **Command**:
  ```bash
  python workers/matching_worker.py
  ```

---

### 4. Search Indexer Worker (`backend/workers/search_indexer_worker.py`)
- **Consumer Group**: `search-indexer-worker-group`
- **Topics Consumed**: `startup.created`, `startup.updated`, `startup.approved`, `startup.deleted`, `search.index`, `cache.invalidate`
- **Responsibilities**:
  1. Updates search indices when startup status changes.
  2. Invalidates stale catalog and feed cache keys.
- **Command**:
  ```bash
  python workers/search_indexer_worker.py
  ```

---

### 5. Audit Logger Worker (`backend/workers/audit_worker.py`)
- **Consumer Group**: `audit-worker-group`
- **Topics Consumed**: `audit.logs`, `startup.approved`, `startup.rejected`
- **DLQ Topic**: `audit.failed`
- **Responsibilities**:
  1. Persists administrative decision records in PostgreSQL (`AdminAction` table).
- **Command**:
  ```bash
  python workers/audit_worker.py
  ```
