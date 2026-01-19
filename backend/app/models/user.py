"""
Modelo de Usuario con roles preparados para granularidad futura
"""

from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Boolean, DateTime, Enum as SQLEnum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum

from ..core.database import Base


class UserRole(str, enum.Enum):
    """
    Roles de usuario.
    Preparado para extensión futura con permisos granulares.
    """

    ADMIN = "admin"  # Acceso total
    ANALYST = "analyst"  # Puede capturar y analizar
    VIEWER = "viewer"  # Solo lectura

    @property
    def permissions(self) -> List[str]:
        """Permisos asociados a cada rol (extensible)"""
        role_permissions = {
            UserRole.ADMIN: [
                "users:read",
                "users:write",
                "users:delete",
                "capture:start",
                "capture:stop",
                "capture:export",
                "settings:read",
                "settings:write",
                "sessions:read",
                "sessions:write",
                "sessions:delete",
            ],
            UserRole.ANALYST: [
                "capture:start",
                "capture:stop",
                "capture:export",
                "sessions:read",
                "sessions:write",
            ],
            UserRole.VIEWER: ["sessions:read"],
        }
        return role_permissions.get(self, [])

    def has_permission(self, permission: str) -> bool:
        """Verificar si el rol tiene un permiso específico"""
        return permission in self.permissions


class User(Base):
    """Modelo de Usuario"""

    __tablename__ = "users"

    # ID
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Credenciales
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    username: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)

    # Perfil
    full_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Rol y permisos
    role: Mapped[UserRole] = mapped_column(
        SQLEnum(UserRole), default=UserRole.VIEWER, nullable=False
    )

    # Para permisos granulares futuros (JSON de permisos extra)
    custom_permissions: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True  # JSON string de permisos adicionales
    )

    # Estado
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False  # Requiere verificación de email
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relaciones (para futuro)
    # capture_sessions: Mapped[List["CaptureSession"]] = relationship(back_populates="user")

    def __repr__(self) -> str:
        return f"<User {self.username} ({self.role.value})>"

    def has_permission(self, permission: str) -> bool:
        """
        Verificar si el usuario tiene un permiso.
        Primero verifica permisos del rol, luego custom_permissions.
        """
        # Admins tienen todos los permisos
        if self.role == UserRole.ADMIN:
            return True

        # Verificar permisos del rol
        if self.role.has_permission(permission):
            return True

        # Verificar permisos personalizados (si existen)
        if self.custom_permissions:
            import json

            try:
                custom = json.loads(self.custom_permissions)
                return permission in custom.get("permissions", [])
            except json.JSONDecodeError:
                pass

        return False
