# Captura de Paquetes

La captura de paquetes es la función principal de NetMentor. Permite interceptar y analizar el tráfico de red en tiempo real.

## 🎯 ¿Qué es la Captura de Paquetes?

La **captura de paquetes** (packet sniffing) es el proceso de interceptar y registrar el tráfico que pasa por una interfaz de red. Es fundamental para:

- 🔍 **Análisis de red**: Entender qué está pasando en tu red
- 🐛 **Debugging**: Identificar problemas de conectividad
- 🛡️ **Seguridad**: Detectar tráfico malicioso o no autorizado
- 📊 **Monitoreo**: Medir el rendimiento de la red

## 🚀 Iniciar una Captura

### Paso 1: Seleccionar Interfaz

En el panel de Captura, selecciona la interfaz de red:

| Interfaz | Sistema | Uso |
|----------|---------|-----|
| `en0` | macOS | WiFi principal |
| `en1` | macOS | Ethernet o segunda WiFi |
| `eth0` | Linux | Ethernet principal |
| `wlan0` | Linux | WiFi |
| `lo0` / `lo` | Ambos | Loopback (tráfico local) |

!!! tip "¿Cómo saber qué interfaz usar?"
    ```bash
    # macOS
    ifconfig | grep -E "^[a-z]" | cut -d: -f1
    
    # Linux
    ip link show | grep -E "^[0-9]" | awk '{print $2}' | tr -d ':'
    ```

### Paso 2: Configurar Filtros (Opcional)

Puedes filtrar el tráfico por:

- **Puerto**: Solo tráfico HTTP (puerto 80)
- **Protocolo**: Solo TCP o UDP
- **IP**: Tráfico hacia/desde una IP específica

### Paso 3: Iniciar Captura

1. **Clic en "Iniciar Captura"** (o botón play)
2. Los paquetes aparecerán en la tabla en tiempo real
3. **Clic en "Detener"** cuando termines

## 📊 Interpretar los Resultados

Cada paquete capturado muestra:

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| **#** | Número de paquete | 1, 2, 3... |
| **Tiempo** | Timestamp de captura | 14:32:01.123 |
| **Origen** | IP de origen | 192.168.1.100 |
| **Destino** | IP de destino | 8.8.8.8 |
| **Protocolo** | Protocolo detectado | TCP, UDP, DNS, HTTP |
| **Longitud** | Tamaño en bytes | 64, 1500 |
| **Info** | Resumen del paquete | GET /index.html |

### Códigos de Color

Los paquetes se colorean según su tipo:

```
🟢 Verde     → TCP normal
🔵 Azul      → UDP
🟡 Amarillo  → DNS
🟣 Morado    → HTTP/HTTPS
🔴 Rojo      → Errores o tráfico sospechoso
```

## 🔍 Análisis Detallado

### Ver Detalles de un Paquete

Haz clic en cualquier paquete para ver:

1. **Cabeceras de Capa 2 (Enlace)**
   - Direcciones MAC origen y destino
   - Tipo de frame Ethernet

2. **Cabeceras de Capa 3 (Red)**
   - Versión IP (v4 o v6)
   - Direcciones IP
   - TTL, fragmentación

3. **Cabeceras de Capa 4 (Transporte)**
   - Puerto origen y destino
   - Flags TCP (SYN, ACK, FIN...)
   - Números de secuencia

4. **Payload (Datos)**
   - Contenido del paquete (si no está cifrado)

### Usar el Explicador IA

1. Selecciona un paquete
2. Clic en "🤖 Explicar con IA"
3. Ollama analizará el paquete y te dará una explicación en lenguaje natural

## ⚠️ Permisos Necesarios

La captura de paquetes requiere **permisos elevados**:

=== "macOS"

    ```bash
    # Opción 1: Ejecutar con sudo
    cd backend
    source venv/bin/activate
    sudo python run.py
    
    # Opción 2: Instalar ChmodBPF (permanente)
    brew install wireshark-chmodbpf
    # Reiniciar sesión después
    ```

=== "Linux"

    ```bash
    # Opción 1: Ejecutar con sudo
    sudo python run.py
    
    # Opción 2: Dar capabilities (permanente)
    sudo setcap cap_net_raw,cap_net_admin+eip $(which python3)
    ```

## 🔧 Solución de Problemas

??? warning "No aparecen paquetes"
    1. ¿Ejecutaste con `sudo`?
    2. ¿La interfaz es correcta? Verifica con `ifconfig`
    3. ¿Hay tráfico de red? Abre un navegador

??? warning "Error: Permission denied"
    La captura requiere permisos root. Ver sección anterior.

??? warning "Demasiados paquetes"
    Usa filtros para reducir el volumen:
    - Filtra por puerto: solo 80/443
    - Filtra por IP: solo tu gateway
    - Captura en intervalos cortos

## 📚 Conceptos Relacionados

- [¿Qué es un paquete?](../concepts/basics/what-is-a-packet.md)
- [TCP vs UDP](../concepts/basics/tcp-vs-udp.md)
- [Protocolos comunes](../concepts/protocols/index.md)
