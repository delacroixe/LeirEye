# 📋 Referencia Rápida - Comandos Útiles

## 🚀 Inicio Rápido

```bash
# Opción 1: Bash script (recomendado)
cd /Users/antuan/Dev/sec/networking
./run_simple.sh

# Opción 2: Python script
python3 run_dashboard.py

# Opción 3: Manual (3 terminales)
# Terminal 1:
cd backend && sudo python run.py

# Terminal 2:
cd frontend && npm start

# Terminal 3:
# Abre navegador en http://localhost:3000
```

---

## 📍 URLs Importantes

| URL | Propósito |
|-----|-----------|
| http://localhost:3000 | Dashboard web |
| http://localhost:8000 | Backend API |
| http://localhost:8000/docs | Swagger UI (prueba endpoints) |
| http://localhost:8000/redoc | ReDoc (docs alternativa) |

---

## 🔧 Backend

### Instalar dependencias
```bash
cd backend
pip install -r requirements.txt
```

### Ejecutar servidor
```bash
# Sin sudo (sin captura)
python run.py

# Con sudo (con captura)
sudo python run.py
```

### Probar endpoints
```bash
# Health check
curl http://localhost:8000/health

# Documentación interactiva
open http://localhost:8000/docs

# Iniciar captura
curl -X POST http://localhost:8000/api/capture/start \
  -H "Content-Type: application/json" \
  -d '{"max_packets": 1000}'

# Obtener status
curl http://localhost:8000/api/capture/status

# Obtener paquetes
curl http://localhost:8000/api/capture/packets?limit=50

# Detener captura
curl -X POST http://localhost:8000/api/capture/stop

# Estadísticas
curl http://localhost:8000/api/stats/summary
curl http://localhost:8000/api/stats/protocols
curl http://localhost:8000/api/stats/top-ips
curl http://localhost:8000/api/stats/top-ports
```

---

## ⚛️ Frontend

### Instalar dependencias
```bash
cd frontend
npm install
```

### Ejecutar en desarrollo
```bash
npm start
# Se abre http://localhost:3000

# Con puerto específico
PORT=3001 npm start
```

### Build para producción
```bash
npm run build
# Crea carpeta build/ lista para deploy
```

### Ejecutar tests
```bash
npm test
```

### Linting
```bash
npm run lint  # Si está configurado
```

---

## 📦 Scripts CLI (Sin Web)

### Capturador básico
```bash
cd /Users/antuan/Dev/sec/networking

# Sin filtro
sudo python3 packet_sniffer.py

# Con filtro HTTP
# Edita archivo y descomenta:
# start_sniffing(packet_filter="tcp port 80")
```

### Analizador con estadísticas
```bash
sudo python3 packet_analyzer.py

# Presiona Ctrl+C para ver estadísticas
# Opción de guardar en PCAP
```

---

## 🔍 Interfaces de Red

### Ver interfaces disponibles

**macOS:**
```bash
ifconfig | grep "^[a-z]"
# Comunes: en0 (WiFi), en1 (Ethernet)
```

**Linux:**
```bash
ip link show
# Comunes: eth0, wlan0, lo
```

### Usar interfaz específica
```bash
# En dashboard: especifica en campo "Interfaz"
# En CLI: edita archivo y cambia iface parameter
```

---

## 🎯 Filtros BPF Comunes

```bash
tcp                    # Solo TCP
udp                    # Solo UDP
icmp                   # Solo ICMP

port 80                # Puerto 80 (HTTP)
port 443               # Puerto 443 (HTTPS)
port 22                # Puerto 22 (SSH)
port 53                # Puerto 53 (DNS)

host 192.168.1.1       # IP específica (origen o destino)
src host 192.168.1.1   # Origen específico
dst host 192.168.1.1   # Destino específico

tcp and port 80        # TCP en puerto 80
tcp port 443 or tcp port 80  # HTTPS o HTTP
host 192.168.1.1 and port 443
tcp and not port 22    # TCP sin SSH
(tcp or udp) and port 53  # DNS
```

---

## 🐛 Troubleshooting

### Puerto 3000 ocupado
```bash
# Ver qué está usando el puerto
lsof -i :3000

# Matar proceso
kill -9 <PID>

# O ejecutar con puerto diferente
PORT=3001 npm start
```

### Puerto 8000 ocupado
```bash
lsof -i :8000
kill -9 <PID>
```

### "Permission denied" en captura
```bash
# Ejecutar con sudo
sudo python3 run_dashboard.py

# O en CLI
sudo python3 packet_sniffer.py
```

### WebSocket no conecta
```bash
# Verificar que backend esté corriendo
curl http://localhost:8000/health

# Abrir DevTools: F12 → Network → WS
# Ver si hay errores en console
```

### React no inicia
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

### Backend falla
```bash
cd backend
pip install --upgrade -r requirements.txt
python run.py
```

---

## 📁 Estructura de Carpetas

