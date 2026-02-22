#!/bin/bash
# Script rápido para levantar la app en desarrollo
# Ejecutar: bash quick_dev_start.sh

set -e

echo "🚀 LeirEye - Quick Dev Start"
echo "════════════════════════════════════════"

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Backend
echo -e "${BLUE}📦 Iniciando Backend...${NC}"
cd backend

# Verificar si .env.development existe
if [ ! -f ".env.development" ]; then
    echo "⚠️  No se encontró .env.development"
    echo "✓ Se usarán valores por defecto de desarrollo"
fi

# Crear usuario de desarrollo
echo -e "${BLUE}🌱 Creando usuario de desarrollo...${NC}"
python seed_dev.py || echo "⚠️  Error al crear usuario (quizás ya existe)"

# Levantar backend en background
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo "✓ Backend levantado (PID: $BACKEND_PID)"

# Esperar que esté listo
sleep 3

# 2. Frontend
echo -e "${BLUE}⚛️  Iniciando Frontend...${NC}"
cd ../frontend

npm start &
FRONTEND_PID=$!
echo "✓ Frontend levantado (PID: $FRONTEND_PID)"

echo ""
echo "════════════════════════════════════════"
echo -e "${GREEN}✓ Aplicación lista!${NC}"
echo ""
echo "📍 Frontend:  http://localhost:3000"
echo "📍 Backend:   http://localhost:8000"
echo "📍 API Docs:  http://localhost:8000/docs"
echo ""
echo "🔐 Desarrollo Auto-Login:"
echo "   Email:    dev@example.com"
echo "   Password: DevPass123"
echo ""
echo "Presiona Ctrl+C para detener..."
echo ""

# Esperar a que termine
wait
