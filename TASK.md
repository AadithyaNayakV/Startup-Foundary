# Project Task Tracker

## Phase 1: Database & Schema Centralization (COMPLETED)
- [x] Create project docs (`CONTEXT.md`, `AUDIT.md`, `TASK.md`).
- [x] Centralize Pydantic schemas in `backend/schemas.py`:
  - [x] `UserResponse` (with `is_approved`, `bio`, `linkedin_url`)
  - [x] `TeamMemberResponse`
  - [x] `StartupResponse` (with `pitch_deck_url`, `team_members`, `completeness_score`, `missing`, `save_count`, `is_saved`)
  - [x] `PostResponse` & `ReplyResponse` (with `author_name`, `author_role`)
  - [x] `MessageResponse`
  - [x] `ConversationResponse`
  - [x] `AdminQueueResponse` & `AdminActionResponse` & `AdminStatsResponse`
- [x] Update `Startup` DB model in `backend/models.py` to add `pitch_deck_url` column.
- [x] Update `backend/routers/feed.py` (`serialize_post`, `serialize_reply`) to join `User` table and include author `name` and `role`.
- [x] Update `backend/routers/startup.py` (`serialize_startup`) to include `team_members` from `StartupMember` and support `pitch_deck_url`.
- [x] Verify backend imports and router responses.

## Phase 2: Auth Pipeline & Middleware Security (COMPLETED)
- [x] Rename `frontend/proxy.js` to `frontend/middleware.js` for Next.js App Router protection.
- [x] Fix case-sensitivity import in `frontend/lib/auth.js` (`./serverAPI`).
- [x] Include Postgres `id` in Redux auth state (`authSuccess`) and auth endpoints.
- [x] Update `MessageThread.jsx` to stringify Postgres UUID `id` comparison (`isMine`).
- [x] Handle unapproved investor state (HTTP 403) with a dedicated pending approval UI banner on investor dashboard.
- [x] Verify `JWT_SECRET_KEY` alignment between `.env` and `.env.local`.

## Phase 3: Frontend Integration & UI Component Wiring (COMPLETED)
- [x] Wrap `/feed` page and `/feed/[id]` page in `<Layout sidebar={...} />`.
- [x] Display `author_name` and `author_role` in `FeedList.jsx` and `ReplyList.jsx`.
- [x] Render `team_members` and `pitch_deck_url` on founder & investor startup detail pages.
- [x] Add pitch deck URL input and file upload (`/startups/pitch-deck-upload`) in `new/page.jsx` and `edit/page.jsx`.
- [x] Fix "Manage Team" button in `frontend/app/founder/startups/page.jsx` to anchor target `#team`.
- [x] Replace placeholder in `frontend/app/page.js` with a modern landing page & SSR auth redirect.
- [x] Populate stub file `frontend/features/auth/authAPI.js` with reusable API methods.

## Phase 4: Full-Stack Verification & Polish (COMPLETED)
- [x] Verify Python backend imports and FastAPI initialization.
- [x] Verify Next.js frontend code structure and route protection.

## Phase 5: Shark Tank AI Deal Evaluator (Phase 1: Financial Traction & Deal Terms - COMPLETED)
- [x] Update `Startup` ORM model in `backend/models.py` with 15 financial, traction, moat, and AI scoring columns (`ask_amount`, `equity_offered`, `implied_valuation`, `use_of_funds`, `mrr`, `growth_rate_pct`, `burn_rate`, `runway_months`, `gross_margin_pct`, `total_raised`, `main_competitors`, `moat_description`, `ai_score`, `ai_verdict`, `ai_score_breakdown`).
- [x] Update `StartupCreate`, `StartupUpdate`, and `StartupResponse` Pydantic schemas in `backend/schemas.py`.
- [x] Update `serialize_startup`, `create_startup`, and `update_startup` in `backend/routers/startup.py`.
- [x] Execute Alembic migration `36d9a78ae1f2_add_shark_tank_deal_fields.py` to upgrade PostgreSQL database schema.
- [x] Add interactive "Deal Terms & Financial Traction" form section with real-time `implied_valuation` auto-calculation in `frontend/app/founder/startups/new/page.jsx` and `edit/page.jsx`.

