import React, { useState, useCallback, useEffect, useRef } from 'react';
import apiService from '../services/api';
import './CaptureControls.css';

interface CaptureControlsProps {
  onCaptureStart?: () => void;
  onCaptureStop?: () => void;
}

const CaptureControls: React.FC<CaptureControlsProps> = ({
  onCaptureStart,
  onCaptureStop,
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [networkInterface, setNetworkInterface] = useState('');
  const [interfaces, setInterfaces] = useState<string[]>([]);
  const [filter, setFilter] = useState('');
  const [maxPackets, setMaxPackets] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startAttemptRef = useRef(false);

  // Sincronizar estado con backend al montar
  useEffect(() => {
    const syncStatus = async () => {
      try {
        const status = await apiService.getStatus();
        console.log('📊 Estado sincronizado:', status);
        setIsCapturing(status.is_running);
      } catch (err) {
        console.error('Error sincronizando estado:', err);
      }
    };
    syncStatus();
  }, []);

  // Cargar interfaces disponibles al montar el componente
  useEffect(() => {
    const loadInterfaces = async () => {
      try {
        const availableInterfaces = await apiService.getInterfaces();
        setInterfaces(availableInterfaces);
        // Seleccionar la primera interfaz por defecto si hay
        if (availableInterfaces.length > 0) {
          setNetworkInterface(availableInterfaces[0]);
        }
      } catch (err) {
        console.error('Error cargando interfaces:', err);
      }
    };

    loadInterfaces();
  }, []);

  const handleStart = useCallback(async () => {
    // Evitar múltiples intentos simultáneos
    if (startAttemptRef.current || isCapturing || loading) {
      console.warn('Intento de inicio ignorado (ya en progreso)');
      return;
    }

    startAttemptRef.current = true;
    try {
      setLoading(true);
      setError(null);
      await apiService.startCapture(
        networkInterface || undefined,
        filter || undefined,
        maxPackets
      );
      setIsCapturing(true);
      onCaptureStart?.();
    } catch (err: any) {
      console.error('Error iniciando captura:', err);
      setError(err.response?.data?.detail || 'Error iniciando captura');
    } finally {
      setLoading(false);
      startAttemptRef.current = false;
    }
  }, [networkInterface, filter, maxPackets, onCaptureStart, isCapturing, loading]);

  const handleStop = useCallback(async () => {
    if (loading) {
      console.warn('handleStop: Ya hay una operación en curso');
      return;
    }
    
    console.log('📤 handleStop llamado, isCapturing:', isCapturing);
    
    try {
      setLoading(true);
      setError(null);
      console.log('📤 Enviando POST /api/capture/stop...');
      const response = await apiService.stopCapture();
      console.log('✓ Respuesta del servidor:', response.data);
      setIsCapturing(false);
      onCaptureStop?.();
    } catch (err: any) {
      console.error('❌ Error deteniendo captura:', err);
      setError(err.response?.data?.detail || 'Error deteniendo captura');
      // Forzar estado a false de todos modos
      setIsCapturing(false);
    } finally {
      setLoading(false);
    }
  }, [onCaptureStop, loading, isCapturing]);

  const handleReset = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await fetch('http://localhost:8000/api/capture/reset', {
        method: 'POST'
      });
      setIsCapturing(false);
      alert('✓ Estado reseteado. Puedes intentar capturar de nuevo.');
    } catch (err: any) {
      console.error('Error reseteando:', err);
      setError('Error reseteando estado');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="capture-controls">
      <h2>🔧 Controles de Captura</h2>
      
      {error && <div className="error-message">{error}</div>}

      <div className="controls-grid">
        <div className="control-group">
          <label>Interfaz de Red:</label>
          <select
            value={networkInterface}
            onChange={(e) => setNetworkInterface(e.target.value)}
            disabled={isCapturing}
            className="interface-select"
          >
            <option value="">-- Todas --</option>
            {interfaces.map((iface) => (
              <option key={iface} value={iface}>{iface}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Filtro BPF:</label>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="ej: tcp port 80"
            disabled={isCapturing}
          />
        </div>

        <div className="control-group">
          <label>Máx. Paquetes:</label>
          <input
            type="number"
            value={maxPackets}
            onChange={(e) => setMaxPackets(Number(e.target.value))}
            min="1"
            max="10000"
            disabled={isCapturing}
          />
        </div>
      </div>

      <div className="filter-buttons">
        <button type="button" onClick={() => setFilter('tcp')} disabled={isCapturing} className="filter-btn">TCP</button>
        <button type="button" onClick={() => setFilter('udp')} disabled={isCapturing} className="filter-btn">UDP</button>
        <button type="button" onClick={() => setFilter('icmp')} disabled={isCapturing} className="filter-btn">ICMP</button>
        <button type="button" onClick={() => setFilter('tcp port 80 or tcp port 443')} disabled={isCapturing} className="filter-btn">HTTP/S</button>
        <button type="button" onClick={() => setFilter('tcp port 22')} disabled={isCapturing} className="filter-btn">SSH</button>
        <button type="button" onClick={() => setFilter('tcp port 53 or udp port 53')} disabled={isCapturing} className="filter-btn">DNS</button>
        <button type="button" onClick={() => setFilter('')} disabled={isCapturing} className="filter-btn filter-btn-clear">✕</button>
      </div>

      <div className="button-group">
        <button onClick={handleStart} disabled={isCapturing || loading} className="btn btn-primary">
          {loading && !isCapturing ? 'Iniciando...' : '▶ Iniciar'}
        </button>
        <button onClick={handleStop} disabled={!isCapturing && !loading} className="btn btn-danger">
          {loading && isCapturing ? 'Deteniendo...' : '■ Detener'}
        </button>
        <button onClick={handleReset} disabled={loading} className="btn btn-secondary" title="Reset">
          🔄
        </button>
        <div className="status-info">
          {isCapturing ? (
            <span className="status-badge status-active">● Activa</span>
          ) : (
            <span className="status-badge status-inactive">○ Inactiva</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaptureControls;
