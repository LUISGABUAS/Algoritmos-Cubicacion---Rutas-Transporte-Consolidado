import { MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Route } from "@/types";

// ─── Contrato de integración ──────────────────────────────────────────────────
// Este componente es un placeholder para el módulo de mapa del equipo.
// Cuando esté listo, reemplazar el contenido interno manteniendo esta interfaz.
//
// Props disponibles para el módulo de mapas:
//   routes          — rutas activas con paradas (lat/lon disponibles en RouteStop)
//   activeRouteId   — ruta actualmente seleccionada
//   onRouteSelect   — callback al seleccionar una ruta
//   onStopSelect    — callback al seleccionar una parada
//   height          — altura del contenedor en px (default: 320)
// ─────────────────────────────────────────────────────────────────────────────

export interface RouteMapProps {
  routes?: Route[];
  activeRouteId?: string;
  highlightedPackageIds?: string[];
  onRouteSelect?: (routeId: string) => void;
  onStopSelect?: (stopId: string) => void;
  height?: number;
  className?: string;
}

export function RouteMap({
  routes = [],
  activeRouteId,
  height = 320,
}: RouteMapProps) {
  const activeRoute = routes.find((r) => r.id === activeRouteId);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Mapa de rutas activas</CardTitle>
        <CardDescription>
          {routes.length > 0
            ? `${routes.length} ruta${routes.length !== 1 ? "s" : ""} en seguimiento`
            : "Sin rutas activas"}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div
          className="relative flex flex-col items-center justify-center bg-muted/40 border-t border-dashed border-border"
          style={{ height }}
        >
          {/* Grid decorativo estilo mapa */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(#64748B 1px, transparent 1px), linear-gradient(90deg, #64748B 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          <div className="relative flex flex-col items-center gap-3 text-center px-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy/10">
              <MapPin className="h-6 w-6 text-navy" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Módulo de mapa pendiente</p>
              <p className="text-xs text-muted-foreground mt-1">
                Integrar aquí el componente de mapas del equipo usando{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">{"<RouteMap />"}</code>
              </p>
            </div>

            {/* Preview de rutas disponibles */}
            {routes.length > 0 && (
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {routes.map((route) => (
                  <span
                    key={route.id}
                    className="rounded-full bg-navy/10 px-2.5 py-1 text-xs font-medium text-navy"
                  >
                    {route.id}
                    {activeRoute?.id === route.id && " ●"}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
