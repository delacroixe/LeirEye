# API de NetMentor

Documentación de la API REST de NetMentor para integración y automatización.

## 🌐 Información General

| Propiedad | Valor |
|-----------|-------|
| **Base URL** | `http://localhost:8000` |
| **Documentación Interactiva** | `http://localhost:8000/docs` |
| **Formato** | JSON |
| **Autenticación** | JWT Bearer Token |

## 📚 Secciones

<div class="grid cards" markdown>

-   :material-lock:{ .lg .middle } **Autenticación**

    ---

    Registro, login y manejo de tokens JWT

    [:octicons-arrow-right-24: Ver](authentication.md)

-   :material-api:{ .lg .middle } **Endpoints**

    ---

    Todos los endpoints disponibles

    [:octicons-arrow-right-24: Ver](endpoints.md)

-   :material-sync:{ .lg .middle } **WebSocket**

    ---

    Streaming de paquetes en tiempo real

    [:octicons-arrow-right-24: Ver](websocket.md)

</div>

## 🚀 Inicio Rápido

### 1. Registrar Usuario

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "myuser",
    "password": "Password123",
    "full_name": "Mi Nombre"
  }'
```

### 2. Obtener Token

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123"
  }'

# Respuesta:
# {
#   "access_token": "eyJhbGci...",
#   "refresh_token": "eyJhbGci...",
#   "token_type": "bearer"
# }
```

### 3. Usar Token

```bash
# Guardar token
export TOKEN="eyJhbGci..."

# Hacer petición autenticada
curl http://localhost:8000/api/capture/interfaces \
  -H "Authorization: Bearer $TOKEN"
```

## 📋 Endpoints Principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Obtener tokens |
| POST | `/api/auth/refresh` | Renovar token |
| GET | `/api/capture/interfaces` | Listar interfaces de red |
| POST | `/api/capture/start` | Iniciar captura |
| POST | `/api/capture/stop` | Detener captura |
| GET | `/api/capture/packets` | Obtener paquetes capturados |
| GET | `/api/stats/summary` | Estadísticas de tráfico |
| GET | `/api/system/info` | Información del sistema |
| POST | `/api/ai/explain` | Explicar paquete con IA |

## 🔐 Autenticación

La API usa JWT (JSON Web Tokens):

```
┌────────────────────────────────────────────────┐
│ Authorization: Bearer eyJhbGciOiJIUzI1NiIs... │
└────────────────────────────────────────────────┘
```

**Flujo de autenticación:**

```mermaid
sequenceDiagram
    participant C as Cliente
    participant A as API
    
    C->>A: POST /auth/login (email, password)
    A->>C: access_token + refresh_token
    
    C->>A: GET /capture/packets + Bearer Token
    A->>C: 200 OK + datos
    
    Note over C,A: Token expira (30 min)
    
    C->>A: POST /auth/refresh + refresh_token
    A->>C: Nuevo access_token
```

## 🔒 Roles y Permisos

| Rol | Permisos |
|-----|----------|
| **ADMIN** | Todo: captura, stats, gestión usuarios, sistema |
| **ANALYST** | Captura, stats, AI, consultas |
| **VIEWER** | Solo lectura de datos |

## 📊 Códigos de Respuesta

| Código | Significado |
|--------|-------------|
| 200 | OK - Petición exitosa |
| 201 | Created - Recurso creado |
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - Token inválido/expirado |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no existe |
| 500 | Server Error - Error interno |

## 🛠️ Herramientas Recomendadas

- **Swagger UI**: `http://localhost:8000/docs`
- **cURL**: Línea de comandos
- **HTTPie**: CLI más amigable
- **Postman/Insomnia**: GUI para APIs
- **Python requests**: Scripting

## 💡 Ejemplos de Uso

### Python

```python
import requests

BASE_URL = "http://localhost:8000"

# Login
response = requests.post(f"{BASE_URL}/api/auth/login", json={
    "email": "user@example.com",
    "password": "Password123"
})
token = response.json()["access_token"]

# Headers para peticiones autenticadas
headers = {"Authorization": f"Bearer {token}"}

# Obtener interfaces
interfaces = requests.get(
    f"{BASE_URL}/api/capture/interfaces",
    headers=headers
).json()

print(interfaces)
```

### JavaScript/TypeScript

```typescript
const BASE_URL = "http://localhost:8000";

async function getPackets() {
  // Login
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "user@example.com",
      password: "Password123"
    })
  });
  const { access_token } = await loginRes.json();
  
  // Get packets
  const packetsRes = await fetch(`${BASE_URL}/api/capture/packets`, {
    headers: { "Authorization": `Bearer ${access_token}` }
  });
  
  return packetsRes.json();
}
```
