# Ejemplos de Uso de la API

Ejemplos prácticos para interactuar con la API de LeirEye usando curl, Python y JavaScript.

## 🚀 Configuración Inicial

### URL Base

```bash
# Desarrollo local
export API_URL="http://localhost:8000"

# Producción
export API_URL="https://tu-servidor.com"
```

---

## 🔐 Autenticación

### Registrar Usuario

=== "curl"

    ```bash
    curl -X POST "$API_URL/api/auth/register" \
      -H "Content-Type: application/json" \
      -d '{
        "email": "usuario@ejemplo.com",
        "username": "miusuario",
        "password": "MiPassword123!"
      }'
    ```

=== "Python"

    ```python
    import httpx

    response = httpx.post(
        f"{API_URL}/api/auth/register",
        json={
            "email": "usuario@ejemplo.com",
            "username": "miusuario",
            "password": "MiPassword123!"
        }
    )
    print(response.json())
    ```

=== "JavaScript"

    ```javascript
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'usuario@ejemplo.com',
        username: 'miusuario',
        password: 'MiPassword123!'
      })
    });
    const data = await response.json();
    console.log(data);
    ```

### Iniciar Sesión y Obtener Token

=== "curl"

    ```bash
    # Obtener token
    TOKEN=$(curl -s -X POST "$API_URL/api/auth/login" \
      -H "Content-Type: application/json" \
      -d '{"email": "usuario@ejemplo.com", "password": "MiPassword123!"}' \
      | jq -r '.access_token')

    echo "Token: $TOKEN"

    # Usar token en siguientes peticiones
    curl -H "Authorization: Bearer $TOKEN" "$API_URL/api/auth/me"
    ```

=== "Python"

    ```python
    import httpx

    # Login
    response = httpx.post(
        f"{API_URL}/api/auth/login",
        json={
            "email": "usuario@ejemplo.com",
            "password": "MiPassword123!"
        }
    )
    tokens = response.json()
    access_token = tokens["access_token"]

    # Usar token
    headers = {"Authorization": f"Bearer {access_token}"}
    me = httpx.get(f"{API_URL}/api/auth/me", headers=headers)
    print(me.json())
    ```

=== "JavaScript"

    ```javascript
    // Login
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'usuario@ejemplo.com',
        password: 'MiPassword123!'
      })
    });
    const { access_token } = await loginResponse.json();

    // Usar token
    const meResponse = await fetch(`${API_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });
    console.log(await meResponse.json());
    ```

---

## 📡 Captura de Paquetes

### Flujo Completo de Captura

=== "curl"

    ```bash
    # 1. Listar interfaces disponibles
    curl -H "Authorization: Bearer $TOKEN" "$API_URL/api/capture/interfaces"

    # 2. Iniciar captura en interfaz específica
    curl -X POST "$API_URL/api/capture/start" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "interface": "en0",
        "filter": "tcp port 80 or tcp port 443",
        "packet_count": 1000
      }'

    # 3. Verificar estado
    curl -H "Authorization: Bearer $TOKEN" "$API_URL/api/capture/status"

    # 4. Obtener paquetes capturados
    curl -H "Authorization: Bearer $TOKEN" \
      "$API_URL/api/capture/packets?limit=50&protocol=TCP"

    # 5. Detener captura
    curl -X POST "$API_URL/api/capture/stop" \
      -H "Authorization: Bearer $TOKEN"
    ```

=== "Python"

    ```python
    import httpx
    import time

    headers = {"Authorization": f"Bearer {access_token}"}

    # 1. Listar interfaces
    interfaces = httpx.get(
        f"{API_URL}/api/capture/interfaces",
        headers=headers
    ).json()
    print("Interfaces:", [i["name"] for i in interfaces["interfaces"]])

    # 2. Iniciar captura
    httpx.post(
        f"{API_URL}/api/capture/start",
        headers=headers,
        json={
            "interface": "en0",
            "filter": "tcp port 80 or tcp port 443",
            "packet_count": 1000
        }
    )

    # 3. Esperar y verificar estado
    time.sleep(5)
    status = httpx.get(
        f"{API_URL}/api/capture/status",
        headers=headers
    ).json()
    print(f"Capturados: {status['packets_captured']} paquetes")

    # 4. Obtener paquetes
    packets = httpx.get(
        f"{API_URL}/api/capture/packets",
        headers=headers,
        params={"limit": 50, "protocol": "TCP"}
    ).json()

    for pkt in packets["packets"][:5]:
        print(f"{pkt['src_ip']}:{pkt['src_port']} -> "
              f"{pkt['dst_ip']}:{pkt['dst_port']} ({pkt['protocol']})")

    # 5. Detener
    httpx.post(f"{API_URL}/api/capture/stop", headers=headers)
    ```

### Filtros BPF Útiles

```bash
# Solo tráfico HTTP/HTTPS
"tcp port 80 or tcp port 443"