```
networking/
├── backend/              # FastAPI
│   ├── app/
│   ├── run.py
│   └── requirements.txt
├── frontend/             # React
│   ├── src/
│   ├── package.json
│   └── public/
├── run_simple.sh         # ⭐ Ejecutor Bash
├── run_dashboard.py      # ⭐ Ejecutor Python
├── packet_sniffer.py     # CLI básico
├── packet_analyzer.py    # CLI con stats
├── README.md
├── QUICKSTART.md
├── DASHBOARD.md
├── DEVELOPMENT.md
├── IMPLEMENTATION.md
├── ARCHITECTURE.md
├── CONCLUSION.md
├── CHEATSHEET.md         # Este archivo
└── .gitignore
```

---

## 🔄 Workflow Típico

```
1. Iniciar dashboard:
   ./run_simple.sh

2. Abrir navegador:
   http://localhost:3000

3. Configurar captura:
   - Interfaz: en0 (opcional)
   - Filtro: tcp port 80 (opcional)
   - Máximo: 1000

4. Hacer clic en "Iniciar Captura"

5. Ver datos en tiempo real:
   - Tabla de paquetes
   - Gráficos de estadísticas
   - IPs y puertos más usados

6. Expandir filas para detalles:
   - Full IP / puertos
   - Flags TCP
   - Payload en hex

7. Detener captura:
   Click en "Detener Captura"

8. Salir:
   Ctrl+C en terminal
```

---

## 💾 Guardar Capturas

### Con CLI (packet_analyzer.py)
```bash
sudo python3 packet_analyzer.py

# Al presionar Ctrl+C:
# ¿Guardar captura en archivo PCAP? (s/n): s
# Se guarda como: capture_YYYYMMDD_HHMMSS.pcap
```

### Abrir en Wireshark
```bash
wireshark capture_20260118_120000.pcap
```

---

## 📊 Ver Logs

### Backend
```bash
# Tail en tiempo real
tail -f /tmp/backend.log

# Buscar errores
grep ERROR /tmp/backend.log
```

### Frontend
```bash
# En consola del navegador: F12 → Console
# O en terminal donde se ejecuta npm start
```

---

## 🔐 Cambiar Configuración

### Crear archivo .env
```bash
cp .env.example .env
# Editar según necesidades
```

### Variables disponibles
```env
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
DEBUG=true
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000
```

---

## 🚀 Deploy

### Docker
```bash
docker-compose up
```

### Heroku
```bash
heroku create your-app-name
git push heroku main
```

### AWS/Digital Ocean
Ver DEVELOPMENT.md para instrucciones

---

## 📚 Documentación Rápida

| Documento | Para Quién | Qué Leer |
|-----------|-----------|---------|
| README.md | Todos | Descripción general |
| QUICKSTART.md | Usuarios | Cómo empezar |
| DASHBOARD.md | Usuarios | Cómo usar dashboard |
| DEVELOPMENT.md | Devs | Cómo extender |
| ARCHITECTURE.md | Devs | Cómo funciona |
| IMPLEMENTATION.md | Devs | Detalles técnicos |
| CONCLUSION.md | Todos | Resumen proyecto |
| CHEATSHEET.md | Todos | Este archivo |

---

## 🆘 Soporte Rápido

**P: ¿Cómo inicio?**
R: `./run_simple.sh`

**P: ¿Dónde está el dashboard?**
R: http://localhost:3000

**P: ¿Cómo pruebo la API?**
R: http://localhost:8000/docs

**P: ¿Necesito sudo?**
R: Sí, para capturar paquetes

**P: ¿Puedo usar sin web?**
R: Sí, usa `packet_sniffer.py` o `packet_analyzer.py`

**P: ¿Cómo cambio el puerto?**
R: `PORT=3001 npm start` (frontend) o archivo .env (backend)

**P: ¿Dónde aprendo más?**
R: Consulta documentación correspondiente (README, DASHBOARD, etc.)

---

## ⌨️ Atajos Útiles

### Terminal
```bash
Ctrl+C          # Detener proceso
Ctrl+Z          # Pausar proceso
bg              # Ejecutar en background
fg              # Traer al foreground
jobs            # Ver procesos en background
```

### VS Code
```bash
Ctrl+`          # Abrir terminal integrada
Ctrl+K Ctrl+W   # Cerrar archivo
Ctrl+/          # Comentar línea
Shift+Alt+F     # Formatear documento
F5              # Debugger
```

### Navegador (DevTools)
```bash
F12             # Abrir DevTools
Ctrl+Shift+C    # Selector de elemento
Ctrl+Shift+K    # Consola
Network         # Ver requests
Storage         # LocalStorage, cookies
```

---

## 🎓 Próximos Pasos

1. **Ejecuta el dashboard:**
   ```bash
   ./run_simple.sh
   ```

2. **Prueba la API:**
   ```
   http://localhost:8000/docs
   ```

3. **Explora el código:**
   - Backend: `backend/app/`
   - Frontend: `frontend/src/`

4. **Agrega features:**
   - Ver DEVELOPMENT.md

5. **Deploy:**
   - Ver DEVELOPMENT.md → Deploying

---

## 📝 Notas Finales

- **Guarda este archivo** para referencia rápida
- **Consulta documentación** para detalles
- **Usa DevTools** para debugging
- **Lee el código** para aprender
- **Experimenta** con filtros y parámetros

---

**¡Listo para empezar! 🚀**

*Última actualización: 18 de enero de 2026*
