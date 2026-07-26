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

---

## 3. 🔐 Authentication & Middleware Pipeline
| Bug ID | Component / File | Description | Impact | Status |
|--------|------------------|-------------|--------|--------|
| AUT-01 | `frontend/proxy.js` -> `frontend/middleware.js` | Middleware named `proxy.js` instead of `middleware.js`. | Next.js completely ignored route protection. | **Resolved (Phase 2)** |
| AUT-02 | `frontend/app/investor/dashboard/page.jsx` | HTTP 403 Forbidden (for unapproved investors) crashed SSR. | Unapproved investors received broken error state instead of approval banner. | **Resolved (Phase 2)** |
| AUT-03 | `frontend/middleware.js` & `backend/.env` | `JWT_SECRET_KEY` alignment across `.env` and `.env.local`. | Token validation failure if keys mismatch. | **Resolved (Phase 2)** |

---

## 4. 🚧 Incomplete Features & Stubs
| Bug ID | Component / File | Description | Status |
|--------|------------------|-------------|--------|
| STU-01 | `frontend/features/auth/authAPI.js` | 0-byte empty file. | **Resolved (Phase 3)** |
| STU-02 | `frontend/app/page.js` | Unstyled placeholder returning `<div>Home Page</div>`. | **Resolved (Phase 3)** |
| STU-03 | `backend/routers/startup.py` | Missing pitch deck upload endpoint (`POST /startups/pitch-deck-upload`). | **Resolved (Phase 3)** |
