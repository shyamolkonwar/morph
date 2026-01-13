"""
Vector Store Service
Supabase pgvector operations for design pattern retrieval
"""

import os
from typing import Optional
from dataclasses import dataclass, field

from app.config import get_settings
from app.services.embeddings import get_embedding_service


@dataclass
class DesignPattern:
    """Design pattern from vector store"""
    id: str
    content: str
    metadata: dict = field(default_factory=dict)
    category: Optional[str] = None
    similarity: float = 0.0


class VectorStoreService:
    """Supabase vector store for design patterns"""
    
    def __init__(self):
        self.settings = get_settings()
        self._client = None
        self.embedding_service = get_embedding_service()
    
    @property
    def client(self):
        """Lazy load Supabase client"""
        if self._client is None:
            from supabase import create_client
            
            url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
            key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
            
            if not url or not key:
                raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required")
            
            self._client = create_client(url, key)
        return self._client
    
    async def search_patterns(
        self,
        query: str,
        match_count: int = 5,
        match_threshold: float = 0.5,
        filter_metadata: Optional[dict] = None,
    ) -> list[DesignPattern]:
        """
        Semantic search for design patterns.
        
        Args:
            query: Natural language query
            match_count: Number of results to return
            match_threshold: Minimum similarity threshold (0-1)
            filter_metadata: Optional JSONB filter
            
        Returns:
            List of matching patterns ordered by similarity
        """
        # Generate embedding for query
        embedding = await self.embedding_service.generate_embedding(query)
        
        # Call RPC function
        result = self.client.rpc(
            "match_design_patterns",
            {
                "query_embedding": embedding,
                "match_count": match_count,
                "match_threshold": match_threshold,
                "filter_metadata": filter_metadata or {},
            }
        ).execute()
        
        # Convert to dataclass
        patterns = []
        for row in result.data or []:
            patterns.append(DesignPattern(
                id=row["id"],
                content=row["content"],
                metadata=row.get("metadata", {}),
                category=row.get("category"),
                similarity=row.get("similarity", 0.0),
            ))
        
        return patterns
    
    async def store_pattern(
        self,
        content: str,
        category: Optional[str] = None,
        metadata: Optional[dict] = None,
        source: str = "generated",
    ) -> str:
        """
        Store a new design pattern.
        
        Args:
            content: Design content (constraint graph JSON or description)
            category: Pattern category
            metadata: Additional metadata
            source: Source of pattern
            
        Returns:
            Pattern ID
        """
        # Generate embedding
        embedding = await self.embedding_service.generate_embedding(content)
        
        # Insert into database
        result = self.client.table("design_patterns").insert({
            "embedding": embedding,
            "content": content,
            "category": category,
            "metadata": metadata or {},
            "source": source,
        }).execute()
        
        return result.data[0]["id"]
    
    async def store_patterns_batch(
        self,
        patterns: list[dict],
    ) -> list[str]:
        """
        Batch store design patterns.
        
        Args:
            patterns: List of dicts with content, category, metadata, source
            
        Returns:
            List of pattern IDs
        """
        # Extract content for batch embedding
        contents = [p["content"] for p in patterns]
        embeddings = await self.embedding_service.generate_embeddings_batch(contents)
        
        # Prepare records
        records = []
        for pattern, embedding in zip(patterns, embeddings):
            records.append({
                "embedding": embedding,
                "content": pattern["content"],
                "category": pattern.get("category"),
                "metadata": pattern.get("metadata", {}),
                "source": pattern.get("source", "generated"),
            })
        
        # Batch insert
        result = self.client.table("design_patterns").insert(records).execute()
        
        return [r["id"] for r in result.data]
    
    async def increment_usage(self, pattern_id: str) -> None:
        """Increment usage count for a pattern"""
        self.client.rpc("increment_pattern_usage", {"pattern_id": pattern_id}).execute()
    
    async def get_stats(self) -> dict:
        """Get vector store statistics"""
        result = self.client.table("design_patterns").select(
            "count", count="exact"
        ).execute()
        
        category_result = self.client.table("design_patterns").select(
            "category"
        ).execute()
        
        categories = {}
        for row in category_result.data or []:
            cat = row.get("category") or "uncategorized"
            categories[cat] = categories.get(cat, 0) + 1
        
        return {
            "total_patterns": result.count or 0,
            "categories": categories,
        }


_vector_store: Optional[VectorStoreService] = None


def get_vector_store() -> VectorStoreService:
    """Get singleton vector store service"""
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStoreService()
    return _vector_store
