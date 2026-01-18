import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Loader } from 'lucide-react';
import './Login.css';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isRegisterMode) {
        const response = await fetch('http://localhost:8000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, username, password, full_name: fullName }),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.detail || 'Error en el registro');
        }
        const data = await response.json();
        localStorage.setItem('access_token', data.tokens.access_token);
        localStorage.setItem('refresh_token', data.tokens.refresh_token);
      } else {
        await login(email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en la autenticación');
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
          <h1>NetMentor</h1>
          <p>Network Traffic Analyzer</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-title">
            <h2>{isRegisterMode ? 'Crear Cuenta' : 'Iniciar Sesión'}</h2>
            <p>
              {isRegisterMode
                ? 'Regístrate para comenzar a analizar tráfico de red'
                : 'Accede con tu email y contraseña'}
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
                type={showPassword ? 'text' : 'password'}
                placeholder={isRegisterMode ? 'Mín. 8 caracteres' : 'Tu contraseña'}
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
            {isRegisterMode && (
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
              'Crear Cuenta'
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="login-footer">
          <p>
            {isRegisterMode ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setError('');
              }}
              className="toggle-mode"
              disabled={isSubmitting}
            >
              {isRegisterMode ? 'Inicia sesión' : 'Regístrate aquí'}
            </button>
          </p>
        </div>

        {/* Demo Info */}
        <div className="demo-info">
          <p>
            <strong>Demo:</strong> El primer usuario registrado será admin automáticamente
          </p>
        </div>
      </div>
    </div>
  );
};
