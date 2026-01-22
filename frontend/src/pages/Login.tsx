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
  const [fullName, setFullName] = useState("");

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
        // Validar email
        const emailError = validateEmail(email);
        if (emailError) {
          throw new Error(emailError);
        }

        // Validar username
        const usernameError = validateUsername(username);
        if (usernameError) {
          throw new Error(usernameError);
        }

        // Validar password
        const passwordError = validatePassword(password);
        if (passwordError) {
          throw new Error(passwordError);
        }

        const response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            username,
            password,
            full_name: fullName,
          }),
        });
        if (!response.ok) {
          const data = await response.json();
          // Si es un error de validación (422), mostrar el primer error
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
      <div className="login-container">
        <div className="loading-spinner">
          <Loader size={40} />
          <p>Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Logo */}
        <div className="login-header">
          <div className="login-logo">
            <div className="logo-icon-large">N</div>
          </div>
          <h1>LeirEye</h1>
          <p>Network Traffic Analyzer</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-title">
            <h2>{isRegisterMode ? "Crear Cuenta" : "Iniciar Sesión"}</h2>
            <p>
              {isRegisterMode
                ? "Regístrate para comenzar a analizar tráfico de red"
                : "Accede con tu email y contraseña"}
            </p>
          </div>

          {error && <div className="error-message">{error}</div>}

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Username (Register only) */}
          {isRegisterMode && (
            <div className="form-group">
              <label htmlFor="username">Nombre de usuario</label>
              <input
                id="username"
                type="text"
                placeholder="tu_usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isSubmitting}
                minLength={3}
              />
            </div>
          )}

          {/* Full Name (Register only) */}
          {isRegisterMode && (
            <div className="form-group">
              <label htmlFor="fullName">Nombre completo (opcional)</label>
              <input
                id="fullName"
                type="text"
                placeholder="Tu Nombre Completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="password-input">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={
                  isRegisterMode ? "Mín. 8 caracteres" : "Tu contraseña"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
                minLength={isRegisterMode ? 8 : 1}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="toggle-password"
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {isRegisterMode && password && (
              <div className="password-requirements">
                <p className={password.length >= 8 ? "valid" : "invalid"}>
                  ✓ Mínimo 8 caracteres
                </p>
                <p className={/[A-Z]/.test(password) ? "valid" : "invalid"}>
                  ✓ Una mayúscula (A-Z)
                </p>
                <p className={/[a-z]/.test(password) ? "valid" : "invalid"}>
                  ✓ Una minúscula (a-z)
                </p>
                <p className={/\d/.test(password) ? "valid" : "invalid"}>
                  ✓ Un número (0-9)
                </p>
              </div>
            )}
            {isRegisterMode && !password && (
              <p className="password-hint">
                Debe contener: mayúsculas, minúsculas y números
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting ? (
              <>
                <Loader size={18} className="spinner" />
                Procesando...
              </>
            ) : isRegisterMode ? (
              "Crear Cuenta"
            ) : (
              "Iniciar Sesión"
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="login-footer">
          <p>
            {isRegisterMode ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setError("");
              }}
              className="toggle-mode"
              disabled={isSubmitting}
            >
              {isRegisterMode ? "Inicia sesión" : "Regístrate aquí"}
            </button>
          </p>
        </div>

        {/* Demo Info */}
        <div className="demo-info">
          <p>
            <strong>Demo:</strong> El primer usuario registrado será admin
            automáticamente
          </p>
        </div>
      </div>
    </div>
  );
};
