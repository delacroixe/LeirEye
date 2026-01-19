"""Cache de patrones conocidos para respuestas rápidas"""

# Puertos comunes
KNOWN_PATTERNS = {
    "TCP:80": {
        "app": "HTTP (Web)",
        "explanation": "Tráfico web sin encriptar. Los datos viajan en texto plano.",
        "security": "⚠️ Cualquiera en tu red podría ver este contenido. Preferible usar HTTPS.",
        "learn": "HTTP es el protocolo base de la web, pero sin la 'S' de seguro.",
    },
    "TCP:443": {
        "app": "HTTPS (Web Segura)",
        "explanation": "Conexión web encriptada. Tus datos están protegidos.",
        "security": "✅ Conexión segura con cifrado TLS/SSL.",
        "learn": "HTTPS usa certificados digitales para verificar la identidad del sitio.",
    },
    "TCP:22": {
        "app": "SSH",
        "explanation": "Conexión remota segura a otro ordenador.",
        "security": "✅ Protocolo seguro usado por administradores de sistemas.",
        "learn": "SSH permite controlar servidores de forma remota y encriptada.",
    },
    "UDP:53": {
        "app": "DNS",
        "explanation": "Tu dispositivo está buscando la dirección IP de un sitio web.",
        "security": "ℹ️ Normal. Es como buscar un número en la guía telefónica de Internet.",
        "learn": "DNS traduce nombres como 'google.com' a direcciones IP numéricas.",
    },
    "TCP:53": {
        "app": "DNS (TCP)",
        "explanation": "Consulta DNS usando TCP, típicamente para respuestas grandes.",
        "security": "ℹ️ Normal para transferencias de zona o respuestas extensas.",
        "learn": "DNS normalmente usa UDP, pero cambia a TCP si la respuesta es muy grande.",
    },
    "TCP:21": {
        "app": "FTP",
        "explanation": "Transferencia de archivos sin encriptar.",
        "security": "⚠️ Protocolo antiguo sin cifrado. Usa SFTP o FTPS en su lugar.",
        "learn": "FTP fue creado en 1971, antes de que la seguridad fuera una prioridad.",
    },
    "TCP:25": {
        "app": "SMTP (Email)",
        "explanation": "Envío de correo electrónico.",
        "security": "ℹ️ Los servidores de email usan este puerto para comunicarse entre sí.",
        "learn": "SMTP es el protocolo que permite que los emails viajen por Internet.",
    },
    "TCP:993": {
        "app": "IMAP Seguro",
        "explanation": "Tu cliente de email está sincronizando mensajes de forma segura.",
        "security": "✅ Conexión encriptada a tu servidor de correo.",
        "learn": "IMAP permite acceder a tus emails desde múltiples dispositivos.",
    },
    "TCP:587": {
        "app": "SMTP Seguro",
        "explanation": "Envío de email con autenticación.",
        "security": "✅ Puerto moderno y seguro para enviar correos.",
        "learn": "El puerto 587 reemplazó al 25 para envío de emails por usuarios.",
    },
    "TCP:3306": {
        "app": "MySQL",
        "explanation": "Conexión a base de datos MySQL.",
        "security": "⚠️ Si ves esto desde fuera de tu red, podría ser un riesgo.",
        "learn": "MySQL es una de las bases de datos más populares del mundo.",
    },
    "TCP:5432": {
        "app": "PostgreSQL",
        "explanation": "Conexión a base de datos PostgreSQL.",
        "security": "ℹ️ Normal si tienes aplicaciones que usan esta base de datos.",
        "learn": "PostgreSQL es conocida por su robustez y cumplimiento de estándares SQL.",
    },
    "TCP:6379": {
        "app": "Redis",
        "explanation": "Conexión a cache Redis.",
        "security": "ℹ️ Base de datos en memoria, común en aplicaciones web.",
        "learn": "Redis almacena datos en RAM para acceso ultra-rápido.",
    },
    "TCP:8080": {
        "app": "HTTP Alternativo",
        "explanation": "Servidor web en puerto alternativo.",
        "security": "ℹ️ Común para desarrollo o proxies.",
        "learn": "El 8080 se usa cuando el 80 está ocupado o requiere permisos.",
    },
    "UDP:123": {
        "app": "NTP",
        "explanation": "Tu dispositivo está sincronizando su reloj con un servidor de tiempo.",
        "security": "✅ Completamente normal y necesario.",
        "learn": "NTP mantiene todos los dispositivos del mundo sincronizados.",
    },
    "UDP:67": {
        "app": "DHCP Server",
        "explanation": "Un servidor está asignando direcciones IP en la red.",
        "security": "✅ Tu router probablemente está haciendo su trabajo.",
        "learn": "DHCP es lo que te da una IP automáticamente al conectarte.",
    },
    "UDP:68": {
        "app": "DHCP Client",
        "explanation": "Tu dispositivo está solicitando una dirección IP.",
        "security": "✅ Proceso normal al conectarse a una red.",
        "learn": "Sin DHCP, tendrías que configurar tu IP manualmente.",
    },
    "ICMP:0": {
        "app": "Ping/Echo",
        "explanation": "Alguien está verificando si un dispositivo está activo.",
        "security": "ℹ️ Normal para diagnósticos de red.",
        "learn": "Ping es como tocar una puerta para ver si hay alguien en casa.",
    },
}

