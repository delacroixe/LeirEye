import { Calendar, Save, Shield, User } from "lucide-react";
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
    <div className="profile-page">
      <div className="page-header">
        <h2>👤 Mi Perfil</h2>
        <p className="page-description">
          Gestiona tu información personal y preferencias
        </p>
      </div>

      <div className="profile-content">
        {/* Avatar Section */}
        <div className="profile-avatar-section">
          <div className="profile-avatar">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.username} />
            ) : (
              <div className="avatar-placeholder-large">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h3>{user.full_name || user.username}</h3>
          <span className="profile-role">{user.role}</span>
        </div>

        {/* Info Cards */}
        <div className="profile-info-cards">
          <div className="info-card">
            <div className="info-card-header">
              <User size={20} />
              <h4>Información de Usuario</h4>
              <button
                className="edit-btn"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Cancelar" : "Editar"}
              </button>
            </div>
            <div className="info-card-content">
              <div className="info-row">
                <label>Nombre de usuario</label>
                <span>{user.username}</span>
              </div>
              <div className="info-row">
                <label>Nombre completo</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    className="edit-input"
                  />
                ) : (
                  <span>{user.full_name || "No especificado"}</span>
                )}
              </div>
              <div className="info-row">
                <label>Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="edit-input"
                  />
                ) : (
                  <span>{user.email || "No especificado"}</span>
                )}
              </div>
              {isEditing && (
                <button className="save-btn" onClick={handleSave}>
                  <Save size={16} />
                  Guardar Cambios
                </button>
              )}
            </div>
          </div>

          <div className="info-card">
            <div className="info-card-header">
              <Shield size={20} />
              <h4>Permisos</h4>
            </div>
            <div className="info-card-content">
              <div className="permissions-list">
                {user.permissions?.map((permission, index) => (
                  <span key={index} className="permission-badge">
                    {permission}
                  </span>
                )) || (
                  <span className="no-permissions">
                    Sin permisos especiales
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="info-card">
            <div className="info-card-header">
              <Calendar size={20} />
              <h4>Actividad</h4>
            </div>
            <div className="info-card-content">
              <div className="info-row">
                <label>Última actividad</label>
                <span>Ahora</span>
              </div>
              <div className="info-row">
                <label>Sesiones activas</label>
                <span>1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
