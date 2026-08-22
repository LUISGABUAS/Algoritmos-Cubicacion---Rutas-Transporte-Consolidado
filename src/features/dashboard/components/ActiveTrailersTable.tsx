import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { useActiveTrailers } from "../hooks/useDashboardData";
import { formatDateTime } from "@/utils/formatters";

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  in_transit: { label: "En ruta",   className: "bg-navy/10 text-navy border-0" },
  loading:    { label: "Cargando",  className: "bg-brand-blue/10 text-brand-blue border-0" },
};

export function ActiveTrailersTable() {
  const { activeTrailers, isLoading } = useActiveTrailers();

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Tráileres en operación</CardTitle>
            <CardDescription>Unidades activas con seguimiento en tiempo real</CardDescription>
          </div>
          <Link
            to="/trailers"
            className="flex items-center gap-1 text-xs text-brand-blue hover:underline font-medium"
          >
            Ver todos <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : activeTrailers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">Sin tráileres activos</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Tráiler</TableHead>
                <TableHead>Ruta</TableHead>
                <TableHead>Conductor</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead>Destino final</TableHead>
                <TableHead className="w-36">Progreso</TableHead>
                <TableHead>ETA</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeTrailers.map(({ trailer, route, driver, progress, eta, origin, destination }) => {
                const statusCfg = STATUS_LABEL[trailer.status];
                return (
                  <TableRow key={trailer.id} className="hover:bg-muted/40">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{trailer.id}</span>
                        {statusCfg && (
                          <Badge className={statusCfg.className}>{statusCfg.label}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {route?.id ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {driver?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {origin}
                    </TableCell>
                    <TableCell className="text-sm">
                      {destination}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={progress} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground w-8 text-right">
                          {progress}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {eta ? formatDateTime(eta) : "—"}
                    </TableCell>
                    <TableCell className="pr-6">
                      <Link
                        to={`/loading/${trailer.id}`}
                        className="flex items-center gap-1 text-xs text-brand-blue hover:underline font-medium whitespace-nowrap"
                      >
                        Ver acomodación <ArrowRight className="h-3 w-3" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
