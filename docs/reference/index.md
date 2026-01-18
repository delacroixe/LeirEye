# Referencia

Documentación de referencia rápida para NetMentor.

## 📚 Contenido

<div class="grid cards" markdown>

-   :material-console:{ .lg .middle } **Comandos**

    ---

    Referencia rápida de todos los comandos

    [:octicons-arrow-right-24: Ver](commands.md)

-   :material-wrench:{ .lg .middle } **Troubleshooting**

    ---

    Solución a problemas comunes

    [:octicons-arrow-right-24: Ver](troubleshooting.md)

-   :material-history:{ .lg .middle } **Changelog**

    ---

    Historial de cambios y versiones

    [:octicons-arrow-right-24: Ver](changelog.md)

</div>

## 🚀 Comandos Rápidos

### Iniciar Todo

```bash
# Terminal 1: Servicios
docker-compose up -d

# Terminal 2: Backend
cd backend && source venv/bin/activate && python run.py

# Terminal 3: Frontend
cd frontend && npm start

# Terminal 4: Ollama (si usas IA)
ollama serve
```

### Parar Todo

```bash
# Ctrl+C en cada terminal, luego:
docker-compose down
```

## 🔧 Solución Rápida

| Problema | Solución |
|----------|----------|
| No captura paquetes | Ejecutar con `sudo python run.py` |
| Frontend no conecta | Verificar CORS y puertos |
| Base de datos error | `docker-compose up -d postgres` |
| Ollama no responde | `ollama serve` en otra terminal |

## 📊 Puertos

| Servicio | Puerto |
|----------|--------|
| Frontend | 3001 |
| Backend API | 8000 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| Ollama | 11434 |

## 📁 Estructura

```
netmentor/
├── backend/           # API FastAPI
│   ├── app/
│   │   ├── core/      # Config, DB, Security
│   │   ├── models/    # SQLAlchemy models
│   │   ├── routes/    # API endpoints
│   │   └── services/  # Business logic
│   └── alembic/       # Migrations
├── frontend/          # React app
│   └── src/
│       ├── components/
│       ├── pages/
│       └── services/
└── docs/              # Esta documentación
```
