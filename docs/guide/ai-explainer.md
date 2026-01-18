# Explicador con IA

NetMentor integra **Ollama** para proporcionar explicaciones en lenguaje natural de los paquetes de red capturados.

## 🤖 ¿Qué es el Explicador IA?

Es una funcionalidad que:

1. **Analiza** un paquete seleccionado
2. **Interpreta** sus cabeceras y datos
3. **Explica** en español qué está haciendo ese paquete
4. **Identifica** posibles riesgos de seguridad

## 🚀 Cómo Usar

### Paso 1: Capturar Paquetes

Primero, inicia una captura para tener paquetes disponibles.

### Paso 2: Seleccionar un Paquete

En la tabla de paquetes, **clic** en el que quieras analizar.

### Paso 3: Solicitar Explicación

1. Clic en el botón **"🤖 Explicar con IA"**
2. Espera unos segundos mientras Ollama procesa
3. Lee la explicación en el panel lateral

## 📝 Ejemplo de Explicación

**Paquete seleccionado:**
```
TCP 192.168.1.100:54321 → 142.250.185.14:443 [SYN]
```

**Explicación de la IA:**

> 📦 **Este paquete es una solicitud de conexión TCP.**
> 
> **¿Qué está pasando?**
> Tu computadora (192.168.1.100) está intentando establecer una conexión 
> segura HTTPS con un servidor de Google (142.250.185.14) en el puerto 443.
> 
> **El flag SYN indica:**
> Es el primer paso del "handshake de tres vías" de TCP. Tu computadora 
> está diciendo "¡Hola! ¿Podemos hablar?"
> 
> **¿Es normal?**
> ✅ Sí, es tráfico normal. El puerto 443 se usa para HTTPS (navegación 
> segura). Probablemente abriste una página de Google o algún servicio 
> que usa sus servidores.
> 
> **Nivel de riesgo:** 🟢 Bajo

## 🎯 Tipos de Análisis

### Explicación Básica

Para usuarios principiantes:
- Lenguaje simple
- Analogías cotidianas
- Sin tecnicismos

### Análisis Técnico

Para usuarios avanzados:
- Detalle de cabeceras
- Valores hexadecimales
- Referencias a RFCs

### Análisis de Seguridad

Enfocado en amenazas:
- ¿Es tráfico normal?
- ¿Hay indicadores de compromiso?
- ¿Qué investigar más?

## 🛡️ Detección de Amenazas

La IA puede identificar patrones sospechosos:

| Patrón | Posible Amenaza | Ejemplo |
|--------|-----------------|---------|
| Muchos SYN sin respuesta | Escaneo de puertos | nmap scan |
| Tráfico a puertos inusuales | Backdoor/C2 | Puerto 4444, 8888 |
| DNS a dominios extraños | Malware | xyz123.tk |
| Grandes transferencias salientes | Exfiltración | Subida de 1GB+ |

**Ejemplo de alerta:**

> ⚠️ **Actividad Sospechosa Detectada**
> 
> Este paquete muestra tráfico hacia el puerto 4444, que es comúnmente 
> usado por herramientas de hacking como Metasploit.
> 
> **Recomendación:** Investiga el proceso que originó esta conexión.
> ```bash
> lsof -i :4444
> ```

## ⚙️ Configuración de Ollama

### Modelo Recomendado

NetMentor usa **llama3.2:3b** por defecto:

```bash
# Descargar modelo
ollama pull llama3.2:3b

# Verificar modelos instalados
ollama list
```

### Modelos Alternativos

| Modelo | RAM Requerida | Velocidad | Calidad |
|--------|---------------|-----------|---------|
| `llama3.2:1b` | 2 GB | ⚡ Rápido | Básica |
| `llama3.2:3b` | 4 GB | ⚖️ Balanceado | Buena |
| `llama3.1:8b` | 8 GB | 🐢 Lento | Excelente |
| `mistral:7b` | 8 GB | ⚖️ Balanceado | Muy buena |

### Cambiar Modelo

En la configuración del backend:

```python
# backend/app/core/config.py
OLLAMA_MODEL = "llama3.2:3b"  # Cambia aquí
```

## 🔧 Troubleshooting

??? warning "Error: Ollama no responde"
    Verifica que Ollama esté corriendo:
    ```bash
    # Verificar proceso
    pgrep -x ollama
    
    # Si no está corriendo
    ollama serve
    ```

??? warning "Respuestas muy lentas"
    1. Prueba un modelo más pequeño
    2. Cierra otras aplicaciones que usen GPU
    3. Considera usar CPU si no tienes GPU dedicada

??? warning "Respuestas incorrectas"
    La IA puede equivocarse. Siempre:
    - Verifica la información
    - Usa múltiples fuentes
    - No tomes decisiones críticas solo con la IA

## 💡 Tips

!!! tip "Paquetes Interesantes"
    No analices todos los paquetes. Enfócate en:
    
    - Primeros paquetes de conexión (SYN)
    - Paquetes con datos (payload)
    - Tráfico a puertos inusuales

!!! tip "Preguntas de Seguimiento"
    Puedes hacer preguntas adicionales sobre el paquete:
    
    - "¿Qué proceso podría generar esto?"
    - "¿Cómo puedo bloquear este tráfico?"
    - "¿Qué más debería investigar?"

!!! tip "Modo Educativo"
    Usa el explicador para aprender:
    
    - Captura tu propio tráfico
    - Pide explicaciones detalladas
    - Compara con la documentación de protocolos
