"""
Rutas de autenticación para NetMentor
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_token
)
from ..core.config import get_settings
from ..models.user import User, UserRole
from ..schemas.auth import (
    UserRegister,
    UserLogin,
    TokenRefresh,
    PasswordChange,
    TokenResponse,
    UserResponse,
    AuthResponse,
    MessageResponse
)
from ..dependencies.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["Autenticación"])
settings = get_settings()


def user_to_response(user: User) -> UserResponse:
    """Convertir modelo User a esquema de respuesta"""
    return UserResponse(
        id=str(user.id),
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        role=user.role.value,
        permissions=user.role.permissions,
        is_active=user.is_active,
        is_verified=user.is_verified,
        created_at=user.created_at,
        last_login=user.last_login
    )


def create_tokens(user_id: str) -> TokenResponse:
    """Crear tokens de acceso y refresh"""
    access_token = create_access_token(subject=user_id)
    refresh_token = create_refresh_token(subject=user_id)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    data: UserRegister,
    db: AsyncSession = Depends(get_db)
):
    """
    Registrar nuevo usuario.
    
    - El primer usuario registrado será ADMIN automáticamente
    - Los siguientes usuarios serán VIEWER por defecto
    """
    # Verificar si email o username ya existen
    result = await db.execute(
        select(User).where(
            or_(User.email == data.email, User.username == data.username)
        )
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        if existing.email == data.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El email ya está registrado"
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario ya existe"
        )
    
    # Verificar si es el primer usuario (será admin)
    result = await db.execute(select(User).limit(1))
    is_first_user = result.scalar_one_or_none() is None
    
    # Crear usuario
    user = User(
        email=data.email,
        username=data.username,
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name,
        role=UserRole.ADMIN if is_first_user else UserRole.VIEWER,
        is_verified=is_first_user,  # Primer usuario auto-verificado
        is_active=True
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Generar tokens
    tokens = create_tokens(str(user.id))
    
    return AuthResponse(
        user=user_to_response(user),
        tokens=tokens
    )


@router.post("/login", response_model=AuthResponse)
async def login(
    data: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """
    Iniciar sesión con email y contraseña.
    """
    # Buscar usuario por email
    result = await db.execute(
        select(User).where(User.email == data.email)
    )
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cuenta desactivada"
        )
    
    # Actualizar último login
    user.last_login = datetime.utcnow()
    await db.commit()
    await db.refresh(user)
    
    # Generar tokens
    tokens = create_tokens(str(user.id))
    
    return AuthResponse(
        user=user_to_response(user),
        tokens=tokens
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    data: TokenRefresh,
    db: AsyncSession = Depends(get_db)
):
    """
    Renovar access token usando refresh token.
    """
    payload = verify_token(data.refresh_token, token_type="refresh")
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido o expirado"
        )
    
    user_id = payload.get("sub")
    
    # Verificar que el usuario aún existe y está activo
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no válido"
        )
    
    # Generar nuevos tokens
    return create_tokens(str(user.id))


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Obtener información del usuario actual.
    """
    return user_to_response(current_user)


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    full_name: str = None,
    avatar_url: str = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Actualizar perfil del usuario actual.
    """
    if full_name is not None:
        current_user.full_name = full_name
    if avatar_url is not None:
        current_user.avatar_url = avatar_url
    
    await db.commit()
    await db.refresh(current_user)
    
    return user_to_response(current_user)


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Cambiar contraseña del usuario actual.
    """
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contraseña actual incorrecta"
        )
    
    current_user.hashed_password = get_password_hash(data.new_password)
    await db.commit()
    
    return MessageResponse(
        message="Contraseña actualizada correctamente",
        success=True
    )


@router.post("/logout", response_model=MessageResponse)
async def logout(
    current_user: User = Depends(get_current_user)
):
    """
    Cerrar sesión (invalidar token en cliente).
    
    Nota: Con JWT stateless, el logout real ocurre en el cliente.
    Para logout server-side, se necesitaría una blacklist de tokens (Redis).
    """
    return MessageResponse(
        message="Sesión cerrada correctamente",
        success=True
    )


@router.get("/verify-token", response_model=MessageResponse)
async def verify_access_token(
    current_user: User = Depends(get_current_user)
):
    """
    Verificar si el token actual es válido.
    Útil para el frontend al cargar la aplicación.
    """
    return MessageResponse(
        message="Token válido",
        success=True
    )
