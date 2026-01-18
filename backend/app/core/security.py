"""
Funciones de seguridad: hashing de passwords y JWT
"""
from datetime import datetime, timedelta
from typing import Optional, Any
from jose import jwt, JWTError
from passlib.context import CryptContext
import logging

from .config import settings

logger = logging.getLogger(__name__)

# Contexto para hashing de passwords
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ==================== PASSWORD ====================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verificar password contra hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generar hash de password"""
    return pwd_context.hash(password)


# ==================== JWT TOKENS ====================

def create_access_token(
    subject: str | Any,
    expires_delta: Optional[timedelta] = None,
    additional_claims: Optional[dict] = None
) -> str:
    """
    Crear token JWT de acceso
    
    Args:
        subject: ID del usuario o identificador único
        expires_delta: Tiempo de expiración personalizado
        additional_claims: Claims adicionales (role, permissions, etc.)
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": str(subject),
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    }
    
    if additional_claims:
        to_encode.update(additional_claims)
    
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(subject: str | Any) -> str:
    """Crear token JWT de refresh (mayor duración)"""
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode = {
        "sub": str(subject),
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh"
    }
    
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    """
    Decodificar y validar token JWT
    
    Returns:
        Payload del token o None si es inválido
    """
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError as e:
        logger.warning(f"Error decodificando token: {e}")
        return None


def verify_token(token: str, token_type: str = "access") -> Optional[str]:
    """
    Verificar token y retornar subject (user_id)
    
    Args:
        token: Token JWT
        token_type: Tipo esperado ("access" o "refresh")
    
    Returns:
        Subject del token (user_id) o None si es inválido
    """
    payload = decode_token(token)
    
    if not payload:
        return None
    
    # Verificar tipo de token
    if payload.get("type") != token_type:
        logger.warning(f"Tipo de token incorrecto: esperado {token_type}, recibido {payload.get('type')}")
        return None
    
    return payload.get("sub")
