# Producción

Guía para desplegar NetMentor en un entorno de producción.

## 🔒 Checklist de Seguridad

Antes de poner en producción:

- [ ] Cambiar `SECRET_KEY` (mínimo 32 caracteres aleatorios)
- [ ] Cambiar contraseñas de base de datos
- [ ] Configurar HTTPS
- [ ] Limitar CORS a dominios específicos
- [ ] Configurar firewall
- [ ] Habilitar rate limiting
- [ ] Deshabilitar debug mode
- [ ] Configurar backups automáticos
- [ ] Configurar monitoreo

## 🔐 Configuración de Seguridad

### Variables de Entorno

```bash
# .env.prod
# Generar: python -c "import secrets; print(secrets.token_urlsafe(32))"
SECRET_KEY=tu-clave-secreta-muy-larga-y-aleatoria

# Base de datos
DB_USER=netmentor_prod
DB_PASSWORD=ContraseñaMuySegura123!
DB_NAME=netmentor_prod

# Redis
REDIS_PASSWORD=OtraContraseñaSegura456!

# CORS - Solo tu dominio
CORS_ORIGINS=https://netmentor.tudominio.com

# Debug desactivado
DEBUG=false
LOG_LEVEL=WARNING
```

### Generar SECRET_KEY

```python
import secrets
print(secrets.token_urlsafe(32))
```

## 🌐 Nginx como Reverse Proxy

### Instalación

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx
```

### Configuración Nginx

```nginx
# /etc/nginx/sites-available/netmentor
upstream backend {
    server 127.0.0.1:8000;
}

upstream frontend {
    server 127.0.0.1:3001;
}

# Redireccionar HTTP a HTTPS
server {
    listen 80;
    server_name netmentor.tudominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name netmentor.tudominio.com;

    # SSL (certbot los configura)
    ssl_certificate /etc/letsencrypt/live/netmentor.tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/netmentor.tudominio.com/privkey.pem;
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
    }

    # WebSocket
    location /ws {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }

    # Health check (sin rate limit)
    location /health {
        proxy_pass http://backend;
    }
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
```

### Activar Sitio

```bash
# Enlazar configuración
sudo ln -s /etc/nginx/sites-available/netmentor /etc/nginx/sites-enabled/

# Verificar configuración
sudo nginx -t

# Recargar
sudo systemctl reload nginx
```

### Certificado SSL

```bash
# Obtener certificado con Certbot
sudo certbot --nginx -d netmentor.tudominio.com

# Renovación automática
sudo certbot renew --dry-run
```

## 🔥 Firewall

```bash
# UFW (Ubuntu)
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Permitir SSH
sudo ufw allow ssh

# Permitir HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Habilitar
sudo ufw enable

# Verificar
sudo ufw status
```

## 📊 Monitoreo

### Prometheus + Grafana (Opcional)

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  grafana_data:
```

### Logs Centralizados

```bash
# Enviar logs a archivo
docker-compose logs -f > /var/log/netmentor/all.log 2>&1 &

# Rotar logs
cat > /etc/logrotate.d/netmentor <<EOF
/var/log/netmentor/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 root root
}
EOF
```

## 💾 Backups Automáticos

### Script de Backup

```bash
#!/bin/bash
# /opt/netmentor/backup.sh

set -e

BACKUP_DIR="/backups/netmentor"
DATE=$(date +%Y%m%d_%H%M%S)
RETAIN_DAYS=30

mkdir -p $BACKUP_DIR

# PostgreSQL
echo "Backing up PostgreSQL..."
docker exec netmentor-postgres pg_dump -U postgres netmentor | \
    gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Subir a S3 (opcional)
# aws s3 cp $BACKUP_DIR/db_$DATE.sql.gz s3://tu-bucket/backups/

# Limpiar backups antiguos
find $BACKUP_DIR -name "*.gz" -mtime +$RETAIN_DAYS -delete

echo "Backup completado: db_$DATE.sql.gz"
```

### Crontab

```bash
# Editar crontab
crontab -e

# Agregar backup diario a las 3 AM
0 3 * * * /opt/netmentor/backup.sh >> /var/log/netmentor/backup.log 2>&1
```

## 🔄 CI/CD

### GitHub Actions para Deploy

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/netmentor
            git pull origin main
            docker-compose -f docker-compose.prod.yml build
            docker-compose -f docker-compose.prod.yml up -d
            docker-compose exec -T backend alembic upgrade head
```

## 🚨 Recuperación ante Desastres

### Restaurar Backup

```bash
# Parar servicios
docker-compose -f docker-compose.prod.yml down

# Restaurar base de datos
gunzip -c backup_20240120.sql.gz | \
    docker exec -i netmentor-postgres psql -U postgres netmentor

# Iniciar servicios
docker-compose -f docker-compose.prod.yml up -d
```

### Rollback de Versión

```bash
# Ver historial
git log --oneline -10

# Rollback a commit específico
git checkout <commit-hash>

# Rebuild y deploy
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

## 📋 Checklist Post-Deploy

- [ ] Verificar HTTPS funciona
- [ ] Verificar login/registro
- [ ] Verificar captura de paquetes
- [ ] Verificar WebSocket (tiempo real)
- [ ] Verificar explicador IA
- [ ] Verificar backups automáticos
- [ ] Configurar alertas de monitoreo
- [ ] Documentar accesos y credenciales
