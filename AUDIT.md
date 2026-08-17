# Full Codebase Audit & Discrepancy Log

## Executive Summary
This document tracks all identified bugs, frontend/backend discrepancies, schema mismatches, auth pipeline vulnerabilities, and stub/incomplete features across the Foundry platform.

---

## 1. 🔄 Frontend ↔ Backend Discrepancies
| Bug ID | Component / File | Description | Impact | Status |
|--------|------------------|-------------|--------|--------|
| DIS-01 | `frontend/lib/auth.js` | Import statement used `./serverApi` (lowercase 'a') while target file was `serverAPI.js`. | Fails module resolution on case-sensitive OS/CI. | **Resolved (Phase 2)** |
| DIS-02 | `frontend/features/auth/authSlice.js` vs `backend/routers/auth.py` | Redux auth state stored only `uid` (Firebase string), missing Postgres UUID `id`. | `MessageThread.jsx` `isMine` comparison failed. | **Resolved (Phase 2)** |
| DIS-03 | `backend/schemas.py` | `UserResponse` missing `is_approved`, `bio`, `linkedin_url`. | `/auth/me` stripped bio, linkedin, and approval status. | **Resolved (Phase 1)** |
| DIS-04 | `frontend/app/feed/page.jsx` | Page content rendered without `<Layout sidebar={...} />`. | Navigation sidebar missing when visiting `/feed`. | **Resolved (Phase 3)** |
| DIS-05 | `frontend/app/founder/startups/page.jsx` | "Manage Team" button linked to `/founder/startups/${id}` without team anchor. | No team section targeting. | **Resolved (Phase 3)** |

---

## 2. 🗄 Database & Schema Mismatches
| Bug ID | Component / File | Description | Impact | Status |
|--------|------------------|-------------|--------|--------|
| SCH-01 | `backend/schemas.py` | Central schema file missing response schemas. Routers used inline models/dict serializers. | Unstructured response models & incomplete OpenAPI docs. | **Resolved (Phase 1)** |
| SCH-02 | `backend/models.py` | `Startup` model missing `pitch_deck_url` column. | Investor UI referenced pitch deck but no DB field/upload existed. | **Resolved (Phase 1 & 3)** |
| SCH-03 | `backend/routers/feed.py` | `serialize_post` and `serialize_reply` did not fetch author `name` or `role`. | Community posts and replies displayed anonymously. | **Resolved (Phase 1 & 3)** |
| SCH-04 | `backend/routers/startup.py` | `serialize_startup` did not include `team_members`. | Founder and investor startup details could not list co-founders. | **Resolved (Phase 1 & 3)** |
| SCH-05 | `backend/routers/startup.py` | Startup creation with `co_founder_emails` silently ignores emails of users not yet registered; editable and dynamically linked via edit endpoint. | Graceful co-founder linking without startup creation failure. | **Resolved** |
| SCH-06 | `backend/routers/messages.py` | `Conversation` model stores single `founder_id`. Co-founders (`role="cofounder"`) locked out of messages. | Co-founders cannot read/send investor messages. | Pending |
| SCH-07 | `backend/models.py` & `schemas.py` | Add `approval_status`, `has_pending_update`, `pending_data`, financial traction, and AI scoring columns. | Enables revision pipeline and AI Deal Evaluator scorecards. | **Resolved** |
| SCH-08 | `backend/models.py` & PostgreSQL DB | `startups` table missing `ai_evaluation_status` column causing 500 errors on `/startups/me` and `/conversations`; duplicate `StartupMember` model class. | Applied Alembic migration `7a8e9d1c2b3a`, removed duplicate model, created standalone sync script `sync_db_schema.py`. | **Resolved (Phase 17)** |
| KAF-01 | `backend/kafka/consumer.py` | Fresh Kafka broker throws `UnknownTopicOrPartitionError` when workers boot up before topics exist. | Integrated `AIOKafkaAdminClient` with `NewTopic` auto-creation and concurrency collision resilience in `ensure_topics_exist`. | **Resolved (Phase 17)** |
| FE-01  | `frontend/lib/api.js` & `RootLayout` | Unhandled API 4xx/5xx errors required duplicate local try/catch logic without uniform user notifications. | Integrated `react-hot-toast` `<ToastProvider />` and Axios error response interceptor for global toast alerts. | **Resolved (Phase 17)** |

