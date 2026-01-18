# Instrucciones para ejecutar el sniffer de paquetes

## Requisito importante: Permisos de root

Para capturar paquetes de red con `scapy`, se requieren permisos de administrador (root). 

### Opción 1: Ejecutar el backend con sudo (Recomendado)

```bash
# Navega al directorio del proyecto
cd /Users/antuan/Dev/sec/networking

# Dale permisos de ejecución al script
chmod +x run_backend.sh

# Ejecuta el backend con sudo
./run_backend.sh

# Alternativamente, directamente con sudo:
cd backend
sudo python run.py
```

### Opción 2: Ejecutar sin sudo configurando ChmodBPF (macOS)

Si usas macOS y no quieres usar sudo cada vez:

```bash
# Instala ChmodBPF
brew install chmodbpf

# Reinicia tu sesión o ejecuta:
sudo -s
su - $USER

# Ahora puedes ejecutar sin sudo:
python run.py
```

### Opción 3: Configurar sudo sin contraseña (No recomendado para producción)

```bash
# Edita sudoers de forma segura
sudo visudo

# Agrega esta línea (reemplaza tu_usuario):
tu_usuario ALL=(ALL) NOPASSWD: /Users/antuan/Dev/sec/networking/backend/run.py

# Ahora puedes ejecutar:
sudo python run.py
```

## Pasos para ejecutar la aplicación

1. **Terminal 1 - Backend:**
   ```bash
   cd /Users/antuan/Dev/sec/networking
   ./run_backend.sh
   # O:
   cd backend && sudo python run.py
   ```

2. **Terminal 2 - Frontend:**
   ```bash
   cd /Users/antuan/Dev/sec/networking/frontend
   npm start
   ```

3. Abre el navegador en `http://localhost:3001`

## Qué esperar

- Una vez iniciado el backend, verás logs de Uvicorn en la terminal
- En el frontend, los controles de captura estarán disponibles
- Al hacer clic en "Iniciar Captura", comenzará a recopilar paquetes
- Los paquetes aparecerán en la tabla después de algunos segundos
- Las estadísticas se actualizarán en tiempo real

## Troubleshooting

Si no ves paquetes:
- ✅ Verifica que el backend esté ejecutándose con permisos de root
- ✅ Revisa los logs del backend para errores
- ✅ Comprueba que el frontend esté conectado (verás mensajes de WebSocket)
- ✅ Intenta especificar una interfaz de red (ej: `en0` en macOS, `eth0` en Linux)

Para ver las interfaces de red disponibles:
```bash
# macOS
ifconfig

# Linux
ip link show
```
