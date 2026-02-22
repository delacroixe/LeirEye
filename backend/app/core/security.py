"""
Funciones de seguridad: hashing de passwords y JWT
"""

import hashlib
import logging
from datetime import datetime, timedelta
from typing import Any, Optional

import bcrypt
from jose import JWTError, jwt

from .config import settings

logger = logging.getLogger(__name__)


# ==================== PASSWORD ====================


def _normalize_password(password: str) -> str:
    """
    Normalizar contraseña usando SHA-256 para asegurar que no exceda 72 bytes.
    Esto previene el error: "password cannot be longer than 72 bytes"
    
    Args:
        password: Contraseña en plaintext
        
    Returns:
        Hash SHA-256 de 64 caracteres (siempre < 72 bytes)
    """
    return hashlib.sha256(password.encode('utf-8')).hexdigest()


def _bcrypt_verify(password: str, hashed: str) -> bool:
    """Verificar password con bcrypt directamente"""
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False


def _bcrypt_hash(password: str) -> str:
    """Generar hash bcrypt directamente"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verificar password contra hash bcrypt.
    Normaliza el plaintext con SHA-256 antes de verificar.
    
    Estrategias de compatibilidad:
    1. SHA-256 normalizado (nuevo método)
    2. Plaintext directo (hashes antiguos <72 bytes)
    3. Plaintext truncado a 72 bytes (hashes antiguos >72 bytes)
    """
    try:
        # Estrategia 1: Verificar con SHA-256 normalizado (nuevo método)
        normalized = _normalize_password(plain_password)
        if _bcrypt_verify(normalized, hashed_password):
            return True
        
        # Estrategia 2: Verificar directamente (hashes antiguos <72 bytes)
        if len(plain_password.encode('utf-8')) <= 72:
            if _bcrypt_verify(plain_password, hashed_password):
                logger.debug("✓ Password verificado con método antiguo (compatibilidad <72 bytes)")
                return True
        
        # Estrategia 3: Truncar a 72 bytes (hashes antiguos >72 bytes truncados)
        truncated = plain_password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
        if _bcrypt_verify(truncated, hashed_password):
            logger.debug("✓ Password verificado con método antiguo (compatibilidad truncado)")
            return True
        
        # Todas las estrategias fallaron
        return False
        
    except Exception as e:
        logger.error(f"Error inesperado al verificar password: {e}")
        return False


def get_password_hash(password: str) -> str:
    """
    Generar hash bcrypt de password.
    Normaliza la contraseña con SHA-256 antes de hashear con bcrypt.
    Esto asegura que bcrypt nunca reciba >72 bytes.
    """
    normalized = _normalize_password(password)
    return _bcrypt_hash(normalized)


# ==================== JWT TOKENS ====================


def create_access_token(
    subject: str | Any,
    expires_delta: Optional[timedelta] = None,
    additional_claims: Optional[dict] = None,
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
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode = {
        "sub": str(subject),
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access",
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
        "type": "refresh",
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
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError as e:
        logger.warning(f"Error decodificando token: {e}")
        return None


def verify_token(token: str, token_type: str = "access") -> Optional[dict]:
    """
    Verificar token y retornar payload completo

    Args:
        token: Token JWT
        token_type: Tipo esperado ("access" o "refresh")

    Returns:
        Payload completo del token o None si es inválido
    """
    payload = decode_token(token)

    if not payload:
        return None

    # Verificar tipo de token
    if payload.get("type") != token_type:
        logger.warning(
            f"Tipo de token incorrecto: esperado {token_type}, recibido {payload.get('type')}"
        )
        return None

    return payload
    return payload
