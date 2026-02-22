# 🚀 Desarrollo Sin Contraseña

Para no tener que introducir contraseña cada vez que levantes la aplicación en desarrollo, seguí estos pasos:

## 1️⃣ Setup Automático (Recomendado)

### Opción A: Script Quick Start

```bash
chmod +x quick_dev_start.sh
./quick_dev_start.sh
```

Esto automáticamente:

- ✅ Crea usuario de desarrollo
- ✅ Levanta backend y frontend
- ✅ Auto-ingresa con `dev@example.com`

### Opción B: Manual

**Backend:**

```bash
cd backend

# Copiar configuración de desarrollo (opcional)
cp .env.development .env

# Crear usuario de desarrollo
python seed_dev.py

# Levantar backend
python -m uvicorn app.main:app --reload
```

**Frontend (en otra terminal):**

```bash
cd frontend
npm start
```

---

## 📝 Credenciales de Desarrollo

Las siguientes credenciales se crean automáticamente al ejecutar `seed_dev.py`:

```
Email:    dev@example.com
Password: DevPass123
Role:     ADMIN
```

El frontend en modo desarrollo auto-ingresa automáticamente con estas credenciales.

---

## ⚙️ Configuración

### Backend (.env.development)

```env
# Tokens más largos en desarrollo (no expiran cada 30 min)
ACCESS_TOKEN_EXPIRE_MINUTES=1440   # 1 día
REFRESH_TOKEN_EXPIRE_DAYS=30       # 30 días

# Debug activado
DEBUG=true

# Crear usuario por defecto
SEED_DEFAULT_USER=true
```

### Frontend (useDevAutoLogin hook)

- Solo funciona en `NODE_ENV=development`
- Si falla auto-login, muestra mensaje en consola
- Los tokens se guardan en localStorage (persisten entre recargas)

---

## 🔑 Modo Sin Auth (Ultra-Dev)

Si quieres saltarte auth completamente (no recomendado):

1. Backend: Comenta el middleware de auth en `app/main.py`
2. Frontend: Salta el ProtectedRoute

> ⚠️ **Solo para desarrollo local**

---

## 🐛 Troubleshooting

### "Usuario ya existe"

- Es normal después de la primera ejecución
- Los tokens se guardan en localStorage
- Solo borra localStorage si quieres volver a registrarte

### "Connection refused"

- Backend no está corriendo
- Asegúrate que ejecutaste `python -m uvicorn app.main:app --reload`

### "Auto-login no funciona"

- Verifica que estés en `NODE_ENV=development`
- Abre DevTools → Console para ver logs
- Intenta login manual con las credenciales

---

## 📱 Acceso Local

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

**✨ Ahora puedes desarrollar sin interrupciones de autenticación!**
