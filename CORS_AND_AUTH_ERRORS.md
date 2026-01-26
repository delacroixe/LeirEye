# 🔴 Entender y Solucionar Errores CORS y 422

Estás viendo dos errores diferentes en la consola del navegador. Aquí cómo entenderlos y arreglarlos.

---

## ❌ Error 1: CORS Bloqueado

```
Access to fetch at 'http://localhost:8000/api/auth/login' from origin 'http://localhost:3000'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header
```

### ¿Qué significa?

El frontend (en puerto 3000) intentó conectarse al backend (en puerto 8000), pero el backend rechazó la solicitud porque no tiene permitido hablar con esa origen.

### ¿Por qué pasa?

Por **seguridad del navegador**: Los navegadores no permiten que un sitio en `http://localhost:3000` acceda a recursos en `http://localhost:8000` a menos que el servidor lo autorice explícitamente.

### ✅ Solución

El backend **YA ESTÁ CONFIGURADO CORRECTAMENTE** para permitir CORS.

**En [backend/app/core/config.py](backend/app/core/config.py#L37-L40):**

```python
BACKEND_CORS_ORIGINS: List[str] = [
    "http://localhost:3000",      # ✅ Tu frontend está aquí
    "http://localhost:3001",
    "http://localhost:5173",
]
```

**En [backend/app/main.py](backend/app/main.py#L57-L62):**

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,  # ✅ Permite orígenes de config
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 🔍 Si el error CORS sigue apareciendo:

**Opción 1: Verifica que el backend esté corriendo**

```bash
curl http://localhost:8000/
# Debe responder: {"message":"LeirEye - Network Traffic Analyzer API",...}
```

**Opción 2: Verifica que el frontend use la URL correcta**

En [frontend/src/config.ts](frontend/src/config.ts#L8):

```typescript
export const API_BASE_URL =
  process.env.REACT_APP_API_URL?.trim() || "http://localhost:8000/api";
// Debe ser: http://localhost:8000/api
```

**Opción 3: Revisa la consola del navegador (F12) → Network tab**

Busca la petición `/api/auth/login` y mira:

- ✅ Response headers debe tener: `access-control-allow-origin: http://localhost:3000`
- ❌ Si no está, significa que el CORS middleware no está funcionando

**Opción 4: Reinicia ambos (a veces ayuda)**

```bash
# Terminal del backend
Ctrl+C
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal del frontend (otra ventana)
Ctrl+C
cd frontend
npm start
```

---

## ❌ Error 2: 422 Unprocessable Entity

```
Failed to load resource: the server responded with a status of 422 (Unprocessable Entity)
:8000/api/auth/register:1
```

### ¿Qué significa?

El backend **rechazó los datos** que el frontend le envió porque no cumplen los requisitos.

### ¿Por qué pasa?

El endpoint `/auth/register` requiere que los datos cumplan ciertas validaciones:

**En [backend/app/schemas/auth.py](backend/app/schemas/auth.py#L17-L39):**

```python
class UserRegister(BaseModel):
    email: EmailStr                     # ✅ Email válido (ej: user@example.com)
    username: str = Field(..., min_length=3, max_length=50)  # ✅ 3-50 caracteres
    password: str = Field(..., min_length=8, max_length=100) # ✅ 8+ caracteres

    @validator("username")
    def username_alphanumeric(cls, v):
        # ✅ Solo letras, números, guiones bajos
        if not re.match(r"^[a-zA-Z0-9_]+$", v):
            raise ValueError("Username solo puede contener letras, números y guiones bajos")

    @validator("password")
    def password_strength(cls, v):
        # ✅ Contraseña fuerte: mayúscula + minúscula + número
        if not re.search(r"[A-Z]", v):
            raise ValueError("La contraseña debe contener al menos una mayúscula")
        if not re.search(r"[a-z]", v):
            raise ValueError("La contraseña debe contener al menos una minúscula")
        if not re.search(r"\d", v):
            raise ValueError("La contraseña debe contener al menos un número")
```

### ✅ Requisitos para registrarse

Tu formulario de registro debe validar:

| Campo                    | Requisito                                        | Ejemplo                          |
| ------------------------ | ------------------------------------------------ | -------------------------------- |
| **email**                | Email válido                                     | ✅ `juan@ejemplo.com`            |
| **username**             | 3-50 caracteres, solo `a-zA-Z0-9_`               | ✅ `juan_123` ❌ `juan@`         |
| **password**             | 8+ caracteres con mayúscula + minúscula + número | ✅ `MiPassword123` ❌ `password` |
| **full_name** (opcional) | Máximo 100 caracteres                            | ✅ `Juan Pérez`                  |

### 🔍 Si recibe 422:

**Opción 1: Abre la consola (F12) → Network → Busca la petición auth/register**

Haz clic en la petición y ve la pestaña **Response**. Verás algo como:

```json
{
  "detail": [
    {
      "loc": ["body", "password"],
      "msg": "La contraseña debe contener al menos una mayúscula",
      "type": "value_error"
    }
  ]
}
```

**Opción 2: Valida con este ejemplo (copia en la consola del navegador)**

```javascript
const testData = {
  email: "usuario@ejemplo.com",
  username: "usuario_123",
  password: "MiPassword123",
  full_name: "Usuario Test",
};

// Validaciones del backend
console.log("✅ Email válido:", testData.email.includes("@"));
console.log(
  "✅ Username 3-50 chars:",
  testData.username.length >= 3 && testData.username.length <= 50,
);
console.log(
  "✅ Username alphanumeric:",
  /^[a-zA-Z0-9_]+$/.test(testData.username),
);
console.log("✅ Password 8+ chars:", testData.password.length >= 8);
console.log("✅ Password tiene mayúscula:", /[A-Z]/.test(testData.password));
console.log("✅ Password tiene minúscula:", /[a-z]/.test(testData.password));
console.log("✅ Password tiene número:", /\d/.test(testData.password));

// Intenta registrar
fetch("http://localhost:8000/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(testData),
})
  .then((r) => r.json())
  .then((data) => console.log("Respuesta:", data))
  .catch((e) => console.error("Error:", e));
```

---

## 🔧 Checklist de Solución

- [ ] Backend está corriendo: `curl http://localhost:8000/`
- [ ] Frontend está corriendo: abre http://localhost:3000
- [ ] API_BASE_URL en config.ts es `http://localhost:8000/api`
- [ ] Email en registro es válido (contiene @)
- [ ] Username tiene 3-50 caracteres (solo a-zA-Z0-9\_)
- [ ] Password tiene 8+ caracteres + mayúscula + minúscula + número
- [ ] Consola del navegador (F12) NO muestra error CORS
- [ ] Consola del navegador (F12) → Network → auth/register → Status 201 (not 422)

---

## 📡 Probando Manualmente con curl

### Test 1: Verificar CORS

```bash
curl -X OPTIONS http://localhost:8000/api/auth/register \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Debería responder con headers CORS:
# < access-control-allow-origin: http://localhost:3000
# < access-control-allow-credentials: true
```

### Test 2: Registrar con datos válidos

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "username": "usuario_123",
    "password": "MiPassword123",
    "full_name": "Usuario Test"
  }' \
  -v

# Respuesta esperada (201):
# {
#   "user": {
#     "id": "123",
#     "email": "usuario@ejemplo.com",
#     "username": "usuario_123",
#     ...
#   },
#   "tokens": {
#     "access_token": "eyJ...",
#     "refresh_token": "...",
#     "token_type": "bearer",
#     "expires_in": 1800
#   }
# }
```

### Test 3: Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "password": "MiPassword123"
  }' \
  -v
```

---

## 🎯 Flujo de Autenticación

```
Usuario llena formulario en http://localhost:3000
    ↓
Frontend valida localmente (email, password strength)
    ↓
Frontend envía POST a http://localhost:8000/api/auth/register
    ↓
Navegador verifica CORS ← ❌ Error aquí = no ve header access-control-allow-origin
    ↓
Backend valida datos con Pydantic ← ❌ Error aquí = 422 si no cumple
    ↓
Backend crea usuario en BD
    ↓
Backend retorna tokens JWT
    ↓
Frontend guarda tokens en localStorage/sessionStorage
    ↓
Frontend redirige a dashboard
```

---

## 📝 Resumen

| Error                 | Causa                               | Solución                                                                                           |
| --------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| **CORS bloqueado**    | Frontend y backend no pueden hablar | Verifica que backend corre en 8000 y tiene CORS habilitado                                         |
| **422 Unprocessable** | Datos no cumplen validaciones       | Asegura email válido, username 3-50 chars alphanumeric, password 8+ con mayúscula+minúscula+número |

Sigue los pasos de "Checklist de Solución" y prueba con curl si todo falla.
