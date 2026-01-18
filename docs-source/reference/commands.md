# Referencia de Comandos

Guía rápida de todos los comandos necesarios para trabajar con LeirEye.

## 🚀 Inicio Rápido

### Iniciar la Aplicación Completa

```bash
# 1. Servicios Docker (PostgreSQL, Redis)
docker-compose up -d

# 2. Backend (en otra terminal)
cd backend
source venv/bin/activate
python run.py

# 3. Frontend (en otra terminal)
cd frontend
npm start

# 4. Ollama para IA (en otra terminal)
ollama serve
```

### Parar Todo

```bash
# Ctrl+C en terminales de backend, frontend, ollama

# Parar Docker
docker-compose down

# Parar y eliminar datos
docker-compose down -v
```

## 🐳 Docker

### Gestión de Contenedores

```bash
# Iniciar servicios
docker-compose up -d

# Ver estado
docker-compose ps

# Ver logs
docker-compose logs -f

# Logs de un servicio específico
docker-compose logs -f postgres

# Reiniciar un servicio
docker-compose restart postgres

# Parar servicios
docker-compose down

# Parar y eliminar volúmenes (¡borra datos!)
docker-compose down -v
```

### Acceso a PostgreSQL

```bash
# Conectar al contenedor
docker exec -it leireye-postgres psql -U postgres -d leireye

# O desde fuera
psql -h localhost -U postgres -d leireye
# Password: postgres
```

### Comandos SQL Útiles

```sql
-- Ver tablas
\dt

-- Ver usuarios
SELECT * FROM users;

-- Contar paquetes
SELECT COUNT(*) FROM packets;

-- Salir
\q
```

## 🐍 Backend

### Entorno Virtual

```bash
# Crear entorno (primera vez)
cd backend
python3 -m venv venv

# Activar entorno
source venv/bin/activate  # macOS/Linux
.\venv\Scripts\activate   # Windows

# Desactivar
deactivate

# Instalar dependencias
pip install -r requirements.txt

# Actualizar dependencias
pip install --upgrade -r requirements.txt
```

### Migraciones (Alembic)

```bash
# Aplicar migraciones
alembic upgrade head

# Ver estado actual
alembic current

# Crear nueva migración
alembic revision --autogenerate -m "descripcion"

# Rollback una migración
alembic downgrade -1

# Rollback todas
alembic downgrade base
```

### Ejecutar Backend

```bash
# Normal
python run.py

# Con captura de paquetes (requiere root)
sudo python run.py

# Modo desarrollo con reload
uvicorn app.main:app --reload --port 8000
```

### Tests

```bash
# Ejecutar todos los tests
pytest

# Con coverage
pytest --cov=app

# Tests específicos
pytest tests/test_auth.py

# Verbose
pytest -v
```

## ⚛️ Frontend

### Gestión de Dependencias

```bash
# Instalar dependencias
cd frontend
npm install

# Agregar dependencia
npm install nombre-paquete

# Agregar dependencia de desarrollo
npm install -D nombre-paquete

# Actualizar dependencias
npm update

# Auditar seguridad
npm audit
npm audit fix
```

### Ejecutar Frontend

```bash
# Desarrollo (con hot reload)
npm start
# Abre http://localhost:3001

# Build para producción
npm run build

# Previsualizar build
npx serve -s build

# Tests
npm test

# Linting
npm run lint
```

## 🤖 Ollama

### Gestión de Modelos

```bash
# Iniciar servidor
ollama serve

# Listar modelos instalados
ollama list

# Descargar modelo
ollama pull llama3.2:3b

# Eliminar modelo
ollama rm llama3.2:3b

# Info de modelo
ollama show llama3.2:3b

# Probar modelo
ollama run llama3.2:3b "Hola, ¿cómo estás?"
```

### Modelos Recomendados

| Modelo | RAM | Uso |
|--------|-----|-----|
| `llama3.2:1b` | 2 GB | Rápido, básico |
| `llama3.2:3b` | 4 GB | Balance (recomendado) |
| `llama3.1:8b` | 8 GB | Mejor calidad |
| `mistral:7b` | 8 GB | Alternativa |

## 🔍 Diagnóstico de Red

### Ver Interfaces

```bash
# macOS
ifconfig

# Linux
ip addr show

# Ver interfaces para captura
python -c "from scapy.all import get_if_list; print(get_if_list())"
```

### Pruebas de Conectividad

```bash
# Ping
ping -c 4 google.com

# DNS lookup
nslookup google.com
dig google.com

# Traceroute
traceroute google.com

# Ver conexiones activas
netstat -an | grep ESTABLISHED

# Ver puertos en escucha
lsof -i -P | grep LISTEN
```

### Verificar Servicios

```bash
# Health check del backend
curl http://localhost:8000/health

# Ver API docs
open http://localhost:8000/docs

# Verificar frontend
curl http://localhost:3001
```

## 📁 Archivos y Logs

### Ubicaciones Importantes

| Archivo/Carpeta | Propósito |
|-----------------|-----------|
| `backend/.env` | Variables de entorno |
| `backend/logs/` | Logs del backend |
| `docker-compose.yml` | Configuración Docker |
| `frontend/build/` | Build de producción |

### Ver Logs

```bash
# Backend (si hay archivo de log)
tail -f backend/logs/leireye.log

# Docker logs
docker-compose logs -f

# Logs del sistema (macOS)
log show --predicate 'processName == "python"' --last 1h
```

## 🔧 Utilidades

### Limpiar Proyecto

```bash
# Limpiar cache de Python
find . -type d -name __pycache__ -exec rm -rf {} +
find . -type f -name "*.pyc" -delete

# Limpiar node_modules
rm -rf frontend/node_modules

# Reinstalar todo
cd frontend && npm install
```

### Variables de Entorno

```bash
# Ver variables actuales
cat backend/.env

# Crear desde ejemplo
cp backend/.env.example backend/.env

# Editar
nano backend/.env
```

### Git

```bash
# Ver estado
git status

# Crear branch
git checkout -b feature/nueva-funcionalidad

# Commit
git add .
git commit -m "Descripción del cambio"

# Push
git push origin feature/nueva-funcionalidad
```

## 📊 Monitoreo

### Uso de Recursos

```bash
# CPU y memoria
top
htop  # Si está instalado

# Uso de disco
df -h

# Procesos de LeirEye
ps aux | grep -E "python|node|docker"
```

### Verificar Puertos

```bash
# Ver quién usa un puerto
lsof -i :8000
lsof -i :3001
lsof -i :5432

# Matar proceso en un puerto
kill $(lsof -t -i:8000)
```
