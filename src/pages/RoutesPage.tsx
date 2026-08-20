import { useState } from "react";
import { RouteFilters } from "@/features/routes/components/RouteFilters";
import { RouteTable } from "@/features/routes/components/RouteTable";
import { useRoutes } from "@/features/routes/hooks/useRoutes";
import type { RouteFilters as Filters } from "@/types";

export default function RoutesPage() {
  const [filters, setFilters] = useState<Filters>({});
  const { data: routes = [], isLoading } = useRoutes(filters);

  const activeCount = routes.filter((r) => r.status === "active").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Rutas</h2>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Cargando..."
              : `${routes.length} rutas · ${activeCount} activa${activeCount !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      <RouteFilters filters={filters} onChange={(f) => { setFilters(f); }} />

      <RouteTable routes={routes} loading={isLoading} />
    </div>
  );
}
