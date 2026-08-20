import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStopColor } from "../utils/scaleUtils";

interface AccessibilityAlertProps {
  packageId: string;
  stopOrder?: number;
  destination?: string;
  blockedByCount: number;
  blockedByIds: string[];
  onLocate: (id: string) => void;
}

export function AccessibilityAlert({
  packageId,
  stopOrder,
  destination,
  blockedByCount,
  blockedByIds,
  onLocate,
}: AccessibilityAlertProps) {
  const stopColor = getStopColor(stopOrder);

  return (
    <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 space-y-2">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-xs font-semibold text-foreground">{packageId}</span>
            {stopOrder && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ backgroundColor: stopColor + "20", color: stopColor }}
              >
                Parada {stopOrder}
              </span>
            )}
          </div>
          {destination && (
            <p className="text-[11px] text-muted-foreground truncate">{destination}</p>
          )}
          <p className="text-[11px] text-warning mt-1">
            Bloqueado por {blockedByCount} paquete{blockedByCount !== 1 ? "s" : ""} de paradas posteriores
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {blockedByIds.map((id) => (
              <button
                key={id}
                onClick={() => onLocate(id)}
                className="font-mono text-[10px] text-brand-blue hover:underline"
              >
                {id}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="h-6 w-full text-[11px] border-warning/40 text-warning hover:bg-warning/10 hover:text-warning gap-1"
        onClick={() => onLocate(packageId)}
      >
        Localizar en canvas
        <ArrowRight className="h-3 w-3" />
      </Button>
    </div>
  );
}
