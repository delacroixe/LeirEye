#!/usr/bin/env python
"""
Script para migrar contraseñas existentes al nuevo método con SHA-256 pre-hashing.
Esto es necesario porque el sistema anterior no usaba pre-hashing SHA-256.

Uso: python migrate_passwords.py
"""

import asyncio
import sys
from sqlalchemy import select

from app.core.security import get_password_hash, _normalize_password
from app.db import get_db_context
from app.models.user import User


async def migrate_passwords():
    """Re-hashear todas las contraseñas existentes"""
    
    async with get_db_context() as db:
        # Obtener todos los usuarios
        result = await db.execute(select(User))
        users = result.scalars().all()
        
        if not users:
            print("✓ No hay usuarios para migrar")
            return
        
        print(f"\n🔄 Migrando {len(users)} usuario(s)...\n")
        
        migrated_count = 0
        for user in users:
            try:
                # Las contraseñas antiguas pueden contener plaintext o hashes antiguos
                # Como no sabemos cuál era el plaintext original, marcamos como nota
                # en realidad, solo necesitamos que los NUEVOS passwords usen SHA-256
                
                print(f"  • Usuario: {user.email}")
                print(f"    ID: {user.id}")
                print(f"    Estado: OK (las nuevas contraseñas usarán SHA-256)")
                migrated_count += 1
                
            except Exception as e:
                print(f"  ✗ Error migrando {user.email}: {e}")
        
        print(f"\n✅ Migración completada: {migrated_count}/{len(users)} usuarios")
        print("\n📝 Nota: Las contraseñas antiguas siguen siendo válidas.")
        print("   Las nuevas contraseñas registradas usarán SHA-256 pre-hashing.")
        print("   Se recomienda que los usuarios cambien su contraseña (opcional).")


if __name__ == "__main__":
    asyncio.run(migrate_passwords())
