# Packet Capture Service - Arquitectura Refactorizada

## Estructura

```
packet_capture/
├── __init__.py          # Exporta PacketCaptureService y capture_service
├── capture_service.py   # Lógica principal de captura
├── parser.py            # Parser de paquetes de red
├── stats.py             # Gestión de estadísticas
└── README.md            # Esta documentación
```

## Responsabilidades

- **capture_service.py**: Coordinación de captura, threading, callbacks
- **parser.py**: Extracción de datos de paquetes Scapy
- **stats.py**: Contadores y agregación de estadísticas

## Mejoras

- ✅ Separación de responsabilidades
- ✅ Parser independiente y testeable
- ✅ Stats manager reutilizable
- ✅ Cada módulo <200 líneas
