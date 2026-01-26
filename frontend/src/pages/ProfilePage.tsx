import { Calendar, Save, Shield, User, Zap } from "lucide-react";
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import "./ProfilePage.css";

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
  });

  const handleSave = () => {
    // TODO: Implementar guardado de perfil en backend
    console.log("Guardando perfil:", formData);
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="profile-page">
        <p>No hay usuario autenticado</p>
      </div>
    );
  }

  return (
    <div className="view-container profile-view">
      <header className="view-header">
        <div className="header-text">
          <h1 className="view-title">
            <span className="title-icon">👤</span> Identidad de Operador
          </h1>
          <p className="view-subtitle">
            Gestión de credenciales, nivel de acceso y parámetros de sesión.
          </p>
        </div>
      </header>

      <div className="view-content">
        <div className="profile-layout">
          {/* Identity Sidebar */}
          <aside className="profile-aside">
            <div className="identity-card glass-card">
              <div className="avatar-preview">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.username} className="avatar-img" />
                ) : (
                  <div className="avatar-placeholder">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="status-indicator online"></div>
              </div>
              <div className="identity-text">
                <h3 className="operator-name">{user.full_name || user.username}</h3>
                <span className="operator-role">{user.role}</span>
              </div>
              <div className="identity-stats">
                <div className="mini-stat">
                  <span className="m-label">Sesión</span>
                  <span className="m-val">ACTIVA</span>
                </div>
                <div className="mini-stat">
                  <span className="m-label">ID</span>
                  <span className="m-val">#{user.username.substring(0, 4)}</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Configuration Main */}
          <main className="profile-main">
            <div className="settings-stack">
              {/* Personal Data */}
              <section className="settings-card glass-card">
                <div className="card-header">
                  <User size={18} className="header-icon" />
                  <h4 className="card-title">Atributos Personales</h4>
                  <button
                    className="action-link-btn"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? "Descartar" : "Modificar"}
                  </button>
                </div>

                <div className="card-body">
                  <div className="form-field">
                    <label className="field-label">Identificador de Acceso</label>
                    <span className="field-readonly">{user.username}</span>
                  </div>

                  <div className="form-field">
                    <label className="field-label">Nombre del Operador</label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="cyber-input"
                        value={formData.full_name}
                        onChange={(e) =>
                          setFormData({ ...formData, full_name: e.target.value })
                        }
                      />
                    ) : (
                      <span className="field-value">{user.full_name || "— No definido —"}</span>
                    )}
                  </div>

                  <div className="form-field">
                    <label className="field-label">Capa de Comunicación (Email)</label>
                    {isEditing ? (
                      <input
                        type="email"
                        className="cyber-input"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    ) : (
                      <span className="field-value">{user.email || "— No definido —"}</span>
                    )}
                  </div>

                  {isEditing && (
                    <div className="form-actions">
                      <button className="premium-btn primary" onClick={handleSave}>
                        <Save size={16} />
                        Guardar Configuración
                      </button>
                    </div>
                  )}
                </div>
              </section>

              {/* Security & Permissions */}
              <section className="settings-card glass-card">
                <div className="card-header">
                  <Shield size={18} className="header-icon" />
                  <h4 className="card-title">Niveles de Privilegio</h4>
                </div>
                <div className="card-body">
                  <div className="permissions-matrix">
                    {user.permissions?.length ? (
                      user.permissions.map((permission, index) => (
                        <div key={index} className="matrix-chip">
                          <Zap size={10} className="chip-icon" />
                          <span>{permission}</span>
                        </div>
                      ))
                    ) : (
                      <span className="matrix-placeholder">Nivel de acceso básico (Consultor)</span>
                    )}
                  </div>
                </div>
              </section>

              {/* Activity Timeline */}
              <section className="settings-card glass-card">
                <div className="card-header">
                  <Calendar size={18} className="header-icon" />
                  <h4 className="card-title">Registro de Actividad</h4>
                </div>
                <div className="card-body">
                  <div className="activity-summary">
                    <div className="log-row">
                      <span className="log-label">Última Sincronización</span>
                      <span className="log-val">Hace 2 minutos</span>
                    </div>
                    <div className="log-row">
                      <span className="log-label">Dirección de IPv4</span>
                      <span className="log-val">127.0.0.1</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
