# NetMentor - Roadmap de Desarrollo

> **"Tu red, explicada"** - Analizador de red educativo con IA local

## 🎯 Visión del Producto

Transformar un sniffer de red técnico en una herramienta educativa que usa IA local para explicar qué pasa en tu red, protegiendo siempre la privacidad del usuario.

---

## Fase 1: IA Core (Semana 1-2) ⬅️ ACTUAL

### Objetivo
Integrar Ollama como motor de IA local para explicaciones educativas.

### Tareas

- [x] **1.1 Backend: Servicio AIExplainer**
  - Crear `backend/app/services/ai_explainer.py`
  - Conexión a Ollama API (localhost:11434)
  - Modelo: llama3.2:3b (ligero, rápido)
  - Cache de explicaciones comunes

- [x] **1.2 Backend: Endpoints IA**
  - `POST /api/ai/explain-packet` - Explicar un paquete
  - `POST /api/ai/explain-alert` - Explicar alerta de seguridad
  - `GET /api/ai/status` - Estado de Ollama

- [x] **1.3 Cache de Patrones Comunes**
  - Pre-computar explicaciones para:
    - Puertos conocidos (80, 443, 22, 53, etc.)
    - Servicios populares (Netflix, Google, Spotify, etc.)
    - Protocolos básicos (TCP, UDP, ICMP, DNS)

- [x] **1.4 Frontend: Botón "Explícame"**
  - Agregar botón en PacketTable
  - Modal con explicación de IA
  - Loading state mientras genera

### Entregable
Usuario puede hacer click en cualquier paquete y recibir explicación en lenguaje simple.

---

## Fase 2: Explicaciones Mejoradas (Semana 3-4)

### Objetivo
Mejorar calidad y velocidad de explicaciones.

### Tareas

- [ ] **2.1 Detección de Aplicaciones**
  - Mapear IPs/dominios a servicios conocidos
  - Base de datos de fingerprints de apps
  - Mostrar logos/iconos de apps detectadas

- [ ] **2.2 Timeline Narrativo**
  - Reemplazar lista técnica por narrativa
  - "Netflix descargando video" en lugar de "TCP 443 → 52.94.xxx"
  - Agrupación inteligente de paquetes relacionados

- [ ] **2.3 Modos de Explicación**
  - 🟢 Básico: "Esto es normal"
  - 🟡 Intermedio: Con contexto técnico
  - 🔴 Avanzado: Detalles completos

- [ ] **2.4 Biblioteca de Conocimiento**
  - Fichas educativas de protocolos
  - Animaciones de conceptos (TCP handshake, DNS lookup)
  - Links a recursos externos

### Entregable
Explicaciones contextuales según nivel del usuario y detección automática de apps.

---

## Fase 3: Seguridad Explicada (Semana 5-6)

### Objetivo
Detectar amenazas y explicarlas de forma educativa.

### Tareas

- [ ] **3.1 Detección de Anomalías**
  - Conexiones HTTP (no seguras)
  - Puertos inusuales (IRC, Telnet, etc.)
  - Tráfico a horas extrañas
  - Destinos geográficos sospechosos

- [ ] **3.2 Alertas Educativas**
  - No solo "bloqueado" sino "por qué"
  - Recomendaciones accionables
  - Nivel de riesgo explicado (bajo/medio/alto)

- [ ] **3.3 Whitelist/Blacklist con Contexto**
  - Marcar IPs como confiables/sospechosas
  - Explicar por qué se sugiere bloquear
  - Historial de decisiones

- [ ] **3.4 Reportes de Seguridad**
  - Resumen diario/semanal
  - Tendencias de tu red
  - Comparación con "redes similares" (anonimizado)

### Entregable
Sistema de alertas que enseña seguridad mientras protege.

---

## Fase 4: Gamificación (Semana 7-8)

### Objetivo
Motivar el aprendizaje con logros y progreso.

### Tareas

- [ ] **4.1 Sistema de Logros**
  - 🔍 Primer Vistazo - Captura tu primer paquete
  - 🗺️ Explorador - Identifica 5 protocolos distintos
  - 🛡️ Vigilante - Detecta conexión HTTP insegura
  - 🌐 Nativo Digital - Completa tutorial TCP/IP
  - 🕵️ Detective DNS - Descubre 10 dominios únicos
  - ⚠️ Cazador - Identifica tráfico anómalo
  - 🔐 Guardián - Configura tu primera regla

- [ ] **4.2 Progreso y Niveles**
  - XP por acciones educativas
  - Niveles: Novato → Aprendiz → Analista → Experto
  - Desbloqueo de features avanzadas

- [ ] **4.3 Tutoriales Interactivos**
  - Guías paso a paso
  - Quizzes contextuales
  - Certificados de completado

- [ ] **4.4 Estadísticas Personales**
  - "Has analizado X paquetes"
  - "Detectaste Y amenazas"
  - "Aprendiste Z conceptos"

### Entregable
Sistema completo de gamificación que incentiva explorar y aprender.

---

## Fase 5: Pulido y Distribución (Semana 9-10)

### Objetivo
Preparar para usuarios reales.

### Tareas

- [ ] **5.1 Onboarding Guiado**
  - Tour inicial de la app
  - Configuración de preferencias
  - Primer captura asistida

- [ ] **5.2 Empaquetado**
  - App Electron para Mac/Windows/Linux
  - Instalador simple (incluye Ollama)
  - Auto-actualizaciones

- [ ] **5.3 Documentación**
  - Guía de usuario
  - FAQ
  - Troubleshooting

- [ ] **5.4 Performance**
  - Optimización de memoria
  - Captura de alto volumen
  - Cache inteligente

### Entregable
Aplicación lista para distribución pública.

---

## 📊 Métricas de Éxito

| Métrica | Objetivo Fase 1 | Objetivo Final |
|---------|-----------------|----------------|
| Tiempo de explicación | < 3s | < 1s (cache) |
| Precisión explicaciones | 80% | 95% |
| Patrones cacheados | 50 | 500+ |
| Logros disponibles | 0 | 20+ |
| NPS usuarios | N/A | > 50 |

---

## 🔧 Stack Técnico

| Componente | Tecnología |
|------------|------------|
| Backend | FastAPI + Python 3.11 |
| Frontend | React 18 + TypeScript |
| IA Local | Ollama + llama3.2:3b |
| Captura | Scapy |
| Tiempo Real | WebSocket |
| Gráficos | Recharts |
| Desktop | Electron (futuro) |

---

## 📅 Timeline

```
Enero 2026
├── Semana 3: Fase 1 - IA Core ⬅️ ACTUAL
├── Semana 4: Fase 1 - Completar
Febrero 2026
├── Semana 1-2: Fase 2 - Explicaciones Mejoradas
├── Semana 3-4: Fase 3 - Seguridad Explicada
Marzo 2026
├── Semana 1-2: Fase 4 - Gamificación
├── Semana 3-4: Fase 5 - Pulido y Distribución
Abril 2026
└── 🚀 Launch Beta Pública
```

---

## Notas

- Prioridad absoluta: **Privacidad** - Todo local, nada a la nube sin consentimiento
- Modelo de IA puede cambiar según rendimiento (llama3.2 → phi3 → mistral)
- Cada fase debe ser usable independientemente
