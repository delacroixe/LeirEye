# 📋 Roadmap de Mejoras - Network Traffic Analyzer

## 🔧 Mejoras en Progreso

### WebSocket Streaming
- [x] Arquitectura con queue para comunicación thread-safe
- [x] Mejor logging para diagnosticar problemas
- [ ] Pruebas con tráfico real (ejecutar con sudo)
- [ ] Validar que paquetes fluyan en tiempo real

---

## 🎯 Mejoras Corto Plazo (v1.1)

### 📊 Análisis Mejorado
- [ ] **Búsqueda en tabla**: Campo de búsqueda en PacketTable para filtrar por IP/protocolo
- [ ] **Exportación de datos**: 
  - Exportar a CSV (tabla de paquetes + estadísticas)
  - Exportar a PCAP (formato estándar para Wireshark)
- [ ] **Gráficos temporales**: 
  - Timeline de paquetes por segundo
  - Gráfico de líneas de actividad en el tiempo
- [ ] **Análisis de flujos**: Agrupar paquetes por sesión (src_ip:src_port → dst_ip:dst_port)

### 🎨 UI/UX
- [ ] **Panel de resumen compacto**: KPI cards con cambios en tiempo real (↑↓)
- [ ] **Colores dinámicos**: Resaltar IPs sospechosas o puertos bien conocidos
- [ ] **Tabs organizadas**: Separar Captura / Análisis / Estadísticas
- [ ] **Responsive design**: Mejor visualización en móvil/tablet

### 🔒 Seguridad
- [ ] **Alertas básicas**:
  - Puerto inusual detectado
  - Tráfico a múltiples puertos desde una IP
  - Patrones de escaneo (SYN floods, port scanning)
- [ ] **Whitelist/Blacklist**: Guardar IPs/puertos de confianza
- [ ] **Geolocalización**: Mostrar ubicación de IPs (MaxMind GeoIP)

---

## 🚀 Mejoras Mediano Plazo (v1.2)

### 📈 Análisis Avanzado
- [ ] **Estadísticas de conversación**: Top talkers (IPs que más tráfico generan)
- [ ] **Protocolos de aplicación**: Detectar HTTP, HTTPS, DNS, FTP, SSH
- [ ] **Análisis de payloads**: Buscar patrones en datos (strings, regexes)
- [ ] **Grafos de tráfico**: Visualizar conexiones entre IPs (nodes y edges)

### 💾 Persistencia
- [ ] **Base de datos**: Guardar capturas históricas (SQLite / PostgreSQL)
- [ ] **Cargar capturas previas**: Comparar con capturas anteriores
- [ ] **Reportes programados**: Generar reportes cada hora/día

### 🌐 Networking
- [ ] **Captura remota**: Conectarse a dispositivos remotos via SSH
- [ ] **Múltiples interfaces**: Capturar simultáneamente en varias interfaces
- [ ] **VLAN/Spanning tree**: Mostrar configuración de red

---

## 🔮 Mejoras Largo Plazo (v2.0)

### 🤖 Machine Learning
- [ ] **Detección de anomalías**: Identificar tráfico anómalo automaticamente
- [ ] **Clasificación de tráfico**: Categorizar por tipo (streaming, gaming, business, etc.)
- [ ] **Predicción**: Predecir próximos puertos/IPs que se usarán

### 📱 Multiplataforma
- [ ] **Versión CLI**: Sniffer de línea de comandos
- [ ] **Aplicación de escritorio**: Electron/Tauri
- [ ] **Aplicación móvil**: Capturar en dispositivos móviles

### 🏢 Funcionalidades Empresariales
- [ ] **Autenticación**: Login de usuarios
- [ ] **RBAC**: Roles y permisos (admin, analyst, viewer)
- [ ] **Auditoría**: Log de quién hizo qué y cuándo
- [ ] **Integración con SIEM**: Enviar datos a Splunk, ELK, etc.

---

## 🐛 Bugs Conocidos / TODO

- [ ] WebSocket debe validarse con tráfico real (requiere sudo)
- [ ] Stats endpoint a veces devuelve 0 en los primeros segundos
- [ ] Frontend puede usar caché de estadísticas antiguas
- [ ] Limpiar archivos obsoletos del proyecto (markdown antiguos)

---

## 📊 Métricas de Éxito

| Métrica | Actual | Objetivo |
|---------|--------|----------|
| Paquetes/segundo | ? | 10,000+ |
| Latencia WebSocket | ? | <100ms |
| Memoria RAM | ? | <200MB |
| CPU (sin captura) | ? | <5% |
| Cobertura tests | 0% | >80% |

---

## 🗓️ Timeline Estimado

- **Semana 1**: Fixes WebSocket + Búsqueda/Filtrado
- **Semana 2**: Exportación (CSV/PCAP) + Gráficos temporales  
- **Semana 3**: Alertas básicas + Geolocalización
- **Semana 4**: BD + Reportes programados
- **Mes 2+**: Análisis avanzado, ML, multiplataforma

---

## 🎓 Tecnologías Recomendadas

- **Backend**: FastAPI (ya usado) ✓, Celery (tareas background), Redis (caché)
- **Frontend**: React (ya usado) ✓, D3.js (gráficos avanzados), Socket.io (WebSocket mejorado)
- **Base de datos**: PostgreSQL, InfluxDB (series de tiempo)
- **ML**: scikit-learn, TensorFlow
- **Otros**: MaxMind GeoIP, Wireshark dissectors, Zeek (IDS)

---

## 📝 Notas

- Mantener compatibilidad con Python 3.10+ y Node.js 16+
- Documentar cada feature con ejemplos
- Escribir tests (pytest para backend, Jest para frontend)
- Mantener el código limpio y modular

