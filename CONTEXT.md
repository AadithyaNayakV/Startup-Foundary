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
- User roles: `founder`, `investor`, `admin`.
- Role assignment via `POST /auth/set-role` is permanent once chosen.

### Data Models Summary
- `User`: Primary user accounts linked via `firebase_uid`. Stores name, email, role, bio, linkedin_url, is_approved, focus_domains, preferred_stage.
- `Startup`: Company profiles owned/co-owned by founders. Contains name, tagline, description, stage, status (`pending`, `approved`, `rejected`), domains, funding_needed, website_url, logo_url, pitch_deck_url, approval_notes.
- `StartupMember`: Join table linking `User` and `Startup` with roles (`ceo`, `cofounder`).
- `StartupSave`: Tracks investor bookmarks of approved startups.
- `Post` & `PostReply`: Community feed discussions.
- `Conversation` & `Message`: 1-on-1 messaging threads between investors and founders regarding a specific startup.
- `ConversationRead`: Tracks last read timestamps per user for unread badge counts.
- `AdminAction`: Audit log of admin approvals/rejections for users and startups.
