import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Loader } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { useAuth } from "../contexts/AuthContext";

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
            full_name: fullName,
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
      <div className="min-h-screen flex items-center justify-center bg-background p-5">
        <div className="flex flex-col items-center gap-4 text-primary">
          <Loader size={40} className="animate-spin" />
          <p>Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-5">
      <Card className="w-full max-w-[420px] shadow-2xl shadow-primary/10 animate-in slide-in-from-bottom-4 duration-300">
        <CardHeader className="text-center space-y-4">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center text-3xl font-bold text-primary-foreground shadow-lg shadow-primary/30">
              N
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">LeirEye</CardTitle>
            <CardDescription>Network Traffic Analyzer</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">
                {isRegisterMode ? "Crear Cuenta" : "Iniciar Sesión"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isRegisterMode
                  ? "Regístrate para comenzar a analizar tráfico de red"
                  : "Accede con tu email y contraseña"}
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-wide"
              >
                Email
              </Label>
              <Input
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
              <div className="space-y-2">
                <Label
                  htmlFor="username"
                  className="text-xs font-semibold uppercase tracking-wide"
                >
                  Nombre de usuario
                </Label>
                <Input
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
              <div className="space-y-2">
                <Label
                  htmlFor="fullName"
                  className="text-xs font-semibold uppercase tracking-wide"
                >
                  Nombre completo (opcional)
                </Label>
                <Input
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
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-wide"
              >
                Contraseña
              </Label>
              <div className="relative">
                <Input
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
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {isRegisterMode && password && (
                <div className="mt-2 p-3 bg-primary/5 rounded-md border-l-[3px] border-primary space-y-1">
                  <p
                    className={cn(
                      "text-xs flex items-center gap-2",
                      password.length >= 8
                        ? "text-green-500"
                        : "text-destructive",
                    )}
                  >
                    ✓ Mínimo 8 caracteres
                  </p>
                  <p
                    className={cn(
                      "text-xs flex items-center gap-2",
                      /[A-Z]/.test(password)
                        ? "text-green-500"
                        : "text-destructive",
                    )}
                  >
                    ✓ Una mayúscula (A-Z)
                  </p>
                  <p
                    className={cn(
                      "text-xs flex items-center gap-2",
                      /[a-z]/.test(password)
                        ? "text-green-500"
                        : "text-destructive",
                    )}
                  >
                    ✓ Una minúscula (a-z)
                  </p>
                  <p
                    className={cn(
                      "text-xs flex items-center gap-2",
                      /\d/.test(password)
                        ? "text-green-500"
                        : "text-destructive",
                    )}
                  >
                    ✓ Un número (0-9)
                  </p>
                </div>
              )}
              {isRegisterMode && !password && (
                <p className="text-xs text-muted-foreground">
                  Debe contener: mayúsculas, minúsculas y números
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full font-semibold uppercase tracking-wide"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader size={18} className="animate-spin mr-2" />
                  Procesando...
                </>
              ) : isRegisterMode ? (
                "Crear Cuenta"
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            {isRegisterMode ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setError("");
              }}
              className="ml-2 text-primary hover:text-primary/80 font-medium transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isRegisterMode ? "Inicia sesión" : "Regístrate aquí"}
            </button>
          </p>

          <div className="w-full p-3 bg-primary/5 rounded-md text-center">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Demo:</strong> El primer
              usuario registrado será admin automáticamente
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
