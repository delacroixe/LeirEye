# Desarrollo - Network Traffic Analyzer

Guía para desarrolladores que quieran contribuir o extender el proyecto.

## 🏗️ Arquitectura

### Backend (FastAPI)

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # App principal, rutas globales, CORS
│   ├── models.py            # Modelos Pydantic
│   ├── routes/
│   │   ├── capture.py       # Endpoints POST/GET/WS para captura
│   │   └── stats.py         # Endpoints GET para estadísticas
│   └── services/
│       └── packet_capture.py # Lógica de captura con Scapy
├── run.py                   # Script de ejecución
└── requirements.txt         # Dependencias
```

#### Flujo de Captura

```
Cliente (React)
    ↓
[POST /api/capture/start]
    ↓
PacketCaptureService.start_capture()
    ↓ (asyncio task)
sniff() (Scapy)
    ↓ (callback para cada paquete)
_process_packet()
    ↓
WebSocket.send_json("packet", data)
    ↓
Cliente (React) recibe en tiempo real
```

### Frontend (React + TypeScript)

```
frontend/
├── src/
│   ├── components/
│   │   ├── CaptureControls.tsx   # Panel de control
│   │   ├── PacketTable.tsx       # Tabla de paquetes
│   │   └── Statistics.tsx        # Gráficos y estadísticas
│   ├── services/
│   │   ├── api.ts                # Cliente HTTP (axios)
│   │   └── websocket.ts          # Cliente WebSocket
│   ├── App.tsx                   # Componente raíz
│   └── index.tsx                 # Entry point
├── package.json
└── public/
```

#### Flujo de Datos

```
App.tsx (estado global)
    ↓
WebSocket listener → setPackets()
    ↓
[PacketTable, Statistics] reciben props
    ↓
Renderizado con Recharts
```

## 🔧 Desarrollo Local

### Backend

```bash
cd backend

# Crear venv
python3 -m venv venv
source venv/bin/activate

# Instalar con dependencias dev
pip install -r requirements.txt
pip install black flake8 pytest pytest-asyncio

# Ejecutar servidor
python run.py

# Con reload automático
python run.py

# Ejecutar tests
pytest

# Formatear código
black app/

# Lint
flake8 app/
```

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Desarrollo con hot reload
npm start

# Build para producción
npm run build

# Tests
npm test

# Lint/Format
npm run lint
npm run format
```

## 📝 Agregar Nuevas Características

### Backend: Nuevo Endpoint

**Ejemplo: Exportar a CSV**

1. Añadir al servicio (`services/packet_capture.py`):

```python
def export_csv(self) -> str:
    """Exporta paquetes a CSV"""
    import csv
    from io import StringIO
    
    output = StringIO()
    writer = csv.DictWriter(output, fieldnames=[
        'timestamp', 'src_ip', 'dst_ip', 'protocol', 'length'
    ])
    writer.writeheader()
    writer.writerows([p.model_dump() for p in self.packets])
    return output.getvalue()
```

2. Añadir ruta (`routes/capture.py`):

```python
@router.get("/export/csv")
async def export_csv():
    """Exporta paquetes a CSV"""
    csv_data = capture_service.export_csv()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=packets.csv"}
    )
```

3. Consumir en frontend:

```typescript
async downloadCsv() {
  const response = await axios.get('/api/capture/export/csv', {
    responseType: 'blob'
  });
  const url = window.URL.createObjectURL(response.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'packets.csv';
  a.click();
}
```

### Frontend: Nuevo Componente

**Ejemplo: Panel de Filtros Avanzados**

1. Crear `src/components/AdvancedFilters.tsx`:

