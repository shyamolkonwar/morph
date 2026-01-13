"""
Asset Manager
Handles image prefetching, font caching, and resource management
"""

import os
import base64
import asyncio
import hashlib
from typing import Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta


@dataclass
class CachedAsset:
    """A cached asset with expiry"""
    data: bytes
    content_type: str
    cached_at: datetime
    ttl_seconds: int = 3600  # 1 hour default
    
    def is_expired(self) -> bool:
        return datetime.now() > self.cached_at + timedelta(seconds=self.ttl_seconds)


class AssetManager:
    """
    Manages asset loading, caching, and conversion.
    
    Features:
    - Async image fetching from URLs
    - In-memory cache with TTL
    - Font file registry
    - Base64 conversion
    """
    
    def __init__(
        self,
        cache_ttl: int = 3600,
        max_cache_size: int = 100,
        font_dir: Optional[str] = None,
    ):
        self.cache_ttl = cache_ttl
        self.max_cache_size = max_cache_size
        self.font_dir = font_dir or os.path.join(os.path.dirname(__file__), "fonts")
        
        self._cache: dict[str, CachedAsset] = {}
        self._font_registry: dict[str, str] = {}  # name -> path
        
        # Initialize font registry
        self._scan_fonts()
    
    def _scan_fonts(self) -> None:
        """Scan font directory for available fonts"""
        if os.path.exists(self.font_dir):
            for filename in os.listdir(self.font_dir):
                if filename.endswith(('.ttf', '.otf', '.woff', '.woff2')):
                    name = os.path.splitext(filename)[0]
                    self._font_registry[name.lower()] = os.path.join(self.font_dir, filename)
    
    def _cache_key(self, url: str) -> str:
        """Generate cache key from URL"""
        return hashlib.md5(url.encode()).hexdigest()
    
    def _cleanup_cache(self) -> None:
        """Remove expired entries and enforce size limit"""
        # Remove expired
        expired = [k for k, v in self._cache.items() if v.is_expired()]
        for k in expired:
            del self._cache[k]
        
        # Enforce size limit (FIFO)
        while len(self._cache) > self.max_cache_size:
            oldest_key = min(self._cache, key=lambda k: self._cache[k].cached_at)
            del self._cache[oldest_key]
    
    async def fetch_image(
        self,
        url: str,
        use_cache: bool = True,
    ) -> Optional[bytes]:
        """
        Fetch an image from URL.
        
        Args:
            url: Image URL
            use_cache: Whether to use cached version
            
        Returns:
            Image bytes or None if fetch fails
        """
        cache_key = self._cache_key(url)
        
        # Check cache
        if use_cache and cache_key in self._cache:
            cached = self._cache[cache_key]
            if not cached.is_expired():
                return cached.data
        
        # Fetch from URL
        try:
            import httpx
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=30.0)
                response.raise_for_status()
                
                content_type = response.headers.get("content-type", "image/png")
                data = response.content
                
                # Cache the result
                self._cache[cache_key] = CachedAsset(
                    data=data,
                    content_type=content_type,
                    cached_at=datetime.now(),
                    ttl_seconds=self.cache_ttl,
                )
                self._cleanup_cache()
                
                return data
                
        except Exception as e:
            print(f"Failed to fetch image from {url}: {e}")
            return None
    
    async def fetch_images_batch(
        self,
        urls: list[str],
    ) -> dict[str, bytes]:
        """
        Fetch multiple images concurrently.
        
        Args:
            urls: List of image URLs
            
        Returns:
            Dict mapping URL to bytes
        """
        tasks = [self.fetch_image(url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        return {
            url: result
            for url, result in zip(urls, results)
            if isinstance(result, bytes)
        }
    
    def get_font_path(self, font_name: str) -> Optional[str]:
        """
        Get path to font file.
        
        Args:
            font_name: Font name (case-insensitive)
            
        Returns:
            Path to font file or None
        """
        return self._font_registry.get(font_name.lower())
    
    def load_font(self, font_name: str) -> Optional[bytes]:
        """
        Load font file contents.
        
        Args:
            font_name: Font name
            
        Returns:
            Font file bytes or None
        """
        path = self.get_font_path(font_name)
        if path and os.path.exists(path):
            with open(path, "rb") as f:
                return f.read()
        return None
    
    def image_to_base64(self, data: bytes, content_type: str = "image/png") -> str:
        """Convert image bytes to base64 data URL"""
        b64 = base64.b64encode(data).decode("utf-8")
        return f"data:{content_type};base64,{b64}"
    
    def image_from_base64(self, data_url: str) -> bytes:
        """Extract bytes from base64 data URL"""
        if data_url.startswith("data:"):
            # Remove data URL prefix
            _, encoded = data_url.split(",", 1)
            return base64.b64decode(encoded)
        return base64.b64decode(data_url)
    
    def register_font(self, name: str, path: str) -> None:
        """Register a custom font"""
        if os.path.exists(path):
            self._font_registry[name.lower()] = path
    
    def list_fonts(self) -> list[str]:
        """List available fonts"""
        return list(self._font_registry.keys())
    
    def get_cache_stats(self) -> dict:
        """Get cache statistics"""
        expired = sum(1 for v in self._cache.values() if v.is_expired())
        return {
            "total_entries": len(self._cache),
            "expired_entries": expired,
            "active_entries": len(self._cache) - expired,
            "fonts_registered": len(self._font_registry),
        }


# Singleton instance
_asset_manager: Optional[AssetManager] = None


def get_asset_manager() -> AssetManager:
    """Get singleton asset manager"""
    global _asset_manager
    if _asset_manager is None:
        _asset_manager = AssetManager()
    return _asset_manager
