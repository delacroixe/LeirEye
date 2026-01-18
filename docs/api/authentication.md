# Autenticación

NetMentor usa JWT (JSON Web Tokens) para autenticación segura.

## 🔐 Flujo de Autenticación

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    
    U->>F: 1. Ingresar credenciales
    F->>B: 2. POST /auth/login
    B->>DB: 3. Verificar usuario
    DB->>B: 4. Usuario válido
    B->>F: 5. access_token + refresh_token
    F->>F: 6. Guardar tokens
    
    Note over F,B: Peticiones autenticadas
    
    F->>B: 7. GET /api/... + Bearer token
    B->>F: 8. Datos protegidos
```

## 📝 Registro

### Endpoint

```
POST /api/auth/register
```

### Request

```json
{
  "email": "usuario@ejemplo.com",
  "username": "mi_usuario",
  "password": "Password123!",
  "full_name": "Nombre Completo"
}
```

### Validaciones

| Campo | Reglas |
|-------|--------|
| `email` | Formato válido, único |
| `username` | 3-50 caracteres, único, alfanumérico |
| `password` | Mín 8 chars, mayúscula, minúscula, número |
| `full_name` | Opcional, máx 100 chars |

### Response (201 Created)

```json
{
  "id": 1,
  "email": "usuario@ejemplo.com",
  "username": "mi_usuario",
  "full_name": "Nombre Completo",
  "role": "ADMIN",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z"
}
```

!!! tip "Primer Usuario"
    El primer usuario registrado obtiene rol **ADMIN** automáticamente.
    Los siguientes obtienen rol **VIEWER** por defecto.

### Errores

| Código | Mensaje | Causa |
|--------|---------|-------|
| 400 | Email already registered | Email duplicado |
| 400 | Username already taken | Username duplicado |
| 422 | Validation error | Campos inválidos |

## 🔑 Login

### Endpoint

```
POST /api/auth/login
```

### Request

```json
{
  "email": "usuario@ejemplo.com",
  "password": "Password123!"
}
```

### Response (200 OK)

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

### Tokens

| Token | Duración | Uso |
|-------|----------|-----|
| `access_token` | 30 minutos | Autenticar peticiones |
| `refresh_token` | 7 días | Obtener nuevo access_token |

### Errores

| Código | Mensaje | Causa |
|--------|---------|-------|
| 401 | Invalid credentials | Email o password incorrectos |
| 403 | Account disabled | Usuario desactivado |

## 🔄 Refresh Token

Cuando el `access_token` expira, usa el `refresh_token` para obtener uno nuevo.

### Endpoint

```
POST /api/auth/refresh
```

### Request

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Response (200 OK)

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

### Errores

| Código | Mensaje | Causa |
|--------|---------|-------|
| 401 | Invalid refresh token | Token inválido o expirado |

## 👤 Obtener Usuario Actual

### Endpoint

```
GET /api/auth/me
```

### Headers

```
Authorization: Bearer <access_token>
```

### Response (200 OK)

```json
{
  "id": 1,
  "email": "usuario@ejemplo.com",
  "username": "mi_usuario",
  "full_name": "Nombre Completo",
  "role": "ADMIN",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z",
  "last_login": "2024-01-20T08:45:00Z"
}
```

## 🚪 Logout

### Endpoint

```
POST /api/auth/logout
```

### Headers

```
Authorization: Bearer <access_token>
```

### Response (200 OK)

```json
{
  "message": "Successfully logged out"
}
```

!!! note "Implementación"
    El logout invalida el token en el servidor.
    El frontend también debe eliminar los tokens guardados.

## 🔒 Usar Tokens

### En Headers HTTP

```bash
curl http://localhost:8000/api/capture/packets \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### En JavaScript

```javascript
const response = await fetch('/api/capture/packets', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

### En Python

```python
import requests

headers = {
    'Authorization': f'Bearer {access_token}'
}

response = requests.get(
    'http://localhost:8000/api/capture/packets',
    headers=headers
)
```

## 🛡️ Estructura del JWT

El token contiene información del usuario:

```json
{
  "sub": "1",
  "email": "usuario@ejemplo.com",
  "role": "ADMIN",
  "exp": 1705312200,
  "iat": 1705310400
}
```

| Campo | Descripción |
|-------|-------------|
| `sub` | ID del usuario |
| `email` | Email del usuario |
| `role` | Rol (ADMIN, ANALYST, VIEWER) |
| `exp` | Timestamp de expiración |
| `iat` | Timestamp de creación |

## 👥 Roles y Permisos

### ADMIN

- ✅ Todo lo de ANALYST
- ✅ Gestionar usuarios
- ✅ Ver logs del sistema
- ✅ Configuración global

### ANALYST

- ✅ Todo lo de VIEWER
- ✅ Iniciar/detener capturas
- ✅ Usar explicador IA
- ✅ Exportar datos

### VIEWER

- ✅ Ver paquetes capturados
- ✅ Ver estadísticas
- ✅ Ver mapa de red
- ❌ No puede capturar
- ❌ No puede modificar

## 🔧 Ejemplo Completo

```python
import requests
import time

BASE_URL = "http://localhost:8000"

class NetMentorClient:
    def __init__(self):
        self.access_token = None
        self.refresh_token = None
        self.token_expires = 0
    
    def login(self, email, password):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        response.raise_for_status()
        data = response.json()
        
        self.access_token = data["access_token"]
        self.refresh_token = data["refresh_token"]
        self.token_expires = time.time() + data["expires_in"]
    
    def _get_headers(self):
        # Auto-refresh si el token está por expirar
        if time.time() > self.token_expires - 60:
            self._refresh()
        
        return {"Authorization": f"Bearer {self.access_token}"}
    
    def _refresh(self):
        response = requests.post(f"{BASE_URL}/api/auth/refresh", json={
            "refresh_token": self.refresh_token
        })
        response.raise_for_status()
        data = response.json()
        
        self.access_token = data["access_token"]
        self.token_expires = time.time() + data["expires_in"]
    
    def get_packets(self):
        response = requests.get(
            f"{BASE_URL}/api/capture/packets",
            headers=self._get_headers()
        )
        response.raise_for_status()
        return response.json()

# Uso
client = NetMentorClient()
client.login("user@example.com", "Password123")
packets = client.get_packets()
print(packets)
```
