# 🌐 NetMentor v2.0.0

## El Analizador de Red que te Enseña Mientras Capturas

> **NetMentor** es una herramienta educativa profesional para análisis de tráfico de red en tiempo real.  
> A diferencia de Wireshark, cada paquete se explica con IA usando Ollama (LLM local).

[![GitHub](https://img.shields.io/badge/GitHub-Repo-blue?logo=github)](https://github.com/yourusername/netmentor)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19+-blue?logo=react)](https://react.dev/)

---

## 🚀 Comienza en 5 Minutos

```bash
# 1. Clonar
git clone https://github.com/yourusername/netmentor.git
cd netmentor

# 2. Instalar
pip install -r backend/requirements.txt
npm install --prefix frontend

# 3. Iniciar servicios
docker-compose up -d

# 4. Backend (terminal 2)
cd backend && python run.py

# 5. Frontend (terminal 3)
cd frontend && npm start

# 6. Abre http://localhost:3001
```

**→ [Guía Completa de Instalación](./docs/getting-started/installation.md)**

---

## ✨ ¿Qué lo Diferencia?

### NetMentor vs Wireshark

| Aspecto | NetMentor | Wireshark |
|--------|-----------|-----------|
| **Interfaz** | React moderna | GTK clásico |
| **Explicaciones** | 🤖 IA local (Ollama) | ❌ Solo datos crudos |
| **Educativo** | ✅ Para aprender | ❌ Para expertos |
| **Visualización** | Gráficos interactivos | Tablas de texto |
| **Curva de aprendizaje** | Baja | Alta |
| **Web** | ✅ Interfaz moderna | ❌ Solo desktop |

---

## 📡 Características Principales

### 1. **Captura en Tiempo Real**
- TCP, UDP, ICMP
- Filtros BPF avanzados
- Streaming WebSocket
- Búsqueda instantánea

### 2. **IA Explicativa** 🤖
```
Paquete: 192.168.1.10:52341 → 8.8.8.8:53 (UDP)

IA Explica:
✓ Tu computadora pide resolver un dominio
✓ 8.8.8.8 es DNS de Google
✓ Puerto 53 = DNS estándar
✓ Tráfico normal y seguro
```

### 3. **Mapa Interactivo**
- Visualización de conexiones
- Geolocalización de IPs
- Grafo animado de nodos
- Estadísticas por conexión

### 4. **Estadísticas en Tiempo Real**
- Protocolos más usados
- IPs/puertos más activos
- Gráficos interactivos
- Historial de sesiones

### 5. **Seguridad Integrada**
- Autenticación JWT
- 3 roles de usuario (ADMIN/ANALYST/VIEWER)
- PostgreSQL encriptada
- Todo local (sin cloud)

---

## 🛠️ Stack Tecnológico

```
┌─────────────────────────────────────┐
│         Frontend (React 19)          │
│  TypeScript + Router + Dark Theme   │
└──────────────┬──────────────────────┘
               │ HTTPS/WSS
┌──────────────▼──────────────────────┐
│      Backend (FastAPI 0.104)        │
│  Python 3.11 + Scapy + WebSocket   │
│        JWT Auth + Async SQLAlchemy   │
└──────────────┬──────────────────────┘
               │ SQL
┌──────────────▼──────────────────────┐
│    PostgreSQL 16 + Alembic          │
│      (Docker Container)             │
└─────────────────────────────────────┘
```

**Dependencias clave:**
- **Backend**: FastAPI, SQLAlchemy, Scapy, Ollama SDK, python-jose
- **Frontend**: React, TypeScript, React Router v7, Recharts, Lucide Icons
- **Infra**: Docker, Docker Compose, Nginx, GitHub Actions

---

## 📚 Documentación

Accede a la **[Documentación Completa](https://yourusername.github.io/netmentor/)** en GitHub Pages.

### Guías Rápidas

| Sección | Descripción |
|---------|-------------|
| 🎯 **[Empezar](./docs/getting-started/index.md)** | Instalación, configuración, inicio rápido |
| 🎓 **[Conceptos](./docs/concepts/index.md)** | Aprende TCP, UDP, DNS, HTTP, SSH, etc. |
| 🛠️ **[Guía de Uso](./docs/guide/index.md)** | Cómo usar cada característica |
| 📖 **[API](./docs/api/index.md)** | Documentación de endpoints REST |
| 🚀 **[Despliegue](./docs/deployment/index.md)** | Docker, producción, AWS/DigitalOcean |
| 📋 **[Referencia](./docs/reference/index.md)** | Comandos, troubleshooting, changelog |

---

## 🎯 Casos de Uso

### 👨‍🎓 Estudiantes de Ciberseguridad
Aprende redes analizando tráfico real de tu computadora con explicaciones de IA.

### 🏢 Administradores de Red
Diagnostica problemas de conectividad de forma visual e intuitiva.

### 🔐 Analistas de Seguridad
Identifica patrones anormales y tráfico sospechoso con alertas.

### 🧑‍💻 Desarrolladores
Depura problemas de red viendo exactamente qué se envía/recibe.

---

## 📊 Estadísticas del Proyecto

```
📦 4,740+ líneas de código
📚 115+ páginas de documentación
🔌 8+ endpoints API REST
👥 3 roles de usuario
⚡ Soporte para 15+ protocolos
🌍 Interfaz en español/inglés
📱 Responsive design
```

---

## 🔐 Seguridad & Privacidad

✅ **Computadora Local** - Todo corre en tu máquina  
✅ **Sin Cloud** - Ningún dato se envía a servidores externos  
✅ **Open Source** - Audita el código en GitHub  
✅ **Autenticación Fuerte** - JWT + Bcrypt  
✅ **Roles de Usuario** - Control granular de acceso  

---

## 🤝 Contribuir

¿Quieres mejorar NetMentor?

1. **Fork** el repositorio
2. Crea una **rama** (`git checkout -b feature/mifeature`)
3. Haz **commit** (`git commit -am 'Agregar feature'`)
4. Sube a la **rama** (`git push origin feature/mifeature`)
5. Abre un **Pull Request**

### Cómo reportar bugs
- Abre un [Issue en GitHub](https://github.com/yourusername/netmentor/issues)
- Describe el bug, pasos para reproducir, y entorno (SO, versión Python, etc.)

### Sugerir mejoras
- Usa [Discussions en GitHub](https://github.com/yourusername/netmentor/discussions)
- Discute ideas antes de implementar

---

## 📄 Licencia

MIT License - Completamente libre para uso personal y educativo.

Ver [LICENSE](./LICENSE) para detalles.

---

## 👥 Autor

Creado con ❤️ para educación en ciberseguridad.

---

## 🙏 Agradecimientos

- [Scapy](https://scapy.net/) - Captura de paquetes
- [FastAPI](https://fastapi.tiangolo.com/) - Framework backend
- [React](https://react.dev/) - Framework frontend
- [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/) - Documentación
- [Ollama](https://ollama.ai/) - LLM local

---

## 📞 Soporte

- 📖 [Documentación Completa](./docs/)
- 🐛 [Reportar Bug](https://github.com/yourusername/netmentor/issues)
- 💬 [Hacer Pregunta](https://github.com/yourusername/netmentor/discussions)
- 📧 Email: tu@email.com

---

**Versión**: 2.0.0  
**Última actualización**: Enero 2026  
**Estado**: ✅ En desarrollo activo
4. Click en "Iniciar Captura"

### Dashboard - Monitorear IP específica

1. Filtro: `host 192.168.1.100`
2. Ver estadísticas en tiempo real
3. Expandir paquetes para detalles

## 🎯 Filtros BPF Comunes

```
tcp                          # Solo TCP
udp                          # Solo UDP
icmp                         # Solo ICMP
port 80                      # Puerto 80
tcp port 443                 # TCP puerto 443
host 192.168.1.1             # IP específica
src host 192.168.1.1         # Origen específico
dst host 192.168.1.1         # Destino específico
tcp and not port 22          # TCP sin SSH
(tcp or udp) and port 53     # DNS
```

## ⚙️ Configuración

Crear archivo `.env` en la raíz:

```env
# Backend
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
DEBUG=true

# Frontend
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000
```

## 📚 Estructura del Proyecto

```
networking/
├── backend/                 # FastAPI server
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── routes/
│   │   └── services/
│   ├── run.py
│   └── requirements.txt
│
├── frontend/                # React app
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── App.tsx
│   └── package.json
│
├── packet_sniffer.py        # CLI básico
├── packet_analyzer.py       # CLI con stats
├── run_dashboard.py         # Ejecutor completo
├── QUICKSTART.md            # Guía rápida
├── DASHBOARD.md             # Docs completas
└── README.md                # Este archivo
```

## 🔐 Notas de Seguridad

⚠️ **Importante:**
- Solo captura tráfico en redes que controlas
- No uses en redes públicas sin autorización
- Respeta privacidad y leyes locales
- Datos almacenados en memoria, no en disco por defecto

## 🐛 Troubleshooting

### "Permission denied"
```bash
sudo python3 packet_sniffer.py
# O para dashboard:
sudo python3 run_dashboard.py
```

### Puerto ya en uso
```bash
lsof -i :8000  # Backend
lsof -i :3000  # Frontend
kill -9 <PID>
```

### WebSocket no conecta
- Verifica que backend esté en http://localhost:8000
- Abre DevTools (F12) → Network → WS
- Comprueba CORS en backend

Más detalles en [DASHBOARD.md](./DASHBOARD.md#-solución-de-problemas)

## 📧 Contacto

Para problemas o sugerencias, abre un issue en el repositorio.

---

**¡Disfruta analizando tráfico! 🚀**
