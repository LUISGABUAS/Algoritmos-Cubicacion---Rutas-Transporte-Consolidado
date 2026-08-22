import { useParams, Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RouteDetailHeader } from "@/features/routes/components/RouteDetailHeader";
import { RouteStopCard } from "@/features/routes/components/RouteStopCard";
import { RouteMap } from "@/components/shared/RouteMap";
import { useRouteDetail } from "@/features/routes/hooks/useRoutes";

export default function RouteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { route, trailer, driver, packages, progress, completedStops, totalStops, isLoading } =
    useRouteDetail(id ?? "");

  const sortedStops = route?.stops.slice().sort((a, b) => a.order - b.order) ?? [];

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Back */}
      <div className="flex items-center gap-2">
        <Link
          to="/routes"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Rutas
        </Link>
        <span className="text-muted-foreground text-sm">/</span>
        <span className="text-sm font-medium text-foreground">{id}</span>
      </div>

      {/* Header con métricas */}
      <RouteDetailHeader
        route={route}
        trailer={trailer}
        driver={driver}
        packages={packages}
        progress={progress}
        completedStops={completedStops}
        totalStops={totalStops}
        isLoading={isLoading}
      />

      {/* Dos columnas: paradas + mapa */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">

        {/* Lista de paradas (2/5) */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Paradas ({sortedStops.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[480px] pr-2">
              <div className="py-1">
                {sortedStops.map((stop, idx) => (
                  <RouteStopCard
                    key={stop.id}
                    stop={stop}
                    isLast={idx === sortedStops.length - 1}
                  />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Mapa (3/5) — placeholder para integración */}
        <div className="lg:col-span-3">
          <RouteMap
            routes={route ? [route] : []}
            activeRouteId={route?.id}
            height={520}
          />
        </div>
      </div>
    </div>
  );
}
