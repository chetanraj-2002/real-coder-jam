import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ConnectionStatusProps {
  status: "connecting" | "connected" | "disconnected" | "error";
  participantCount?: number;
}

export default function ConnectionStatus({ status, participantCount }: ConnectionStatusProps) {
  const statusConfig = {
    connecting: {
      icon: Loader2,
      label: "Connecting...",
      variant: "secondary" as const,
      className: "animate-spin",
    },
    connected: {
      icon: Wifi,
      label: participantCount ? `${participantCount} online` : "Connected",
      variant: "default" as const,
      className: "",
    },
    disconnected: {
      icon: WifiOff,
      label: "Disconnected",
      variant: "secondary" as const,
      className: "",
    },
    error: {
      icon: WifiOff,
      label: "Connection error",
      variant: "destructive" as const,
      className: "",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1.5">
      <Icon className={cn("h-3 w-3", config.className)} />
      {config.label}
    </Badge>
  );
}
