import { LayoutGrid, AlignLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrailerTopView } from "./TrailerTopView";
import { TrailerSideView } from "./TrailerSideView";
import { LayerSelector } from "./LayerSelector";
import { cn } from "@/lib/utils";
import type { Package, Trailer } from "@/types";
import type { ViewMode, LayerSlice } from "../types";

interface TrailerCanvasProps {
  trailer?: Trailer;
  packages: Package[];
  selectedPackageId: string | null;
  onSelect: (id: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  layers: LayerSlice[];
  activeLayerIndex: number | null;
  activeLayerIds: Set<string> | null;
  onLayerChange: (index: number | null) => void;
  isLoading?: boolean;
}

export function TrailerCanvas({
  trailer,
  packages,
  selectedPackageId,
  onSelect,
  viewMode,
  onViewModeChange,
  layers,
  activeLayerIndex,
  activeLayerIds,
  onLayerChange,
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

  const activeLayer = activeLayerIndex !== null ? layers[activeLayerIndex] : null;

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        {/* Toggle vista */}
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

        {/* Selector de capas */}
        {layers.length > 0 && (
          <LayerSelector
            layers={layers}
            activeIndex={activeLayerIndex}
            onChange={onLayerChange}
          />
        )}

        <div className="ml-auto text-xs text-muted-foreground">
          {trailer.id} · {trailer.internalLength}×{trailer.internalWidth}×{trailer.internalHeight} cm
        </div>
      </div>

      {/* SVG */}
      <div className="flex-1 min-h-0 rounded-lg border bg-card overflow-hidden flex items-center justify-center p-4">
        {viewMode === "top" ? (
          <TrailerTopView
            trailer={trailer}
            packages={packages}
            selectedPackageId={selectedPackageId}
            onSelect={onSelect}
            activeLayerIds={activeLayerIds}
          />
        ) : (
          <TrailerSideView
            trailer={trailer}
            packages={packages}
            selectedPackageId={selectedPackageId}
            onSelect={onSelect}
            activeLayer={activeLayer}
            activeLayerIds={activeLayerIds}
          />
        )}
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground shrink-0">
        {[
          { color: "#F97316", label: "Parada 1" },
          { color: "#1D4ED8", label: "Parada 2" },
          { color: "#16A34A", label: "Parada 3" },
          { color: "#7C3AED", label: "Parada 4" },
          { color: "#94A3B8", label: "Sin parada" },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm border"
              style={{ backgroundColor: color + "40", borderColor: color }} />
            {label}
          </span>
        ))}
        {activeLayer && (
          <span className="ml-auto text-brand-orange font-medium">
            {activeLayer.label} visible
          </span>
        )}
      </div>
    </div>
  );
}
