from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from routers import auth
from core.config import settings

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

# CRITICAL CORS CONFIGURATION FOR CSR/SSR
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL], # e.g., "http://localhost:3000"
    allow_credentials=True, # MUST be True to allow HTTP-Only cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}