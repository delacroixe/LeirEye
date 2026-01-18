# ¿Qué es un Paquete de Red?

Un **paquete** es la unidad básica de información que viaja por una red. Cuando envías un mensaje, ves un video, o abres una página web, la información se divide en pequeños paquetes que viajan de forma independiente.

## 📦 Analogía Simple

Imagina que quieres enviar un libro completo por correo, pero solo puedes usar sobres pequeños:

1. **Divides** el libro en páginas individuales
2. **Numeras** cada página (para ordenarlas después)
3. **Escribes** la dirección en cada sobre
4. **Envías** los sobres (pueden llegar por diferentes rutas)
5. **El destinatario** reordena las páginas y reconstruye el libro

Esto es exactamente lo que hacen los paquetes de red.

## 🔍 Anatomía de un Paquete

Un paquete tiene varias partes:

```
┌─────────────────────────────────────────────────┐
│                   CABECERAS                      │
├──────────────┬──────────────┬───────────────────┤
│ Ethernet     │ IP Header    │ TCP/UDP Header    │
│ (Capa 2)     │ (Capa 3)     │ (Capa 4)          │
├──────────────┴──────────────┴───────────────────┤
│                    PAYLOAD                       │
│              (Los datos reales)                  │
└─────────────────────────────────────────────────┘
```

### Cabecera Ethernet (Capa 2)
- **MAC Origen**: Dirección física del remitente
- **MAC Destino**: Dirección física del destinatario
- **Tipo**: Qué protocolo viene después (IPv4, IPv6)

### Cabecera IP (Capa 3)
- **IP Origen**: Dirección IP del remitente
- **IP Destino**: Dirección IP del destinatario
- **TTL**: Tiempo de vida (cuántos saltos puede hacer)
- **Protocolo**: TCP, UDP, ICMP, etc.

### Cabecera TCP/UDP (Capa 4)
- **Puerto Origen**: Aplicación que envía
- **Puerto Destino**: Aplicación que recibe
- **Flags** (TCP): Control de conexión
- **Checksum**: Verificación de integridad

### Payload (Datos)
- El contenido real: texto, imágenes, videos
- Puede estar cifrado (HTTPS)

## 📊 En NetMentor

Cuando capturas un paquete, NetMentor te muestra:

```
#1 | 14:32:01.123 | 192.168.1.100 → 8.8.8.8 | UDP | 64 bytes | DNS Query
```

| Campo | Significado |
|-------|-------------|
| #1 | Número de paquete en la captura |
| 14:32:01.123 | Momento exacto de captura |
| 192.168.1.100 | Tu computadora (origen) |
| 8.8.8.8 | Servidor DNS de Google (destino) |
| UDP | Protocolo de transporte |
| 64 bytes | Tamaño total del paquete |
| DNS Query | Tipo de información |

## 📏 Tamaño de los Paquetes

Los paquetes tienen un tamaño máximo llamado **MTU** (Maximum Transmission Unit):

| Red | MTU Típico | Notas |
|-----|------------|-------|
| Ethernet | 1500 bytes | Estándar más común |
| WiFi | 1500 bytes | Igual que Ethernet |
| VPN | 1400-1450 bytes | Menor por encapsulación |
| DSL | 1492 bytes | Ligeramente menor |

Si un paquete es más grande que el MTU, se **fragmenta** en paquetes más pequeños.

## 🔄 Ciclo de Vida de un Paquete

```mermaid
flowchart LR
    A[Aplicación crea datos] --> B[OS divide en paquetes]
    B --> C[Añade cabeceras]
    C --> D[Envía por interfaz]
    D --> E[Viaja por la red]
    E --> F[Llega al destino]
    F --> G[Se procesan cabeceras]
    G --> H[Se entrega a la app]
```

### Ejemplo: Cargar una Página Web

1. **Tu navegador** quiere cargar `google.com`
2. **DNS Query**: Paquete preguntando la IP de google.com
3. **DNS Response**: Paquete con la respuesta (142.250.x.x)
4. **TCP SYN**: Paquete iniciando conexión
5. **TCP SYN-ACK**: Google responde
6. **TCP ACK**: Conexión establecida
7. **HTTP GET**: Solicita la página
8. **HTTP Response**: Google envía la página (muchos paquetes)

## 🎯 ¿Por Qué Paquetes?

### Ventajas de dividir en paquetes:

| Ventaja | Explicación |
|---------|-------------|
| **Eficiencia** | Múltiples conversaciones comparten la red |
| **Resiliencia** | Si un paquete se pierde, solo se reenvía ese |
| **Flexibilidad** | Diferentes rutas para diferentes paquetes |
| **Equidad** | Nadie acapara toda la red |

### Si no hubiera paquetes:

- Una llamada VoIP bloquearía toda la red
- Si algo falla, hay que reenviar TODO
- Una conexión lenta afecta a todas

## 💡 Experimenta en NetMentor

1. **Inicia una captura**
2. **Abre** una página web simple
3. **Observa** cuántos paquetes genera
4. **Haz clic** en un paquete para ver detalles

!!! tip "Experimento"
    Captura mientras haces ping a google.com:
    ```bash
    ping -c 4 google.com
    ```
    Verás 8 paquetes: 4 ICMP Echo Request y 4 Echo Reply.

## 📚 Siguiente Paso

Ahora que entiendes qué es un paquete, aprende sobre:

- [Direcciones IP](ip-addresses.md) - Cómo se identifican origen y destino
- [Puertos](ports.md) - Cómo las aplicaciones se comunican
