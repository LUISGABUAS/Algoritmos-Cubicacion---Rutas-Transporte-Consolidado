import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/utils/formatters";
import type { StopAccessibilityInfo } from "../utils/accessibilityUtils";

interface AccessibilityPanelProps {
  overallAccessibility: number;
  stopAccessibility: StopAccessibilityInfo[];
  onHighlightPackage?: (id: string) => void;
}

function AccessibilityBar({ value }: { value: number }) {
  const pct = value * 100;
  const color = pct >= 90 ? "bg-success" : pct >= 70 ? "bg-warning" : "bg-danger";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn(
        "text-xs font-semibold w-10 text-right",
        pct >= 90 ? "text-success" : pct >= 70 ? "text-warning" : "text-danger"
      )}>
        {formatPercent(pct)}
      </span>
    </div>
  );
}

export function AccessibilityPanel({
  overallAccessibility,
  stopAccessibility,
  onHighlightPackage,
}: AccessibilityPanelProps) {
  const pct = overallAccessibility * 100;
  const isGood = pct >= 90;

  return (
    <div className="p-4 space-y-4">
      {/* General */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Accesibilidad de descarga
          </p>
          {isGood ? (
            <CheckCircle2 className="h-4 w-4 text-success" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-warning" />
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={cn(
            "text-2xl font-bold",
            pct >= 90 ? "text-success" : pct >= 70 ? "text-warning" : "text-danger"
          )}>
            {formatPercent(pct)}
          </span>
          <span className="text-xs text-muted-foreground">accesibilidad general</span>
        </div>
      </div>

      {stopAccessibility.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Por parada</p>
            {stopAccessibility.map((stop) => (
              <div key={stop.stopOrder}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-foreground">
                    Parada {stop.stopOrder} — {stop.stopName}
                  </p>
                  <span className="text-[10px] text-muted-foreground">
                    {stop.packageCount} paquetes
                  </span>
                </div>
                <AccessibilityBar value={stop.accessibility} />

                {stop.blockedIds.length > 0 && (
                  <div className="mt-1.5 space-y-1">
                    {stop.blockedIds.map((id) => (
                      <button
                        key={id}
                        className="flex items-center gap-1.5 w-full text-left text-[11px] text-warning hover:text-warning/80 transition-colors"
                        onClick={() => onHighlightPackage?.(id)}
                      >
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        {id} bloqueado — clic para localizar
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {stopAccessibility.length === 0 && (
        <p className="text-xs text-muted-foreground italic">
          Ejecuta la optimización para ver el análisis de accesibilidad.
        </p>
      )}
    </div>
  );
}
