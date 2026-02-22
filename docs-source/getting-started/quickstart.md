# Inicio Rápido

¡Instala y ejecuta LeirEye en menos de 5 minutos!

## Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/delacroixe/LeirEye.git
cd LeirEye
```

## Paso 2: Iniciar los Servicios con Docker

```bash
docker-compose up -d
```

Esto inicia:
- ✅ PostgreSQL 16 (base de datos)
- ✅ Nginx (proxy inverso)

Espera a que aparezca: `Successfully started 2 containers`

## Paso 3: Instalar Dependencias del Backend

```bash
pip install -r backend/requirements.txt
```

O en un entorno virtual:

```bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r backend/requirements.txt
```

## Paso 4: Instalar Dependencias del Frontend

```bash
cd frontend
npm install
cd ..
```

## Paso 5: Iniciar el Backend

Abre una **terminal nueva**:

```bash
cd backend
python run.py
```

Verás:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## Paso 6: Iniciar el Frontend

Abre otra **terminal nueva**:

```bash
cd frontend
npm start
```

El navegador se abrirá automáticamente en `http://localhost:3001`

Si no se abre, ve a [http://localhost:3001](http://localhost:3001) manualmente.

## Paso 7: Registrarse

1. Haz clic en **"Registrarse"**
2. Completa el formulario:
   - **Email**: tu@email.com
   - **Usuario**: tunombre
   - **Contraseña**: fuerte123!
   - **Nombre completo**: Tu Nombre

3. Haz clic en **"Registrarse"**

**Nota**: El primer usuario se convierte automáticamente en ADMIN.

## Paso 8: ¡Comienza a Capturar!

1. Inicia sesión con tus credenciales
2. Ve a **"Captura"** en el menú
3. Haz clic en **"Iniciar Captura"**
4. ¡Verás paquetes en tiempo real!

---

## 🎉 ¡Listo!

¡Ya tienes LeirEye funcionando! Ahora puedes:

- 📡 [Capturar paquetes](../guide/packet-capture.md)
- 🤖 [Usar la IA explicativa](../guide/ai-explainer.md)
- 📊 [Ver estadísticas](../guide/statistics.md)
- 🗺️ [Explorar el mapa de red](../guide/network-map.md)

## ❌ Algo salió mal?

**Ver las [Soluciones Comunes](../reference/troubleshooting.md)**

| Problema | Solución |
|----------|----------|
| Puerto 5432 en uso | `docker-compose down && docker-compose up -d` |
| Node no encontrado | Instala Node.js desde [nodejs.org](https://nodejs.org) |
| Python no encontrado | Instala Python 3.11+ desde [python.org](https://python.org) |
| WebSocket error | Verifica que el backend esté corriendo en el puerto 8000 |
