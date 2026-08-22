import { Package, Truck, BarChart2, CheckCircle2, Clock } from "lucide-react";
import { KPICard } from "./KPICard";
import { useDashboardMetrics } from "../hooks/useDashboardData";
import { formatPercent } from "@/utils/formatters";

export function KPIGrid() {
  const { data: metrics, isLoading } = useDashboardMetrics();

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <KPICard
        title="Paquetes totales"
        value={metrics?.totalPackages.toLocaleString("es-MX") ?? "—"}
        delta={metrics?.totalPackagesDelta}
        icon={Package}
        iconColor="bg-brand-blue"
        loading={isLoading}
      />
      <KPICard
        title="Tráileres activos"
        value={metrics?.activeTrailers ?? "—"}
        icon={Truck}
        iconColor="bg-navy"
        loading={isLoading}
      />
      <KPICard
        title="Ocupación promedio"
        value={metrics ? formatPercent(metrics.avgOccupancy) : "—"}
        delta={metrics?.avgOccupancyDelta}
        icon={BarChart2}
        iconColor="bg-navy"
        loading={isLoading}
      />
      <KPICard
        title="Entregas completadas"
        value={metrics?.deliveriesCompleted.toLocaleString("es-MX") ?? "—"}
        delta={metrics?.deliveriesCompletedDelta}
        icon={CheckCircle2}
        iconColor="bg-success"
        loading={isLoading}
      />
      <KPICard
        title="Entregas a tiempo"
        value={metrics ? formatPercent(metrics.onTimeDeliveryRate) : "—"}
        delta={metrics?.onTimeDeliveryRateDelta}
        icon={Clock}
        iconColor={
          metrics && metrics.onTimeDeliveryRate >= 95
            ? "bg-success"
            : metrics && metrics.onTimeDeliveryRate >= 85
            ? "bg-warning"
            : "bg-danger"
        }
        loading={isLoading}
      />
    </div>
  );
}
