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
import type { RouteFilters } from "@/types";

interface RouteFiltersProps {
  filters: RouteFilters;
  onChange: (f: RouteFilters) => void;
}

const EMPTY = "all";

export function RouteFilters({ filters, onChange }: RouteFiltersProps) {
  const hasActive = !!filters.status || !!filters.search;

  function set(key: keyof RouteFilters, value: string | undefined) {
    onChange({ ...filters, [key]: value || undefined });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-52">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por ID u origen..."
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
          <SelectItem value="planned">Planificada</SelectItem>
          <SelectItem value="active">Activa</SelectItem>
          <SelectItem value="completed">Completada</SelectItem>
          <SelectItem value="delayed">Retrasada</SelectItem>
        </SelectContent>
      </Select>

      {hasActive && (
        <Button variant="ghost" size="sm" onClick={() => onChange({})} className="gap-1.5 text-muted-foreground">
          <X className="h-3.5 w-3.5" />
          Limpiar
        </Button>
      )}
    </div>
  );
}
