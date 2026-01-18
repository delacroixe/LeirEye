# Capturador de Tráfico de Red con Python

Herramientas para capturar y analizar tráfico de red similar a Wireshark usando Python y Scapy.

**⚡ NUEVO: Dashboard web interactivo con FastAPI + React** → [Ver DASHBOARD.md](./DASHBOARD.md)

## 📂 Contenido

### Scripts CLI (Python Puro)
- `packet_sniffer.py` - Capturador básico en tiempo real
- `packet_analyzer.py` - Analizador con estadísticas
- Requiere solo Scapy, sin dependencias web

### Dashboard Web (FastAPI + React) ⭐
- **Backend**: API REST con streaming WebSocket
- **Frontend**: Interfaz React con gráficos en tiempo real
- Dashboard interactivo, estadísticas en vivo, filtros BPF
- **Ver**: [DASHBOARD.md](./DASHBOARD.md) para documentación completa
- **Inicio rápido**: [QUICKSTART.md](./QUICKSTART.md)

## 🚀 Inicio Rápido

### Dashboard Completo (Recomendado)

```bash
# Ejecutar backend + frontend automáticamente
python3 run_dashboard.py

# Si necesitas permisos de admin:
sudo python3 run_dashboard.py
```

Abre navegador en: **http://localhost:3000**

---

### Scripts CLI (Sin Web)

```bash
pip install -r requirements.txt

# Capturador básico
sudo python3 packet_sniffer.py

# Analizador con estadísticas
sudo python3 packet_analyzer.py
```

## 📊 Comparación

| Feature | CLI | Dashboard |
|---------|-----|-----------|
| Captura en vivo | ✓ | ✓ |
| Tabla de paquetes | Terminal | ✓ Web |
| Gráficos estadísticas | ✗ | ✓ (Recharts) |
| Interfaz amigable | ✗ | ✓ React |
| Filtros BPF | ✓ | ✓ |
| Exportar PCAP | ✓ | Planeado |
| WebSocket streaming | ✗ | ✓ |
| API REST | ✗ | ✓ |

## 📖 Documentación

- **[QUICKSTART.md](./QUICKSTART.md)** - Inicio rápido del dashboard
- **[DASHBOARD.md](./DASHBOARD.md)** - Documentación completa del web app
- **[requirements.txt](./requirements.txt)** - Dependencias Python

## 🔧 Requisitos

- Python 3.8+
- Node.js 16+ (para dashboard)
- Permisos de administrador (para captura)
- macOS/Linux (la compatibilidad de Windows es limitada)

## 📝 Ejemplos de Uso

### CLI - Capturar HTTP

```bash
sudo python3 packet_sniffer.py

# Con filtro BPF:
# Edita el archivo y descomenta:
# start_sniffing(packet_filter="tcp port 80")
```

### CLI - Ver estadísticas

```bash
sudo python3 packet_analyzer.py

# Presiona Ctrl+C para ver estadísticas finales
# Opción de guardar en PCAP
```

### Dashboard - Capturar HTTPS

1. Abre http://localhost:3000
2. Interfaz: (vacío para todas)
3. Filtro: `tcp port 443`
4. Click en "Iniciar Captura"

### Dashboard - Monitorear IP específica

1. Filtro: `host 192.168.1.100`
2. Ver estadísticas en tiempo real
3. Expandir paquetes para detalles

## 🎯 Filtros BPF Comunes

```
tcp                          # Solo TCP
udp                          # Solo UDP
icmp                         # Solo ICMP
port 80                      # Puerto 80
tcp port 443                 # TCP puerto 443
host 192.168.1.1             # IP específica
src host 192.168.1.1         # Origen específico
dst host 192.168.1.1         # Destino específico
tcp and not port 22          # TCP sin SSH
(tcp or udp) and port 53     # DNS
```

## ⚙️ Configuración

Crear archivo `.env` en la raíz:

```env
# Backend
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
DEBUG=true

# Frontend
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000
```

## 📚 Estructura del Proyecto

```
networking/
├── backend/                 # FastAPI server
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── routes/
│   │   └── services/
│   ├── run.py
│   └── requirements.txt
│
├── frontend/                # React app
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── App.tsx
│   └── package.json
│
├── packet_sniffer.py        # CLI básico
├── packet_analyzer.py       # CLI con stats
├── run_dashboard.py         # Ejecutor completo
├── QUICKSTART.md            # Guía rápida
├── DASHBOARD.md             # Docs completas
└── README.md                # Este archivo
```

## 🔐 Notas de Seguridad

⚠️ **Importante:**
- Solo captura tráfico en redes que controlas
- No uses en redes públicas sin autorización
- Respeta privacidad y leyes locales
- Datos almacenados en memoria, no en disco por defecto

## 🐛 Troubleshooting

### "Permission denied"
```bash
sudo python3 packet_sniffer.py
# O para dashboard:
sudo python3 run_dashboard.py
```

### Puerto ya en uso
```bash
lsof -i :8000  # Backend
lsof -i :3000  # Frontend
kill -9 <PID>
```

### WebSocket no conecta
- Verifica que backend esté en http://localhost:8000
- Abre DevTools (F12) → Network → WS
- Comprueba CORS en backend

Más detalles en [DASHBOARD.md](./DASHBOARD.md#-solución-de-problemas)

## 📧 Contacto

Para problemas o sugerencias, abre un issue en el repositorio.

---

**¡Disfruta analizando tráfico! 🚀**
