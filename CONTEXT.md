# Foundry Platform - Context & Architecture Guide

## Overview
Foundry is a multi-role startup-investor matching and community platform built with Next.js (Frontend) and FastAPI + PostgreSQL (Backend).

## Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, Redux Toolkit, Tailwind CSS, Axios, Firebase Auth SDK, `jose` (JWT).
- **Backend**: FastAPI, SQLAlchemy ORM, PostgreSQL (UUID primary keys), Pydantic v2, PyJWT, Firebase Admin SDK.

## Key Architecture & Data Flows

### Authentication & Sessions
- Authentication is initiated on the frontend via Google Sign-In (Firebase Client SDK).
- The Firebase ID Token is sent to FastAPI (`POST /auth/google`).
- FastAPI verifies the token with Firebase Admin SDK, creates/retrieves the `User` record in PostgreSQL, and issues a custom HTTP-Only cookie (`session`) signed with `JWT_SECRET_KEY` (HS256 algorithm, 7-day validity).
- User roles: `founder`, `investor`, `admin`. System admin credentials (`ADMIN_EMAIL` / `ADMIN_PASSWORD`) are loaded dynamically from environment variables.
- Role assignment via `POST /auth/set-role` is permanent once chosen.
- Active user sessions are automatically extended via `POST /auth/refresh` background interceptor.
- Startup approval in `POST /admin/startups/{id}/approve` emits `startup.scrape_requested`, triggering `backend/workers/scraper_worker.py` (Dual-Stage DDGS + Parallel Playwright scraping) to produce `startup.scraped`, followed by `backend/workers/ai_scoring_worker.py` (Ollama `qwen2.5:7b` 100-Point Weighted VC Rubric).

### Data Models Summary
- `User`: Primary user accounts linked via `firebase_uid`. Stores name, email, role, bio, linkedin_url, is_approved, focus_domains, preferred_stage.
- `Startup`: Company profiles owned/co-owned by founders. Contains name, tagline, description, stage, status/approval_status (`pending`, `approved`, `rejected`), has_pending_update, pending_data, domains, funding_needed, website_url, logo_url, pitch_deck_url, approval_notes, financial traction fields (ask_amount, equity_offered, implied_valuation, mrr, growth_rate_pct, burn_rate, runway_months, gross_margin_pct, total_raised, main_competitors, moat_description), and AI scoring fields (ai_score, ai_verdict, ai_score_breakdown).
- `StartupMember`: Join table linking `User` and `Startup` with roles (`ceo`, `cofounder`).
- `StartupSave`: Tracks investor bookmarks of approved startups.
- `Post` & `PostReply`: Community feed discussions.
- `Conversation` & `Message`: 1-on-1 messaging threads between investors and founders regarding a specific startup.
- `ConversationRead`: Tracks last read timestamps per user for unread badge counts.
- `AdminAction`: Audit log of admin approvals/rejections for users and startups.