## Phase 6: Admin Review Pipeline & AI Deal Evaluator (COMPLETED)
- [x] Update `Startup` model and schemas with `approval_status`, `has_pending_update`, and `pending_data`.
- [x] Execute Alembic migration `df11c76f9f9d_add_admin_review_revision_fields.py` to add revision columns to PostgreSQL.
- [x] Implement live vs draft revision workflow in `PUT /startups/{id}`: approved startups store proposed updates in `pending_data` without overwriting live public feed.
- [x] Implement `compute_ai_score` engine in `backend/routers/admin.py`: evaluates Valuation Realism, Growth & Traction, Unit Economics, and Defensibility (0-100 score, verdict, strengths, and red flags).
- [x] Update `POST /admin/startups/{id}/approve` to merge `pending_data`, set `approval_status = "approved"`, and compute AI score.
- [x] Render amber pending review notification banner in `frontend/app/founder/startups/[id]/edit/page.jsx`.
- [x] Build **AI Investment Intelligence Scorecard** in `frontend/app/investor/startups/[id]/page.jsx` and `founder/startups/[id]/page.jsx`.

## Phase 7: Dedicated Admin Login Authentication Flow (COMPLETED)
- [x] Create `POST /auth/admin-login` backend endpoint validating `admin@example.com` / `12345`, creating system admin DB user, issuing 7-day signed JWT session cookie, and returning `UserResponse`.
- [x] Update `frontend/proxy.js` middleware exceptions to allow `/admin/login` as a public route without infinite redirect loops.
- [x] Build Admin Login page component at `frontend/app/admin/login/page.jsx` with input credentials, error alert handling, Redux `authSuccess` dispatching, and redirect to `/admin/audit`.

## Phase 8: Admin Market Scraping & AI Scoring, Env Credentials, Session Auto-Refresh, and Uvicorn Fix (COMPLETED)
- [x] Configure `ADMIN_EMAIL` and `ADMIN_PASSWORD` dynamically in `.env`, `frontend/.env.local`, and `backend/core/config.py`.
- [x] Build market web scraping & domain intelligence engine in `backend/services/scraper.py`.
- [x] Integrate live market web scraping & metadata extraction into `POST /admin/startups/{id}/approve` AI Deal Scoring Engine.
- [x] Add session renewal backend endpoint `POST /auth/refresh` in `backend/routers/auth.py`.
- [x] Add automated background session refresh interceptor in `frontend/lib/api.js`.
- [x] Fix `get_startup_detail` and `update_startup` in `backend/routers/startup.py` to resolve `NameError: name 'payload' is not defined`.
- [x] Configure SQLAlchemy connection pool parameters (`pool_pre_ping=True`, `pool_recycle=3600`) for Uvicorn stability.

## Phase 9: Streamlined Teammate Selection & Live Profile Linking (COMPLETED)
- [x] Define `StartupMember` ORM model in `backend/models.py` as join table between `Startup` and `User` with custom assigned roles.
- [x] Update `StartupMemberCreate` and `TeamMemberResponse` schemas in `backend/schemas.py` to support live profile fields (`user_id`, `name`, `email`, `role`, `bio`, `linkedin_url`).
- [x] Add user search API endpoint `GET /users/search?q=...` in `backend/routers/users.py`.
- [x] Update `serialize_startup` in `backend/routers/startup.py` to join `StartupMember` with `User` and serialize live profile attributes.
- [x] Build Teammate Search & Tagging UI with Role Input Fields in `frontend/app/founder/startups/new/page.jsx` and `edit/page.jsx`.
- [x] Upgrade rich team member cards across Founder and Investor detail views with bio snippets and clickable LinkedIn profile links.

