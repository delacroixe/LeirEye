#!/usr/bin/env python
"""
Script para resetear la contraseña de un usuario en la base de datos
"""

import asyncio
import sys

from sqlalchemy import select
from app.core.security import get_password_hash
from app.core.database import AsyncSessionLocal
from app.models.user import User


async def reset_user_password(email: str, new_password: str):
    """Resetear contraseña de un usuario"""
    
    async with AsyncSessionLocal() as db:
        # Buscar usuario
        result = await db.execute(
            select(User).where(User.email == email)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"❌ Usuario no encontrado: {email}")
            return False
        
        # Actualizar contraseña
        print(f"🔄 Actualizando contraseña para: {email}")
        user.hashed_password = get_password_hash(new_password)
        
        await db.commit()
        print(f"✅ Contraseña actualizada correctamente")
        print(f"   Email: {email}")
        print(f"   Nueva contraseña: {new_password}")
        return True


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Uso: python reset_password.py <email> <nueva_contraseña>")
        print("Ejemplo: python reset_password.py usuario@ejemplo.com MiNuevaPass123")
        sys.exit(1)
    
    email = sys.argv[1]
    password = sys.argv[2]
    
    asyncio.run(reset_user_password(email, password))
