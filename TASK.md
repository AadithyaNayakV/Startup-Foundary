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
