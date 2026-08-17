# TASK: Implement Transactional Outbox Pattern for Kafka Resilience

Act as a Principal Staff Engineer.

Currently, the system suffers from the "Dual Write Problem". If a user creates/approves a startup, it saves to PostgreSQL, but if the `aiokafka` producer fails to publish the event (e.g., Kafka is down), the startup is stuck in limbo and scraping never occurs. The main API response must not fail if Kafka is down.

Review `backend/models.py`, `backend/routers/startup.py`, and the Kafka producer configuration.

---

## 1. DATABASE OUTBOX SCHEMA
- Create a new SQLAlchemy model named `KafkaOutbox`.
- Columns: `id` (UUID), `topic` (String), `payload` (JSONB), `status` (String: 'PENDING', 'SENT', 'FAILED'), `created_at` (DateTime), `updated_at` (DateTime).
- Generate and apply the Alembic migration (or provide the SQL command) to create this table.

## 2. ATOMIC DATABASE WRITES
- Refactor the startup creation/approval logic in the FastAPI router.
- Remove the direct `kafka_producer.send()` call from the main HTTP execution flow.
- Instead, within the EXACT SAME database transaction (using the same `db` session) that saves/updates the `Startup` record, create a new `KafkaOutbox` record with `status='PENDING'`.
- Commit the transaction. (If the DB fails, both fail. If the DB succeeds, the event is permanently safe).

## 3. THE OUTBOX RELAY WORKER
- Create a new background worker or asynchronous loop inside FastAPI (using `asyncio.create_task` on app startup, or a dedicated Python worker script).
- This relay worker should query the `KafkaOutbox` table every 5 seconds for records where `status == 'PENDING'`.
- For each record, attempt to publish it to Kafka using the `aiokafka` producer.
- If the publish is successful, update the `KafkaOutbox` record `status='SENT'`.
- Wrap the publish attempt in a `try/except` block catching `aiokafka` connection errors. If Kafka is down, gracefully catch the error, leave the outbox record as 'PENDING', and sleep until the next poll cycle.