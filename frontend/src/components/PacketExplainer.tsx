import React, { useState, useEffect } from 'react';
import apiService, { PacketData } from '../services/api';
import './PacketExplainer.css';

interface PacketExplainerProps {
  packet: PacketData | null;
  onClose: () => void;
}

interface Explanation {
  source: string;
  app: string;
  explanation: string;
  security: string;
  learn: string;
  details: Record<string, any>;
}

const PacketExplainer: React.FC<PacketExplainerProps> = ({ packet, onClose }) => {
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!packet) return;

    const fetchExplanation = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await apiService.explainPacket({
          protocol: packet.protocol,
          src_ip: packet.src_ip,
          dst_ip: packet.dst_ip,
          src_port: packet.src_port,
          dst_port: packet.dst_port,
          flags: packet.flags,
          length: packet.length,
          use_ai: true,
        });
        setExplanation(result);
      } catch (err: any) {
        console.error('Error obteniendo explicación:', err);
        setError(err.message || 'Error al obtener explicación');
      } finally {
        setLoading(false);
      }
    };

    fetchExplanation();
  }, [packet]);

  if (!packet) return null;

  return (
    <div className="explainer-overlay" onClick={onClose}>
      <div className="explainer-modal" onClick={(e) => e.stopPropagation()}>
        <button className="explainer-close" onClick={onClose}>×</button>
        
        <div className="explainer-header">
          <span className="explainer-icon">🎓</span>
          <h2>¿Qué está pasando?</h2>
        </div>

        {loading && (
          <div className="explainer-loading">
            <div className="loading-spinner"></div>
            <p>Analizando paquete...</p>
          </div>
        )}

        {error && (
          <div className="explainer-error">
            <p>❌ {error}</p>
          </div>
        )}

        {explanation && !loading && (
          <div className="explainer-content">
            {/* App/Servicio */}
            <div className="explainer-section app-section">
              <span className="section-label">Aplicación</span>
              <span className="section-value app-name">{explanation.app}</span>
            </div>

            {/* Explicación principal */}
            <div className="explainer-section">
              <span className="section-label">💬 Explicación</span>
              <p className="explanation-text">{explanation.explanation}</p>
            </div>

            {/* Seguridad */}
            <div className="explainer-section security-section">
              <span className="section-label">🛡️ Seguridad</span>
              <p className="security-text">{explanation.security}</p>
            </div>

            {/* Dato educativo */}
            <div className="explainer-section learn-section">
              <span className="section-label">💡 ¿Sabías que...?</span>
              <p className="learn-text">{explanation.learn}</p>
            </div>

            {/* Detalles técnicos */}
            <details className="explainer-details">
              <summary>📋 Detalles técnicos</summary>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Protocolo</span>
                  <span className="detail-value">{explanation.details.protocol}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Origen</span>
                  <span className="detail-value">{explanation.details.src}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Destino</span>
                  <span className="detail-value">{explanation.details.dst}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Tamaño</span>
                  <span className="detail-value">{explanation.details.size}</span>
                </div>
                {explanation.details.flags && (
                  <div className="detail-item">
                    <span className="detail-label">Flags</span>
                    <span className="detail-value">{explanation.details.flags}</span>
                  </div>
                )}
              </div>
            </details>

            {/* Fuente */}
            <div className="explainer-source">
              {explanation.source === 'ollama' && '🤖 Explicado por IA'}
              {explanation.source === 'cache' && '⚡ Respuesta instantánea'}
              {explanation.source === 'basic' && 'ℹ️ Explicación básica'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PacketExplainer;
