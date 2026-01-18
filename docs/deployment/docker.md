# Despliegue con Docker

Guía completa para desplegar NetMentor usando Docker.

## 🐳 Requisitos

- Docker 24.0+
- Docker Compose 2.0+
- 4 GB RAM mínimo
- 10 GB disco

```bash
# Verificar versiones
docker --version
docker compose version
```

## 📦 Docker Compose (Desarrollo)

### Archivo docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: netmentor-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: netmentor
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: netmentor-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

### Comandos Básicos

```bash
# Iniciar servicios
docker-compose up -d

# Ver estado
docker-compose ps

# Ver logs
docker-compose logs -f

# Parar servicios
docker-compose down

# Parar y borrar datos
docker-compose down -v
```

## 🚀 Docker Compose (Producción)

### docker-compose.prod.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: netmentor-postgres
    environment:
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME:-netmentor}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: netmentor-redis
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: netmentor-backend
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      SECRET_KEY: ${SECRET_KEY}
      CORS_ORIGINS: ${CORS_ORIGINS}
      OLLAMA_HOST: http://ollama:11434
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    cap_add:
      - NET_ADMIN
      - NET_RAW
    network_mode: host  # Para captura de paquetes
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        REACT_APP_API_URL: ${API_URL:-http://localhost:8000}
    container_name: netmentor-frontend
    ports:
      - "3001:80"
    depends_on:
      - backend
    restart: unless-stopped

  ollama:
    image: ollama/ollama:latest
    container_name: netmentor-ollama
    volumes:
      - ollama_data:/root/.ollama
    ports:
      - "11434:11434"
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  ollama_data:
```

### Archivo .env para Producción

```bash
# .env.prod
DB_USER=netmentor
DB_PASSWORD=SecurePassword123!
DB_NAME=netmentor

REDIS_PASSWORD=RedisSecurePass456!

SECRET_KEY=your-very-long-and-secure-secret-key-here-min-32-chars

CORS_ORIGINS=https://tu-dominio.com

API_URL=https://api.tu-dominio.com
```

## 🔨 Dockerfiles

### Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    libpcap-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements primero (cache de Docker)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY . .

# Usuario no-root (excepto para captura)
# RUN useradd -m appuser && chown -R appuser:appuser /app
# USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as build

WORKDIR /app

# Copiar package.json primero
COPY package*.json ./
RUN npm ci

# Copiar código y build
COPY . .

ARG REACT_APP_API_URL=http://localhost:8000
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

# Producción con nginx
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Frontend nginx.conf

```nginx
# frontend/nginx.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 🚀 Desplegar

### 1. Preparar Entorno

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/netmentor.git
cd netmentor

# Crear archivo de entorno
cp .env.example .env.prod
# Editar con valores reales
nano .env.prod
```

### 2. Build y Ejecutar

```bash
# Build de imágenes
docker-compose -f docker-compose.prod.yml build

# Iniciar servicios
docker-compose -f docker-compose.prod.yml up -d

# Verificar estado
docker-compose -f docker-compose.prod.yml ps

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 3. Migraciones

```bash
# Ejecutar migraciones
docker-compose -f docker-compose.prod.yml exec backend \
    alembic upgrade head
```

### 4. Descargar Modelo Ollama

```bash
# Descargar modelo
docker-compose -f docker-compose.prod.yml exec ollama \
    ollama pull llama3.2:3b
```

## 🔄 Actualizaciones

```bash
# Parar servicios
docker-compose -f docker-compose.prod.yml down

# Actualizar código
git pull origin main

# Rebuild
docker-compose -f docker-compose.prod.yml build --no-cache

# Iniciar
docker-compose -f docker-compose.prod.yml up -d

# Migraciones si hay
docker-compose -f docker-compose.prod.yml exec backend \
    alembic upgrade head
```

## 💾 Backups

### Base de Datos

```bash
# Backup
docker-compose exec postgres \
    pg_dump -U postgres netmentor > backup_$(date +%Y%m%d).sql

# Restore
docker-compose exec -T postgres \
    psql -U postgres netmentor < backup_20240120.sql
```

### Automatizar Backups

```bash
#!/bin/bash
# backup.sh
BACKUP_DIR=/backups
DATE=$(date +%Y%m%d_%H%M%S)

# PostgreSQL
docker-compose exec -T postgres \
    pg_dump -U postgres netmentor | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Limpiar backups antiguos (30 días)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
```

Agregar a crontab:
```bash
# Backup diario a las 3 AM
0 3 * * * /path/to/backup.sh
```

## 📊 Monitoreo

### Health Checks

```bash
# Verificar todos los servicios
docker-compose -f docker-compose.prod.yml ps

# Health check específico
curl http://localhost:8000/health
```

### Logs

```bash
# Todos los logs
docker-compose -f docker-compose.prod.yml logs -f

# Solo backend
docker-compose -f docker-compose.prod.yml logs -f backend

# Últimas 100 líneas
docker-compose -f docker-compose.prod.yml logs --tail=100 backend
```

### Métricas

```bash
# Uso de recursos
docker stats
```
