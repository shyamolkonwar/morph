"""
JWT Authentication Dependency
Validates Supabase JWT tokens and extracts user information
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from typing import Optional
from pydantic import BaseModel

from app.config import get_settings


security = HTTPBearer()


class CurrentUser(BaseModel):
    """Authenticated user information from JWT"""
    user_id: str
    email: Optional[str] = None
    role: Optional[str] = None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> CurrentUser:
    """
    Validate Supabase JWT and extract user information.
    
    Usage:
        @app.get("/protected")
        async def protected_route(user: CurrentUser = Depends(get_current_user)):
            return {"user_id": user.user_id}
    
    Raises:
        HTTPException: 401 if token is invalid or expired
    """
    settings = get_settings()
    
    if not settings.supabase_jwt_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JWT secret not configured"
        )
    
    token = credentials.credentials
    
    try:
        # Decode and verify JWT
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False}  # Supabase doesn't use aud claim
        )
        
        # Extract user information
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID"
            )
        
        return CurrentUser(
            user_id=user_id,
            email=payload.get("email"),
            role=payload.get("role")
        )
        
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> Optional[CurrentUser]:
    """
    Optional authentication - returns None if no token provided.
    
    Usage:
        @app.get("/optional-auth")
        async def route(user: Optional[CurrentUser] = Depends(get_optional_user)):
            if user:
                return {"message": f"Hello {user.user_id}"}
            return {"message": "Hello anonymous"}
    """
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None
