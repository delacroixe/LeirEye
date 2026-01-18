# 🚀 Guía Rápida - Network Traffic Analyzer

## Inicio Inmediato (Recomendado)

### Opción 1: Script Automatizado (Más Fácil)

```bash
cd /Users/antuan/Dev/sec/networking

# Ejecutar dashboard completo (Backend + Frontend)
python3 run_dashboard.py

# Si necesitas permisos de admin para captura:
sudo python3 run_dashboard.py
```

Luego abre el navegador en: **http://localhost:3000**

---

### Opción 2: Ejecución Manual

#### Terminal 1 - Backend

```bash
cd /Users/antuan/Dev/sec/networking/backend

# Crear entorno virtual (opcional)
python3 -m venv venv
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar (requiere sudo para captura)
sudo python run.py
```

Backend disponible en: `http://localhost:8000`

#### Terminal 2 - Frontend

```bash
cd /Users/antuan/Dev/sec/networking/frontend

# Instalar dependencias
npm install

# Ejecutar
npm start
```

Frontend disponible en: `http://localhost:3000`

---

## 📊 Usando el Dashboard

### 1. Interfaz Principal

```
┌─ Network Traffic Analyzer ──────────────────┐
├─ Controles de Captura ──────────────────────┤
│  Interfaz: [en0/eth0]                       │
│  Filtro:   [tcp port 80]                    │
│  Máximo:   [1000]                           │
│  [Iniciar Captura] [Detener Captura]        │
├─ Estadísticas ──────────────────────────────┤
│  Total: 500 | TCP: 250 | UDP: 150 | ICMP: 50 │
│  [Gráfico de Protocolos]                    │
├─ Paquetes Capturados ───────────────────────┤
│  Hora | IP Origen | IP Destino | Protocolo │
│  12:30:45 | 192.168.1.100 | 8.8.8.8 | TCP │
└─────────────────────────────────────────────┘
```

### 2. Configurar Captura

1. **Interfaz** (opcional):
   - Dejar vacío para capturar en todas
   - Común en macOS: `en0` (WiFi), `en1` (Ethernet)
   - Común en Linux: `eth0`, `wlan0`

2. **Filtro BPF** (opcional):
   ```
   tcp              # Solo TCP
   udp              # Solo UDP
   port 80          # Puerto 80
   tcp port 443     # TCP puerto 443
   host 192.168.1.1 # IP específica
   tcp port 80 or tcp port 443  # HTTP o HTTPS
   ```

3. **Máximo de Paquetes**: 1000 (por defecto)

### 3. Iniciar Captura

Click en "Iniciar Captura" → Verás paquetes en tiempo real

### 4. Ver Detalles de Paquete

Click en cualquier fila de la tabla para expandir y ver:
- IPs origen/destino
- Puertos origen/destino
- Flags TCP
- Payload en hexadecimal
- Timestamp exacto

---

## 🔧 Comandos Útiles

### Ver interfaces disponibles

**macOS:**
```bash
ifconfig | grep "^[a-z]"
```

**Linux:**
```bash
ip link show
```

### Ver procesos ejecutándose

```bash
# Ver puerto 8000 (Backend)
lsof -i :8000

# Ver puerto 3000 (Frontend)
lsof -i :3000

# Matar procesos
pkill -f "python run.py"
pkill -f "npm start"
```

### Instalar dependencias nuevamente

```bash
# Backend
cd backend && pip install -r requirements.txt --force-reinstall

# Frontend
cd frontend && npm install --force
```

---

## 📝 Ejemplos de Filtros

| Objetivo | Filtro |
|----------|--------|
| HTTP | `tcp port 80` |
| HTTPS | `tcp port 443` |
| SSH | `tcp port 22` |
| DNS | `udp port 53` |
| Solo TCP | `tcp` |
| Solo UDP | `udp` |
| IP específica | `host 192.168.1.100` |
| Red específica | `net 192.168.1.0/24` |
| No SSH | `tcp and not port 22` |
| HTTP o HTTPS | `tcp port 80 or tcp port 443` |

---

## 🐛 Solución de Problemas

### "Permission denied" en captura

```bash
# Ejecutar con sudo
sudo python3 run_dashboard.py

# O en backend:
cd backend && sudo python run.py
```

### Puerto 8000/3000 ya en uso

```bash
# Encontrar proceso
lsof -i :8000

# Matar proceso
kill -9 <PID>
```

### WebSocket no conecta

- Verifica que backend esté en `http://localhost:8000`
- Abre consola del navegador (F12) → Pestaña Network
- Busca conexión WebSocket

### Paquetes no aparecen

1. Verifica que haya tráfico en la interfaz
2. Cambia el filtro o déjalo vacío
3. Aumenta el límite de paquetes
4. Comprueba que el filtro BPF es válido

### React no compila

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

---

## 🔗 URLs Útiles

| Servicio | URL |
|----------|-----|
| Dashboard | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| API Docs (ReDoc) | http://localhost:8000/redoc |

---

## 📚 Documentación Completa

Ver [DASHBOARD.md](./DASHBOARD.md) para documentación detallada.

---

## ✨ Tips

- Los paquetes se actualizan en tiempo real via WebSocket
- Las estadísticas se actualizan cada 5 segundos
- Máximo 200 paquetes en la tabla (para rendimiento)
- Usa filtros para reducir tráfico
- Expande paquetes para ver detalles completos
- Los datos se almacenan en memoria de la sesión

---

**¡Listo! Disfruta analizando tráfico de red 🚀**
