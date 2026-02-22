import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart3,
  Bell,
  ChevronDown,
  Globe,
  LogOut,
  Menu,
  Network,
  Radio,
  Scan,
  Send,
  Settings,
  Terminal,
  User,
  Wifi,
  X,
} from "lucide-react";
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAlerts } from "../contexts/AlertsContext";
import { useAuth } from "../contexts/AuthContext";
import { useCaptureContext } from "../contexts/CaptureContext";
import { useTerminal } from "../contexts/TerminalContext";
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
  const { isOpen: isTerminalOpen, toggleTerminal, isConnected } = useTerminal();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

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
      label: "Análisis de Red",
      path: "/analysis",
      icon: <Scan size={20} />,
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
      label: "WiFi Analyzer",
      path: "/wifi",
      icon: <Radio size={20} />,
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
      {/* Mobile Toggle */}
      <button
        className={`sidebar-mobile-toggle ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Container */}
      <aside
        className={`app-sidebar ${isOpen ? "mobile-open" : ""} ${isCollapsed ? "collapsed" : ""}`}
      >
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className={`logo-icon ${isCapturing ? "capturing" : ""}`}>
              L
            </div>
            {!isCollapsed && (
              <div className="logo-info">
                <span className="logo-brand">
                  Leir<span className="logo-accent">Eye</span>
                </span>
                <span className="logo-status">
                  {isCapturing ? "● Monitorizando" : "System Ready"}
                </span>
              </div>
            )}
          </div>
          <button
            className="collapse-toggle-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expandir" : "Contraer"}
          >
            <ChevronDown
              size={14}
              style={{
                transform: isCollapsed ? "rotate(-90deg)" : "rotate(90deg)",
              }}
            />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group">
            {!isCollapsed && <h3 className="nav-group-title">Operaciones</h3>}
            <ul className="nav-list">
              {visibleItems.map((item) => (
                <li key={item.path} className="nav-item">
                  <button
                    className={`nav-link ${isActive(item.path) ? "active" : ""}`}
                    onClick={() => handleNavigation(item.path)}
                    title={isCollapsed ? item.label : ""}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {!isCollapsed && (
                      <span className="nav-label">{item.label}</span>
                    )}
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

          {/* Terminal Toggle */}
          <div className="nav-group nav-group-terminal">
            {!isCollapsed && <h3 className="nav-group-title">Herramientas</h3>}
            <button
              className={`nav-link terminal-nav-btn ${isTerminalOpen ? "active" : ""}`}
              onClick={toggleTerminal}
              title={isCollapsed ? "Terminal (Ctrl+`)" : ""}
            >
              <span className="nav-icon">
                <Terminal size={20} />
                {isConnected && <span className="terminal-connected-dot" />}
              </span>
              {!isCollapsed && <span className="nav-label">Terminal</span>}
              {!isCollapsed && (
                <span className="nav-shortcut">Ctrl+`</span>
              )}
            </button>
          </div>
        </nav>

        {user && (
          <div className="sidebar-footer">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="user-profile-btn">
                  <div className="user-avatar">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.username} />
                    ) : (
                      <span>{user.username.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <>
                      <div className="user-details">
                        <span className="user-name">
                          {user.full_name || user.username}
                        </span>
                        <span className="user-role">{user.role}</span>
                      </div>
                      <ChevronDown size={14} className="user-chevron" />
                    </>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="user-dropdown-content"
              >
                <DropdownMenuItem onClick={() => handleNavigation("/profile")}>
                  <User size={16} />
                  <span>Perfil de Analista</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigation("/settings")}>
                  <Settings size={16} />
                  <span>Configuración</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="logout-item"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />
      )}
    </>
  );
};
