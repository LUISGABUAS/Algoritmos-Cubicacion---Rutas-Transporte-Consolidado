import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { routeService } from "@/services/routeService";
import type { PackageFilters } from "@/types";

interface PackageFiltersProps {
  filters: PackageFilters;
  onChange: (filters: PackageFilters) => void;
}

const STATUS_OPTIONS = [
  { value: "pending",    label: "Pendiente" },
  { value: "assigned",   label: "Asignado" },
  { value: "loaded",     label: "Cargado" },
  { value: "in_transit", label: "En tránsito" },
  { value: "delivered",  label: "Entregado" },
];

const PRIORITY_OPTIONS = [
  { value: "high",   label: "Alta" },
  { value: "medium", label: "Media" },
  { value: "low",    label: "Baja" },
];

const EMPTY = "all";

export function PackageFilters({ filters, onChange }: PackageFiltersProps) {
  const { data: routes } = useQuery({
    queryKey: ["routes"],
    queryFn: () => routeService.getAll(),
  });

  const hasActiveFilters =
    !!filters.status || !!filters.routeId || !!filters.priority || !!filters.search;

  function set(key: keyof PackageFilters, value: string | undefined) {
    onChange({ ...filters, [key]: value || undefined });
  }

  function clearAll() {
    onChange({});
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Búsqueda */}
      <div className="relative flex-1 min-w-52">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por ID, destinatario, destino..."
          className="pl-9"
          value={filters.search ?? ""}
          onChange={(e) => set("search", e.target.value)}
        />
      </div>

      {/* Estado */}
      <Select
        value={filters.status ?? EMPTY}
        onValueChange={(v) => set("status", v === EMPTY ? undefined : v)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={EMPTY}>Todos los estados</SelectItem>
          {STATUS_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Ruta */}
      <Select
        value={filters.routeId ?? EMPTY}
        onValueChange={(v) => set("routeId", v === EMPTY ? undefined : v)}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Ruta" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={EMPTY}>Todas las rutas</SelectItem>
          {routes?.map((r) => (
            <SelectItem key={r.id} value={r.id}>{r.id}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Prioridad */}
      <Select
        value={filters.priority ?? EMPTY}
        onValueChange={(v) => set("priority", v === EMPTY ? undefined : v)}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Prioridad" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={EMPTY}>Todas</SelectItem>
          {PRIORITY_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Limpiar filtros */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1.5 text-muted-foreground">
          <X className="h-3.5 w-3.5" />
          Limpiar
        </Button>
      )}
    </div>
  );
}