# Solo DNS
"udp port 53"

# Tráfico hacia una IP específica
"host 8.8.8.8"

# Todo excepto SSH
"not port 22"

# Paquetes grandes (>1000 bytes)
"greater 1000"

# Solo tráfico de red local
"net 192.168.1.0/24"
```

---

## 📊 Estadísticas

### Obtener Resumen Completo

=== "curl"

    ```bash
    # Resumen general
    curl -H "Authorization: Bearer $TOKEN" "$API_URL/api/stats/summary"

    # Distribución de protocolos
    curl -H "Authorization: Bearer $TOKEN" "$API_URL/api/stats/protocols"

    # Top IPs
    curl -H "Authorization: Bearer $TOKEN" "$API_URL/api/stats/top-ips?limit=10"

    # Top puertos
    curl -H "Authorization: Bearer $TOKEN" "$API_URL/api/stats/top-ports?limit=15"
    ```

=== "Python"

    ```python
    import httpx

    headers = {"Authorization": f"Bearer {access_token}"}

    # Obtener todas las estadísticas
    summary = httpx.get(f"{API_URL}/api/stats/summary", headers=headers).json()
    protocols = httpx.get(f"{API_URL}/api/stats/protocols", headers=headers).json()
    top_ips = httpx.get(f"{API_URL}/api/stats/top-ips", headers=headers).json()

    print(f"Total paquetes: {summary['total_packets']}")
    print(f"TCP: {protocols['tcp']['percentage']:.1f}%")
    print(f"UDP: {protocols['udp']['percentage']:.1f}%")

    print("\nTop IPs origen:")
    for ip, count in summary['top_src_ips'].items():
        print(f"  {ip}: {count} paquetes")
    ```

---

## 🗺️ Mapa de Red

### Obtener Datos del Mapa

=== "curl"

    ```bash
    curl -H "Authorization: Bearer $TOKEN" "$API_URL/api/stats/network-map"
    ```

=== "Python"

    ```python
    import httpx

    headers = {"Authorization": f"Bearer {access_token}"}
    network_map = httpx.get(
        f"{API_URL}/api/stats/network-map",
        headers=headers
    ).json()

    print(f"Nodos: {network_map['summary']['total_nodes']}")
    print(f"  - Locales: {network_map['summary']['local_nodes']}")
    print(f"  - Externos: {network_map['summary']['external_nodes']}")
    print(f"Enlaces: {network_map['summary']['total_links']}")

    # Mostrar nodos externos con geolocalización
    for node in network_map['nodes']:
        if not node['isLocal'] and node.get('geo'):
            geo = node['geo']
            print(f"  {node['id']}: {geo['city']}, {geo['country']}")
    ```

---

## 🤖 Explicador IA

### Explicar Tráfico

=== "curl"

    ```bash
    # Explicar un paquete específico
    curl -X POST "$API_URL/api/ai/explain/packet" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "packet_data": {
          "src_ip": "192.168.1.100",
          "dst_ip": "8.8.8.8",
          "src_port": 54321,
          "dst_port": 53,
          "protocol": "UDP"
        }
      }'

    # Analizar patrones de tráfico
    curl -X POST "$API_URL/api/ai/analyze" \
      -H "Authorization: Bearer $TOKEN"
    ```

=== "Python"

    ```python
    import httpx

    headers = {"Authorization": f"Bearer {access_token}"}

    # Explicar un paquete
    explanation = httpx.post(
        f"{API_URL}/api/ai/explain/packet",
        headers=headers,
        json={
            "packet_data": {
                "src_ip": "192.168.1.100",
                "dst_ip": "8.8.8.8",
                "src_port": 54321,
                "dst_port": 53,
                "protocol": "UDP"
            }
        }
    ).json()

    print("Explicación:", explanation.get("explanation"))
    print("Nivel de riesgo:", explanation.get("risk_level", "N/A"))
    ```

---

## 💻 Información del Sistema

### Obtener Estado del Sistema

=== "curl"

    ```bash
    # Info completa del dispositivo
    curl -H "Authorization: Bearer $TOKEN" "$API_URL/api/system/info"

    # Resumen rápido
    curl -H "Authorization: Bearer $TOKEN" "$API_URL/api/system/summary"

    # Conexiones activas
    curl -H "Authorization: Bearer $TOKEN" \
      "$API_URL/api/system/connections?status=ESTABLISHED&limit=50"
    ```

=== "Python"

    ```python
    import httpx

    headers = {"Authorization": f"Bearer {access_token}"}

    # Info del sistema
    system_info = httpx.get(
        f"{API_URL}/api/system/info",
        headers=headers
    ).json()

    print(f"Sistema: {system_info['system']['os']} {system_info['system']['os_version']}")
    print(f"CPU: {system_info['system']['cpu_percent']}%")
    print(f"RAM: {system_info['system']['memory_percent']}%")
    print(f"IP Privada: {system_info['private_ip']}")
    print(f"IP Pública: {system_info.get('public_ip', 'N/A')}")

    # Conexiones activas
    connections = httpx.get(
        f"{API_URL}/api/system/connections",
        headers=headers,
        params={"status": "ESTABLISHED", "limit": 10}
    ).json()

    print(f"\nConexiones establecidas: {len(connections)}")
    for conn in connections[:5]:
        print(f"  {conn['process_name']}: {conn['remote_address']}:{conn['remote_port']}")
    ```

---

## 🔌 WebSocket en Tiempo Real

### Suscribirse a Paquetes en Vivo

=== "Python"

    ```python
    import asyncio
    import websockets
    import json

    async def listen_packets():
        uri = f"ws://localhost:8000/ws/packets?token={access_token}"

        async with websockets.connect(uri) as ws:
            print("Conectado al WebSocket...")

            while True:
                message = await ws.recv()
                packet = json.loads(message)

                print(f"[{packet['timestamp']}] "
                      f"{packet['src_ip']}:{packet['src_port']} -> "
                      f"{packet['dst_ip']}:{packet['dst_port']} "
                      f"({packet['protocol']})")

    asyncio.run(listen_packets())
    ```

=== "JavaScript"

    ```javascript
    const ws = new WebSocket(`ws://localhost:8000/ws/packets?token=${accessToken}`);

    ws.onopen = () => {
      console.log('Conectado al WebSocket');
    };

    ws.onmessage = (event) => {
      const packet = JSON.parse(event.data);
      console.log(
        `[${packet.timestamp}] ` +
        `${packet.src_ip}:${packet.src_port} -> ` +
        `${packet.dst_ip}:${packet.dst_port} ` +
        `(${packet.protocol})`
      );
    };

    ws.onerror = (error) => {
      console.error('Error WebSocket:', error);
    };

    ws.onclose = () => {
      console.log('Desconectado del WebSocket');
    };
    ```

---

## 🛠️ Script Completo de Ejemplo

### Monitor de Red Automatizado

```python
#!/usr/bin/env python3
"""
Monitor de red automatizado usando la API de LeirEye
"""
import httpx
import time
import sys

