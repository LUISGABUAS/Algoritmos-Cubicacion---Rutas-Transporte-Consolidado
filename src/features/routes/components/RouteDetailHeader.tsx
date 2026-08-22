import { Link } from "react-router-dom";
import { Truck, User, Package, MapPin, Clock, Ruler, ArrowRight, Boxes } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { RouteStatusBadge } from "./RouteStatusBadge";
import { formatDistance, formatDuration, formatPercent } from "@/utils/formatters";
import type { Route, Trailer, Driver, Package as Pkg } from "@/types";

interface RouteDetailHeaderProps {
  route?: Route;
  trailer?: Trailer;
  driver?: Driver;
  packages: Pkg[];
  progress: number;
  completedStops: number;
  totalStops: number;
  isLoading: boolean;
}

function StatChip({ icon: Icon, label, value, href }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link to={href} className="hover:opacity-80 transition-opacity" onClick={(e) => e.stopPropagation()}>
        {inner}
      </Link>
    );
  }
  return inner;
}

export function RouteDetailHeader({
  route, trailer, driver, packages, progress, completedStops, totalStops, isLoading,
}: RouteDetailHeaderProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-5 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!route) return null;

  const lastStop = route.stops.at(-1);

  return (
    <Card>
      <CardContent className="p-5">
        {/* Title row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xl font-bold text-foreground">{route.id}</span>
            <RouteStatusBadge status={route.status} />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="font-medium text-foreground">{route.origin}</span>
            <ArrowRight className="h-4 w-4" />
            <span className="font-medium text-foreground">{lastStop?.name ?? "—"}</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-5">
          <StatChip icon={Ruler}   label="Distancia"   value={route.totalDistance ? formatDistance(route.totalDistance) : "—"} />
          <StatChip icon={Clock}   label="Duración est." value={route.estimatedDuration ? formatDuration(route.estimatedDuration) : "—"} />
          <StatChip icon={MapPin}  label="Paradas"     value={`${completedStops} / ${totalStops}`} />
          <StatChip icon={Package} label="Paquetes"    value={`${packages.length}`} />
          <StatChip
            icon={Truck}
            label="Tráiler"
            value={trailer?.id ?? "—"}
            href={trailer ? `/loading/${trailer.id}` : undefined}
          />
          <StatChip
            icon={User}
            label="Conductor"
            value={driver?.name.split(" ")[0] ?? "—"}
          />
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progreso de ruta</span>
            <span className="font-semibold text-foreground">{formatPercent(progress)}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Link acomodación */}
        {trailer && (
          <div className="mt-3 pt-3 border-t">
            <Link
              to={`/loading/${trailer.id}`}
              className="flex items-center gap-2 text-xs text-brand-blue hover:underline font-medium w-fit"
            >
              <Boxes className="h-3.5 w-3.5" />
              Ver acomodación de {trailer.id}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
