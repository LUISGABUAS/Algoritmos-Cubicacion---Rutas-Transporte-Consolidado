import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PackageFilters } from "@/features/packages/components/PackageFilters";
import { PackageTable } from "@/features/packages/components/PackageTable";
import { Pagination } from "@/components/shared/Pagination";
import { usePackages, useDeletePackage } from "@/features/packages/hooks/usePackages";
import type { PackageFilters as Filters } from "@/types";

const PAGE_SIZE = 10;

export default function PackagesPage() {
  const [filters, setFilters] = useState<Filters>({});
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: allPackages = [], isLoading } = usePackages(filters);
  const deleteMutation = useDeletePackage();

  // Paginación client-side (sustituir por parámetros de API cuando esté el backend)
  const total = allPackages.length;
  const packages = allPackages.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleFiltersChange(newFilters: Filters) {
    setFilters(newFilters);
    setPage(1);
    setSelectedIds([]);
  }

  function handleBulkDelete() {
    selectedIds.forEach((id) => deleteMutation.mutate(id));
    setSelectedIds([]);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Paquetes</h2>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Cargando..." : `${total} paquete${total !== 1 ? "s" : ""} en total`}
          </p>
        </div>
        <Button asChild className="bg-navy hover:bg-navy/90">
          <Link to="/packages/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo paquete
          </Link>
        </Button>
      </div>

      {/* Filtros */}
      <PackageFilters filters={filters} onChange={handleFiltersChange} />

      {/* Bulk actions — visible cuando hay selección */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-brand-blue/20 bg-brand-blue/5 px-4 py-2.5">
          <span className="text-sm font-medium text-foreground">
            {selectedIds.length} paquete{selectedIds.length !== 1 ? "s" : ""} seleccionado{selectedIds.length !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/30 hover:bg-destructive/5"
              onClick={handleBulkDelete}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Eliminar seleccionados
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds([])}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Tabla */}
      <PackageTable
        packages={packages}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        loading={isLoading}
      />

      {/* Paginación */}
      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onChange={(p) => {
          setPage(p);
          setSelectedIds([]);
        }}
      />
    </div>
  );
}
