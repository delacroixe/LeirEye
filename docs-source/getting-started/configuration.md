# Configuración

Personaliza LeirEye para tus necesidades específicas.

## Archivo de Configuración (.env)

Crea un archivo `.env` en la raíz del proyecto:

```bash
# ===== BASE DE DATOS =====
POSTGRES_USER=leireye
POSTGRES_PASSWORD=tu_contraseña_fuerte
POSTGRES_DB=leireye_db
DATABASE_URL=postgresql://leireye:tu_contraseña_fuerte@db:5432/leireye_db

# ===== BACKEND =====
SECRET_KEY=tu_clave_secreta_muy_larga_min_32_caracteres
DEBUG=false
ENVIRONMENT=production
LOG_LEVEL=INFO

# ===== FRONTEND =====
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000

# ===== IA (OLLAMA) =====
OLLAMA_ENABLED=true
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=mistral

# ===== DOCKER PORTS =====
POSTGRES_PORT=5432
BACKEND_PORT=8000
FRONTEND_PORT=3001
```

## Variables por Sección

### Base de Datos

```yaml
POSTGRES_USER: nombre de usuario (default: leireye)
POSTGRES_PASSWORD: contraseña segura (min 12 caracteres)
POSTGRES_DB: nombre de base de datos (default: leireye_db)
DATABASE_URL: URL de conexión completa
```

### Backend

```yaml
SECRET_KEY: Clave para firmar tokens JWT
           Genera con: openssl rand -hex 32
           
DEBUG: true para desarrollo, false para producción

ENVIRONMENT: development | staging | production

LOG_LEVEL: DEBUG | INFO | WARNING | ERROR | CRITICAL
           Para desarrollo: DEBUG
           Para producción: INFO o WARNING
           
CORS_ORIGINS: URLs permitidas para CORS
             Ej: http://localhost:3001,https://tu-dominio.com
```

### Frontend

```yaml
REACT_APP_API_URL: URL del backend API
                  Desarrollo: http://localhost:8000
                  Producción: https://api.tu-dominio.com

REACT_APP_WS_URL: URL para WebSocket
                 Desarrollo: ws://localhost:8000
                 Producción: wss://api.tu-dominio.com
```

### IA (Ollama)

```yaml
OLLAMA_ENABLED: true | false
               true para activar explicaciones con IA
               
OLLAMA_API_URL: Dirección del servidor Ollama
               Default: http://localhost:11434
               
OLLAMA_MODEL: Modelo a usar
             Opciones: mistral, neural-chat, orca-mini
             Default: mistral (rápido, buena calidad)
```

## Configuración en Docker Compose

Edita `docker-compose.yml`:

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "${POSTGRES_PORT}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  web:
    build: ./backend
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000
    environment:
      DATABASE_URL: ${DATABASE_URL}
      SECRET_KEY: ${SECRET_KEY}
      DEBUG: ${DEBUG}
    ports:
      - "${BACKEND_PORT}:8000"
    depends_on:
      - db

volumes:
  postgres_data:
```

## Configuración del Backend

Archivo: `backend/app/main.py`

```python
from fastapi import FastAPI
from fastapi.cors import CORSMiddleware

app = FastAPI(
    title="LeirEye API",
    version="2.0.0",
    description="API de análisis de tráfico de red"
)

# CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:3001").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
```

## Configuración del Frontend

Archivo: `frontend/.env.local`

```javascript
// src/config.ts
export const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
export const WS_URL = process.env.REACT_APP_WS_URL || "ws://localhost:8000";

// Token JWT
export const TOKEN_EXPIRY = 30 * 60 * 1000; // 30 minutos
export const TOKEN_REFRESH = 25 * 60 * 1000; // Refrescar a los 25 min

// Captura
export const PACKET_BUFFER_SIZE = 1000;
export const UPDATE_INTERVAL = 500; // ms
export const AUTO_CLEAR_AFTER = 5; // minutos
```

## Parámetros de Captura de Paquetes

Archivo: `backend/app/services/packet_capture.py`

```python
# Configuración de captura
PACKET_TIMEOUT = 1  # segundos
SNAPLEN = 65535     # bytes máximos por paquete
BUFFER_SIZE = 10000 # paquetes en memoria

# Filtros BPF
FILTER_HTTP = "tcp port 80 or tcp port 443"
FILTER_DNS = "udp port 53"
FILTER_SSH = "tcp port 22"

# Protocolos a capturar
PROTOCOLS = {
    'tcp': 6,
    'udp': 17,
    'icmp': 1,
}
```

## Configuración de Base de Datos

Archivo: `backend/sqlalchemy.ini`

```ini
[sqlalchemy]
sqlalchemy.url = {DATABASE_URL}
sqlalchemy.echo = false
sqlalchemy.pool_size = 20
sqlalchemy.pool_recycle = 3600
sqlalchemy.pool_pre_ping = true
```

## Niveles de Log

### Desarrollo
```env
LOG_LEVEL=DEBUG
DEBUG=true
```

Salida detallada de todo.

### Staging
```env
LOG_LEVEL=INFO
DEBUG=false
```

Información de eventos principales.

### Producción
```env
LOG_LEVEL=WARNING
DEBUG=false
```

Solo errores y advertencias.

## Seguridad en Producción

### 1. Generar SECRET_KEY

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### 2. Usuarios y Permisos

```bash
# En Linux/macOS
chmod 600 .env
```

### 3. HTTPS

```yaml
# docker-compose.yml
nginx:
  image: nginx:latest
  ports:
    - "443:443"
    - "80:80"
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf
    - ./certs:/etc/nginx/certs
```

### 4. Database

```bash
# Cambiar contraseña por defecto
ALTER USER leireye WITH PASSWORD 'contraseña_fuerte_nueva';
```

## Monitoreo

### Prometheus

```yaml
# docker-compose.yml
prometheus:
  image: prom/prometheus
  ports:
    - "9090:9090"
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
```

### Logs

```bash
# Ver logs en tiempo real
docker-compose logs -f backend

# Logs de la base de datos
docker-compose logs -f db
```

## Rendimiento

### Aumentar límites del sistema

```bash
# macOS
ulimit -n 65536

# Linux
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf
```

### Tuning de PostgreSQL

```sql
-- Conexiones
max_connections = 200

-- Memory
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 16MB

-- Performance
random_page_cost = 1.1
effective_io_concurrency = 200
```

## Troubleshooting de Configuración

| Problema | Solución |
|----------|----------|
| "SECRET_KEY too short" | Debe tener mínimo 32 caracteres |
| "Connection refused" en DB | Verifica DATABASE_URL, puerto 5432 |
| "CORS error" | Agrega tu URL a CORS_ORIGINS |
| "Ollama not found" | Verifica OLLAMA_API_URL y que Ollama esté corriendo |
| "WebSocket timeout" | Aumenta timeout en cliente, verifica firewall |

Para ayuda adicional: [Solución de Problemas](../reference/troubleshooting.md)
