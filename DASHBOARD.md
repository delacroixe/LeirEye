# Network Traffic Analyzer - Dashboard Completo

Dashboard interactivo para capturar y analizar tráfico de red en tiempo real, construido con FastAPI y React.

## 🎯 Características

- 📊 **Captura de Paquetes en Tiempo Real**: Streaming via WebSocket
- 📈 **Estadísticas Avanzadas**: Protocolos, IPs, puertos
- 🎨 **Dashboard Interactivo**: Interfaz React moderna y responsiva
- 🔧 **Filtros BPF**: Compatibles con Wireshark
- 💾 **Exportación PCAP**: Guardable en formato estándar
- ⚡ **Alto Rendimiento**: FastAPI async + React optimizado

## 📂 Estructura del Proyecto

```
networking/
├── backend/
│   ├── app/
│   │   ├── main.py           # Aplicación FastAPI
│   │   ├── models.py         # Modelos Pydantic
│   │   ├── routes/
│   │   │   ├── capture.py    # Endpoints de captura
│   │   │   └── stats.py      # Endpoints de estadísticas
│   │   └── services/
│   │       └── packet_capture.py  # Lógica de captura
│   ├── requirements.txt
│   └── run.py
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CaptureControls.tsx
│   │   │   ├── PacketTable.tsx
│   │   │   └── Statistics.tsx
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   └── websocket.ts
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── package.json
│   └── public/
│
├── README.md
└── start.sh
```

## 🚀 Instalación Rápida

### Requisitos Previos
- Python 3.8+
- Node.js 16+
- npm o yarn
- Permisos de administrador (para captura de paquetes)

### Backend

```bash
cd backend

# Crear entorno virtual (opcional)
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar servidor
python run.py
```

El backend estará disponible en: `http://localhost:8000`

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Ejecutar servidor de desarrollo
npm start
```

El frontend estará disponible en: `http://localhost:3000`

### Ejecución Completa (Un Solo Comando)

```bash
chmod +x start.sh
./start.sh
```

## 📖 Uso

### 1. Acceder al Dashboard

Abre tu navegador en `http://localhost:3000`

### 2. Configurar Captura

En el panel "Controles de Captura":
- **Interfaz**: (Opcional) Especifica una interfaz (ej: `en0`, `eth0`)
- **Filtro BPF**: (Opcional) Usa filtros como:
  - `tcp port 80` - HTTP
  - `tcp port 443` - HTTPS
  - `udp` - Solo UDP
  - `host 192.168.1.1` - IP específica
  - `port 22` - SSH
- **Máximo de Paquetes**: Límite de captura

### 3. Iniciar Captura

Click en "Iniciar Captura" - requiere permisos de administrador

```bash
# macOS/Linux - ejecutar con sudo
sudo python run.py
```

### 4. Monitorear

- **Tabla de Paquetes**: Paquetes en tiempo real con detalles expandibles
- **Estadísticas**: Distribución de protocolos, top IPs/puertos
- **Gráficos**: Visualización en tiempo real

## 🔌 API Endpoints

### Captura

```
POST   /api/capture/start       - Inicia captura
POST   /api/capture/stop        - Detiene captura
GET    /api/capture/status      - Status actual
GET    /api/capture/packets     - Últimos paquetes
POST   /api/capture/clear       - Limpia buffer
WS     /api/capture/ws          - WebSocket streaming
```

### Estadísticas

```
GET    /api/stats/summary       - Resumen de stats
GET    /api/stats/protocols     - Distribución de protocolos
GET    /api/stats/top-ips       - Top IPs (origen/destino)
GET    /api/stats/top-ports     - Top puertos
```

## 📊 Ejemplo de Uso de API (curl)

```bash
# Iniciar captura
curl -X POST http://localhost:8000/api/capture/start \
  -H "Content-Type: application/json" \
  -d '{
    "interface": "en0",
    "packet_filter": "tcp port 80",
    "max_packets": 1000
  }'

# Obtener status
curl http://localhost:8000/api/capture/status

# Obtener paquetes
curl http://localhost:8000/api/capture/packets?limit=50

# Obtener estadísticas
curl http://localhost:8000/api/stats/summary
```

## 🐛 Filtros BPF Comunes

```
# Protocolo
tcp              - Solo TCP
udp              - Solo UDP
icmp             - Solo ICMP
ip               - Solo IP

# Puerto
port 80          - Puerto 80
tcp port 443     - TCP puerto 443
dst port 22      - Destino puerto 22

# Host
host 192.168.1.1           - Cualquier dirección
src host 192.168.1.1       - Origen específico
dst host 192.168.1.1       - Destino específico

# Combinaciones
tcp and port 80            - TCP en puerto 80
(tcp or udp) and port 53   - DNS
host 192.168.1.1 and port 443
tcp and not port 22        - TCP sin SSH
```

## 🖥️ Interfaces de Red

### Obtener interfaces disponibles

**macOS:**
```bash
ifconfig | grep "^[a-z]"
```

Comunes: `en0` (WiFi), `en1` (Ethernet), `lo0` (Loopback)

**Linux:**
```bash
ip link show
```

Comunes: `eth0`, `wlan0`, `lo`

## ⚠️ Notas de Seguridad

- **Permisos**: La captura requiere permisos de root/admin
- **Privacidad**: Solo usa en redes que controles
- **Datos**: Los paquetes capturados se almacenan en memoria del servidor
- **HTTPS**: En producción, habilita SSL/TLS

## 📦 Dependencias

### Backend
- `fastapi` - Framework web async
- `uvicorn` - ASGI server
- `scapy` - Captura de paquetes
- `pydantic` - Validación de datos

### Frontend
- `react` - Framework UI
- `recharts` - Gráficos
- `axios` - HTTP client
- `typescript` - Type safety

## 🔧 Solución de Problemas

### "Permission denied" al capturar

```bash
# Ejecutar con sudo
sudo python run.py
```

### WebSocket no conecta

- Verifica que el backend esté ejecutándose en `localhost:8000`
- Comprueba CORS en `app/main.py`
- Revisa la consola del navegador

### Paquetes vacíos

- Verifica el filtro BPF
- Comprueba si hay tráfico en la interfaz seleccionada
- Aumenta el límite de paquetes

### React no compila

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

## 📝 Ejemplos de Uso

### Capturar solo HTTP

```
Interfaz: (dejar vacío)
Filtro: tcp port 80
Máximo: 1000
```

### Monitorear una IP específica

```
Filtro: host 192.168.1.100
```

### Capturar DNS

```
Filtro: udp port 53
```

### Capturar HTTPS

```
Filtro: tcp port 443
```

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/amazing`)
3. Commit cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 🙌 Reconocimientos

- Basado en [Wireshark](https://www.wireshark.org/)
- Construido con [FastAPI](https://fastapi.tiangolo.com/) y [React](https://react.dev/)
- Captura de paquetes con [Scapy](https://scapy.net/)

## 📧 Contacto

Para preguntas o sugerencias, abre un issue en el repositorio.

---

**¡Disfruta analizando tráfico de red! 🚀**
