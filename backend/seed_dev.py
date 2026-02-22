#!/usr/bin/env python
"""
Script para inicializar la base de datos en desarrollo
Crea un usuario por defecto para que no tengas que registrarte cada vez
"""

import asyncio
import sys

from sqlalchemy import select

from app.core.config import settings
from app.core.security import get_password_hash
from app.db import get_db_context
from app.models.user import User


async def seed_dev_user():
    """Crear usuario por defecto en desarrollo"""
    
    DEV_EMAIL = "dev@example.com"
    DEV_PASSWORD = "DevPass123"
    DEV_USERNAME = "dev"
    
    async with get_db_context() as db:
        # Verificar si ya existe
        result = await db.execute(
            select(User).where(User.email == DEV_EMAIL)
        )
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            print(f"✓ Usuario de desarrollo ya existe: {DEV_EMAIL}")
            print(f"  Password: {DEV_PASSWORD}")
            return
        
        # Crear usuario
        user = User(
            email=DEV_EMAIL,
            username=DEV_USERNAME,
            hashed_password=get_password_hash(DEV_PASSWORD),
            full_name="Developer",
            is_active=True,
            is_verified=True,
            role="ADMIN"
        )
        
        db.add(user)
        await db.commit()
        
        print("✓ Usuario de desarrollo creado:")
        print(f"  Email:    {DEV_EMAIL}")
        print(f"  Password: {DEV_PASSWORD}")
        print("  Role:     ADMIN")


async def main():
    """Ejecutar inicialización"""
    try:
        if settings.SEED_DEFAULT_USER:
            print("🌱 Inicializando base de datos en desarrollo...")
            await seed_dev_user()
            print("✓ Listo!\n")
        else:
            print("ℹ️  SEED_DEFAULT_USER=false, saltando creación de usuario\n")
    except Exception as e:
        print(f"✗ Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
    asyncio.run(main())
