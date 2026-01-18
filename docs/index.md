---
title: NetMentor - Analizador de Red Educativo con IA
hide:
  - navigation
  - toc
---

<style>
.md-main__inner {
  margin-top: 0;
}
.md-content__inner {
  padding-top: 0;
}
</style>

<div class="hero" markdown>

# 🌐 NetMentor

## El analizador de red que te **enseña** mientras capturas

Herramienta educativa de análisis de tráfico de red con IA local.  
Captura, visualiza, y **entiende** qué está pasando en tu red.

[Empezar :rocket:](getting-started/index.md){ .md-button .md-button--primary }
[GitHub :fontawesome-brands-github:](https://github.com/yourusername/netmentor){ .md-button }

</div>

---

## ✨ Características Principales

<div class="grid cards" markdown>

-   :material-access-point-network:{ .lg .middle } **Captura en Tiempo Real**

    ---

    Captura paquetes TCP, UDP e ICMP directamente desde tus interfaces de red.
    Streaming vía WebSocket para actualizaciones instantáneas.

    [:octicons-arrow-right-24: Ver más](guide/packet-capture.md)

-   :material-robot:{ .lg .middle } **IA Explicativa**

    ---

    Ollama integrado explica cada paquete en lenguaje simple.
    "¿Qué está haciendo mi red?" — Ahora lo sabrás.

    [:octicons-arrow-right-24: Ver más](guide/ai-explainer.md)

-   :material-map-marker-path:{ .lg .middle } **Mapa de Red Interactivo**

    ---

    Visualiza conexiones como un grafo. Geolocalización de IPs públicas.
    Identifica patrones de comunicación de un vistazo.

    [:octicons-arrow-right-24: Ver más](guide/network-map.md)

-   :material-chart-bar:{ .lg .middle } **Estadísticas Visuales**

    ---

    Gráficos de protocolos, top IPs, puertos más usados.
    Timeline de actividad y análisis por proceso.

    [:octicons-arrow-right-24: Ver más](guide/statistics.md)

-   :material-shield-lock:{ .lg .middle } **100% Local y Seguro**

    ---

    Todo corre en tu máquina. Sin cloud, sin telemetría.
    Tus datos de red nunca salen de tu equipo.

    [:octicons-arrow-right-24: Seguridad](concepts/security/basics.md)

-   :material-school:{ .lg .middle } **Diseñado para Aprender**

    ---

    Documentación conceptual: qué es TCP, cómo funciona DNS, 
    qué son los puertos... Aprende mientras usas.

    [:octicons-arrow-right-24: Conceptos](concepts/index.md)

</div>

---

## 🚀 Empezar en 5 Minutos

=== "Con Docker (Recomendado)"

    ```bash
    # 1. Clonar repositorio
    git clone https://github.com/yourusername/netmentor.git
    cd netmentor

    # 2. Iniciar servicios
    docker-compose up -d

    # 3. Iniciar backend
    cd backend
    alembic upgrade head
    python run.py

    # 4. Iniciar frontend (nueva terminal)
    cd frontend
    npm install && npm start
    ```

=== "Manual"

    ```bash
    # Requisitos: Python 3.11+, Node.js 18+, PostgreSQL
    
    # Backend
    cd backend
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    alembic upgrade head
    python run.py

    # Frontend (nueva terminal)
    cd frontend
    npm install
    npm start
    ```

**Abre tu navegador en** [http://localhost:3001](http://localhost:3001) **y regístrate.**

!!! tip "Primer usuario = Admin"
    El primer usuario registrado obtiene rol de **ADMIN** automáticamente.

[:octicons-arrow-right-24: Guía completa de instalación](getting-started/installation.md)

---

## 🎯 ¿Para quién es NetMentor?

<div class="grid" markdown>

:fontawesome-solid-graduation-cap: **Estudiantes**
: Aprende cómo funcionan las redes analizando tráfico real

:fontawesome-solid-chalkboard-teacher: **Educadores**
: Herramienta didáctica para enseñar conceptos de networking

:fontawesome-solid-user-shield: **Profesionales de Seguridad**
: Análisis rápido de tráfico con explicaciones contextuales

:fontawesome-solid-laptop-code: **Desarrolladores**
: Debuggea conexiones de red de tus aplicaciones

</div>

---

##  Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| **Backend** | FastAPI, Python 3.11+, Scapy |
| **Frontend** | React 19, TypeScript, Recharts |
| **Base de Datos** | PostgreSQL 16, SQLAlchemy |
| **IA** | Ollama (LLM local) |
| **Contenedores** | Docker, Docker Compose |
| **Autenticación** | JWT, bcrypt, RBAC |

---

## 📚 Documentación

<div class="grid cards" markdown>

-   :material-rocket-launch: [**Empezar**](getting-started/index.md)

    Instalación, configuración inicial, primer uso

-   :material-book-open-variant: [**Guía de Uso**](guide/index.md)

    Cómo usar cada funcionalidad

-   :material-school: [**Conceptos**](concepts/index.md)

    Aprende sobre redes y protocolos

-   :material-api: [**API Reference**](api/index.md)

    Documentación técnica de la API

-   :material-tools: [**Referencia**](reference/index.md)

    Comandos, troubleshooting, changelog

-   :material-cloud-upload: [**Despliegue**](deployment/index.md)

    Llevar NetMentor a producción

</div>

---

## 🤝 Contribuir

NetMentor es open source. ¡Las contribuciones son bienvenidas!

- :fontawesome-brands-github: [Ver código fuente](https://github.com/yourusername/netmentor)
- :material-bug: [Reportar un bug](https://github.com/yourusername/netmentor/issues)
- :material-lightbulb: [Sugerir mejora](https://github.com/yourusername/netmentor/discussions)

---

<div class="grid" markdown>

:material-license: **MIT License**
: Libre para usar, modificar y distribuir

:material-update: **Versión Actual: 2.0.0**
: Última actualización: Enero 2026

</div>
