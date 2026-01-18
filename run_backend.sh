#!/bin/bash
# Script para ejecutar el backend con permisos de root (necesario para capturar paquetes con scapy)

cd /Users/antuan/Dev/sec/networking/backend

# Activar virtualenv si existe
if [ -d "/Users/antuan/.local/share/virtualenvs/backend-opRFuAcw" ]; then
    source /Users/antuan/.local/share/virtualenvs/backend-opRFuAcw/bin/activate
fi

# Ejecutar con sudo para permitir captura de paquetes
sudo -E python run.py
