"""
Configuración de base de datos PostgreSQL con SQLAlchemy async
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import MetaData
import logging

from .config import settings

logger = logging.getLogger(__name__)

# Convención de nombres para constraints (útil para migraciones)
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

metadata = MetaData(naming_convention=convention)


class Base(DeclarativeBase):
    """Base para todos los modelos SQLAlchemy"""

    metadata = metadata


# Engine async para operaciones normales
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

# Session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncSession:
    """
    Dependency para obtener sesión de base de datos.
    Uso: db: AsyncSession = Depends(get_db)
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Inicializar tablas (para desarrollo, usar Alembic en producción)"""
    async with engine.begin() as conn:
        # Importar todos los modelos para que Base los registre
        from ..models import user  # noqa: F401

        await conn.run_sync(Base.metadata.create_all)
        logger.info("✓ Tablas de base de datos creadas")


async def close_db():
    """Cerrar conexiones de base de datos"""
    await engine.dispose()
    logger.info("✓ Conexiones de base de datos cerradas")
