import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import Base, engine
from core.config import settings
from kafka.manager import kafka_manager
from routers import auth, startup, users, admin, feed, messages, dataroom

import firebase_admin
from firebase_admin import credentials

# Initialize DB Tables
Base.metadata.create_all(bind=engine)

# Initialize Firebase Admin
try:
    cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS)
    firebase_admin.initialize_app(cred)
except ValueError:
    # App already initialized
    pass


import asyncio
from services.outbox_relay import outbox_relay

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize Kafka producer connection and Outbox Relay loop
    print("🚀 Starting Foundry API service...")
    try:
        await kafka_manager.start()
    except Exception as e:
        print(f"⚠️ Kafka startup warning: {e}")

    # Launch Transactional Outbox Relay Loop as a background task
    relay_task = asyncio.create_task(outbox_relay.run_relay_loop())
    
    yield
    
    # Shutdown: gracefully stop Outbox Relay and close Kafka connections
    print("🛑 Shutting down Foundry API service...")
    try:
        await outbox_relay.stop()
        relay_task.cancel()
        try:
            await relay_task
        except asyncio.CancelledError:
            pass
    except Exception as e:
        print(f"⚠️ Outbox relay shutdown warning: {e}")

    try:
        await kafka_manager.stop()
    except Exception as e:
        print(f"⚠️ Kafka shutdown warning: {e}")


app = FastAPI(title="Foundry API", lifespan=lifespan)

# Serve uploaded media
upload_dir = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

origins = list(
    set(
        [
            settings.FRONTEND_URL,
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
    )
)

# CRITICAL CORS CONFIGURATION FOR CSR/SSR
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,  # MUST be True to allow HTTP-Only cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(startup.router)
app.include_router(users.router)
app.include_router(admin.router)
app.include_router(feed.router)
app.include_router(messages.router)
app.include_router(dataroom.router)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "kafka_producer": kafka_manager.producer._is_started if kafka_manager.producer else False}
