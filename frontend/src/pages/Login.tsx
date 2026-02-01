import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { useAuth } from "../contexts/AuthContext";
import "./Login.css";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState("");

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate("/capture");
    }
  }, [isAuthenticated, isLoading, navigate]);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) return "La contraseña debe tener al menos 8 caracteres";
    if (!/[A-Z]/.test(pwd))
      return "La contraseña debe contener al menos una mayúscula";
    if (!/[a-z]/.test(pwd))
      return "La contraseña debe contener al menos una minúscula";
    if (!/\d/.test(pwd))
      return "La contraseña debe contener al menos un número";
    return null;
  };

  const validateUsername = (user: string): string | null => {
    if (user.length < 3)
      return "El nombre de usuario debe tener al menos 3 caracteres";
    if (user.length > 50)
      return "El nombre de usuario no puede exceder 50 caracteres";
    if (!/^[a-zA-Z0-9_]+$/.test(user))
      return "El nombre de usuario solo puede contener letras, números y guiones bajos";
    return null;
  };

  const validateEmail = (mail: string): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(mail)) return "Por favor ingresa un email válido";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (isRegisterMode) {
        const emailError = validateEmail(email);
        if (emailError) throw new Error(emailError);

        const usernameError = validateUsername(username);
        if (usernameError) throw new Error(usernameError);

        const passwordError = validatePassword(password);
        if (passwordError) throw new Error(passwordError);

        const response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            username,
            password,
          }),
        });
        if (!response.ok) {
          const data = await response.json();
          if (
            response.status === 422 &&
            data.detail &&
            Array.isArray(data.detail)
          ) {
            const errorDetail = data.detail[0];
            const fieldError = errorDetail.msg || "Datos inválidos";
            throw new Error(fieldError);
          }
          throw new Error(data.detail || "Error en el registro");
        }
        const data = await response.json();
        localStorage.setItem("access_token", data.tokens.access_token);
        localStorage.setItem("refresh_token", data.tokens.refresh_token);
      } else {
        await login(email, password);
      }
      navigate("/capture");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error en la autenticación",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="system-loading-overlay">
        <div className="loading-core">
          <Loader size={48} className="spinning-core" />
          <div className="loading-text">
            <span className="text-line">AUTENTICANDO NÚCLEO...</span>
            <span className="text-line secondary">VERIFICANDO CREDENCIALES DE ACCESO</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      {/* Dynamic Background Elements */}
      <div className="background-architecture">
        <div className="glow-sphere sphere-1"></div>
        <div className="glow-sphere sphere-2"></div>
        <div className="data-grid-overlay"></div>
      </div>

      <div className="auth-portal glass-card">
        <header className="portal-header">
          <div className="portal-logo">
            {/* Logo space */}
          </div>
          <div className="portal-brand">
            <h1 className="brand-title">
              LEIR<span className="highlight">EYE</span>
            </h1>
            <p className="brand-subtitle">CYBER INTELLIGENCE OPERATING SYSTEM</p>
          </div>
        </header>

        <main className="portal-body">
          {error && (
            <div className="auth-error-block glass-card">
              <span className="error-icon">⚠️</span>
              <p className="error-message">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="fields-stack">
              <div className="auth-field">
                <label className="auth-label">Identificador de Operador (Email)</label>
                <div className="input-wrapper">
                  <Input
                    id="email"
                    type="email"
                    placeholder="operador@leireye.io"
                    className="premium-auth-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {isRegisterMode && (
                <div className="auth-field fade-in">
                  <label className="auth-label">Nombre de Código</label>
                  <div className="input-wrapper">
                    <Input
                      id="username"
                      type="text"
                      placeholder="Codename_Alpha"
                      className="premium-auth-input"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              )}

              <div className="auth-field">
                <label className="auth-label">Clave de Encriptación</label>
                <div className="input-wrapper">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    className="premium-auth-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="input-eye-toggle"
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <footer className="portal-actions">
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className={`premium-deploy-btn ${isSubmitting ? "deploying" : ""}`}
              >
                {isSubmitting ? (
                  <div className="deploy-loading">
                    <Loader size={20} className="spinning" />
                    <span>SINCRONIZANDO...</span>
                  </div>
                ) : isRegisterMode ? (
                  "INICIALIZAR PROTOCOLO"
                ) : (
                  "AUTORIZAR ACCESO"
                )}
              </button>

              <div className="auth-switch">
                <span className="switch-text">
                  {isRegisterMode ? "¿Ya posee autorización?" : "¿Aún sin credenciales?"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(!isRegisterMode);
                    setError("");
                  }}
                  className="switch-action-btn"
                  disabled={isSubmitting}
                >
                  {isRegisterMode ? "Iniciar Sesión" : "Registrar Operador"}
                </button>
              </div>
            </footer>
          </form>
        </main>
      </div>
    </div>
  );
};
