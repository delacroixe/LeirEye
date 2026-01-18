# 🚀 Ejecutar Network Traffic Analyzer

## ✅ Requisitos
- Python 3.10+
- Node.js 16+
- macOS/Linux (Windows con WSL)
- Permisos de sudo (para captura con scapy)

## 📦 Instalación

### Backend
```bash
cd backend
pip install -r requirements.txt
```

### Frontend
```bash
cd frontend
npm install
```

## 🏃 Ejecutar la Aplicación

### Opción 1: Scripts automáticos (Recomendado)

**Terminal 1 - Backend:**
```bash
chmod +x run_backend.sh
./run_backend.sh
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### Opción 2: Manual

**Terminal 1 - Backend (con sudo):**
```bash
cd backend
source /path/to/venv/bin/activate  # Tu virtualenv
sudo -E python run.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

## 🌐 Acceder a la Aplicación

- **Frontend**: http://localhost:3001
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 🧪 Pruebas

### Probar WebSocket (requiere terminal 3)
```bash
# Instalar websockets
pip install websockets

# Ejecutar prueba
python test_websocket.py
```

Esto mostrará:
```
✓ Conectado a ws://localhost:8000/api/capture/ws
📊 Estado inicial: {...}
📦 Paquete 1: 192.168.1.1 → 8.8.8.8 (TCP)
📦 Paquete 2: 192.168.1.1 → 8.8.8.8 (UDP)
✓ Prueba completada: 47 paquetes recibidos
```

## 🔍 Usar la Aplicación

1. **Seleccionar interfaz**: Dropdown automático detecta interfaces
2. **Aplicar filtro** (opcional): 
   - Usar botones predefinidos (TCP, UDP, HTTP/HTTPS, etc.)
   - O escribir filtro BPF manualmente
3. **Iniciar captura**: Click en "Iniciar Captura"
4. **Ver resultados en tiempo real**:
   - Tabla de paquetes (abajo)
   - Estadísticas en vivo (arriba)
   - Gráficos de protocolos y puertos

## 🐛 Troubleshooting

### "Permission denied" en captura
```bash
# El backend DEBE ejecutarse con sudo
sudo python run.py
# O usar el script
./run_backend.sh
```

### WebSocket no conecta
- Verifica que backend esté en puerto 8000: `curl http://localhost:8000/health`
- Verifica CORS: Backend debe aceptar `http://localhost:3001`
- Revisa console del navegador (F12) para errores

### "0 paquetes capturados"
- Asegúrate de usar `sudo`
- Verifica que tu interfaz sea válida (ej: `en0`, `eth0`)
- Prueba sin filtro primero
- Genera tráfico: `ping 8.8.8.8` o abre un navegador

### Estadísticas no actualizan
- Verifica que WebSocket está conectado (icono en App.tsx)
- Mira la consola del backend para errores
- Intenta refrescar la página

## 📋 Estructura del Proyecto

```
networking/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app
│   │   ├── models.py            # Pydantic models
│   │   ├── routes/
│   │   │   ├── capture.py       # Endpoints de captura + WebSocket
│   │   │   └── stats.py         # Estadísticas
│   │   └── services/
│   │       └── packet_capture.py # Lógica de captura
│   ├── run.py                   # Punto de entrada
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Component principal
│   │   ├── components/
│   │   │   ├── CaptureControls.tsx
│   │   │   ├── PacketTable.tsx
│   │   │   └── Statistics.tsx
│   │   └── services/
│   │       ├── api.ts           # HTTP client
│   │       └── websocket.ts     # WebSocket client
│   └── package.json
├── run_backend.sh               # Script para ejecutar backend
├── test_websocket.py            # Prueba de WebSocket
└── IMPROVEMENTS.md              # Roadmap de mejoras
```

## 🔮 Próximas Mejoras

Ver [IMPROVEMENTS.md](./IMPROVEMENTS.md) para el roadmap completo.

Mejoras pendientes:
- [ ] Búsqueda en tabla de paquetes
- [ ] Exportar a CSV/PCAP
- [ ] Gráficos temporales
- [ ] Alertas de seguridad
- [ ] Geolocalización de IPs

## 📞 Soporte

Para reportar bugs o sugerir features, revisa los logs:

**Backend:**
```bash
# Los logs aparecen en la terminal donde ejecutaste sudo python run.py
# Busca líneas con ERROR o advertencias
```

**Frontend:**
```bash
# F12 en navegador → Console tab
# Mira los mensajes de console.log() y console.error()
```

