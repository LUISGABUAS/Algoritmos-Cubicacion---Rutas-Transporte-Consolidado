import { cn } from "@/lib/utils";
import { formatVolume, formatWeight, formatPercent } from "@/utils/formatters";

interface TrailerCapacityBarProps {
  volumePct: number;
  weightPct: number;
  usedVolume: number;
  totalCapacityVolume: number;
  usedWeight: number;
  maxWeight: number;
}

function barColor(pct: number): string {
  if (pct >= 95) return "bg-warning";
  if (pct >= 85) return "bg-success";
  if (pct >= 1)  return "bg-brand-blue";
  return "bg-muted-foreground/20";
}

function CapacityRow({
  label,
  pct,
  used,
  total,
  color,
}: {
  label: string;
  pct: number;
  used: string;
  total: string;
  color: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-medium", pct >= 95 ? "text-warning" : "text-foreground")}>
          {formatPercent(pct)}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground">
        {used} / {total}
      </p>
    </div>
  );
}

export function TrailerCapacityBar({
  volumePct,
  weightPct,
  usedVolume,
  totalCapacityVolume,
  usedWeight,
  maxWeight,
}: TrailerCapacityBarProps) {
  return (
    <div className="space-y-2 min-w-[140px]">
      <CapacityRow
        label="Volumen"
        pct={volumePct}
        used={formatVolume(usedVolume)}
        total={formatVolume(totalCapacityVolume)}
        color={barColor(volumePct)}
      />
      <CapacityRow
        label="Peso"
        pct={weightPct}
        used={formatWeight(usedWeight)}
        total={formatWeight(maxWeight)}
        color={barColor(weightPct)}
      />
    </div>
  );
}
