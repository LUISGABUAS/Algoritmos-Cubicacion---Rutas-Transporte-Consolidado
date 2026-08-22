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
import type { TrailerFilters } from "@/types";

interface TrailerFiltersProps {
  filters: TrailerFilters;
  onChange: (filters: TrailerFilters) => void;
}

const STATUS_OPTIONS = [
  { value: "available",    label: "Disponible" },
  { value: "loading",      label: "Cargando" },
  { value: "in_transit",   label: "En ruta" },
  { value: "unloading",    label: "Descargando" },
  { value: "maintenance",  label: "Mantenimiento" },
];

const EMPTY = "all";

export function TrailerFilters({ filters, onChange }: TrailerFiltersProps) {
  const hasActive = !!filters.status || !!filters.search;

  function set(key: keyof TrailerFilters, value: string | undefined) {
    onChange({ ...filters, [key]: value || undefined });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-52">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por ID o nombre..."
          className="pl-9"
          value={filters.search ?? ""}
          onChange={(e) => set("search", e.target.value)}
        />
      </div>

      <Select
        value={filters.status ?? EMPTY}
        onValueChange={(v) => set("status", v === EMPTY ? undefined : v)}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={EMPTY}>Todos los estados</SelectItem>
          {STATUS_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActive && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange({})}
          className="gap-1.5 text-muted-foreground"
        >
          <X className="h-3.5 w-3.5" />
          Limpiar
        </Button>
      )}
    </div>
  );
}
