from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
from dotenv import load_dotenv
import os

from api.routes import scenarios, fsm, generator, verification
from core.database import init_db

# Load environment variables
load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    yield
    # Shutdown
    pass

app = FastAPI(
    title="AutoState API",
    description="Natural language-driven FSM and code/policy generator",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(scenarios.router, prefix="/api/scenarios", tags=["scenarios"])
app.include_router(fsm.router, prefix="/api/fsm", tags=["fsm"])
app.include_router(generator.router, prefix="/api/generator", tags=["generator"])
app.include_router(verification.router, prefix="/api/verification", tags=["verification"])

@app.get("/")
async def root():
    return {"message": "AutoState API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 