# 🚀 NetMentor v2.0.0 - Production Deployment Guide

Guía completa para desplegar NetMentor en producción.

---

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Security Hardening](#security-hardening)
7. [Monitoring & Logging](#monitoring--logging)
8. [Scaling Considerations](#scaling-considerations)

---

## Pre-Deployment Checklist

### Requirements
- [ ] Linux server (Ubuntu 20.04+ recommended) or cloud instance (AWS, DigitalOcean, Azure)
- [ ] Python 3.11+
- [ ] Node.js 18.0+
- [ ] PostgreSQL 14+ (or managed database service)
- [ ] Docker (optional but recommended)
- [ ] Domain name
- [ ] SSL certificate (Let's Encrypt)
- [ ] Reverse proxy (Nginx or Apache)

### Code Readiness
- [x] All TypeScript compiles without errors
- [x] All Python tests pass
- [x] All dependencies specified in requirements.txt
- [x] Environment template (.env.example) provided
- [x] No hardcoded secrets or credentials
- [x] No debug logging in production code

### Documentation Review
- [x] SETUP_GUIDE.md reviewed
- [x] ARCHITECTURE_v2.md understood
- [x] TESTING_CHECKLIST.md passed
- [x] TROUBLESHOOTING.md bookmarked

---

## Environment Configuration

### Backend Configuration

#### Create Production .env File
```bash
# backend/.env (DO NOT COMMIT TO GIT)

# Database
DATABASE_URL=postgresql+asyncpg://username:password@db.example.com:5432/netmentor_prod

# Security
SECRET_KEY=<generate-with: python -c "import secrets; print(secrets.token_urlsafe(64))">
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS (production domains only)
CORS_ORIGINS=["https://netmentor.example.com","https://app.netmentor.example.com"]

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b

# Logging
LOG_LEVEL=INFO
LOG_FILE=/var/log/netmentor/backend.log

# Deployment
ENVIRONMENT=production
DEBUG=False
```

#### Generate Secure SECRET_KEY
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(64))"
# Output example:
# eL3K8x9_z2Q5vB1jC6mN4pR7sT0uW3xY5zA8bD0eF2gH4i-K7lM9nO1pR3sT5uV
```

#### Frontend Configuration
```bash
# frontend/.env.production

# Backend API
REACT_APP_API_URL=https://api.netmentor.example.com
REACT_APP_WS_URL=wss://api.netmentor.example.com/ws

# Analytics (optional)
REACT_APP_ANALYTICS_ID=your-analytics-id

# Version
REACT_APP_VERSION=2.0.0
```

---

## Database Setup

### Option 1: Managed Database (Recommended for Production)

#### AWS RDS PostgreSQL
```bash
# 1. Create RDS instance
# - Engine: PostgreSQL 15
# - Storage: 100GB
# - Multi-AZ: Yes
# - Backup retention: 30 days

# 2. Get endpoint
# - Example: netmentor-db.xxxxxx.us-east-1.rds.amazonaws.com

# 3. Create database
psql -h netmentor-db.xxxxxx.us-east-1.rds.amazonaws.com \
  -U postgres \
  -c "CREATE DATABASE netmentor_prod;"

# 4. Set DATABASE_URL
DATABASE_URL=postgresql+asyncpg://postgres:password@netmentor-db.xxxxxx.us-east-1.rds.amazonaws.com:5432/netmentor_prod
```

#### DigitalOcean Database
```bash
# 1. Create Managed Database
# - Type: PostgreSQL
# - Version: 15
# - Region: (closest to users)

# 2. Database URL provided automatically
# - Format: postgresql://user:password@host:port/database?sslmode=require
```

#### Azure Database for PostgreSQL
```bash
# 1. Create Flexible Server
# - SKU: Standard (GP_Gen5_2 or higher)
# - Storage: 128GB
# - High availability: Enabled

# 2. Get connection string
# - Add `?sslmode=require` to connection string
```

### Option 2: Self-Hosted PostgreSQL

```bash
# 1. Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# 2. Create database and user
sudo su - postgres
psql

CREATE DATABASE netmentor_prod;
CREATE USER netmentor WITH PASSWORD 'secure-password-here';
GRANT ALL PRIVILEGES ON DATABASE netmentor_prod TO netmentor;
ALTER DATABASE netmentor_prod OWNER TO netmentor;
\q

# 3. Enable remote connections (if needed)
# Edit: /etc/postgresql/15/main/postgresql.conf
listen_addresses = '*'

# Edit: /etc/postgresql/15/main/pg_hba.conf
host    all             all             0.0.0.0/0               md5

# 4. Restart PostgreSQL
sudo systemctl restart postgresql

# 5. Set DATABASE_URL
DATABASE_URL=postgresql+asyncpg://netmentor:secure-password-here@localhost:5432/netmentor_prod
```

### Run Migrations

```bash
cd backend

# Activate environment
source venv/bin/activate

# Run migrations
alembic upgrade head

# Verify
psql -h <host> -U <user> -d netmentor_prod -c "\dt"
# Should show: users table
```

---

## Backend Deployment

### Option 1: Systemd Service (Linux Server)

#### Create Service File
```bash
# /etc/systemd/system/netmentor-backend.service

[Unit]
Description=NetMentor Backend API
After=network.target postgresql.service

[Service]
Type=notify
User=netmentor
WorkingDirectory=/home/netmentor/netmentor/backend
Environment="PATH=/home/netmentor/netmentor/backend/venv/bin"
ExecStart=/home/netmentor/netmentor/backend/venv/bin/python run.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### Install and Run
```bash
# Copy application to /home/netmentor/netmentor
sudo cp -r /path/to/netmentor /home/netmentor/

# Set permissions
sudo chown -R netmentor:netmentor /home/netmentor/netmentor

# Create log directory
sudo mkdir -p /var/log/netmentor
sudo chown netmentor:netmentor /var/log/netmentor

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable netmentor-backend
sudo systemctl start netmentor-backend

# Check status
sudo systemctl status netmentor-backend
```

### Option 2: Docker Container (Recommended)

#### Create Dockerfile
```dockerfile
# Dockerfile (in backend directory)
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 8000

# Run application
CMD ["python", "run.py"]
```

#### Docker Compose for Production
```yaml
# docker-compose.prod.yml

version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: netmentor_prod
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - netmentor-network
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    networks:
      - netmentor-network
    restart: always
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  backend:
    build: ./backend
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - SECRET_KEY=${SECRET_KEY}
      - CORS_ORIGINS=${CORS_ORIGINS}
      - ENVIRONMENT=production
      - DEBUG=False
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - netmentor-network
    restart: always
    ports:
      - "8000:8000"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
    networks:
      - netmentor-network
    restart: always

volumes:
  postgres_data:
  redis_data:

networks:
  netmentor-network:
    driver: bridge
```

#### Deploy with Docker
```bash
# Set environment variables
export DATABASE_URL=postgresql+asyncpg://...
export SECRET_KEY=...
export CORS_ORIGINS='["https://netmentor.example.com"]'

# Build and run
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

### Option 3: Cloud Platforms

#### AWS ECS (Elastic Container Service)
```bash
# 1. Push image to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker tag netmentor-backend:latest <account>.dkr.ecr.us-east-1.amazonaws.com/netmentor-backend:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/netmentor-backend:latest

# 2. Create ECS service
# - Use CloudFormation or AWS Console
# - Point to ECR image
# - Set environment variables
# - Configure security groups
# - Enable load balancer

# 3. Create RDS instance
# - PostgreSQL 15
# - Multi-AZ enabled
# - Automated backups

# 4. Deploy
# - ECS Fargate recommended for simplicity
# - Set task count to 2-4 for redundancy
```

#### DigitalOcean App Platform
```bash
# 1. Create app.yaml
name: netmentor
services:
- name: backend
  github:
    repo: your-github/netmentor
    branch: main
  build_command: pip install -r requirements.txt
  run_command: python run.py
  environment_slug: python
  envs:
  - key: DATABASE_URL
    value: ${db.connection_string}
  http_port: 8000

- name: frontend
  github:
    repo: your-github/netmentor
    branch: main
  source_dir: frontend
  build_command: npm install && npm run build
  http_port: 3000
  envs:
  - key: REACT_APP_API_URL
    value: https://api.${APP_DOMAIN}

databases:
- name: db
  engine: PG
  version: "15"

# 2. Deploy
doctl apps create --spec app.yaml
```

---

## Frontend Deployment

### Option 1: Static Hosting (Netlify, Vercel, AWS S3)

#### Build for Production
```bash
cd frontend
npm install
npm run build
# Output: build/

# Verify build
ls -la build/
# Should have: index.html, js/, css/, public/
```

#### Netlify
```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Build
npm run build

# 3. Deploy
netlify deploy --prod --dir=build

# 4. Configure redirects
# Create: public/_redirects
/*  /index.html  200
```

#### Vercel
```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Build and deploy
vercel --prod

# 3. Set environment variables in Vercel dashboard
REACT_APP_API_URL=https://api.netmentor.example.com
REACT_APP_WS_URL=wss://api.netmentor.example.com/ws
```

#### AWS S3 + CloudFront
```bash
# 1. Create S3 bucket
aws s3 mb s3://netmentor-app-prod

# 2. Build
npm run build

# 3. Upload to S3
aws s3 sync build/ s3://netmentor-app-prod/

# 4. Create CloudFront distribution
# - Origin: S3 bucket
# - SSL: Use CloudFront certificate
# - Caching: cache policy for static assets

# 5. Update DNS to point to CloudFront
```

### Option 2: Container Deployment

```dockerfile
# frontend/Dockerfile

# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Nginx Configuration
```nginx
# frontend/nginx.conf

server {
    listen 80;
    location / {
        root /usr/share/nginx/html;
        try_files $uri /index.html;
    }
    location /api {
        proxy_pass http://backend:8000;
    }
    location /ws {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## Reverse Proxy Setup

### Nginx Configuration (Recommended)

```nginx
# /etc/nginx/sites-available/netmentor

upstream backend {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name netmentor.example.com api.netmentor.example.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.netmentor.example.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/netmentor.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/netmentor.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Proxy to Backend
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;
}

server {
    listen 443 ssl http2;
    server_name netmentor.example.com;
    
    ssl_certificate /etc/letsencrypt/live/netmentor.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/netmentor.example.com/privkey.pem;
    
    # Frontend static files
    root /var/www/netmentor/build;
    index index.html;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    
    # SPA routing
    location / {
        try_files $uri /index.html;
    }
    
    # API routes
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket
    location /ws {
        proxy_pass http://backend/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Enable Configuration
```bash
sudo ln -s /etc/nginx/sites-available/netmentor /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### SSL Certificate (Let's Encrypt)

```bash
# 1. Install Certbot
sudo apt install certbot python3-certbot-nginx

# 2. Get certificate
sudo certbot certonly --nginx \
  -d netmentor.example.com \
  -d api.netmentor.example.com

# 3. Auto-renewal (certbot sets this up automatically)
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# 4. Verify renewal
sudo certbot renew --dry-run
```

---

## Security Hardening

### Database Security

```sql
-- Limit connections
ALTER SYSTEM SET max_connections = 100;

-- Enable SSL
ssl = on
ssl_cert_file = '/path/to/server.crt'
ssl_key_file = '/path/to/server.key'

-- Enforce password strength
CREATE EXTENSION pgcrypto;

-- Regular backups
pg_dump -h host -U user -d netmentor_prod | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Application Security

```python
# backend/app/core/config.py

# Update for production
CORS_ORIGINS = [
    "https://netmentor.example.com",
    "https://app.netmentor.example.com"
]

# Enforce HTTPS
FORCE_HTTPS = True

# Secure cookie settings
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"

# Rate limiting (implement in Phase 2)
RATE_LIMIT_ENABLED = True
RATE_LIMIT_REQUESTS = 100
RATE_LIMIT_PERIOD = 3600  # 1 hour
```

### Server Security

```bash
# Enable firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Disable root login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Keep system updated
sudo apt update && sudo apt upgrade -y

# Install fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Monitor logs
sudo tail -f /var/log/fail2ban.log
```

---

## Monitoring & Logging

### Logging Setup

```python
# backend/app/core/config.py

import logging
from pythonjsonlogger import jsonlogger

# JSON logging for ELK stack
logHandler = logging.FileHandler('logs/app.log')
formatter = jsonlogger.JsonFormatter()
logHandler.setFormatter(formatter)
logging.getLogger().addHandler(logHandler)
```

### Health Check Endpoint

```bash
# Health check (already implemented)
curl https://api.netmentor.example.com/health

# Expected response
{
  "status": "ok",
  "database": "connected",
  "version": "2.0.0",
  "timestamp": "2024-01-18T10:30:00Z"
}
```

### Monitoring Tools

#### Prometheus + Grafana
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'netmentor'
    static_configs:
      - targets: ['localhost:8000']
```

#### ELK Stack (Elasticsearch, Logstash, Kibana)
```json
// Logstash configuration
{
  "input": {
    "file": {
      "path": "/var/log/netmentor/backend.log"
    }
  },
  "output": {
    "elasticsearch": {
      "hosts": ["localhost:9200"]
    }
  }
}
```

---

## Scaling Considerations

### Horizontal Scaling

```yaml
# docker-compose.prod.yml - with scaling

version: '3.8'
services:
  backend:
    build: ./backend
    deploy:
      replicas: 3  # Run 3 instances
      update_config:
        parallelism: 1
        delay: 10s
    networks:
      - netmentor-network

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
```

### Database Connection Pooling

```python
# backend/app/core/database.py

from sqlalchemy.pool import NullPool

# For production with connection pool
engine = create_async_engine(
    settings.DATABASE_URL,
    poolclass=AsyncAdaptedQueuePool,
    pool_size=20,
    max_overflow=10,
    echo=False
)
```

### Redis Caching

```python
# backend/app/core/cache.py

import redis
from typing import Any

redis_client = redis.Redis(
    host="redis",
    port=6379,
    db=0,
    decode_responses=True
)

def cache_user(user_id: str, user_data: dict):
    redis_client.setex(
        f"user:{user_id}",
        3600,  # 1 hour
        json.dumps(user_data)
    )
```

---

## Post-Deployment Checklist

- [ ] Application accessible at domain
- [ ] HTTPS working (green lock in browser)
- [ ] Health check responding
- [ ] Database migrations applied
- [ ] First admin user created
- [ ] Logs being written to files
- [ ] Backups configured
- [ ] Monitoring active
- [ ] Alerting set up
- [ ] Team trained on operations
- [ ] Disaster recovery plan documented

---

## Rollback Plan

### If Something Goes Wrong

```bash
# 1. Stop current deployment
sudo systemctl stop netmentor-backend
docker-compose -f docker-compose.prod.yml down

# 2. Restore previous version
git checkout <previous-commit>
docker-compose -f docker-compose.prod.yml up -d

# 3. Run migrations (if needed)
alembic upgrade head

# 4. Verify
curl https://api.netmentor.example.com/health
```

### Database Rollback

```bash
# If migration caused issues
cd backend
alembic downgrade -1  # Undo last migration
alembic upgrade head  # Reapply

# Or restore from backup
psql -h host -U user -d netmentor_prod < backup_20240118.sql
```

---

## Support & Documentation

- **Setup Issues**: See SETUP_GUIDE.md
- **Architecture Questions**: Read ARCHITECTURE_v2.md
- **Troubleshooting**: Check TROUBLESHOOTING.md
- **Command Reference**: Use COMMANDS_REFERENCE.md

---

**Version**: 2.0.0  
**Last Updated**: January 18, 2026  
**Status**: Production Ready ✅
