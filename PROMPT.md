# TASK: Connect Python AI Worker to Remote EC2 Ollama Instance

Act as a Principal Python Backend Engineer.

First, read `backend/workers/ai_scoring_worker.py` and `backend/.env`.

---

## 1. ENVIRONMENT VARIABLE SETUP
- Update `backend/.env` to include the target EC2 IP for Ollama:
  `OLLAMA_BASE_URL=http://16.113.91.178:11434`
- Read this variable securely inside the Python worker using `os.getenv()`.

## 2. REFACTOR HTTP CONNECTION
- Locate the HTTP client logic (`httpx` or similar) inside `ai_scoring_worker.py`.
- Remove any hardcoded `localhost` references.
- Dynamically construct the endpoint URL by appending `/api/generate` to the `OLLAMA_BASE_URL` env variable.
- Ensure the payload is targeting the correct model (e.g., `"qwen2.5:7b"`).

## 3. NETWORK RESILIENCE
- Increase the HTTP client timeout to `150.0` seconds to account for internet latency and large prompt inference times on the EC2 instance.
- Add try/except blocks to specifically catch HTTP timeouts and connection errors.
- If the EC2 connection fails, log a clear warning ("Remote EC2 Ollama connection failed") and route the startup evaluation to a "failed" state rather than crashing the worker process.