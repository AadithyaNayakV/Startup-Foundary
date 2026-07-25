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

## Phase 4: Full-Stack Verification & Polish (READY FOR VERIFICATION)
- [x] Verify Python backend imports and FastAPI initialization.
- [x] Verify Next.js frontend code structure and route protection.
