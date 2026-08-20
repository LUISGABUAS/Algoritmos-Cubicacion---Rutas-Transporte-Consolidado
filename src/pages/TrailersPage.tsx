import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrailerFilters } from "@/features/trailers/components/TrailerFilters";
import { TrailerTable } from "@/features/trailers/components/TrailerTable";
import { useTrailersWithStats } from "@/features/trailers/hooks/useTrailers";
import type { TrailerFilters as Filters } from "@/types";

export default function TrailersPage() {
  const [filters, setFilters] = useState<Filters>({});
  const { trailers, isLoading } = useTrailersWithStats(filters);

  function handleFiltersChange(newFilters: Filters) {
    setFilters(newFilters);
  }

  const activeCount = trailers.filter(
    (t) => t.trailer.status === "in_transit" || t.trailer.status === "loading"
  ).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Tráileres</h2>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Cargando..."
              : `${trailers.length} unidades · ${activeCount} en operación`}
          </p>
        </div>
        <Button asChild className="bg-navy hover:bg-navy/90">
          <Link to="/trailers/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo tráiler
          </Link>
        </Button>
      </div>

      {/* Filtros */}
      <TrailerFilters filters={filters} onChange={handleFiltersChange} />

      {/* Tabla */}
      <TrailerTable trailers={trailers} loading={isLoading} />
    </div>
  );
}
