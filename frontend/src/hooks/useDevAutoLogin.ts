/**
 * Hook para auto-login en desarrollo
 * En desarrollo, auto-ingresa con credenciales por defecto
 */

import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export const useDevAutoLogin = () => {
  const { isAuthenticated, login, isLoading } = useAuth();
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);

  useEffect(() => {
    // Solo en desarrollo y si no está autenticado
    if (
      process.env.NODE_ENV === "development" &&
      !isAuthenticated &&
      !isLoading &&
      !autoLoginAttempted
    ) {
      setAutoLoginAttempted(true);

      // Intentar auto-login
      login("dev@example.com", "DevPass123").catch(() => {
        // Si falla, el usuario simplemente no está registrado
        // Necesita crear su propia cuenta
        console.log(
          "Auto-login failed. Use dev@example.com / DevPass123 or register.",
        );
      });
    }
  }, [isAuthenticated, isLoading, autoLoginAttempted, login]);
};

export default useDevAutoLogin;
