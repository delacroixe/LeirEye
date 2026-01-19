"""Aplicación FastAPI principal"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import sys

from .core.config import get_settings
from .core.database import init_db, close_db
from .routes import capture, stats, ai, system, auth

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