## Phase 10: Universal User Profile Access & Full Information Transparency (COMPLETED)
- [x] Implement `GET /users/{user_id}/profile` (and `GET /users/{user_id}`) in `backend/routers/users.py` returning complete `UserProfileResponse`.
- [x] Create reusable `<UserProfileModal />` component in `frontend/components/UserProfileModal.jsx` displaying User Avatar, Name, Role Badge, Approval Status, Bio, Email (`mailto:` button), LinkedIn link, Focus Domains tags, and Stage preferences.
- [x] Create `<TeamMemberCard />` component in `frontend/components/TeamMemberCard.jsx` wiring Team Cards on Startup Detail pages to open `<UserProfileModal />`.
- [x] Wire author names in Community Feed (`frontend/components/FeedList.jsx`) and Reply List (`frontend/components/ReplyList.jsx`) to open `<UserProfileModal />`.
- [x] Wire pending user rows in Admin Control Panel (`frontend/components/AdminQueue.jsx`) to open `<UserProfileModal />`.

## Phase 11: Prioritized User Auto-Suggest & Domain-Based Investor Matchmaker (COMPLETED)
- [x] Add SQL case weighting in `GET /users/search` in `backend/routers/users.py` prioritizing exact matches, prefix matches, and approved users.
- [x] Add `domain_investment_counts`, `top_focus_domain`, and `total_deals_count` columns to `User` ORM model in `backend/models.py` and `backend/schemas.py`.
- [x] Create `POST /users/me/investor-focus` endpoint allowing investors to update portfolio counts and auto-derive top focus domain and deal counts.
- [x] Implement `GET /startups/{id}/recommended-investors` in `backend/routers/startup.py` matching investors by sector overlap and sorting by deal count.
- [x] Add 300ms search input debounce timer in `frontend/app/founder/startups/new/page.jsx` and `edit/page.jsx`.
- [x] Build and render `<RecommendedInvestorsWidget />` on founder startup detail page (`/founder/startups/[id]`).

## Phase 12: Founder Investor Navigation, Domain-Matched Investor Directory & Global Pagination (COMPLETED)
- [x] Add `PaginatedResponse` Pydantic schema structure in `backend/schemas.py`.
- [x] Implement `GET /users/investors` endpoint in `backend/routers/users.py` supporting domain filtering, priority sorting, and pagination.
- [x] Add "Investors" navigation item (`/founder/investors`) with briefcase icon to `FounderSidebar.jsx`.
- [x] Create reusable `<Pagination />` React component in `frontend/components/Pagination.jsx`.
- [x] Build dedicated Founder Investor Directory page at `frontend/app/founder/investors/page.jsx` featuring sector dropdown filter, rich investor cards, direct email buttons, and pagination controls.

## Phase 13: Secure Data Room (Due Diligence Vault) & AI Market Radar Engine (COMPLETED)
- [x] Create `DataRoomDocument` and `DataRoomAccessRequest` ORM models in `backend/models.py` and Pydantic schemas in `backend/schemas.py`.
- [x] Add `market_radar_data` JSON column to `Startup` model in `backend/models.py` and `backend/schemas.py`.
- [x] Create AI Market Radar research service in `backend/services/market_radar.py` & `POST /startups/{id}/generate-market-radar` endpoint in `backend/routers/startup.py`.
- [x] Build Data Room router `backend/routers/dataroom.py` handling investor access requests (`POST /request-access`), founder response controls (`POST /respond`), file upload (`POST /documents`), and RBAC document retrieval (`GET /documents`).
- [x] Build `<DataRoomSection />` component (`frontend/components/DataRoomSection.jsx`) featuring locked vault banner for unapproved investors, access request workflow, document upload manager, and file download links.
- [x] Build `<MarketRadarWidget />` component (`frontend/components/MarketRadarWidget.jsx`) displaying TAM/SAM market sizing, CAGR percentage, top competitor benchmarks, growth tailwinds, and risks.
- [x] Render `<DataRoomSection />` and `<MarketRadarWidget />` across Founder and Investor startup detail pages.

