"""
Celery Application Configuration
Configured for Upstash Redis (serverless)
"""

import os
from celery import Celery

# Get Upstash Redis URL from environment
UPSTASH_REDIS_URL = os.getenv("UPSTASH_REDIS_URL", "redis://localhost:6379/0")

# Convert redis:// to rediss:// for SSL if it's an Upstash URL
if "upstash.io" in UPSTASH_REDIS_URL and UPSTASH_REDIS_URL.startswith("redis://"):
    UPSTASH_REDIS_URL = UPSTASH_REDIS_URL.replace("redis://", "rediss://", 1)

# Add SSL cert verification bypass for serverless providers
if "rediss://" in UPSTASH_REDIS_URL and "ssl_cert_reqs" not in UPSTASH_REDIS_URL:
    if "?" in UPSTASH_REDIS_URL:
        UPSTASH_REDIS_URL += "&ssl_cert_reqs=CERT_NONE"
    else:
        UPSTASH_REDIS_URL += "?ssl_cert_reqs=CERT_NONE"


# Create Celery app
celery_app = Celery(
    "morph_worker",
    broker=UPSTASH_REDIS_URL,
    backend=UPSTASH_REDIS_URL,
    include=["app.tasks.generation"],
)

# Celery Configuration optimized for Upstash
celery_app.conf.update(
    # ═══════════════════════════════════════════════════════════════
    # Connection Settings (Upstash Serverless)
    # ═══════════════════════════════════════════════════════════════
    broker_pool_limit=None,  # Upstash manages connections server-side
    broker_connection_retry_on_startup=True,
    broker_heartbeat=10,  # Keep connection alive
    
    # ═══════════════════════════════════════════════════════════════
    # Task Settings
    # ═══════════════════════════════════════════════════════════════
    task_acks_late=True,  # Redelivery if worker crashes
    task_reject_on_worker_lost=True,
    task_time_limit=120,  # Hard limit: 2 minutes
    task_soft_time_limit=60,  # Soft limit: 1 minute
    
    # ═══════════════════════════════════════════════════════════════
    # Worker Settings
    # ═══════════════════════════════════════════════════════════════
    worker_prefetch_multiplier=1,  # Heavy tasks, fetch one at a time
    worker_concurrency=4,  # Adjust based on CPU cores
    
    # ═══════════════════════════════════════════════════════════════
    # Result Backend
    # ═══════════════════════════════════════════════════════════════
    result_expires=3600,  # Results expire after 1 hour
    result_extended=True,  # Store task metadata
    
    # ═══════════════════════════════════════════════════════════════
    # Serialization
    # ═══════════════════════════════════════════════════════════════
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    
    # ═══════════════════════════════════════════════════════════════
    # Queue Routing
    # ═══════════════════════════════════════════════════════════════
    task_routes={
        "app.tasks.generation.orchestrate_design_generation": {"queue": "generation"},
        "app.tasks.generation.iterative_refinement_loop": {"queue": "generation"},
    },
    task_default_queue="default",
)


# For running: celery -A celery_app worker --loglevel=info -Q generation,default
