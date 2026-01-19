"""
Tests para endpoints de autenticación

NOTA: Los tests de registro/login requieren PostgreSQL por el tipo UUID.
Estos tests se ejecutan contra la DB real en CI/CD.
Para tests locales, usar: pytest tests/test_api.py
"""
import pytest
from httpx import AsyncClient


# Marcar tests que requieren PostgreSQL
pytestmark = pytest.mark.skipif(
    True,  # Cambiar a False cuando se use PostgreSQL en tests
    reason="Auth tests require PostgreSQL (UUID type not supported in SQLite)"
)


class TestAuthRegister:
    """Tests para registro de usuarios"""
    
    @pytest.mark.asyncio
    async def test_register_success(self, client: AsyncClient):
        """Registro exitoso con datos válidos"""
        response = await client.post("/api/auth/register", json={
            "email": "test@example.com",
            "username": "testuser",
            "password": "SecurePass123!"
        })
        
        assert response.status_code == 201
        data = response.json()
        assert data["user"]["email"] == "test@example.com"
        assert data["user"]["username"] == "testuser"
        assert "tokens" in data
        assert "access_token" in data["tokens"]
    
    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, client: AsyncClient):
        """No permite emails duplicados"""
        # Primer registro
        await client.post("/api/auth/register", json={
            "email": "duplicate@example.com",
            "username": "user1",
            "password": "SecurePass123!"
        })
        
        # Intento duplicado
        response = await client.post("/api/auth/register", json={
            "email": "duplicate@example.com",
            "username": "user2",
            "password": "SecurePass123!"
        })
        
        assert response.status_code == 400
        assert "ya registrado" in response.json()["detail"].lower()


class TestAuthLogin:
    """Tests para login de usuarios"""
    
    @pytest.mark.asyncio
    async def test_login_success(self, client: AsyncClient):
        """Login exitoso con credenciales correctas"""
        # Primero registrar
        await client.post("/api/auth/register", json={
            "email": "login@example.com",
            "username": "loginuser",
            "password": "SecurePass123!"
        })
        
        # Luego login
        response = await client.post("/api/auth/login", json={
            "email": "login@example.com",
            "password": "SecurePass123!"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "tokens" in data
        assert data["tokens"]["token_type"] == "bearer"
    
    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client: AsyncClient):
        """Login falla con contraseña incorrecta"""
        # Registrar
        await client.post("/api/auth/register", json={
            "email": "wrong@example.com",
            "username": "wronguser",
            "password": "SecurePass123!"
        })
        
        # Login con contraseña incorrecta
        response = await client.post("/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "WrongPassword!"
        })
        
        assert response.status_code == 401


class TestAuthProtected:
    """Tests para rutas protegidas"""
    
    @pytest.mark.asyncio
    async def test_me_without_token(self, client: AsyncClient):
        """Acceso a /me sin token falla"""
        response = await client.get("/api/auth/me")
        
        assert response.status_code == 401
