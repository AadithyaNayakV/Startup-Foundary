from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from database import Base, engine

from core.config import settings
from routers import auth, startup, users, admin, feed, messages

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

app = FastAPI(title="Foundry API")

# Serve uploaded media
upload_dir = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

# CRITICAL CORS CONFIGURATION FOR CSR/SSR
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
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


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
