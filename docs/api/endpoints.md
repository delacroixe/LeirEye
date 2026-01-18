# Endpoints de la API

Referencia completa de todos los endpoints disponibles en NetMentor.

## 🔐 Autenticación

Ver [documentación de autenticación](authentication.md) para detalles.

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/refresh` | Renovar token |
| GET | `/api/auth/me` | Usuario actual |
| POST | `/api/auth/logout` | Cerrar sesión |

---

## 📡 Captura de Paquetes

### Listar Interfaces

```
GET /api/capture/interfaces
```

**Response:**
```json
{
  "interfaces": [
    {
      "name": "en0",
      "description": "Wi-Fi",
      "addresses": ["192.168.1.100"],
      "is_up": true
    },
    {
      "name": "lo0",
      "description": "Loopback",
      "addresses": ["127.0.0.1"],
      "is_up": true
    }
  ]
}
```

---

### Iniciar Captura

```
POST /api/capture/start
```

**Request:**
```json
{
  "interface": "en0",
  "filter": "tcp port 80",
  "packet_count": 100
}
```

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `interface` | string | Nombre de la interfaz |
| `filter` | string | Filtro BPF (opcional) |
| `packet_count` | int | Límite de paquetes (opcional) |

**Response:**
```json
{
  "status": "capturing",
  "session_id": "abc123",
  "interface": "en0",
  "started_at": "2024-01-20T10:30:00Z"
}
```

---

### Detener Captura

```
POST /api/capture/stop
```

**Response:**
```json
{
  "status": "stopped",
  "packets_captured": 156,
  "duration_seconds": 45
}
```

---

### Obtener Estado

```
GET /api/capture/status
```

**Response:**
```json
{
  "is_capturing": true,
  "interface": "en0",
  "packets_captured": 89,
  "started_at": "2024-01-20T10:30:00Z"
}
```

---

### Listar Paquetes

```
GET /api/capture/packets
```

**Query Parameters:**

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `limit` | int | 100 | Máximo de paquetes |
| `offset` | int | 0 | Paginación |
| `protocol` | string | - | Filtrar por protocolo |
| `src_ip` | string | - | Filtrar por IP origen |
| `dst_ip` | string | - | Filtrar por IP destino |

**Response:**
```json
{
  "packets": [
    {
      "id": 1,
      "timestamp": "2024-01-20T10:30:01.123Z",
      "src_ip": "192.168.1.100",
      "dst_ip": "8.8.8.8",
      "src_port": 54321,
      "dst_port": 53,
      "protocol": "UDP",
      "length": 64,
      "info": "DNS Query: google.com"
    }
  ],
  "total": 156,
  "limit": 100,
  "offset": 0
}
```

---

### Detalle de Paquete

```
GET /api/capture/packets/{packet_id}
```

**Response:**
```json
{
  "id": 1,
  "timestamp": "2024-01-20T10:30:01.123Z",
  "layers": {
    "ethernet": {
      "src_mac": "aa:bb:cc:dd:ee:ff",
      "dst_mac": "11:22:33:44:55:66",
      "type": "IPv4"
    },
    "ip": {
      "version": 4,
      "src": "192.168.1.100",
      "dst": "8.8.8.8",
      "ttl": 64,
      "protocol": "UDP"
    },
    "udp": {
      "src_port": 54321,
      "dst_port": 53,
      "length": 44
    },
    "dns": {
      "query": "google.com",
      "type": "A"
    }
  },
  "raw_hex": "4500003c..."
}
```

---

## 📊 Estadísticas

### Resumen General

```
GET /api/stats/summary
```

**Response:**
```json
{
  "total_packets": 1567,
  "total_bytes": 2345678,
  "capture_duration": 300,
  "packets_per_second": 5.22,
  "protocols": {
    "TCP": 1200,
    "UDP": 300,
    "ICMP": 50,
    "Other": 17
  },
  "top_sources": [
    {"ip": "192.168.1.100", "packets": 800},
    {"ip": "192.168.1.1", "packets": 400}
  ],
  "top_destinations": [
    {"ip": "8.8.8.8", "packets": 200},
    {"ip": "142.250.185.14", "packets": 150}
  ]
}
```

---

### Estadísticas por Protocolo

```
GET /api/stats/protocols
```

**Response:**
```json
{
  "protocols": [
    {
      "name": "TCP",
      "packets": 1200,
      "bytes": 1800000,
      "percentage": 76.5
    },
    {
      "name": "UDP",
      "packets": 300,
      "bytes": 45000,
      "percentage": 19.1
    }
  ]
}
```

---

### Estadísticas por IP

```
GET /api/stats/ips
```

**Query Parameters:**

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `direction` | string | "both" | "source", "destination", "both" |
| `limit` | int | 10 | Top N IPs |

**Response:**
```json
{
  "sources": [
    {
      "ip": "192.168.1.100",
      "packets": 800,
      "bytes": 120000,
      "protocols": ["TCP", "UDP", "ICMP"]
    }
  ],
  "destinations": [
    {
      "ip": "8.8.8.8",
      "packets": 200,
      "bytes": 15000,
      "protocols": ["UDP"]
    }
  ]
}
```

---

### Timeline

```
GET /api/stats/timeline
```

**Query Parameters:**

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `interval` | string | "1m" | "1s", "10s", "1m", "5m" |
| `metric` | string | "packets" | "packets", "bytes" |

**Response:**
```json
{
  "interval": "1m",
  "metric": "packets",
  "data": [
    {"timestamp": "2024-01-20T10:30:00Z", "value": 45},
    {"timestamp": "2024-01-20T10:31:00Z", "value": 52},
    {"timestamp": "2024-01-20T10:32:00Z", "value": 38}
  ]
}
```

---

## 🗺️ Mapa de Red

### Obtener Nodos y Conexiones

```
GET /api/network/map
```

**Response:**
```json
{
  "nodes": [
    {
      "id": "192.168.1.100",
      "label": "My-PC",
      "type": "local",
      "packets": 800
    },
    {
      "id": "192.168.1.1",
      "label": "Router",
      "type": "gateway",
      "packets": 400
    },
    {
      "id": "8.8.8.8",
      "label": "dns.google",
      "type": "external",
      "packets": 200
    }
  ],
  "edges": [
    {
      "source": "192.168.1.100",
      "target": "8.8.8.8",
      "packets": 200,
      "protocols": ["UDP"]
    }
  ]
}
```

---

## 🤖 Explicador IA

### Explicar Paquete

```
POST /api/ai/explain
```

**Request:**
```json
{
  "packet_id": 42,
  "detail_level": "intermediate"
}
```

| Parámetro | Tipo | Opciones | Descripción |
|-----------|------|----------|-------------|
| `packet_id` | int | - | ID del paquete |
| `detail_level` | string | "basic", "intermediate", "advanced" | Nivel de detalle |

**Response:**
```json
{
  "explanation": "Este paquete es una consulta DNS...",
  "security_assessment": {
    "risk_level": "low",
    "concerns": [],
    "recommendations": []
  },
  "related_concepts": ["DNS", "UDP", "Port 53"]
}
```

---

## 💻 Sistema

### Información del Sistema

```
GET /api/system/info
```

**Response:**
```json
{
  "os": {
    "name": "macOS",
    "version": "14.2.1",
    "architecture": "arm64"
  },
  "network": {
    "hostname": "MacBook-Pro.local",
    "interfaces": 5,
    "gateway": "192.168.1.1",
    "dns_servers": ["8.8.8.8", "8.8.4.4"]
  },
  "resources": {
    "cpu_percent": 15.2,
    "memory_percent": 45.8,
    "disk_percent": 62.1
  },
  "netmentor": {
    "version": "2.0.0",
    "uptime_seconds": 3600
  }
}
```

---

### Health Check

```
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "ollama": "connected",
  "timestamp": "2024-01-20T10:30:00Z"
}
```

---

## 👥 Usuarios (Admin)

### Listar Usuarios

```
GET /api/users
```

!!! note "Requiere rol ADMIN"

**Response:**
```json
{
  "users": [
    {
      "id": 1,
      "email": "admin@example.com",
      "username": "admin",
      "role": "ADMIN",
      "is_active": true,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 5
}
```

---

### Actualizar Rol

```
PATCH /api/users/{user_id}/role
```

**Request:**
```json
{
  "role": "ANALYST"
}
```

**Response:**
```json
{
  "id": 2,
  "username": "analyst1",
  "role": "ANALYST",
  "updated_at": "2024-01-20T10:30:00Z"
}
```

---

## 📤 Exportar

### Exportar Paquetes

```
GET /api/export/packets
```

**Query Parameters:**

| Parámetro | Tipo | Opciones | Descripción |
|-----------|------|----------|-------------|
| `format` | string | "json", "csv", "pcap" | Formato de salida |
| `limit` | int | - | Límite de paquetes |

**Response:**
- `json`: Objeto JSON con paquetes
- `csv`: Archivo CSV descargable
- `pcap`: Archivo PCAP descargable

---

### Exportar Estadísticas

```
GET /api/export/stats
```

**Query Parameters:**

| Parámetro | Tipo | Opciones | Descripción |
|-----------|------|----------|-------------|
| `format` | string | "json", "csv", "pdf" | Formato de salida |

---

## ⚠️ Manejo de Errores

Todas las respuestas de error siguen este formato:

```json
{
  "detail": "Descripción del error",
  "error_code": "INVALID_TOKEN",
  "timestamp": "2024-01-20T10:30:00Z"
}
```

### Códigos de Error Comunes

| Código HTTP | error_code | Descripción |
|-------------|------------|-------------|
| 400 | INVALID_REQUEST | Datos de entrada inválidos |
| 401 | INVALID_TOKEN | Token JWT inválido o expirado |
| 401 | MISSING_TOKEN | No se proporcionó token |
| 403 | INSUFFICIENT_PERMISSIONS | Sin permisos para esta acción |
| 404 | NOT_FOUND | Recurso no encontrado |
| 429 | RATE_LIMITED | Demasiadas peticiones |
| 500 | INTERNAL_ERROR | Error interno del servidor |
