import {
  BarChart3,
  Bell,
  ChevronDown,
  Globe,
  LogOut,
  Menu,
  Network,
  Send,
  Settings,
  User,
  Wifi,
  X,
} from "lucide-react";
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAlerts } from "../contexts/AlertsContext";
import { useAuth } from "../contexts/AuthContext";
import { useCaptureContext } from "../contexts/CaptureContext";
import "./Sidebar.css";

interface MenuItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  requiredPermission?: string;
}

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasPermission } = useAuth();
  const { isCapturing } = useCaptureContext();
  const { unreadCount } = useAlerts();
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const menuItems: MenuItem[] = [
    {
      label: "Captura",
      path: "/capture",
      icon: <Wifi size={20} />,
      requiredPermission: "capture:start",
    },
    {
      label: "Estadísticas",
      path: "/statistics",
      icon: <BarChart3 size={20} />,
      requiredPermission: "sessions:read",
    },
    {
      label: "Mapa de Red",
      path: "/network-map",
      icon: <Network size={20} />,
      requiredPermission: "sessions:read",
    },
    {
      label: "Alertas",
      path: "/alerts",
      icon: <Bell size={20} />,
      requiredPermission: "sessions:read",
    },
    {
      label: "DNS Tracker",
      path: "/dns",
      icon: <Globe size={20} />,
      requiredPermission: "sessions:read",
    },
    {
      label: "Packet Builder",
      path: "/packet-builder",
      icon: <Send size={20} />,
      requiredPermission: "capture:start",
    },
    {
      label: "Sistema",
      path: "/system",
      icon: <Settings size={20} />,
      requiredPermission: "sessions:read",
    },
  ];

  // Filtrar items por permisos
  const visibleItems = menuItems.filter((item) => {
    if (!item.requiredPermission) return true;
    return hasPermission(item.requiredPermission);
  });

  const isActive = (path: string) => location.pathname === path;

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    setIsOpen(false);
  };

  return (
    <>
      {/* Toggle Button (Mobile) */}
      <button
        className="sidebar-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay (Mobile) */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        {/* Logo Section */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className={`logo-icon ${isCapturing ? "capturing" : ""}`}>
              N
            </div>
            <div className="logo-text">
              <h1>LeriEye</h1>
              <p>{isCapturing ? "● Capturando..." : "Network Analyzer"}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section">
            <h3 className="nav-section-title">Menu Principal</h3>
            <ul className="nav-list">
              {visibleItems.map((item) => (
                <li key={item.path}>
                  <button
                    className={`nav-item ${isActive(item.path) ? "active" : ""}`}
                    onClick={() => handleNavigation(item.path)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                    {item.path === "/alerts" && unreadCount > 0 && (
                      <span className="nav-badge">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* User Section */}
        {user && (
          <div className="sidebar-user">
            <button
              className="user-button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            >
              <div className="user-avatar">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.username} />
                ) : (
                  <div className="avatar-placeholder">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="user-info">
                <p className="user-name">{user.full_name || user.username}</p>
                <p className="user-role">{user.role}</p>
              </div>
              <ChevronDown
                size={16}
                className={`chevron ${isUserMenuOpen ? "open" : ""}`}
              />
            </button>

            {isUserMenuOpen && (
              <div className="user-menu">
                <button
                  className="user-menu-item"
                  onClick={() => {
                    navigate("/profile");
                    setIsUserMenuOpen(false);
                    setIsOpen(false);
                  }}
                >
                  <User size={16} />
                  <span>Perfil</span>
                </button>
                <button
                  className="user-menu-item"
                  onClick={() => {
                    navigate("/settings");
                    setIsUserMenuOpen(false);
                    setIsOpen(false);
                  }}
                >
                  <Settings size={16} />
                  <span>Configuración</span>
                </button>
                <hr className="user-menu-divider" />
                <button
                  className="user-menu-item logout"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
};