API_URL = "http://localhost:8000"

def login(email: str, password: str) -> str:
    """Autenticarse y obtener token"""
    response = httpx.post(
        f"{API_URL}/api/auth/login",
        json={"email": email, "password": password}
    )
    response.raise_for_status()
    return response.json()["access_token"]

def capture_and_analyze(token: str, interface: str, duration: int = 30):
    """Capturar tráfico y mostrar análisis"""
    headers = {"Authorization": f"Bearer {token}"}

    print(f"🚀 Iniciando captura en {interface}...")

    # Iniciar captura
    httpx.post(
        f"{API_URL}/api/capture/start",
        headers=headers,
        json={"interface": interface}
    )

    # Esperar
    print(f"⏳ Capturando durante {duration} segundos...")
    time.sleep(duration)

    # Detener
    result = httpx.post(f"{API_URL}/api/capture/stop", headers=headers).json()
    print(f"✅ Capturados: {result.get('packets_captured', 'N/A')} paquetes")

    # Obtener estadísticas
    stats = httpx.get(f"{API_URL}/api/stats/summary", headers=headers).json()

    print("\n📊 Resumen:")
    print(f"  Total paquetes: {stats['total_packets']}")
    print(f"  TCP: {stats['tcp']} | UDP: {stats['udp']} | ICMP: {stats['icmp']}")

    print("\n🔝 Top IPs origen:")
    for ip, count in list(stats.get('top_src_ips', {}).items())[:5]:
        print(f"  {ip}: {count}")

    print("\n🔝 Top puertos:")
    for port, count in list(stats.get('top_ports', {}).items())[:5]:
        print(f"  {port}: {count}")

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Uso: python monitor.py <email> <password> <interface>")
        sys.exit(1)

    email, password, interface = sys.argv[1:4]

    try:
        token = login(email, password)
        print("🔐 Autenticado correctamente")
        capture_and_analyze(token, interface)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
```

**Uso:**

```bash
python monitor.py usuario@ejemplo.com MiPassword123! en0
```

---

## 📝 Notas Importantes

!!! warning "Permisos de Captura"
Para capturar tráfico de red, el backend debe ejecutarse con privilegios elevados:
`bash
    sudo python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
    `

!!! tip "Rate Limiting"
La API tiene límites de peticiones. Si recibes error 429, espera unos segundos antes de reintentar.

!!! info "Tokens JWT"
Los tokens de acceso expiran en 30 minutos. Usa el endpoint `/api/auth/refresh` para renovarlos.
