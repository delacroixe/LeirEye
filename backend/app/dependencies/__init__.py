"""
Dependencias de FastAPI para LeirEye
"""
from .auth import (
    get_current_user,
    get_current_user_optional,
    get_current_active_verified_user,
    require_role,
    require_permission,
    require_admin,
    require_analyst,
    require_viewer
)

__all__ = [
    "get_current_user",
    "get_current_user_optional", 
    "get_current_active_verified_user",
    "require_role",
    "require_permission",
    "require_admin",
    "require_analyst",
    "require_viewer"
]
