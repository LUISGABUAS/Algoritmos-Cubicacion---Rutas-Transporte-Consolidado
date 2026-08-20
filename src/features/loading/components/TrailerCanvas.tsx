import { Layers, LayoutGrid, AlignLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrailerTopView } from "./TrailerTopView";
import { TrailerSideView } from "./TrailerSideView";
import { cn } from "@/lib/utils";
import type { Package, Trailer } from "@/types";
import type { ViewMode } from "../types";

interface TrailerCanvasProps {
  trailer?: Trailer;
  packages: Package[];
  selectedPackageId: string | null;
  onSelect: (id: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  isLoading?: boolean;
}

export function TrailerCanvas({
  trailer,
  packages,
  selectedPackageId,
  onSelect,
  viewMode,
  onViewModeChange,
  isLoading = false,
}: TrailerCanvasProps) {
  if (isLoading) {
    return <Skeleton className="w-full h-full min-h-[400px] rounded-lg" />;
  }

  if (!trailer) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Tráiler no encontrado
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Toolbar del canvas */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex rounded-lg border bg-card overflow-hidden">
          <Button
            variant="ghost"
            size="sm"
            className={cn("rounded-none gap-2 h-8", viewMode === "top" && "bg-navy text-white hover:bg-navy/90")}
            onClick={() => onViewModeChange("top")}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Vista superior
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("rounded-none gap-2 h-8 border-l", viewMode === "side" && "bg-navy text-white hover:bg-navy/90")}
            onClick={() => onViewModeChange("side")}
          >
            <AlignLeft className="h-3.5 w-3.5" />
            Vista lateral
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <Layers className="h-3.5 w-3.5" />
          {trailer.id} · {trailer.internalLength}×{trailer.internalWidth}×{trailer.internalHeight} cm
        </div>
      </div>

      {/* Área del SVG */}
      <div className="flex-1 min-h-0 rounded-lg border bg-card overflow-hidden flex items-center justify-center p-4">
        {viewMode === "top" ? (
          <TrailerTopView
            trailer={trailer}
            packages={packages}
            selectedPackageId={selectedPackageId}
            onSelect={onSelect}
          />
        ) : (
          <TrailerSideView
            trailer={trailer}
            packages={packages}
            selectedPackageId={selectedPackageId}
            onSelect={onSelect}
          />
        )}
      </div>

      {/* Leyenda de paradas */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground shrink-0">
        {[
          { color: "#F97316", label: "Parada 1" },
          { color: "#1D4ED8", label: "Parada 2" },
          { color: "#16A34A", label: "Parada 3" },
          { color: "#7C3AED", label: "Parada 4" },
          { color: "#94A3B8", label: "Sin parada" },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm border" style={{ backgroundColor: color + "40", borderColor: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
