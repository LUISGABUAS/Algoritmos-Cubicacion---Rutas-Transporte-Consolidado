import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MoreHorizontal, Pencil, Trash2, Eye, Route, AlertTriangle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { PackageStatusBadge } from "./PackageStatusBadge";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { useDeletePackage } from "../hooks/usePackages";
import { formatDimensions, formatWeight } from "@/utils/formatters";
import type { Package } from "@/types";

interface PackageTableProps {
  packages: Package[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  loading?: boolean;
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell className="pl-6"><Skeleton className="h-4 w-4" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-36" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
          <TableCell><Skeleton className="h-5 w-20" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
          <TableCell className="pr-6"><Skeleton className="h-8 w-8" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function PackageTable({ packages, selectedIds, onSelectionChange, loading = false }: PackageTableProps) {
  const navigate = useNavigate();
  const deleteMutation = useDeletePackage();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const allSelected = packages.length > 0 && selectedIds.length === packages.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  function toggleAll() {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(packages.map((p) => p.id));
    }
  }

  function toggleOne(id: string) {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((s) => s !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  }

  function handleDelete() {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        setDeleteId(null);
        onSelectionChange(selectedIds.filter((id) => id !== deleteId));
      },
    });
  }

  return (
    <>
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-muted/30">
              <TableHead className="pl-6 w-12">
                <Checkbox
                  checked={allSelected}
                  data-state={someSelected ? "indeterminate" : undefined}
                  onCheckedChange={toggleAll}
                  aria-label="Seleccionar todos"
                />
              </TableHead>
              <TableHead className="font-medium">ID</TableHead>
              <TableHead className="font-medium">Destinatario</TableHead>
              <TableHead className="font-medium">Destino</TableHead>
              <TableHead className="font-medium">Dimensiones</TableHead>
              <TableHead className="font-medium">Peso</TableHead>
              <TableHead className="font-medium">Ruta</TableHead>
              <TableHead className="font-medium">Parada</TableHead>
              <TableHead className="font-medium">Estado</TableHead>
              <TableHead className="font-medium">Prioridad</TableHead>
              <TableHead className="pr-6 w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeleton />
            ) : packages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11}>
                  <EmptyState
                    title="Sin paquetes"
                    description="No se encontraron paquetes con los filtros aplicados."
                  />
                </TableCell>
              </TableRow>
            ) : (
              packages.map((pkg) => {
                const isSelected = selectedIds.includes(pkg.id);
                return (
                  <TableRow
                    key={pkg.id}
                    className={isSelected ? "bg-muted/40 hover:bg-muted/50" : "hover:bg-muted/20"}
                    data-state={isSelected ? "selected" : undefined}
                  >
                    <TableCell className="pl-6">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleOne(pkg.id)}
                        aria-label={`Seleccionar ${pkg.id}`}
                      />
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-mono text-sm font-medium text-foreground">{pkg.id}</span>
                        {pkg.barcode && (
                          <span className="text-[11px] text-muted-foreground">{pkg.barcode}</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col max-w-[180px]">
                        <span className="text-sm font-medium text-foreground truncate">{pkg.recipientName}</span>
                        <span className="text-[11px] text-muted-foreground truncate">{pkg.senderName}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="text-sm text-foreground">{pkg.destination}</span>
                    </TableCell>

                    <TableCell>
                      <span className="text-sm text-muted-foreground font-mono whitespace-nowrap">
                        {formatDimensions(pkg.length, pkg.width, pkg.height)}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatWeight(pkg.weight)}
                      </span>
                    </TableCell>

                    <TableCell>
                      {pkg.routeId ? (
                        <Badge className="bg-navy/10 text-navy border-0 font-mono">
                          {pkg.routeId}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {pkg.stopOrder != null ? (
                        <span className="text-sm text-center font-medium w-8 inline-flex items-center justify-center rounded-full bg-muted h-6">
                          {pkg.stopOrder}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <PackageStatusBadge status={pkg.status} />
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <PriorityBadge priority={pkg.priority} />
                        {pkg.fragile && (
                          <AlertTriangle className="h-3.5 w-3.5 text-warning" aria-label="Frágil" />
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/packages/${pkg.id}/edit`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/packages/${pkg.id}/edit`)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={!!pkg.routeId}>
                            <Route className="mr-2 h-4 w-4" />
                            Asignar a ruta
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteId(pkg.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
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

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar paquete?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El paquete{" "}
              <span className="font-mono font-medium">{deleteId}</span> será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
