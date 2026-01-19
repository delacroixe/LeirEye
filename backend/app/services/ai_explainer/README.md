# AI Explainer Service - Arquitectura Refactorizada

## Estructura

```
ai_explainer/
 __init__.py          # Exporta AIExplainerService y ai_service
 ai_service.py        # Lgggica principal del servicio
 ollama_client.py     # Cliente para comunicacinnn con Ollama
 patterns.py          # Cache de patrones conocidos
 README.md           # Esta documentacinnn
```

## Responsabilidades

- **ai_service.py**: Coordinacinnn general, estrategia de explicacinnn
- **ollama_client.py**: Comunicacinnn HTTP con Ollama
- **patterns.py**: Patrones predefinidos para respuestas rpidas

## Mejoras

-  Separacinnn de responsabilidades
-  MacUIEvents s fcil de testear
-  MacUIEvents s mantenible
-  Cada mdddulo <150 leas
