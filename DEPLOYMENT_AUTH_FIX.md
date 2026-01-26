# 🚀 Guía de Despliegue - Auth Fixes

## ⚡ Inicio Rápido (Desarrollo)

### 1. Reiniciar Backend
```bash
cd /Users/antuan/Dev/sec/networking/backend
python run.py
```

### 2. Testear Inmediatamente
```bash
# En otra terminal
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dev@example.com",
    "password": "DevPass123"
  }'

# Esperado: HTTP 200 con token JWT
```

### 3. Testear en Frontend
- Abrir `http://localhost:3000`
- Intentar login con cualquier contraseña
- Debería funcionar sin errores CORS

---

## 📝 Checklist de Validación

- [ ] Backend inicia sin errores
- [ ] Logs muestran "✓ Logging configurado correctamente"
- [ ] Base de datos conecta correctamente
- [ ] CORS middleware está activo
- [ ] Test de login retorna HTTP 200
- [ ] Token JWT en respuesta
- [ ] Frontend puede hacer login
- [ ] No hay errores 500
- [ ] No hay errores CORS en consola del navegador

---

## 🔍 Qué Cambió

### Archivo Principal Modificado
```
backend/app/core/security.py
├── Importado hashlib
├── Agregada función _normalize_password()
├── Modificada verify_password()
└── Modificada get_password_hash()
```

### Cambios en Funciones

**Antes:**
```python
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)  # ❌ Falla si >72 bytes
```

**Después:**
```python
def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        normalized = _normalize_password(plain_password)
        return pwd_context.verify(normalized, hashed_password)  # ✅ Funciona siempre
    except ValueError as e:
        logger.error(f"Error al verificar password: {e}")
        return False
```

---

## 🧪 Tests Recomendados

### Test 1: Login Normal
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dev@example.com",
    "password": "DevPass123"
  }'
```

### Test 2: Contraseña Larga
```bash
# Registrar con contraseña muy larga
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test_long@example.com",
    "username": "testlong",
    "password": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "full_name": "Test User"
  }'

# Luego hacer login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test_long@example.com",
    "password": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  }'
```

### Test 3: CORS Headers
```bash
# Debe incluir headers CORS
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{
    "email": "dev@example.com",
    "password": "DevPass123"
  }' \
  -i  # Muestra headers
```

**Esperado en headers:**
```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

---

## ⚠️ Troubleshooting

### Problema: Aún recibo error 500
**Solución:**
1. Reiniciar el backend completamente
2. Verificar que `hashlib` está importado
3. Ver logs del backend para más detalles

### Problema: Error CORS aún aparece
**Solución:**
1. Verificar que el error 500 desapareció
2. Limpiar cache del navegador (Ctrl+Shift+Del)
3. Recargar página (Ctrl+Shift+R)
4. Verificar headers CORS con `curl -i`

### Problema: Contraseñas antiguas no funcionan
**Solución:**
1. Las contraseñas hasheadas con bcrypt directo no funcionarán con SHA-256
2. Usuarios afectados deben hacer "Forgot Password" o registrarse nuevamente
3. Es una migración gradual

---

## 📊 Rollback (Si es necesario)

En caso de problemas críticos:

```bash
# Revertir cambio
git checkout backend/app/core/security.py

# Reiniciar backend
python run.py
```

---

## 📈 Mejoras Futuras

1. **Logging mejorado** - Registrar intentos fallidos de login
2. **Rate limiting** - Limitar intentos de login por IP
3. **Validación de contraseña** - Requerir contraseñas fuertes
4. **Auditoría** - Registrar cambios de contraseña

---

## 📞 Contacto

En caso de problemas:
- Revisar [AUTH_FIX_SUMMARY.md](AUTH_FIX_SUMMARY.md)
- Revisar [BCRYPT_FIX_DOCUMENTATION.md](BCRYPT_FIX_DOCUMENTATION.md)
- Revisar [CORS_FIX_DOCUMENTATION.md](CORS_FIX_DOCUMENTATION.md)
- Revisar logs del backend

---

## ✅ Validación Final

Después del despliegue, verificar:

```bash
# 1. Backend running
curl http://localhost:8000/docs  # Swagger UI

# 2. API health
curl http://localhost:8000/api/system/health

# 3. Login functionality
# (Ver Test 1 arriba)

# 4. CORS working
# (Ver Test 3 arriba)
```

**Si todo esto funciona:** ✅ **Despliegue exitoso!**

