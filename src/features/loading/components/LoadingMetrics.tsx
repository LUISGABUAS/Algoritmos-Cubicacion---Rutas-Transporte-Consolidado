import { totalVolume, totalWeight, trailerTotalVolume } from "@/utils/calculations";
import { formatVolume, formatWeight, formatPercent } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import type { Package, Trailer } from "@/types";

interface MetricChipProps {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}

function MetricChip({ label, value, sub, highlight }: MetricChipProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center px-5 py-2 border-r last:border-r-0",
      highlight && "bg-brand-orange/5"
    )}>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={cn("text-base font-bold", highlight ? "text-brand-orange" : "text-foreground")}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

interface LoadingMetricsProps {
  trailer: Trailer;
  packages: Package[];
  overallAccessibility?: number; // 0-1
}

export function LoadingMetrics({ trailer, packages, overallAccessibility }: LoadingMetricsProps) {
  const placed  = packages.filter((p) => p.position);
  const capVol  = trailerTotalVolume(trailer);
  const usedVol = totalVolume(placed);
  const usedWgt = totalWeight(placed);
  const volPct  = capVol > 0 ? (usedVol / capVol) * 100 : 0;
  const wasted  = 100 - volPct;
  const accPct  = overallAccessibility !== undefined ? overallAccessibility * 100 : null;

  return (
    <div className="flex border rounded-lg bg-card overflow-hidden shrink-0">
      <MetricChip
        label="Ocupación"
        value={formatPercent(volPct)}
        highlight={volPct >= 85}
      />
      <MetricChip
        label="Volumen"
        value={formatVolume(usedVol)}
        sub={`/ ${formatVolume(capVol)}`}
      />
      <MetricChip
        label="Peso"
        value={formatWeight(usedWgt)}
        sub={`/ ${formatWeight(trailer.maxWeight)}`}
      />
      <MetricChip
        label="Paquetes"
        value={`${placed.length} / ${packages.length}`}
        sub="acomodados"
      />
      <MetricChip
        label="Espacio libre"
        value={formatPercent(wasted)}
        sub={formatVolume(capVol - usedVol)}
      />
      {accPct !== null && (
        <MetricChip
          label="Accesibilidad"
          value={formatPercent(accPct)}
          highlight={accPct < 90}
        />
      )}
    </div>
  );
}