---

## 3. 🔐 Authentication & Middleware Pipeline
| Bug ID | Component / File | Description | Impact | Status |
|--------|------------------|-------------|--------|--------|
| AUT-01 | `frontend/proxy.js` | Next.js 16 deprecated `middleware.js` in favor of `proxy.js`. Presence of both caused unhandled rejection error. | Consolidated full route protection in `frontend/proxy.js` and removed `middleware.js`. | **Resolved** |
| AUT-02 | `frontend/app/investor/dashboard/page.jsx` | HTTP 403 Forbidden (for unapproved investors) crashed SSR. | Unapproved investors received broken error state instead of approval banner. | **Resolved (Phase 2)** |
| AUT-03 | `frontend/middleware.js` & `backend/.env` | `JWT_SECRET_KEY` alignment across `.env` and `.env.local`. | Token validation failure if keys mismatch. | **Resolved (Phase 2)** |
| AUT-04 | `frontend/proxy.js` & `backend/routers/auth.py` | Add public route exception for `/admin/login` and dedicated `POST /auth/admin-login` endpoint. | Enables dedicated system admin authentication. | **Resolved** |
| AUT-05 | `frontend/app/admin/layout.jsx` | `AdminLayout` checked `currentUser.role !== "admin"` and rendered `"Admin access required."` for all `/admin/*` sub-routes, breaking `/admin/login`. | Updated `AdminLayout` to pass through un-layouted children for `/admin/login`. | **Resolved** |
| AUT-06 | `frontend/lib/api.js` | Axios interceptor bypassed toasts for silent 401 token refresh endpoints (`/auth/refresh`, `/auth/me`). | Prevents spamming users with auth error toasts during background session checks. | **Resolved (Phase 17)** |

---

## 4. 🚧 Incomplete Features & Stubs
| Bug ID | Component / File | Description | Status |
|--------|------------------|-------------|--------|
| STU-01 | `frontend/features/auth/authAPI.js` | 0-byte empty file. | **Resolved (Phase 3)** |
| STU-02 | `frontend/app/page.js` | Unstyled placeholder returning `<div>Home Page</div>`. | **Resolved (Phase 3)** |
| STU-03 | `backend/routers/startup.py` | Missing pitch deck upload endpoint (`POST /startups/pitch-deck-upload`). | **Resolved (Phase 3)** |
| STU-04 | `backend/routers/admin.py` | Automated AI Investment Scoring Engine (`compute_ai_score`) and pending edit merge on approval. | **Resolved** |
| STU-05 | `frontend/app/admin/login/page.jsx` | Dedicated Admin Login Page UI component with credentials form & Redux auth state dispatching. | **Resolved** |
| STU-06 | `backend/services/scraper.py` & `admin.py` | Live market intelligence web scraping engine integrated into AI Deal Scoring. | **Resolved** |
| STU-07 | `backend/routers/auth.py` & `frontend/lib/api.js` | Automated background session token refresh (`POST /auth/refresh`) interceptor. | **Resolved** |
| STU-08 | `backend/database.py` | PostgreSQL database connection pool parameters (`pool_pre_ping=True`, `pool_recycle=3600`) for Uvicorn stability. | **Resolved** |
| STU-09 | `backend/models.py` & `schemas.py` | `StartupMember` join table model & `StartupMemberCreate` / `TeamMemberResponse` schemas with custom role assignment. | **Resolved** |
| STU-10 | `backend/routers/users.py` & Frontend | Teammate user search API (`GET /users/search`) & rich team member profile cards with LinkedIn links. | **Resolved** |
| STU-11 | `backend/kafka/admin.py` & `frontend/components/ToastProvider.jsx` | Dynamic Kafka topic auto-creation and global client toast notification provider. | **Resolved (Phase 17)** |
