import { AlertTriangle, Package, Weight, Maximize2, HardDrive } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useOperationSummary } from "../hooks/useDashboardData";
import { formatVolume, formatWeight, formatPercent } from "@/utils/formatters";

interface SummaryItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  alert?: boolean;
}

function SummaryItem({ icon: Icon, label, value, sub, alert = false }: SummaryItemProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
          alert ? "bg-warning/10" : "bg-muted"
        )}
      >
        <Icon className={cn("h-4 w-4", alert ? "text-warning" : "text-muted-foreground")} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("text-sm font-semibold", alert ? "text-warning" : "text-foreground")}>
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

export function OperationSummary() {
  const { data, isLoading } = useOperationSummary();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const volumePct = data
    ? Math.round((data.usedVolume / data.totalVolume) * 100)
    : 0;

  const weightPct = data
    ? Math.round((data.usedWeight / data.totalWeight) * 100)
    : 0;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <SummaryItem
            icon={HardDrive}
            label="Volumen utilizado"
            value={data ? `${formatVolume(data.usedVolume)} / ${formatVolume(data.totalVolume)}` : "—"}
            sub={data ? formatPercent(volumePct) : undefined}
          />
          <SummaryItem
            icon={Weight}
            label="Peso utilizado"
            value={data ? `${formatWeight(data.usedWeight)} / ${formatWeight(data.totalWeight)}` : "—"}
            sub={data ? formatPercent(weightPct) : undefined}
          />
          <SummaryItem
            icon={Maximize2}
            label="Espacio disponible"
            value={data ? formatVolume(data.totalVolume - data.usedVolume) : "—"}
            sub={data ? formatPercent(100 - volumePct) + " libre" : undefined}
          />
          <SummaryItem
            icon={Package}
            label="Sin acomodar"
            value={data ? `${data.unassignedPackages} paquetes` : "—"}
            alert={(data?.unassignedPackages ?? 0) > 0}
          />
          <SummaryItem
            icon={AlertTriangle}
            label="Alertas activas"
            value={data ? `${data.activeAlerts} alerta${data.activeAlerts !== 1 ? "s" : ""}` : "—"}
            alert={(data?.activeAlerts ?? 0) > 0}
          />
        </div>
      </CardContent>
    </Card>
  );
}
