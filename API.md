# Foundry API & Event Emissions Specification

## Overview
This document specifies all synchronous REST API endpoints and their corresponding asynchronous Kafka event emissions.

---

## 🔐 Auth Endpoints (`/auth`)

### `POST /auth/google`
- **Description**: Verifies Firebase ID Token and issues HTTP-Only session cookie.
- **Kafka Event Emitted**: `user.registered` (if new account)

### `POST /auth/set-role`
- **Description**: Assigns user role (`founder` or `investor`).
- **Kafka Event Emitted**: `user.registered` / `investor.registered`

### `POST /auth/admin-login`
- **Description**: Authenticates system admin credentials.

---

## 🏢 Startup Endpoints (`/startups`)

### `POST /startups`
- **Role Required**: `founder`
- **Description**: Submits new startup profile.
- **Kafka Event Emitted**: `startup.created`

### `PUT /startups/{id}`
- **Role Required**: `founder` (Member)
- **Description**: Updates startup profile details (enters pending queue if startup is approved).
- **Kafka Event Emitted**: `startup.updated`

### `POST /startups/{id}/save`
- **Role Required**: `investor` (Approved)
- **Description**: Bookmarks a startup.
- **Kafka Event Emitted**: `startup.saved`

### `DELETE /startups/{id}/save`
- **Role Required**: `investor` (Approved)
- **Description**: Removes startup bookmark.
- **Kafka Event Emitted**: `startup.unsaved`

---

## 👑 Admin Endpoints (`/admin`)

### `POST /admin/users/{user_id}/approve`
- **Role Required**: `admin`
- **Description**: Approves user registration.
- **Kafka Events Emitted**: `audit.logs`, `notification.email`

### `POST /admin/users/{user_id}/reject`
- **Role Required**: `admin`
- **Description**: Rejects user registration.
- **Kafka Events Emitted**: `audit.logs`

### `POST /admin/startups/{startup_id}/approve`
- **Role Required**: `admin`
- **Description**: Approves startup profile and triggers web scraping + AI deal scoring pipeline.
- **Kafka Events Emitted**: `startup.approved`, `startup.scrape_requested`, `audit.logs`

### `POST /admin/startups/{startup_id}/reject`
- **Role Required**: `admin`
- **Description**: Rejects startup submission.
- **Kafka Events Emitted**: `startup.rejected`, `audit.logs`

---

## 💬 Messaging & Feed Endpoints (`/feed`, `/messages`)

### `POST /feed`
- **Description**: Creates community forum post.
- **Kafka Event Emitted**: `feed.post_created`

### `POST /feed/{post_id}/reply`
- **Description**: Adds reply to community post.
- **Kafka Event Emitted**: `feed.reply_created`

### `POST /messages/{conversation_id}/messages`
- **Description**: Sends direct message in founder-investor conversation thread.
- **Kafka Event Emitted**: `message.sent`

---

## ⚙️ Asynchronous Event Workers & Pipelines

### `Scraper Worker` (`backend/workers/scraper_worker.py`)
- **Topics Consumed**: `startup.scrape_requested`, `startup.approved`
- **Kafka Event Emitted**: `startup.scraped` (contains `search_query_used`, `top_sites_scraped`, `competitors_found`)

### `AI Scoring Worker` (`backend/workers/ai_scoring_worker.py`)
- **Topics Consumed**: `startup.scraped`, `startup.approved`, `startup.score_requested`
- **Kafka Event Emitted**: `startup.scored` (contains `ai_score`, `ai_verdict`, `category_scores`, `market_radar`)

### `Matching Worker` (`backend/workers/matching_worker.py`)
- **Topics Consumed**: `startup.scored`, `startup.approved`, `investor.updated`
- **Kafka Event Emitted**: `investor.matched`
