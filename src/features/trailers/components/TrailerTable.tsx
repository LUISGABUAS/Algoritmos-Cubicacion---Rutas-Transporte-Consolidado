import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MoreHorizontal, Pencil, Trash2, Boxes, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TrailerStatusBadge } from "./TrailerStatusBadge";
import { TrailerCapacityBar } from "./TrailerCapacityBar";
import { EmptyState } from "@/components/shared/EmptyState";
import { useDeleteTrailer } from "../hooks/useTrailers";
import { formatDimensions } from "@/utils/formatters";
import type { Trailer, Route, Driver } from "@/types";

interface TrailerRow {
  trailer: Trailer;
  route?: Route;
  driver?: Driver;
  packageCount: number;
  usedVolume: number;
  usedWeight: number;
  totalCapacityVolume: number;
  volumePct: number;
  weightPct: number;
}

interface TrailerTableProps {
  trailers: TrailerRow[];
  loading?: boolean;
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 7 }).map((__, j) => (
            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export function TrailerTable({ trailers, loading = false }: TrailerTableProps) {
  const navigate = useNavigate();
  const deleteMutation = useDeleteTrailer();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  return (
    <>
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-muted/30">
              <TableHead className="pl-6 font-medium">Tráiler</TableHead>
              <TableHead className="font-medium">Estado</TableHead>
              <TableHead className="font-medium">Ruta / Conductor</TableHead>
              <TableHead className="font-medium">Dimensiones internas</TableHead>
              <TableHead className="font-medium">Paquetes</TableHead>
              <TableHead className="font-medium w-48">Ocupación</TableHead>
              <TableHead className="pr-6 w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeleton />
            ) : trailers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <EmptyState
                    icon={Truck}
                    title="Sin tráileres"
                    description="No se encontraron tráileres con los filtros aplicados."
                  />
                </TableCell>
              </TableRow>
            ) : (
              trailers.map(({
                trailer, route, driver, packageCount,
                usedVolume, usedWeight, totalCapacityVolume, volumePct, weightPct,
              }) => (
                <TableRow key={trailer.id} className="hover:bg-muted/20">
                  {/* Tráiler */}
                  <TableCell className="pl-6">
                    <div className="flex flex-col">
                      <span className="font-mono text-sm font-medium text-foreground">{trailer.id}</span>
                      <span className="text-xs text-muted-foreground">{trailer.name}</span>
                      {trailer.licensePlate && (
                        <span className="text-[11px] text-muted-foreground">{trailer.licensePlate}</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Estado */}
                  <TableCell>
                    <TrailerStatusBadge status={trailer.status} />
                  </TableCell>

                  {/* Ruta / Conductor */}
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      {route ? (
                        <Link
                          to={`/routes/${route.id}`}
                          className="text-sm font-medium text-brand-blue hover:underline font-mono"
                        >
                          {route.id}
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin ruta</span>
                      )}
                      {driver && (
                        <span className="text-xs text-muted-foreground truncate max-w-[160px]">
                          {driver.name}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Dimensiones */}
                  <TableCell>
                    <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                      {formatDimensions(
                        trailer.internalLength,
                        trailer.internalWidth,
                        trailer.internalHeight
                      )}
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Máx. {trailer.maxWeight.toLocaleString("es-MX")} kg
                    </p>
                  </TableCell>

                  {/* Paquetes */}
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-foreground">{packageCount}</span>
                      <span className="text-xs text-muted-foreground">paquetes</span>
                    </div>
                  </TableCell>

                  {/* Ocupación */}
                  <TableCell>
                    <TrailerCapacityBar
                      volumePct={volumePct}
                      weightPct={weightPct}
                      usedVolume={usedVolume}
                      totalCapacityVolume={totalCapacityVolume}
                      usedWeight={usedWeight}
                      maxWeight={trailer.maxWeight}
                    />
                  </TableCell>

                  {/* Acciones */}
                  <TableCell className="pr-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => navigate(`/loading/${trailer.id}`)}
                          disabled={trailer.status === "maintenance"}
                        >
                          <Boxes className="mr-2 h-4 w-4" />
                          Ver acomodación
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/trailers/${trailer.id}/edit`)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          disabled={trailer.status === "in_transit"}
                          onClick={() => setDeleteId(trailer.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tráiler?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El tráiler{" "}
              <span className="font-mono font-medium">{deleteId}</span> será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) {
                  deleteMutation.mutate(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
