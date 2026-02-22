"""Aplicación FastAPI principal"""

import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import get_settings
from .core.database import close_db, init_db
from .routes import (
    ai,
    alerts,
    analysis,
    auth,
    capture,
    dns,
    stats,
    system,
    terminal,
    wifi,
)

# Configurar logging con más detalle
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)
logger.info("✓ Logging configurado correctamente")

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ciclo de vida de la aplicación"""
    # Startup
    logger.info("🚀 Iniciando LeirEye...")
    try:
        await init_db()
        logger.info("✓ Base de datos conectada")
    except Exception as e:
        logger.warning(f"⚠ Base de datos no disponible: {e}")
        logger.info("  Continuando sin persistencia...")
    
    # Conectar el callback de alertas para WebSocket
    try:
        from .routes.alerts import broadcast_alert
        from .services.alerts import alert_manager
        alert_manager.set_on_alert_callback(broadcast_alert)
        logger.info("✓ Callback de alertas configurado")
    except Exception as e:
        logger.warning(f"⚠ No se pudo configurar callback de alertas: {e}")
    
    # Inicializar el detector de patrones
    try:
        from .services.pattern_detector import pattern_detector
        logger.info(f"✓ PatternDetector inicializado con {len(pattern_detector._detectors)} detectores")
    except Exception as e:
        logger.warning(f"⚠ No se pudo inicializar PatternDetector: {e}")

    yield

    # Shutdown
    logger.info("🛑 Cerrando LeirEye...")
    try:
        await close_db()
        logger.info("✓ Base de datos cerrada")
    except Exception:
        pass


app = FastAPI(
    title="LeirEye - Network Traffic Analyzer",
    description="API educativa para capturar y analizar tráfico de red con IA",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas de autenticación
app.include_router(auth.router, prefix="/api", tags=["Autenticación"])

# Rutas de funcionalidad
app.include_router(capture.router)
app.include_router(stats.router)
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(system.router)
app.include_router(analysis.router, prefix="/api", tags=["Análisis de Red"])
app.include_router(alerts.router, prefix="/api", tags=["Alertas"])
app.include_router(dns.router, prefix="/api", tags=["DNS"])
app.include_router(wifi.router, prefix="/api/wifi", tags=["wifi"])
app.include_router(terminal.router)


@app.get("/")
async def root():
    """Endpoint raíz de la API"""
    return {
        "message": "LeirEye - Network Traffic Analyzer API",
        "version": "2.0.0",
        "docs": "/docs",
        "features": [
            "Captura de paquetes en tiempo real",
            "Análisis con IA local (Ollama)",
            "Mapa de red interactivo",
            "Información del sistema",
            "Autenticación JWT",
        ],
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    from .core.database import engine

    db_status = "unknown"
    try:
        async with engine.connect() as conn:
            await conn.execute("SELECT 1")
            db_status = "connected"
    except Exception:
        db_status = "disconnected"

    return {"status": "healthy", "version": "2.0.0", "database": db_status}
    return {"status": "healthy", "version": "2.0.0", "database": db_status}

    db_status = "unknown"
    try:
        async with engine.connect() as conn:
            await conn.execute("SELECT 1")
            db_status = "connected"
    except Exception:
        db_status = "disconnected"

    return {"status": "healthy", "version": "2.0.0", "database": db_status}
    return {"status": "healthy", "version": "2.0.0", "database": db_status}
