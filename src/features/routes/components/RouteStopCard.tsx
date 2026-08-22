import { CheckCircle2, Clock, Package, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/utils/formatters";
import { STOP_COLORS } from "@/features/loading/utils/scaleUtils";
import type { RouteStop } from "@/types";

interface RouteStopCardProps {
  stop: RouteStop;
  isLast?: boolean;
}

const STOP_STATUS = {
  pending:   { icon: Clock,         label: "Pendiente",  className: "text-muted-foreground" },
  completed: { icon: CheckCircle2,  label: "Completada", className: "text-success" },
  skipped:   { icon: MapPin,        label: "Omitida",    className: "text-warning" },
};

export function RouteStopCard({ stop, isLast = false }: RouteStopCardProps) {
  const stopColor = STOP_COLORS[(stop.order - 1) % STOP_COLORS.length];
  const statusCfg = STOP_STATUS[stop.status];
  const StatusIcon = statusCfg.icon;

  return (
    <div className="flex gap-4">
      {/* Línea vertical + número de parada */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shrink-0"
          style={{ backgroundColor: stopColor }}
        >
          {stop.order}
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 mt-1" style={{ backgroundColor: stopColor + "30", minHeight: "24px" }} />
        )}
      </div>

      {/* Contenido de la parada */}
      <div className={cn("pb-6 flex-1 min-w-0", isLast && "pb-0")}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <p className="text-sm font-semibold text-foreground">{stop.name}</p>
            {stop.address && (
              <p className="text-xs text-muted-foreground">{stop.address}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <StatusIcon className={cn("h-3.5 w-3.5", statusCfg.className)} />
            <span className={cn("text-xs font-medium", statusCfg.className)}>
              {statusCfg.label}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {stop.estimatedArrival && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              ETA: {formatDateTime(stop.estimatedArrival)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            {stop.packageIds.length} paquete{stop.packageIds.length !== 1 ? "s" : ""}
          </span>
          {stop.latitude && stop.longitude && (
            <Badge className="bg-muted text-muted-foreground border-0 text-[10px] font-mono">
              {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
