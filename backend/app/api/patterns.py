"""
Pattern Search API Endpoint
POST /api/v1/patterns/search
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from app.services.vector_store import get_vector_store


router = APIRouter()


class SearchPatternsRequest(BaseModel):
    """Request for semantic pattern search"""
    query: str = Field(..., min_length=3, description="Natural language query")
    match_count: int = Field(default=5, ge=1, le=20)
    match_threshold: float = Field(default=0.5, ge=0.0, le=1.0)
    filter_category: Optional[str] = Field(default=None)
    filter_metadata: Optional[dict] = Field(default=None)


class PatternResult(BaseModel):
    """Single pattern result"""
    id: str
    content: str
    category: Optional[str]
    metadata: dict
    similarity: float


class SearchPatternsResponse(BaseModel):
    """Response from pattern search"""
    patterns: list[PatternResult]
    count: int


@router.post("/patterns/search", response_model=SearchPatternsResponse)
async def search_patterns(request: SearchPatternsRequest):
    """
    Semantic search for design patterns.
    
    Uses OpenAI embeddings + pgvector for similarity search.
    """
    try:
        vector_store = get_vector_store()
        
        # Build metadata filter
        filter_metadata = request.filter_metadata or {}
        if request.filter_category:
            filter_metadata["category"] = request.filter_category
        
        patterns = await vector_store.search_patterns(
            query=request.query,
            match_count=request.match_count,
            match_threshold=request.match_threshold,
            filter_metadata=filter_metadata if filter_metadata else None,
        )
        
        return SearchPatternsResponse(
            patterns=[
                PatternResult(
                    id=p.id,
                    content=p.content,
                    category=p.category,
                    metadata=p.metadata,
                    similarity=p.similarity,
                )
                for p in patterns
            ],
            count=len(patterns),
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


class AddPatternRequest(BaseModel):
    """Request to add a new pattern"""
    content: str = Field(..., min_length=10)
    category: Optional[str] = None
    metadata: Optional[dict] = None
    source: str = Field(default="generated")


class AddPatternResponse(BaseModel):
    """Response from adding pattern"""
    id: str
    status: str


@router.post("/patterns/add", response_model=AddPatternResponse)
async def add_pattern(request: AddPatternRequest):
    """
    Add a new design pattern to the vector store.
    
    Note: In production, this should be admin-only.
    """
    try:
        vector_store = get_vector_store()
        
        pattern_id = await vector_store.store_pattern(
            content=request.content,
            category=request.category,
            metadata=request.metadata,
            source=request.source,
        )
        
        return AddPatternResponse(id=pattern_id, status="created")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add pattern: {str(e)}")


class PatternStatsResponse(BaseModel):
    """Vector store statistics"""
    total_patterns: int
    categories: dict[str, int]


@router.get("/patterns/stats", response_model=PatternStatsResponse)
async def get_pattern_stats():
    """Get statistics about the pattern library"""
    try:
        vector_store = get_vector_store()
        stats = await vector_store.get_stats()
        
        return PatternStatsResponse(
            total_patterns=stats["total_patterns"],
            categories=stats["categories"],
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")