## Phase 14: Multi-Parameter AI Scoring Engine & Weighted VC Evaluation Rubric (`qwen2.5:7b` - COMPLETED)
- [x] Configure local Ollama `OLLAMA_MODEL = "qwen2.5:7b"` and `OLLAMA_BASE_URL = "http://localhost:11434"` in `backend/core/config.py` and `backend/.env`.
- [x] Build comprehensive parameter aggregation combining founder pitch inputs, financial traction, and live scraped signals.
- [x] Implement 100-point 4-category weighted VC rubric in `backend/services/ai_scorer.py`: Problem-Market Fit & Solution (30 Pts), Competitive Moat & Differentiation (25 Pts), Market Size & Industry Tailwinds (20 Pts), Execution & Tech Viability (25 Pts).
- [x] Create `backend/workers/ai_scoring_worker.py` listening to `startup.scraped`, `startup.approved`, `startup.scrape_requested`, `startup.score_requested`, persisting evaluations to PostgreSQL and emitting `startup.scored`.
- [x] Upgrade frontend scorecards in `frontend/app/founder/startups/[id]/page.jsx` and `investor/startups/[id]/page.jsx` to render the 4 weighted VC rubric categories, tech stack badges, and competitors found.

## Phase 15: Dual-Stage Web Scraping Pipeline via `ddgs` & Playwright (COMPLETED)
- [x] Add `duckduckgo-search`, `ddgs`, `playwright`, and `beautifulsoup4` to `backend/requirements.txt`.
- [x] Implement Stage 1: Free search engine query via `DDGS().text(query, max_results=10)`.
- [x] Implement Stage 2: Parallel headless Chromium scraping using `async_playwright()`, opening 10 concurrent tabs with `.png`, `.jpg`, `.css`, and `.woff` resource aborts for 5x speedup.
- [x] Implement 8-second hard timeout per page with graceful fallback to `DDGS` text snippets.
- [x] Build `backend/workers/scraper_worker.py` (Consumer Group: `scraper-worker-group`) consuming `startup.scrape_requested` / `startup.approved` and emitting structured `startup.scraped` events to Kafka.

## Phase 16: Remote EC2 Ollama Instance Integration & Network Resilience (COMPLETED)
- [x] Configure remote EC2 Ollama endpoint `OLLAMA_BASE_URL=http://16.113.91.178:11434` with model `qwen2.5:7b` in `backend/.env` and `backend/core/config.py`.
- [x] Refactor HTTP client logic in `backend/services/ai_scorer.py` and `backend/workers/ai_scoring_worker.py` using `httpx.Client(timeout=150.0)`.
- [x] Dynamically construct `/api/generate` endpoint from `OLLAMA_BASE_URL` env variable.
- [x] Implement network resilience catching timeouts (`httpx.TimeoutException`) and connection errors (`httpx.ConnectError`, `httpx.RequestError`).
- [x] Gracefully route failed evaluations to `ai_evaluation_status = "failed"` in PostgreSQL and log clear warning without crashing the worker process.

## Phase 17: Database Schema Sync, Kafka Topic Auto-Creation & Global Error Toasts (COMPLETED)
- [x] Clean up duplicate `StartupMember` model definition in `backend/models.py`.
- [x] Apply Alembic migration `7a8e9d1c2b3a_add_s3_ai_evaluation_fields.py` to upgrade PostgreSQL database schema with `ai_evaluation_status` and `pitch_deck_parsed_text`.
- [x] Create standalone idempotent schema sync script `backend/scripts/sync_db_schema.py` using SQLAlchemy reflection and `ALTER TABLE ADD COLUMN IF NOT EXISTS`.
- [x] Implement Kafka topic auto-creation in `backend/kafka/admin.py` and `backend/kafka/consumer.py` using `AIOKafkaAdminClient` and `NewTopic` with concurrent collision protection.
- [x] Install `react-hot-toast` and configure dark-mode styled `<ToastProvider />` in `frontend/app/layout.js`.
- [x] Enhance Axios response error interceptor in `frontend/lib/api.js` to catch 4xx/5xx errors, extract FastAPI validation / error details with fallback, and trigger global toast notifications while bypassing silent 401 token refresh.

