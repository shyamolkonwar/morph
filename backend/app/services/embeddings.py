"""
Embedding Service
Generate embeddings using OpenAI text-embedding-3-small
"""

from typing import Optional
from functools import lru_cache

from app.config import get_settings


class EmbeddingService:
    """Generate embeddings for semantic search"""
    
    MODEL = "text-embedding-3-small"
    DIMENSIONS = 1536
    
    def __init__(self):
        self.settings = get_settings()
        self._client: Optional["OpenAI"] = None
    
    @property
    def client(self):
        """Lazy load OpenAI client"""
        if self._client is None:
            from openai import OpenAI
            self._client = OpenAI(api_key=self.settings.openai_api_key)
        return self._client
    
    async def generate_embedding(self, text: str) -> list[float]:
        """
        Generate embedding for a single text.
        
        Args:
            text: Text to embed
            
        Returns:
            List of 1536 floats
        """
        # Use sync client with asyncio
        import asyncio
        return await asyncio.to_thread(self._generate_sync, text)
    
    def _generate_sync(self, text: str) -> list[float]:
        """Synchronous embedding generation"""
        response = self.client.embeddings.create(
            model=self.MODEL,
            input=text,
            dimensions=self.DIMENSIONS,
        )
        return response.data[0].embedding
    
    async def generate_embeddings_batch(
        self,
        texts: list[str],
        batch_size: int = 100
    ) -> list[list[float]]:
        """
        Generate embeddings for multiple texts.
        
        Args:
            texts: List of texts to embed
            batch_size: Number of texts per API call
            
        Returns:
            List of embeddings (1536 floats each)
        """
        import asyncio
        
        all_embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            embeddings = await asyncio.to_thread(
                self._generate_batch_sync, batch
            )
            all_embeddings.extend(embeddings)
        
        return all_embeddings
    
    def _generate_batch_sync(self, texts: list[str]) -> list[list[float]]:
        """Synchronous batch embedding generation"""
        response = self.client.embeddings.create(
            model=self.MODEL,
            input=texts,
            dimensions=self.DIMENSIONS,
        )
        # Sort by index to maintain order
        sorted_data = sorted(response.data, key=lambda x: x.index)
        return [d.embedding for d in sorted_data]


@lru_cache()
def get_embedding_service() -> EmbeddingService:
    """Get singleton embedding service"""
    return EmbeddingService()


# Convenience function for quick embedding
async def generate_embedding(text: str) -> list[float]:
    """Generate embedding for text"""
    service = get_embedding_service()
    return await service.generate_embedding(text)
