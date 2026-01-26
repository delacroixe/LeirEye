import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
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
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-[1000] md:hidden bg-bg-secondary border border-bg-tertiary text-text-primary hover:bg-bg-tertiary hover:text-accent"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </Button>

      {/* Overlay (Mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-[90] md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 w-[280px] h-screen bg-gradient-to-b from-bg-primary to-bg-secondary border-r border-bg-tertiary flex flex-col z-[99] overflow-y-auto",
          "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-bg-tertiary hover:scrollbar-thumb-accent",
          "transition-transform duration-300 md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-bg-tertiary shrink-0">
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
            <div
              className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xl text-bg-primary shrink-0 transition-all",
                isCapturing
                  ? "bg-gradient-to-br from-green-500 to-green-600 animate-pulse"
                  : "bg-gradient-to-br from-accent to-accent-hover",
              )}
            >
              N
            </div>
            <div className="flex flex-col">
              <h1 className="text-base font-bold text-text-primary leading-none">
                LeriEye
              </h1>
              <p className="text-xs text-text-secondary mt-1">
                {isCapturing ? "● Capturando..." : "Network Analyzer"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide px-4 mb-3">
              Menu Principal
            </h3>
            <ul className="space-y-1">
              {visibleItems.map((item) => (
                <li key={item.path}>
                  <button
                    className={cn(
                      "w-full px-4 py-3 flex items-center gap-3 text-sm font-medium transition-all relative",
                      isActive(item.path)
                        ? "bg-bg-tertiary text-accent before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-accent before:rounded-r"
                        : "text-text-secondary hover:bg-bg-tertiary hover:text-accent",
                    )}
                    onClick={() => handleNavigation(item.path)}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span>{item.label}</span>
                    {item.path === "/alerts" && unreadCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="ml-auto bg-error text-white text-xs px-2 py-0.5"
                      >
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Badge>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* User Section */}
        {user && (
          <div className="p-4 border-t border-bg-tertiary shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-bg-tertiary/50 hover:bg-bg-tertiary transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center shrink-0 overflow-hidden">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-bg-primary font-semibold">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 text-left overflow-hidden">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {user.full_name || user.username}
                    </p>
                    <p className="text-xs text-text-secondary truncate">
                      {user.role}
                    </p>
                  </div>
                  <ChevronDown
                    size={16}
                    className="text-text-secondary shrink-0"
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-bg-secondary border-bg-tertiary"
              >
                <DropdownMenuItem
                  className="text-text-primary hover:bg-bg-tertiary hover:text-accent cursor-pointer"
                  onClick={() => {
                    navigate("/profile");
                    setIsOpen(false);
                  }}
                >
                  <User size={16} className="mr-2" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-text-primary hover:bg-bg-tertiary hover:text-accent cursor-pointer"
                  onClick={() => {
                    navigate("/settings");
                    setIsOpen(false);
                  }}
                >
                  <Settings size={16} className="mr-2" />
                  <span>Configuración</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-bg-tertiary" />
                <DropdownMenuItem
                  className="text-error hover:bg-error/10 hover:text-error cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut size={16} className="mr-2" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </aside>
    </>
  );
};
