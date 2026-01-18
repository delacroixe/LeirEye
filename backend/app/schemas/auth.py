"""
Esquemas Pydantic para autenticación
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, validator
import re


# ============================================================================
# Request Schemas
# ============================================================================

class UserRegister(BaseModel):
    """Esquema para registro de usuario"""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8, max_length=100)
    full_name: Optional[str] = Field(None, max_length=100)
    
    @validator("username")
    def username_alphanumeric(cls, v):
        if not re.match(r"^[a-zA-Z0-9_]+$", v):
            raise ValueError("Username solo puede contener letras, números y guiones bajos")
        return v
    
    @validator("password")
    def password_strength(cls, v):
        if not re.search(r"[A-Z]", v):
            raise ValueError("La contraseña debe contener al menos una mayúscula")
        if not re.search(r"[a-z]", v):
            raise ValueError("La contraseña debe contener al menos una minúscula")
        if not re.search(r"\d", v):
            raise ValueError("La contraseña debe contener al menos un número")
        return v


class UserLogin(BaseModel):
    """Esquema para login"""
    email: EmailStr
    password: str


class TokenRefresh(BaseModel):
    """Esquema para refresh token"""
    refresh_token: str


class PasswordChange(BaseModel):
    """Esquema para cambio de contraseña"""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)


class PasswordReset(BaseModel):
    """Esquema para resetear contraseña"""
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)


# ============================================================================
# Response Schemas
# ============================================================================

class TokenResponse(BaseModel):
    """Respuesta de tokens"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # segundos


class UserResponse(BaseModel):
    """Respuesta de usuario (sin datos sensibles)"""
    id: str
    email: str
    username: str
    full_name: Optional[str]
    avatar_url: Optional[str]
    role: str
    permissions: List[str]
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime]
    
    class Config:
        from_attributes = True


class UserPublic(BaseModel):
    """Información pública de usuario"""
    id: str
    username: str
    full_name: Optional[str]
    avatar_url: Optional[str]
    role: str
    
    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    """Respuesta completa de autenticación"""
    user: UserResponse
    tokens: TokenResponse


class MessageResponse(BaseModel):
    """Respuesta de mensaje genérico"""
    message: str
    success: bool = True
