import React from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import "./App.css";
import AlertToast from "./components/AlertToast";
import { CaptureBar } from "./components/CaptureBar";
import GlobalFilterBadge from "./components/GlobalFilterBadge";
import { Sidebar } from "./components/Sidebar";
import { AlertsProvider } from "./contexts/AlertsContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CaptureProvider } from "./contexts/CaptureContext";
import { SyncProvider } from "./contexts/SyncContext";
import useDevAutoLogin from "./hooks/useDevAutoLogin";
import AlertsPage from "./pages/AlertsPage";
import CapturePage from "./pages/CapturePage";
import DNSPage from "./pages/DNSPage";
import { Login } from "./pages/Login";
import NetworkMapPage from "./pages/NetworkMapPage";
import PacketBuilderPage from "./pages/PacketBuilderPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import StatisticsPage from "./pages/StatisticsPage";
import SystemPage from "./pages/SystemPage";
import WiFiPage from "./pages/WiFiPage";

// Componente protegido para rutas que requieren autenticación
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function AppContent() {
  const { isAuthenticated } = useAuth();

  // Auto-login en desarrollo
  useDevAutoLogin();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <SyncProvider>
      <div className="app-container">
        {/* Background Atmosphere */}
        <div className="bg-blur-glow bg-blur-1" />
        <div className="bg-blur-glow bg-blur-2" />

        <div className="app-layout">
          <Sidebar />

          <div className="app-content-wrapper">
            <CaptureBar />

            <div className="global-filter-overlay">
              <GlobalFilterBadge />
            </div>

            <main className="app-main-view">
              <AlertToast />
              <Routes>
                <Route
                  path="/capture"
                  element={
                    <ProtectedRoute>
                      <CapturePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/statistics"
                  element={
                    <ProtectedRoute>
                      <StatisticsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/network-map"
                  element={
                    <ProtectedRoute>
                      <NetworkMapPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/alerts"
                  element={
                    <ProtectedRoute>
                      <AlertsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dns"
                  element={
                    <ProtectedRoute>
                      <DNSPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/wifi"
                  element={
                    <ProtectedRoute>
                      <WiFiPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/packet-builder"
                  element={
                    <ProtectedRoute>
                      <PacketBuilderPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/system"
                  element={
                    <ProtectedRoute>
                      <SystemPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/" element={<Navigate to="/capture" replace />} />
                <Route path="*" element={<Navigate to="/capture" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      </div>
    </SyncProvider>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <CaptureProvider>
          <AlertsProvider>
            <AppContent />
          </AlertsProvider>
        </CaptureProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
