import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import React from "react";
import { useCaptureContext } from "../contexts/CaptureContext";

export const CaptureBar: React.FC = () => {
  const {
    isCapturing,
    wsConnected,
    networkInterface,
    filter,
    maxPackets,
    interfaces,
    loading,
    error,
    startCapture,
    stopCapture,
    resetCapture,
    setNetworkInterface,
    setFilter,
    setMaxPackets,
  } = useCaptureContext();

  const filterChips = [
    { label: "TCP", value: "tcp" },
    { label: "UDP", value: "udp" },
    { label: "ICMP", value: "icmp" },
    { label: "HTTP/S", value: "tcp port 80 or tcp port 443" },
    { label: "DNS", value: "tcp port 53 or udp port 53" },
  ];

  return (
    <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Status Indicators */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              wsConnected ? "bg-success animate-pulse" : "bg-error",
            )}
          />
          <Badge
            variant={isCapturing ? "default" : "secondary"}
            className={cn(
              "font-medium",
              isCapturing
                ? "bg-success/20 text-success border-success/30"
                : "bg-bg-tertiary text-text-secondary border-bg-tertiary",
            )}
          >
            {isCapturing ? "● Capturando" : "○ Inactivo"}
          </Badge>
        </div>

        {/* Controls Row */}
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <select
            value={networkInterface}
            onChange={(e) => setNetworkInterface(e.target.value)}
            disabled={isCapturing}
            className="h-9 px-3 bg-bg-tertiary border border-accent/20 rounded-md text-sm text-text-primary focus:outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed"
            title="Interfaz de red"
          >
            <option value="">Todas las interfaces</option>
            {interfaces.map((iface) => (
              <option key={iface} value={iface}>
                {iface}
              </option>
            ))}
          </select>

          <Input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtro BPF (ej: tcp port 80)"
            disabled={isCapturing}
            className="flex-1 min-w-[200px] bg-bg-tertiary border-accent/20 text-text-primary placeholder:text-text-secondary"
          />

          <Input
            type="number"
            value={maxPackets}
            onChange={(e) => setMaxPackets(Number(e.target.value))}
            min="1"
            max="10000"
            disabled={isCapturing}
            className="w-20 bg-bg-tertiary border-accent/20 text-text-primary"
            title="Máx. paquetes"
          />

          <div className="flex items-center gap-1">
            <Button
              onClick={startCapture}
              disabled={isCapturing || loading}
              size="icon"
              className="bg-success hover:bg-success/80 text-white"
              title="Iniciar captura"
            >
              {loading && !isCapturing ? "..." : "▶"}
            </Button>
            <Button
              onClick={stopCapture}
              disabled={!isCapturing && !loading}
              size="icon"
              variant="destructive"
              className="bg-error hover:bg-error/80"
              title="Detener captura"
            >
              ■
            </Button>
            <Button
              onClick={resetCapture}
              disabled={loading}
              size="icon"
              variant="outline"
              className="border-accent/20 text-text-secondary hover:text-accent hover:border-accent"
              title="Resetear"
            >
              ↺
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {filterChips.map((chip) => (
          <Button
            key={chip.label}
            onClick={() => setFilter(chip.value)}
            disabled={isCapturing}
            variant="outline"
            size="sm"
            className={cn(
              "text-xs border-accent/20 text-text-secondary hover:text-accent hover:border-accent",
              filter === chip.value && "bg-accent/10 text-accent border-accent",
            )}
          >
            {chip.label}
          </Button>
        ))}
        <Button
          onClick={() => setFilter("")}
          disabled={isCapturing}
          variant="ghost"
          size="sm"
          className="text-xs text-error hover:bg-error/10 hover:text-error"
        >
          ✕ Limpiar
        </Button>
      </div>

      {error && (
        <Alert
          variant="destructive"
          className="bg-error/10 border-error/30 text-error"
        >
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default CaptureBar;
