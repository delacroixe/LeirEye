# Empezar con NetMentor

Bienvenido a la guía de inicio rápido de NetMentor. Esta sección te guiará a través de todo lo necesario para tener la herramienta funcionando.

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

| Software | Versión Mínima | Propósito |
|----------|----------------|-----------|
| **Python** | 3.10+ | Backend API |
| **Node.js** | 18+ | Frontend React |
| **Docker** | 24+ | Base de datos PostgreSQL |
| **Ollama** | Última | Motor de IA |

### Verificar Instalaciones

```bash
# Verificar versiones
python3 --version   # Python 3.10+
node --version      # v18+
docker --version    # Docker 24+
ollama --version    # Última versión
```

## 🚀 Instalación Rápida

=== "🐳 Docker (Recomendado)"

    ```bash
    # Clonar el repositorio
    git clone https://github.com/tu-usuario/netmentor.git
    cd netmentor
    
    # Iniciar servicios de Docker
    docker-compose up -d
    
    # Configurar backend
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    alembic upgrade head
    
    # Configurar frontend
    cd ../frontend
    npm install
    ```

=== "📦 Manual"

    ```bash
    # 1. PostgreSQL manual
    brew install postgresql@15
    brew services start postgresql@15
    createdb netmentor
    
    # 2. Redis manual
    brew install redis
    brew services start redis
    
    # 3. Configurar backend
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    
    # Configurar .env
    cp .env.example .env
    # Editar DATABASE_URL si es necesario
    
    alembic upgrade head
    
    # 4. Configurar frontend
    cd ../frontend
    npm install
    ```

## 🎯 Ejecución

Necesitarás **4 terminales**:

### Terminal 1: Ollama (Motor IA)
```bash
ollama serve
# Primera vez: descarga llama3.2:3b automáticamente
```

### Terminal 2: Docker
```bash
docker-compose up
# PostgreSQL en :5432, Redis en :6379
```

### Terminal 3: Backend
```bash
cd backend
source venv/bin/activate
python run.py
# API en http://localhost:8000
```

### Terminal 4: Frontend
```bash
cd frontend
npm start
# App en http://localhost:3001
```

## 👤 Primer Usuario

1. **Abre** `http://localhost:3001`
2. **Clic en** "Regístrate aquí"
3. **Completa** el formulario:
   - Email: `tu-email@ejemplo.com`
   - Username: `tu_usuario`
   - Password: `Password123` (mínimo 8 caracteres, mayúscula, minúscula, número)

!!! tip "Privilegios de Administrador"
    El primer usuario registrado es **ADMIN** automáticamente.
    Puede gestionar usuarios y tiene acceso completo.

## ✅ Verificar Instalación

```bash
# Verificar backend
curl http://localhost:8000/health
# Respuesta: {"status": "healthy"}

# Verificar API docs
open http://localhost:8000/docs
```

## 🔧 Solución de Problemas

??? warning "No se capturan paquetes"
    La captura de paquetes requiere **permisos root**:
    ```bash
    cd backend
    source venv/bin/activate
    sudo python run.py
    ```

??? warning "Error de conexión a PostgreSQL"
    Verifica que Docker esté corriendo:
    ```bash
    docker-compose ps
    # Debe mostrar postgres y redis como "Up"
    ```

??? warning "Frontend no conecta al backend"
    Verifica CORS en `backend/.env`:
    ```
    CORS_ORIGINS=http://localhost:3001
    ```

## 📚 Siguiente Paso

<div class="grid cards" markdown>

-   :material-book-open-variant:{ .lg .middle } **Guía de Uso**

    ---

    Aprende a usar todas las funcionalidades de NetMentor

    [:octicons-arrow-right-24: Ir a la Guía](../guide/index.md)

-   :material-school:{ .lg .middle } **Aprende Conceptos**

    ---

    Comprende los fundamentos de redes y seguridad

    [:octicons-arrow-right-24: Ver Conceptos](../concepts/index.md)

</div>
