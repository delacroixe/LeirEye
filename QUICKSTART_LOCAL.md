# ⚡ Guía Rápida: Arranca la App Ahora

## 🎯 En 5 minutos

### Opción A: Con Docker Compose (RECOMENDADO) ✅

Más fácil, simula la infraestructura real.

```bash
# 1. Inicia PostgreSQL + Redis
docker-compose up -d

# 2. Espera 5 segundos a que inicien

# 3. Instala dependencias del backend
pip install -r backend/requirements.txt

# 4. Instala dependencias del frontend (en otra carpeta)
cd frontend && npm install && cd ..

# 5. Terminal 1: Arranca el backend
cd backend
uvicorn app.main:app --reload --port 8000

# 6. Terminal 2: Arranca el frontend
cd frontend
npm start
```

**Resultado:**

- Frontend: http://localhost:3000 ✅
- Backend API: http://localhost:8000 ✅
- API Docs: http://localhost:8000/docs ✅

---

### Opción B: 100% Local (Sin Docker)

Si no tienes Docker o prefieres desarrollo puro.

```bash
# 1. Crea base de datos PostgreSQL local
# macOS:
brew install postgresql
createdb leireye

# 2. Instala dependencias
pip install -r backend/requirements.txt
cd frontend && npm install && cd ..

# 3. Terminal 1: Backend
cd backend
uvicorn app.main:app --reload --port 8000

# 4. Terminal 2: Frontend
cd frontend
npm start
```

⚠️ **Nota:** Necesitas PostgreSQL corriendo en localhost:5432

---

## 🐳 ¿Diferencia entre docker-compose.yml y Dockerfile?

### docker-compose.yml

- **Qué hace:** Inicia PostgreSQL + Redis en tu máquina
- **Cuándo usarlo:** Desarrollo local
- **Quién lo ejecuta:** Tú (con `docker-compose up`)
- **Incluye:** Base de datos, caché

### Dockerfile (backend y frontend)

- **Qué hace:** Empaqueta la app en contenedores
- **Cuándo usarlo:** Testing en CI, producción
- **Quién lo ejecuta:** GitHub Actions (CI)
- **Propósito:** Verificar que la app funciona en entorno limpio

**Analogía:**

- docker-compose = "Mis herramientas de desarrollo"
- Dockerfile = "Cómo empaqueto la app para producción"

---

## ✅ Verifica que todo funciona

```bash
# 1. Backend responde
curl http://localhost:8000/
# Response: {"message":"¡Bienvenido a LeirEye API!","version":"2.0.0"}

# 2. Frontend carga
open http://localhost:3000

# 3. API docs interactiva
open http://localhost:8000/docs
```

---

## 🔧 Comandos útiles

```bash
# Ver si PostgreSQL está corriendo
docker-compose ps

# Ver logs
docker-compose logs -f postgres
docker-compose logs -f redis

# Detener todo
docker-compose down

# Reiniciar
docker-compose restart

# Limpiar todo
docker-compose down -v  # ⚠️ Borra datos!
```

---

## 🆘 Problemas comunes

### "Puerto 8000 en uso"

```bash
lsof -i :8000
kill -9 <PID>
```

### "PostgreSQL rechaza conexión"

```bash
docker-compose restart postgres
# Espera 10 segundos
```

### "npm install falla"

```bash
npm cache clean --force
npm install --legacy-peer-deps
```

### "No puedo capturar paquetes"

Necesitas permisos elevados:

```bash
sudo -u <tu_usuario> uvicorn app.main:app --reload --port 8000
```

---

## 📂 Estructura de carpetas

```
leireye/
├── backend/           ← Python + FastAPI
│   ├── app/
│   ├── requirements.txt
│   └── run.py
├── frontend/          ← React + TypeScript
│   ├── src/
│   ├── package.json
│   └── public/
├── docker/            ← Para CI/producción
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── init.sql
└── docker-compose.yml ← Para desarrollo local
```

---

## 🚀 Siguiente paso

1. Corre `docker-compose up -d`
2. Abre http://localhost:3000
3. Crea un usuario y haz login
4. ¡A explorar LeirEye!

**¿Dudas?** Revisa [QUICKSTART_v2.md](QUICKSTART_v2.md) para más detalles.
