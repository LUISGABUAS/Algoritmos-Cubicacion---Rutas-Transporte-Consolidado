import { Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getStopColor } from "../utils/scaleUtils";
import { formatDimensions, formatWeight } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import type { Package } from "@/types";

interface PackageListProps {
  packages: Package[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function PackageItem({
  pkg,
  isSelected,
  onSelect,
}: {
  pkg: Package;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const hasPosition = !!pkg.position;
  const stopColor = getStopColor(pkg.stopOrder);

  return (
    <button
      className={cn(
        "w-full text-left px-3 py-2.5 transition-colors border-l-2",
        isSelected
          ? "bg-brand-orange/10 border-brand-orange"
          : "border-transparent hover:bg-muted/50"
      )}
      onClick={() => onSelect(pkg.id)}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="font-mono text-xs font-semibold text-foreground">{pkg.id}</span>
        <div className="flex items-center gap-1 shrink-0">
          {pkg.stopOrder && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{ backgroundColor: stopColor + "20", color: stopColor }}
            >
              P{pkg.stopOrder}
            </span>
          )}
          <Badge
            className={cn(
              "text-[10px] h-4 px-1 border-0",
              hasPosition ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
            )}
          >
            {hasPosition ? "Acomodado" : "Pendiente"}
          </Badge>
        </div>
      </div>

      <p className="text-xs text-muted-foreground truncate">{pkg.destination}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">
        {formatDimensions(pkg.length, pkg.width, pkg.height)} · {formatWeight(pkg.weight)}
      </p>
    </button>
  );
}

export function PackageList({ packages, selectedId, onSelect }: PackageListProps) {
  const [search, setSearch] = useState("");

  const filtered = packages.filter(
    (p) =>
      !search ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.destination.toLowerCase().includes(search.toLowerCase())
  );

  const placed  = filtered.filter((p) => p.position);
  const pending = filtered.filter((p) => !p.position);

  return (
    <div className="flex flex-col h-full border-r bg-card">
      {/* Header */}
      <div className="p-3 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-foreground">Paquetes</p>
          <span className="text-xs text-muted-foreground">{packages.length} total</span>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            className="pl-8 h-8 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Separator />

      <ScrollArea className="flex-1">
        {placed.length > 0 && (
          <>
            <div className="px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              Acomodados ({placed.length})
            </div>
            {placed.map((pkg) => (
              <PackageItem key={pkg.id} pkg={pkg} isSelected={selectedId === pkg.id} onSelect={onSelect} />
            ))}
          </>
        )}

        {pending.length > 0 && (
          <>
            {placed.length > 0 && <Separator className="my-1" />}
            <div className="px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              Pendientes ({pending.length})
            </div>
            {pending.map((pkg) => (
              <PackageItem key={pkg.id} pkg={pkg} isSelected={selectedId === pkg.id} onSelect={onSelect} />
            ))}
          </>
        )}

        {filtered.length === 0 && (
          <p className="p-4 text-center text-xs text-muted-foreground">Sin paquetes</p>
        )}
      </ScrollArea>
    </div>
  );
}
