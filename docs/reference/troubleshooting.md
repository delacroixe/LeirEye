# Troubleshooting

Soluciones a problemas comunes en NetMentor.

## 🔍 Diagnóstico Rápido

### Checklist de Verificación

```bash
# 1. Docker corriendo
docker-compose ps
# Debe mostrar postgres y redis como "Up"

# 2. Backend respondiendo
curl http://localhost:8000/health
# Debe retornar {"status": "healthy"}

# 3. Frontend accesible
curl -I http://localhost:3001
# Debe retornar 200 OK

# 4. Ollama (si usas IA)
curl http://localhost:11434/api/tags
# Debe listar modelos
```

---

## 📡 Problemas de Captura

### No se capturan paquetes

**Síntoma:** La captura inicia pero no aparecen paquetes.

**Causa:** Falta de permisos para capturar en la interfaz.

**Solución:**

=== "macOS"

    ```bash
    # Opción 1: Ejecutar con sudo
    cd backend
    source venv/bin/activate
    sudo python run.py
    
    # Opción 2: Instalar ChmodBPF (permanente)
    brew install wireshark-chmodbpf
    # Reiniciar sesión
    ```

=== "Linux"

    ```bash
    # Opción 1: Ejecutar con sudo
    sudo python run.py
    
    # Opción 2: Dar capabilities
    sudo setcap cap_net_raw,cap_net_admin+eip $(which python3)
    ```

### Interfaz no disponible

**Síntoma:** Error "Interface not found" o "No such device".

**Solución:**

```bash
# Ver interfaces disponibles
ifconfig | grep -E "^[a-z]"

# O con Python
python -c "from scapy.all import get_if_list; print(get_if_list())"
```

Asegúrate de usar el nombre exacto de la interfaz (ej: `en0`, no `wifi`).

---

## 🗄️ Problemas de Base de Datos

### Error de conexión a PostgreSQL

**Síntoma:** `Connection refused` o `could not connect to server`.

**Solución:**

```bash
# Verificar que Docker está corriendo
docker-compose ps

# Si postgres no está corriendo
docker-compose up -d postgres

# Verificar logs
docker-compose logs postgres

# Si hay problemas de volumen
docker-compose down -v
docker-compose up -d
```

### Error de migración

**Síntoma:** `Table already exists` o `Relation does not exist`.

**Solución:**

```bash
cd backend
source venv/bin/activate

# Ver estado actual
alembic current

# Forzar a versión específica
alembic stamp head

# Rollback y reaplicar
alembic downgrade base
alembic upgrade head
```

### Resetear base de datos

```bash
# ¡CUIDADO! Esto borra todos los datos
docker-compose down -v
docker-compose up -d
cd backend
source venv/bin/activate
alembic upgrade head
```

---

## 🌐 Problemas de Conexión Frontend-Backend

### CORS Error

**Síntoma:** Error en consola del navegador: `Access-Control-Allow-Origin`.

**Solución:**

Verificar `backend/.env`:

```ini
CORS_ORIGINS=http://localhost:3001,http://127.0.0.1:3001
```

Reiniciar el backend después de cambiar.

### Connection Refused

**Síntoma:** Frontend muestra error de conexión.

**Verificar:**

```bash
# Backend corriendo
curl http://localhost:8000/health

# Puerto correcto en frontend
cat frontend/.env
# Debe tener REACT_APP_API_URL=http://localhost:8000
```

### WebSocket no conecta

**Síntoma:** Paquetes no aparecen en tiempo real.

**Solución:**

1. Verificar que el backend esté corriendo
2. Revisar consola del navegador para errores
3. Verificar firewall no bloquea WebSocket

---

## 🔐 Problemas de Autenticación

### Token expirado constantemente

**Síntoma:** Sesión se cierra frecuentemente.

**Causa:** Tokens expiran después de 30 minutos.

**Solución:**
El frontend debería renovar automáticamente. Si no funciona, verificar que el refresh token esté guardándose correctamente.

### No puedo crear primer usuario

**Síntoma:** Error al registrar.

**Verificar:**

```bash
# Base de datos accesible
psql -h localhost -U postgres -d netmentor -c "SELECT 1"

# Migraciones aplicadas
cd backend
source venv/bin/activate
alembic current
```

### Password inválido

**Requisitos del password:**

- Mínimo 8 caracteres
- Al menos una mayúscula
- Al menos una minúscula
- Al menos un número

Ejemplo válido: `Password123`

---

## 🤖 Problemas con Ollama

### Ollama no responde

**Síntoma:** Explicador IA no funciona.

**Solución:**

```bash
# Verificar si está corriendo
curl http://localhost:11434/api/tags

# Si no responde, iniciar
ollama serve

# En otra terminal, verificar modelo
ollama list
# Si no hay modelos
ollama pull llama3.2:3b
```

### Respuestas muy lentas

**Causa:** Modelo grande o hardware limitado.

**Solución:**

```bash
# Usar modelo más pequeño
ollama pull llama3.2:1b

# Cambiar en configuración
# backend/app/core/config.py
OLLAMA_MODEL = "llama3.2:1b"
```

### Error de memoria

**Síntoma:** Ollama se cierra o sistema se congela.

**Solución:**

1. Cerrar otras aplicaciones
2. Usar modelo más pequeño
3. Aumentar swap si es posible

---

## 🖥️ Problemas del Sistema

### Puerto ya en uso

**Síntoma:** `Address already in use`.

**Solución:**

```bash
# Ver qué usa el puerto
lsof -i :8000

# Matar el proceso
kill $(lsof -t -i:8000)

# O cambiar el puerto en la configuración
```

### Falta de espacio en disco

**Síntoma:** Errores aleatorios, Docker no inicia.

**Solución:**

```bash
# Ver espacio
df -h

# Limpiar Docker
docker system prune -a

# Limpiar logs viejos
rm -rf backend/logs/*.log.old
```

### Memoria insuficiente

**Síntoma:** Sistema lento, procesos mueren.

**Solución:**

1. Cerrar aplicaciones innecesarias
2. Usar modelo Ollama más pequeño
3. Reducir número de paquetes en memoria

---

## 🐛 Debugging

### Ver logs detallados

```bash
# Backend con debug
DEBUG=true python run.py

# Frontend con logs
REACT_APP_DEBUG=true npm start
```

### Verificar estado de servicios

```bash
# Script de diagnóstico
echo "=== Docker ==="
docker-compose ps

echo "=== Backend ==="
curl -s http://localhost:8000/health | jq .

echo "=== Frontend ==="
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001

echo "=== Ollama ==="
curl -s http://localhost:11434/api/tags | jq .models[].name

echo "=== Puertos ==="
lsof -i :3001,:8000,:5432,:6379,:11434 2>/dev/null | grep LISTEN
```

### Reportar un Bug

Si el problema persiste, incluye:

1. Versión de NetMentor
2. Sistema operativo
3. Logs relevantes
4. Pasos para reproducir
5. Comportamiento esperado vs actual

---

## 💡 Tips Generales

!!! tip "Reiniciar es válido"
    Si algo no funciona y no sabes por qué:
    ```bash
    docker-compose down
    docker-compose up -d
    # Reiniciar backend y frontend
    ```

!!! tip "Verificar logs siempre"
    Los logs tienen la respuesta el 90% de las veces:
    ```bash
    docker-compose logs -f
    # Y la consola del navegador (F12)
    ```

!!! tip "Actualizar dependencias"
    Muchos problemas se resuelven actualizando:
    ```bash
    cd backend && pip install --upgrade -r requirements.txt
    cd frontend && npm update
    ```
