import { useNavigate } from "react-router-dom";
import { MoreHorizontal, Eye, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RouteStatusBadge } from "./RouteStatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDistance, formatDuration } from "@/utils/formatters";
import type { Route } from "@/types";

interface RouteTableProps {
  routes: Route[];
  loading?: boolean;
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 7 }).map((__, j) => (
            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export function RouteTable({ routes, loading = false }: RouteTableProps) {
  const navigate = useNavigate();

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent bg-muted/30">
            <TableHead className="pl-6 font-medium">Ruta</TableHead>
            <TableHead className="font-medium">Origen → Destino</TableHead>
            <TableHead className="font-medium">Paradas</TableHead>
            <TableHead className="font-medium">Distancia</TableHead>
            <TableHead className="font-medium">Duración est.</TableHead>
            <TableHead className="font-medium">Progreso</TableHead>
            <TableHead className="font-medium">Estado</TableHead>
            <TableHead className="pr-6 w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableSkeleton />
          ) : routes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8}>
                <EmptyState
                  icon={Map}
                  title="Sin rutas"
                  description="No se encontraron rutas con los filtros aplicados."
                />
              </TableCell>
            </TableRow>
          ) : (
            routes.map((route) => {
              const completed = route.stops.filter((s) => s.status === "completed").length;
              const total     = route.stops.length;
              const progress  = total > 0 ? Math.round((completed / total) * 100) : 0;
              const lastStop  = route.stops.at(-1);

              return (
                <TableRow
                  key={route.id}
                  className="hover:bg-muted/20 cursor-pointer"
                  onClick={() => navigate(`/routes/${route.id}`)}
                >
                  <TableCell className="pl-6">
                    <span className="font-mono text-sm font-semibold text-foreground">
                      {route.id}
                    </span>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{route.origin}</span>
                      {lastStop && (
                        <span className="text-xs text-muted-foreground">→ {lastStop.name}</span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="text-sm text-foreground">{total} paradas</span>
                    <p className="text-xs text-muted-foreground">{completed} completadas</p>
                  </TableCell>

                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {route.totalDistance ? formatDistance(route.totalDistance) : "—"}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {route.estimatedDuration ? formatDuration(route.estimatedDuration) : "—"}
                    </span>
                  </TableCell>

                  <TableCell className="w-36">
                    <div className="flex items-center gap-2">
                      <Progress value={progress} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground w-8 text-right">
                        {progress}%
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <RouteStatusBadge status={route.status} />
                  </TableCell>

                  <TableCell className="pr-6" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/routes/${route.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalle
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
