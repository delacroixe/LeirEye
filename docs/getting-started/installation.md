# Instalación Completa

Guía detallada de instalación de NetMentor en diferentes plataformas.

## Requisitos del Sistema

### Software Requerido

| Requisito | Versión Mínima | Notas |
|-----------|-----------------|-------|
| Python | 3.11 | [Descargar](https://www.python.org/downloads/) |
| Node.js | 18.0 | [Descargar](https://nodejs.org/) |
| Docker | 24.0 | [Descargar](https://www.docker.com/products/docker-desktop/) |
| Docker Compose | 2.20 | Incluido en Docker Desktop |
| PostgreSQL | 16 | Via Docker (recomendado) |

### Hardware Recomendado

- **CPU**: 2+ cores
- **RAM**: 4GB mínimo (8GB recomendado)
- **Disco**: 2GB espacio libre
- **Red**: Conexión estable a internet

## Instalación por Sistema Operativo

### macOS (Intel y Apple Silicon)

#### 1. Instalar Homebrew (si no lo tienes)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### 2. Instalar dependencias

```bash
brew install python@3.11 node@18 docker
```

#### 3. Instalar Docker Desktop

Descarga desde [docker.com](https://www.docker.com/products/docker-desktop/) e instala manualmente.

Luego inicia Docker Desktop desde Applications.

#### 4. Clonar NetMentor

```bash
git clone https://github.com/yourusername/netmentor.git
cd netmentor
```

#### 5. Instalar dependencias Python

```bash
python3.11 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
```

#### 6. Instalar dependencias Node

```bash
cd frontend
npm install
cd ..
```

#### 7. Iniciar servicios

```bash
# Terminal 1: Servicios
docker-compose up -d

# Terminal 2: Backend
source venv/bin/activate
cd backend && python run.py

# Terminal 3: Frontend
cd frontend && npm start
```

---

### Linux (Ubuntu/Debian)

#### 1. Actualizar sistema

```bash
sudo apt update
sudo apt upgrade -y
```

#### 2. Instalar dependencias del sistema

```bash
sudo apt install -y \
    python3.11 \
    python3.11-venv \
    python3-pip \
    nodejs \
    npm \
    git \
    curl
```

#### 3. Instalar Docker

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

Verifica la instalación:
```bash
docker --version
docker-compose --version
```

#### 4. Clonar NetMentor

```bash
git clone https://github.com/yourusername/netmentor.git
cd netmentor
```

#### 5. Crear entorno virtual

```bash
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt
```

#### 6. Instalar dependencias Node

```bash
cd frontend
npm install
cd ..
```

#### 7. Iniciar servicios

```bash
# Terminal 1
docker-compose up -d

# Terminal 2
source venv/bin/activate
cd backend && python run.py

# Terminal 3
cd frontend && npm start
```

---

### Windows (WSL2 Recomendado)

#### Opción A: Windows Subsystem for Linux 2 (WSL2) - RECOMENDADO

##### 1. Habilitar WSL2

Abre PowerShell como administrador y ejecuta:

```powershell
wsl --install
```

Reinicia tu computadora.

##### 2. Instalar Ubuntu

Abre Microsoft Store, busca Ubuntu 22.04 LTS e instala.

##### 3. Configurar Ubuntu

Abre Ubuntu desde el menú Start:
```bash
# Primera vez: configura usuario y contraseña
```

##### 4. Instalar dependencias

```bash
sudo apt update
sudo apt install -y \
    python3.11 \
    python3.11-venv \
    python3-pip \
    nodejs \
    npm \
    git \
    curl
```

##### 5. Instalar Docker Desktop

Descarga desde [docker.com](https://www.docker.com/products/docker-desktop/)

En Docker Desktop → Settings → General → marcar "Use WSL 2 based engine"

##### 6. Instalar NetMentor

```bash
git clone https://github.com/yourusername/netmentor.git
cd netmentor

# Backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# Frontend
cd frontend
npm install
cd ..
```

##### 7. Iniciar

```bash
# Terminal 1
docker-compose up -d

# Terminal 2
source venv/bin/activate
cd backend && python run.py

# Terminal 3
cd frontend && npm start
```

#### Opción B: Windows Nativo (Sin WSL2)

Windows nativo es más complicado. Si lo prefieres:

1. Instala Python 3.11+ desde [python.org](https://python.org)
2. Instala Node.js 18+ desde [nodejs.org](https://nodejs.org)
3. Instala Docker Desktop desde [docker.com](https://docker.com)
4. Abre PowerShell como administrador y sigue los pasos de instalación

⚠️ **Nota**: La captura de paquetes con Scapy en Windows requiere permisos especiales.

---

## Verificar Instalación

### Backend

```bash
curl http://localhost:8000/health
```

Debe responder con: `{"status":"ok"}`

### Base de Datos

```bash
docker-compose ps
```

Debe mostrar `netmentor_db_1` como `Up`

### Frontend

Abre [http://localhost:3001](http://localhost:3001) en tu navegador.

Debe cargar la página de login/registro.

## Instalación Avanzada

### Variables de Entorno

Crea un archivo `.env` en la raíz:

```bash
# Backend
POSTGRES_USER=netmentor
POSTGRES_PASSWORD=securepassword123
POSTGRES_DB=netmentor_db
DATABASE_URL=postgresql://netmentor:securepassword123@db:5432/netmentor_db
SECRET_KEY=your-secret-key-here-min-32-chars
DEBUG=false
```

### Ollama (IA Local)

Si quieres usar explicaciones de IA:

1. Descarga desde [ollama.ai](https://ollama.ai)
2. Instala y ejecuta: `ollama serve`
3. En terminal nueva: `ollama pull mistral`
4. Modifica `backend/.env`: `OLLAMA_MODEL=mistral`

### PostgreSQL Manual (Sin Docker)

Si prefieres una base de datos local:

```bash
# macOS
brew install postgresql@16
brew services start postgresql@16

# Linux
sudo apt install postgresql-16
sudo systemctl start postgresql

# Crear base de datos
psql -U postgres
CREATE DATABASE netmentor_db;
CREATE USER netmentor WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE netmentor_db TO netmentor;
\q
```

Luego modifica `DATABASE_URL` en `.env`

## Solucionar Problemas Comunes

| Error | Solución |
|-------|----------|
| `python: command not found` | Instala Python 3.11 desde python.org |
| `node: command not found` | Instala Node.js desde nodejs.org |
| `docker: command not found` | Instala Docker Desktop |
| `Error: Port 5432 in use` | `docker-compose down && docker-compose up -d` |
| `npm ERR! code EACCES` | `sudo chown -R $(whoami) ~/.npm` |
| `CORS error en frontend` | Verifica que backend corre en 8000 |
| `WebSocket connection failed` | Verifica puerto 8000 abierto |

¿Necesitas más ayuda? Consulta la [Solución de Problemas](../reference/troubleshooting.md).
