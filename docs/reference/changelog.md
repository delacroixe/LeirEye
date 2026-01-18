# Changelog

Historial de cambios de NetMentor.

## 📋 Versiones

---

## [2.0.0] - 2024-01

### ✨ Nuevas Características

- **Sistema de Autenticación Completo**
  - Registro y login de usuarios
  - JWT con access y refresh tokens
  - Roles: ADMIN, ANALYST, VIEWER
  - Primer usuario es ADMIN automáticamente

- **Base de Datos PostgreSQL**
  - Persistencia de usuarios
  - Migraciones con Alembic
  - Modelos SQLAlchemy

- **Interfaz Profesional**
  - Sidebar con navegación por secciones
  - React Router para múltiples páginas
  - Tarjeta de usuario con rol
  - Tema oscuro profesional

- **Captura de Paquetes Mejorada**
  - Streaming en tiempo real vía WebSocket
  - Filtros por protocolo, IP, puerto
  - Detalle completo de cada paquete

- **Mapa de Red**
  - Visualización interactiva de topología
  - Nodos y conexiones basados en tráfico
  - Diferentes layouts disponibles

- **Explicador con IA**
  - Integración con Ollama
  - Explicaciones en español
  - Niveles: básico, intermedio, avanzado
  - Análisis de seguridad

- **Estadísticas**
  - Gráficos en tiempo real
  - Distribución por protocolo
  - Top IPs y puertos
  - Timeline de tráfico

### 🔧 Mejoras Técnicas

- Migración a React 19
- TypeScript en todo el frontend
- FastAPI con async/await
- Docker Compose para servicios
- Documentación con MkDocs Material

### 🐛 Correcciones

- Manejo de errores mejorado
- Reconexión automática de WebSocket
- Validación de formularios
- CORS configurado correctamente

---

## [1.0.0] - 2023-12

### ✨ Características Iniciales

- Captura básica de paquetes con Scapy
- Visualización en tabla simple
- Estadísticas básicas
- API REST con FastAPI
- Frontend React básico

---

## 🗺️ Roadmap

### Próximas Versiones

#### v2.1.0 (Planificado)

- [ ] Exportar a PCAP
- [ ] Alertas configurables
- [ ] Dashboard personalizable
- [ ] Modo oscuro/claro toggle
- [ ] Internacionalización (i18n)

#### v2.2.0 (Futuro)

- [ ] Reglas de detección personalizadas
- [ ] Integración con VirusTotal
- [ ] Análisis de archivos extraídos
- [ ] API pública documentada

#### v3.0.0 (Visión)

- [ ] Clustering de múltiples instancias
- [ ] Machine Learning para detección
- [ ] Plugins/extensiones
- [ ] Versión desktop (Electron)

---

## 📝 Notas de Migración

### De 1.x a 2.x

1. **Base de datos nueva** - Los datos no se migran automáticamente
2. **Autenticación requerida** - Todas las rutas API ahora requieren token
3. **Frontend rediseñado** - Componentes completamente nuevos
4. **Docker obligatorio** - Se requiere Docker Compose para PostgreSQL

**Pasos de migración:**

```bash
# 1. Backup de datos importantes
# 2. Actualizar código
git pull origin main

# 3. Recrear entorno
cd backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 4. Iniciar servicios
docker-compose up -d

# 5. Aplicar migraciones
alembic upgrade head

# 6. Actualizar frontend
cd ../frontend
rm -rf node_modules
npm install
```

---

## 🏷️ Convenciones de Versionado

NetMentor sigue [Semantic Versioning](https://semver.org/):

- **MAJOR** (x.0.0): Cambios incompatibles
- **MINOR** (0.x.0): Nueva funcionalidad compatible
- **PATCH** (0.0.x): Correcciones de bugs

### Tipos de Commits

| Prefijo | Descripción |
|---------|-------------|
| `feat:` | Nueva característica |
| `fix:` | Corrección de bug |
| `docs:` | Documentación |
| `style:` | Formato, sin cambios de código |
| `refactor:` | Refactoring |
| `test:` | Tests |
| `chore:` | Mantenimiento |
