import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AccessibilityAlert } from "./AccessibilityAlert";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/utils/formatters";
import type { StopAccessibilityInfo } from "../utils/accessibilityUtils";
import type { Package } from "@/types";

interface AccessibilityPanelProps {
  overallAccessibility: number;
  stopAccessibility: StopAccessibilityInfo[];
  packages: Package[];
  hasPlacedPackages: boolean;
  onHighlightPackage: (id: string) => void;
}

function AccessibilityBar({ value }: { value: number }) {
  const pct = value * 100;
  const color = pct >= 90 ? "bg-success" : pct >= 70 ? "bg-warning" : "bg-danger";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn(
        "text-xs font-semibold w-10 text-right tabular-nums",
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
  packages,
  hasPlacedPackages,
  onHighlightPackage,
}: AccessibilityPanelProps) {
  const pct = overallAccessibility * 100;
  const isGood = pct >= 90;

  // Todos los paquetes bloqueados de todas las paradas
  const allBlockedIds = [...new Set(stopAccessibility.flatMap((s) => s.blockedIds))];
  const blockedPackages = allBlockedIds
    .map((id) => {
      const pkg = packages.find((p) => p.id === id);
      // Paquetes que físicamente bloquean a este (parada posterior + Z menor = más cerca de puerta)
      const blockers = packages
        .filter((q) =>
          q.position != null &&
          pkg?.position != null &&
          q.stopOrder != null &&
          pkg.stopOrder != null &&
          q.stopOrder > pkg.stopOrder &&
          q.position.z < pkg.position.z
        )
        .map((q) => q.id);
      return { pkg, blockedByIds: blockers };
    })
    .filter((b) => b.pkg != null);

  if (!hasPlacedPackages) {
    return (
      <div className="p-4 flex flex-col items-center gap-3 text-center">
        <Info className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground">
          El análisis de accesibilidad estará disponible después de ejecutar la optimización.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">

        {/* Score general */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Accesibilidad de descarga
            </p>
            {isGood
              ? <CheckCircle2 className="h-4 w-4 text-success" />
              : <AlertTriangle className="h-4 w-4 text-warning" />
            }
          </div>

          <div className="flex items-end gap-2 mb-2">
            <span className={cn(
              "text-3xl font-bold tabular-nums leading-none",
              pct >= 90 ? "text-success" : pct >= 70 ? "text-warning" : "text-danger"
            )}>
              {formatPercent(pct)}
            </span>
            <span className="text-xs text-muted-foreground pb-0.5">general</span>
          </div>
          <AccessibilityBar value={overallAccessibility} />
        </div>

        {/* Por parada */}
        {stopAccessibility.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                Por parada
              </p>
              {stopAccessibility.map((stop) => (
                <div key={stop.stopOrder} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-foreground">
                      Parada {stop.stopOrder} — {stop.stopName}
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {stop.packageCount} paq.
                    </span>
                  </div>
                  <AccessibilityBar value={stop.accessibility} />
                  {stop.blockedCount > 0 && (
                    <p className="text-[10px] text-warning">
                      {stop.blockedCount} paquete{stop.blockedCount !== 1 ? "s" : ""} bloqueado{stop.blockedCount !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Alertas de paquetes bloqueados */}
        {blockedPackages.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                Conflictos ({blockedPackages.length})
              </p>
              {blockedPackages.map(({ pkg, blockedByIds }) =>
                pkg ? (
                  <AccessibilityAlert
                    key={pkg.id}
                    packageId={pkg.id}
                    stopOrder={pkg.stopOrder}
                    destination={pkg.destination}
                    blockedByCount={blockedByIds.length || 1}
                    blockedByIds={blockedByIds}
                    onLocate={onHighlightPackage}
                  />
                ) : null
              )}
            </div>
          </>
        )}

        {stopAccessibility.length === 0 && (
          <p className="text-xs text-muted-foreground italic">
            Optimiza el acomodo para ver el análisis completo por parada.
          </p>
        )}
      </div>
    </ScrollArea>
  );
}
