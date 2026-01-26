# AI Explainer Service - Arquitectura Refactorizada

## Estructura

```
ai_explainer/
├── __init__.py          # Exporta AIExplainerService y ai_service
├── ai_service.py        # Lógica principal del servicio
├── ollama_client.py     # Cliente para comunicación con Ollama
├── patterns.py          # Cache de patrones conocidos
└── README.md            # Esta documentación
```

## Responsabilidades

- **ai_service.py**: Coordinación general, estrategia de explicación
- **ollama_client.py**: Comunicación HTTP con Ollama
- **patterns.py**: Patrones predefinidos para respuestas rápidas

## Mejoras

- ✅ Separación de responsabilidades
- ✅ Más fácil de testear
- ✅ Más mantenible
- ✅ Cada módulo <150 líneas
