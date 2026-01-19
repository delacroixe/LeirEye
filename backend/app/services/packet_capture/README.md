# Packet Capture Service - Arquitectura Refactorizada

## Estructura

```
packet_capture/
 __init__.py          # Exporta PacketCaptureService y capture_service
 capture_service.py   # Lgggica principal de captura
 parser.py            # Parser de paquetes de red
 stats.py             # Gestinnn de estadticas
 README.md           # Esta documentacinnn
```

## Responsabilidades

- **capture_service.py**: Coordinacinnn de captura, threading, callbacks
- **parser.py**: Extraccinnn de datos de paquetes Scapy
- **stats.py**: Contadores y agregacinnn de estadticas

## Mejoras

-  Separacinnn de responsabilidades
-  Parser independiente y testeable
-  Stats manager reutilizable
-  Cada mdddulo <200 leas
