import { useQuery } from "@tanstack/react-query";
import { KPIGrid } from "@/features/dashboard/components/KPIGrid";
import { TrailerOccupancyChart } from "@/features/dashboard/components/TrailerOccupancyChart";
import { DeliveriesByRouteChart } from "@/features/dashboard/components/DeliveriesByRouteChart";
import { TrailerStatusChart } from "@/features/dashboard/components/TrailerStatusChart";
import { ActiveTrailersTable } from "@/features/dashboard/components/ActiveTrailersTable";
import { RouteMap } from "@/features/dashboard/components/RouteMap";
import { OperationSummary } from "@/features/dashboard/components/OperationSummary";
import { routeService } from "@/services/routeService";

export default function DashboardPage() {
  const { data: routes } = useQuery({
    queryKey: ["routes"],
    queryFn: () => routeService.getAll({ status: "active" }),
  });

  return (
    <div className="space-y-5">
      <KPIGrid />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <TrailerOccupancyChart />
        <DeliveriesByRouteChart />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RouteMap routes={routes} />
        </div>
        <TrailerStatusChart />
      </div>

      <ActiveTrailersTable />

      <OperationSummary />
    </div>
  );
}
