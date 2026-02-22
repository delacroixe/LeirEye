"""
Esquemas Pydantic para LeirEye
"""

from .alerts import (
    Alert,
    AlertCreate,
    AlertFilter,
    AlertSeverity,
    AlertSource,
    AlertStats,
    AlertType,
)
from .auth import (
    AuthResponse,
    MessageResponse,
    PasswordChange,
    TokenRefresh,
    TokenResponse,
    UserLogin,
    UserPublic,
    UserRegister,
    UserResponse,
)
from .capture import CaptureRequest, CaptureStats, CaptureStatus, PacketData
from .dns import (
    DNSProcessStats,
    DNSQuery,
    DNSRecord,
    DNSResponse,
    DNSStats,
    DNSTunnelingIndicators,
)

__all__ = [
    # Auth
    "UserRegister",
    "UserLogin",
    "TokenRefresh",
    "PasswordChange",
    "TokenResponse",
    "UserResponse",
    "UserPublic",
    "AuthResponse",
    "MessageResponse",
    # Capture
    "PacketData",
    "CaptureStats",
    "CaptureRequest",
    "CaptureStatus",
    # Alerts
    "Alert",
    "AlertCreate",
    "AlertType",
    "AlertSeverity",
    "AlertSource",
    "AlertStats",
    "AlertFilter",
    # DNS
    "DNSQuery",
    "DNSResponse",
    "DNSRecord",
    "DNSStats",
    "DNSProcessStats",
    "DNSTunnelingIndicators",
]
