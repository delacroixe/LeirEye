# Solución: Error CORS - HTTP 500 Backend

## 🔴 Problema Reportado

```
Access to fetch at 'http://localhost:8000/api/auth/login' from origin 'http://localhost:3000' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

---

## 🔍 Análisis

### Root Cause (Causa Raíz)

El error CORS es **secundario**. La causa real es:

1. **Error 500 en Backend** → `ValueError: password cannot be longer than 72 bytes`
2. El servidor retorna error sin headers CORS
3. Navegador bloquea la respuesta por política de CORS

**No es un problema de configuración CORS**, sino de un error en el servidor que genera una respuesta de error sin headers CORS.

---

## ✅ Verificación de CORS

La configuración CORS en [backend/app/main.py](backend/app/main.py) está **correcta**:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,  # ["http://localhost:3000", ...]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Y en [backend/app/core/config.py](backend/app/core/config.py):

```python
BACKEND_CORS_ORIGINS: List[str] = [
    "http://localhost:3000",    # ✅ Frontend está incluido
    "http://localhost:3001",
    "http://localhost:5173",
]
```

---

## 🔧 Solución Real

La solución **real** es arreglar el error de Bcrypt (ver [BCRYPT_FIX_DOCUMENTATION.md](BCRYPT_FIX_DOCUMENTATION.md)).

Una vez que el backend retorna respuestas 200/success correctamente:
- ✅ Headers CORS se envían correctamente
- ✅ Navegador acepta la respuesta
- ✅ Requests funcionan sin bloqueos

---

## 📊 Flujo de Error vs Flujo Correcto

### ❌ Flujo Anterior (Con Error)
```
Frontend (localhost:3000)
    ↓
POST /api/auth/login
    ↓
Backend (localhost:8000)
    ↓
ERROR: password > 72 bytes
    ↓
HTTP 500 (sin headers CORS)
    ↓
Navegador: "CORS error"
```

### ✅ Flujo Correcto (Con Fix)
```
Frontend (localhost:3000)
    ↓
POST /api/auth/login
    ↓
Backend (localhost:8000)
    ↓
SHA-256 normalize + Bcrypt verify
    ↓
HTTP 200 + headers CORS
    ↓
Navegador: acepta respuesta ✓
```

---

## 🚀 Resultado

Después de aplicar la solución:

1. ✅ Backend procesa login correctamente
2. ✅ Headers CORS se incluyen en la respuesta
3. ✅ Navegador acepta la respuesta
4. ✅ Frontend recibe token JWT
5. ✅ Sesión se inicia correctamente

---

## 🧪 Test Manual

Para verificar que todo funciona:

```bash
# 1. Iniciar backend
cd backend
python run.py

# 2. En otra terminal, test login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{
    "email": "dev@example.com",
    "password": "DevPass123"
  }'

# Debería ver:
# - HTTP 200
# - Token JWT en respuesta
# - Headers CORS presentes
```

---

## 📝 Resumen

| Aspecto | Estado |
|--------|--------|
| **Configuración CORS** | ✅ Correcta |
| **Error original** | ❌ Bcrypt (NO CORS) |
| **Solución** | ✅ SHA-256 pre-hashing |
| **CORS Funciona** | ✅ Automáticamente |

