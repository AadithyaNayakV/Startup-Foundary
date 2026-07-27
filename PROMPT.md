# TASK: Secure Data Room (Due Diligence Vault) & AI Market Radar Engine

Act as a Principal Full-Stack Engineer.

First, read `CONTEXT.md`, `TASK.md`, and `AUDIT.md` to align with our architecture, schemas, and security guidelines.

---

## PART 1: SECURE DATA ROOM (DUE DILIGENCE VAULT)

### 1. DATA ROOM DB MODELS & SCHEMAS (`backend/models.py` & `backend/schemas.py`)
- In `backend/models.py`, create two new ORM models:
  1. `DataRoomDocument`:
     * `id` (UUID), `startup_id` (UUID, ForeignKey), `file_name` (String), `file_url` (String), `file_type` (String: "financials", "cap_table", "patent", "other"), `created_at` (datetime).
  2. `DataRoomAccessRequest`:
     * `id` (UUID), `startup_id` (UUID, ForeignKey), `investor_id` (UUID, ForeignKey), `status` (String: "pending", "approved", "rejected"), `requested_at` (datetime).

- In `backend/schemas.py`, create corresponding Pydantic schemas: `DataRoomDocumentResponse`, `DataRoomAccessRequestCreate`, and `DataRoomAccessRequestResponse`.

### 2. ACCESS CONTROL & ROUTING (`backend/routers/dataroom.py` & `main.py`)
- Create `backend/routers/dataroom.py` and register it in `main.py`:
  1. `POST /startups/{id}/dataroom/request-access`:
     * Authenticated investors can request access to a startup's data room (sets status to `"pending"`).
  2. `GET /startups/{id}/dataroom/requests`:
     * Startup founder views all pending and approved access requests.
  3. `POST /dataroom/requests/{request_id}/respond`:
     * Founder updates request status to `"approved"` or `"rejected"`.
  4. `POST /startups/{id}/dataroom/documents`:
     * Startup founder uploads secure documents (Financial Models, Cap Tables, Patents).
  5. `GET /startups/{id}/dataroom/documents`:
     * Enforces strict authorization: Accessible ONLY if the user is the startup founder, an admin, OR an investor with an `"approved"` `DataRoomAccessRequest`.

### 3. FRONTEND DATA ROOM UI (`frontend/app/`)
- **Investor View (`/investor/startups/[id]/page.jsx`)**:
  * Add a **"Data Room (Due Diligence)"** tab on the Startup Detail page.
  * If the investor is NOT approved: Display a locked vault banner with a **"Request Access to Data Room"** button.
  * If request is pending: Show an amber tag: *"Access Request Pending Founder Approval"*.
  * If approved: Render the document list with secure download buttons for Financial Models, Cap Tables, and Pitch Decks.
- **Founder View (`/founder/startups/[id]`)**:
  * Add a **"Manage Data Room"** tab to upload documents and respond to investor access requests with 1-click **Approve** / **Deny** buttons.

---

## PART 2: AI MARKET RADAR & COMPETITOR INTELLIGENCE

### 4. MARKET RESEARCH DB & SCHEMAS (`backend/models.py` & `backend/schemas.py`)
- In `backend/models.py`, add a market intelligence column to the `Startup` model:
  * `market_radar_data` (JSON/JSONB, nullable=True)  
    # Schema: { tam_size: str, sam_size: str, cagr_pct: float, top_competitors: list, tailwinds: list, market_risks: list }
- In `backend/schemas.py`, include `market_radar_data` in `StartupResponse`.

### 5. MARKET RESEARCH SERVICE & ENDPOINT (`backend/services/market_radar.py` & `backend/routers/startup.py`)
- Create `backend/services/market_radar.py`:
  * Takes a startup's `name`, `domains`, `tagline`, and `description`.
  * Scrapes recent web context/trends for similar products and market size.
  * Prompts Gemini/LLM to produce a structured **Market Radar Report**:
    - Estimated TAM/SAM market size.
    - Top 3–5 direct or indirect competitors with their strengths.
    - Industry Growth Rate (CAGR %) and market tailwinds.
    - Main adoption risks.
- In `backend/routers/startup.py`, add endpoint `POST /startups/{id}/generate-market-radar`:
  * Triggers the market research pipeline and persists the JSON results to `startup.market_radar_data`.

### 6. FRONTEND MARKET RADAR UI (`frontend/app/`)
- Build a **"Market & Competitor Radar"** component:
  * **Founder View (`/founder/startups/[id]`)**: Displays market report with a **"Generate / Refresh Market Radar"** button.
  * **Investor View (`/investor/startups/[id]`)**: Displays market size (TAM/SAM), competitor analysis, and growth tailwinds.

---

## GENERAL CONSTRAINTS
- Update `TASK.md`, `CONTEXT.md`, and `AUDIT.md` to log these additions.
- STRICT SCOPE: Do NOT touch or modify any messaging files, routes, or components (`messages.py`, `MessageThread.jsx`, `/inbox`).