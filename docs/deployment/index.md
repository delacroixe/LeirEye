# Despliegue

Guías para desplegar NetMentor en diferentes entornos.

## 📚 Contenido

<div class="grid cards" markdown>

-   :material-docker:{ .lg .middle } **Docker**

    ---

    Despliegue con Docker y Docker Compose

    [:octicons-arrow-right-24: Ver](docker.md)

-   :material-server:{ .lg .middle } **Producción**

    ---

    Configuración para entornos de producción

    [:octicons-arrow-right-24: Ver](production.md)

</div>

## 🚀 Opciones de Despliegue

| Opción | Complejidad | Uso Recomendado |
|--------|-------------|-----------------|
| **Desarrollo local** | ⭐ | Desarrollo, pruebas |
| **Docker Compose** | ⭐⭐ | Demos, equipos pequeños |
| **Docker Compose + Nginx** | ⭐⭐⭐ | Producción pequeña |
| **Kubernetes** | ⭐⭐⭐⭐⭐ | Producción enterprise |

## 🏃 Inicio Rápido

### Desarrollo Local

```bash
# Servicios
docker-compose up -d

# Backend
cd backend
source venv/bin/activate
python run.py

# Frontend
cd frontend
npm start
```

### Docker Compose Completo

```bash
# Todo en contenedores
docker-compose -f docker-compose.prod.yml up -d
```

## 📋 Requisitos

### Mínimos

| Recurso | Desarrollo | Producción |
|---------|------------|------------|
| CPU | 2 cores | 4 cores |
| RAM | 4 GB | 8 GB |
| Disco | 10 GB | 50 GB |
| Red | 100 Mbps | 1 Gbps |

### Software

- Docker 24+
- Docker Compose 2.0+
- (Opcional) Nginx para reverse proxy
- (Opcional) Certbot para SSL

## 🔐 Consideraciones de Seguridad

!!! warning "Antes de producción"
    1. Cambiar `SECRET_KEY` en `.env`
    2. Configurar HTTPS
    3. Limitar CORS a dominios específicos
    4. Configurar firewall
    5. Habilitar rate limiting
    6. Configurar backups automáticos