```typescript
import React, { useState } from 'react';

interface AdvancedFiltersProps {
  onFilterChange: (filter: string) => void;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  onFilterChange,
}) => {
  const [protocol, setProtocol] = useState('');
  const [port, setPort] = useState('');

  const buildFilter = () => {
    let filter = '';
    if (protocol) filter += protocol;
    if (port) filter += ` and port ${port}`;
    onFilterChange(filter);
  };

  return (
    <div className="advanced-filters">
      <select value={protocol} onChange={(e) => setProtocol(e.target.value)}>
        <option value="">Todos los protocolos</option>
        <option value="tcp">TCP</option>
        <option value="udp">UDP</option>
        <option value="icmp">ICMP</option>
      </select>
      
      <input
        type="number"
        value={port}
        onChange={(e) => setPort(e.target.value)}
        placeholder="Puerto"
      />
      
      <button onClick={buildFilter}>Aplicar</button>
    </div>
  );
};

export default AdvancedFilters;
```

2. Usar en `App.tsx`:

```typescript
const [filter, setFilter] = useState('');

<AdvancedFilters onFilterChange={setFilter} />
```

## 🧪 Testing

### Backend Tests

```python
# test_capture.py
import pytest
from app.services.packet_capture import PacketCaptureService

@pytest.fixture
def service():
    return PacketCaptureService()

def test_service_initialization(service):
    assert not service.is_running
    assert service.stats['total'] == 0

@pytest.mark.asyncio
async def test_capture_start(service):
    # Mock sniff para tests
    service.start_capture()
    assert service.is_running
```

### Frontend Tests

```typescript
// CaptureControls.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import CaptureControls from './CaptureControls';

test('muestra botón de inicio', () => {
  render(<CaptureControls />);
  expect(screen.getByText('Iniciar Captura')).toBeInTheDocument();
});

test('llama a onCaptureStart al hacer click', () => {
  const mock = jest.fn();
  render(<CaptureControls onCaptureStart={mock} />);
  fireEvent.click(screen.getByText('Iniciar Captura'));
  expect(mock).toHaveBeenCalled();
});
```

## 🚀 Deploying

### Producción - Backend

```bash
# Build
pip install -r requirements.txt
python run.py  # Con HOST=0.0.0.0

# Con Gunicorn (production)
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 app.main:app
```

### Producción - Frontend

```bash
# Build
npm run build

# Servir con nginx
nginx -c nginx.conf
```

### Docker (Opcional)

**Dockerfile.backend:**

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY backend/app ./app
CMD ["python", "run.py"]
```

**Dockerfile.frontend:**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY frontend/package.json .
RUN npm install
COPY frontend .
RUN npm run build
CMD ["npm", "start"]
```

## 📋 Checklist para Contribuciones

- [ ] Código sigue el estilo del proyecto
- [ ] Tests agregados y pasando
- [ ] Documentación actualizada
- [ ] No hay warnings de lint
- [ ] Cambios probados manualmente
- [ ] Commit messages claros

## 🔍 Debugging

### Backend

```python
# En app/main.py añadir logging
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

logger.debug(f"Paquete recibido: {packet_info}")
```

### Frontend

```typescript
// En services/websocket.ts
console.log('Mensaje WebSocket:', message);

// DevTools: F12 → Network → WS → Messages
```

## 📚 Stack Tecnológico

| Componente | Tecnología | Versión |
|-----------|-----------|---------|
| Backend Web | FastAPI | 0.109.0 |
| ASGI Server | Uvicorn | 0.27.0 |
| Captura | Scapy | 2.5.0+ |
| Validación | Pydantic | 2.5.3 |
| Frontend | React | 19.2.3 |
| Gráficos | Recharts | latest |
| HTTP Client | Axios | latest |
| WebSocket | Native WS | - |
| Typing | TypeScript | 4.9.5 |

## 🤝 Contribución

1. Fork el repo
2. Crea una rama: `git checkout -b feature/awesome`
3. Commit: `git commit -m "Add awesome feature"`
4. Push: `git push origin feature/awesome`
5. Pull Request

## 📞 Soporte

- Issues: Abre un issue en GitHub
- Discussions: Para preguntas generales
- Security: Reporta privadamente

---

**Happy coding! 🚀**
