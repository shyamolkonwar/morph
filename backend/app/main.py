"""
MorphV2 Generative Banner System - FastAPI Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import get_settings
from app.api import generate, verify, patterns, jobs, projects


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    settings = get_settings()
    print(f"🚀 Starting {settings.app_name} v{settings.app_version}")
    print(f"   AI Provider: {settings.default_ai_provider}")
    print(f"   Max Iterations: {settings.max_iterations}")
    print(f"   Vector Store: Supabase pgvector")
    yield
    print("👋 Shutting down MorphV2")


app = FastAPI(
    title="MorphV2 Generative Banner API",
    description="""
    First-Principles Design Engine for Professional Banner Generation.
    
    ## Architecture
    - **GOD Prompt System**: Creative Director + Layout Engineer personas
    - **Constraint-Based Synthesis**: Mathematical layout validation
    - **5-Layer Verification**: Automated quality assurance
    - **Iterative Refinement**: Self-correcting design loop
    - **RAG Pipeline**: Semantic pattern retrieval with pgvector
    """,
    version="2.0.0",
    lifespan=lifespan,
)

# CORS Configuration
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(generate.router, prefix="/api/v1", tags=["generation"])
app.include_router(verify.router, prefix="/api/v1", tags=["verification"])
app.include_router(patterns.router, prefix="/api/v1", tags=["patterns"])
app.include_router(projects.router, prefix="/api/v1", tags=["projects"])
app.include_router(jobs.router, prefix="/api/v1", tags=["jobs"])


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "MorphV2 Generative Banner API",
        "status": "operational",
        "version": settings.app_version,
        "architecture": "5-Pillar First-Principles Design Engine",
    }


@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "version": settings.app_version,
        "ai_provider": settings.default_ai_provider,
        "has_openrouter_key": bool(settings.openrouter_api_key),
        "has_anthropic_key": bool(settings.anthropic_api_key),
        "has_openai_key": bool(settings.openai_api_key),
        "queue": "Celery + Upstash Redis",
    }