# IPs/dominios conocidos
KNOWN_SERVICES = {
    "netflix": "🎬 Netflix - Streaming de video",
    "google": "🔍 Google - Servicios de búsqueda y cloud",
    "facebook": "📘 Facebook/Meta - Red social",
    "instagram": "📷 Instagram - Red social de fotos",
    "whatsapp": "💬 WhatsApp - Mensajería",
    "apple": "🍎 Apple - Servicios de iCloud y actualizaciones",
    "microsoft": "🪟 Microsoft - Servicios Windows y Office",
    "amazon": "📦 Amazon - Comercio y AWS",
    "spotify": "🎵 Spotify - Streaming de música",
    "youtube": "📺 YouTube - Streaming de video",
    "twitter": "🐦 Twitter/X - Red social",
    "slack": "💼 Slack - Comunicación empresarial",
    "zoom": "📹 Zoom - Videoconferencias",
    "discord": "🎮 Discord - Chat para gamers",
    "github": "💻 GitHub - Desarrollo de software",
    "cloudflare": "☁️ Cloudflare - CDN y seguridad web",
    "akamai": "🌐 Akamai - CDN (entrega de contenido)",
}

# Explicaciones de alertas
ALERT_EXPLANATIONS = {
    "http_unencrypted": {
        "title": "Conexión sin encriptar detectada",
        "explanation": "Este sitio web no usa HTTPS. Es como enviar una postal en lugar de una carta sellada - cualquiera en el camino podría leerla.",
        "risk": "medio",
        "action": "Evita introducir contraseñas o datos personales en sitios HTTP.",
        "learn": "HTTPS usa certificados digitales para crear un 'túnel' seguro entre tu navegador y el servidor.",
    },
    "unusual_port": {
        "title": "Puerto inusual detectado",
        "explanation": "Se detectó tráfico en un puerto no común.",
        "risk": "bajo",
        "action": "Verifica qué aplicación está usando este puerto.",
        "learn": "Los puertos son como puertas numeradas. Cada servicio tiene su puerta asignada.",
    },
    "late_night_traffic": {
        "title": "Actividad nocturna",
        "explanation": "Se detectó tráfico de red a una hora inusual. Podría ser una actualización automática o algo más.",
        "risk": "bajo",
        "action": "Revisa qué aplicaciones tienen permiso para ejecutarse en segundo plano.",
        "learn": "Muchas apps actualizan sus datos por la noche cuando no usas el dispositivo.",
    },
    "dns_unusual": {
        "title": "Consulta DNS sospechosa",
        "explanation": "Tu dispositivo buscó un dominio que parece generado aleatoriamente. Esto puede indicar malware.",
        "risk": "alto",
        "action": "Ejecuta un escaneo antivirus en tu dispositivo.",
        "learn": "El malware a menudo usa dominios aleatorios para comunicarse con servidores de control.",
    },
}