## Phase 18: Full UI Success/Error Toast Wiring & Global Font Color Fixes (COMPLETED)
- [x] Fix font colors, text contrast, placeholder readability, and remove conflicting dark mode overrides in `frontend/app/globals.css`.
- [x] Wire success and error toasts across all role flows:
  - Auth: Google Sign-In, Role Selection, Admin Login, and Logout across all Sidebars.
  - Founder: Startup profile creation, editing, logo & pitch deck uploads, and profile changes.
  - Investor: Bookmark/save startups, direct founder conversation initiation, and profile/domain updates.
  - Admin: User approve/reject, startup approve/reject with AI scoring trigger.
  - Community & Messaging: Feed posts, discussion replies, direct message thread dispatches.
  - Due Diligence & Market Intelligence: Data room access request, document uploads, document deletion, and AI Market Radar generation.

## Phase 19: Transactional Outbox Pattern for Kafka Resilience (COMPLETED)
- [x] Create `KafkaOutbox` model in `backend/models.py` (`id`, `topic`, `payload`, `status`, `retry_count`, `last_error`, timestamps).
- [x] Create and execute Alembic migration `8b9f0e2d3c4a_create_kafka_outbox_table.py` and update `backend/scripts/sync_db_schema.py`.
- [x] Build atomic outbox enqueue helper in `backend/kafka/outbox.py`.
- [x] Refactor startup creation, pitch deck upload, startup editing, and admin approval/rejection endpoints to atomically write outbox records within the PostgreSQL transaction, eliminating dual-write failure vulnerabilities.
- [x] Implement `OutboxRelayService` in `backend/services/outbox_relay.py` and standalone worker `backend/workers/outbox_worker.py` polling every 5 seconds with automatic connection retry and failure backoff.
- [x] Integrate outbox relay loop into FastAPI lifespan in `backend/main.py`.

## Phase 22: Strict Business-Metric VC Scoring & Worker Keep-Alive Resilience (COMPLETED)
- [x] Diagnosed previous scorecard evaluation (identified legacy fallback heuristic with inflated baseline points).
- [x] Replaced heuristic engine and LLM scoring rubric in `backend/services/ai_scorer.py` with strict Tier-1 VC business financial standards (penalizing $0 MRR / unrealistic valuations and rewarding high MRR, MoM growth, high gross margins, and defensible IP).
- [x] Added auto-reconnect supervisor loops to all 7 Kafka background workers (`ai_scoring_worker.py`, `scraper_worker.py`, `notification_worker.py`, `audit_worker.py`, `matching_worker.py`, `search_indexer_worker.py`, `outbox_worker.py`) preventing process exits upon Kafka disconnects or restarts.
- [x] Redesigned AI Investment Intelligence Scorecard UI in both `founder/startups/[id]` and `investor/startups/[id]` to high-contrast clean white card theme.
- [x] Verified full Next.js production build (`next build`) with 0 errors.

## Phase 23: Secure AWS S3 Pre-Signed URL Architecture for Private Documents (COMPLETED)
- [x] Implemented `generate_presigned_url` in `backend/utils/s3_manager.py` with configurable expiration, inline browser viewing (`ResponseContentDisposition: inline`), and MIME-type detection.
- [x] Updated Data Room endpoints in `backend/routers/dataroom.py`:
  - `GET /startups/{id}/dataroom/documents`: Automatically dynamically pre-signs all document URLs for authorized founders and approved investors.
  - `GET /dataroom/documents/{document_id}/download-url`: Dedicated secure endpoint verifying founder ownership or approved investor access before issuing a 1-hour pre-signed S3 URL.
- [x] Updated Startup endpoints in `backend/routers/startup.py`:
  - `serialize_startup`: Pre-signs `pitch_deck_url` and `logo_url` so browser requests bypass S3 private ACL `AccessDenied` errors.
  - `GET /startups/{id}/pitch-deck-url`: Dedicated pre-signed URL endpoint for pitch deck PDFs.
- [x] Updated `frontend/components/DataRoomSection.jsx` with `handleViewDocument` to open pre-signed URLs directly in the browser.
- [x] Verified 100% with `scratch/test_presigned_urls.py` showing raw direct access returns 403 AccessDenied while pre-signed URL delivers 200 OK with full document bytes.

