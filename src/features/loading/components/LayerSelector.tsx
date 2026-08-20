import { ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LayerSlice } from "../types";

interface LayerSelectorProps {
  layers: LayerSlice[];
  activeIndex: number | null; // null = todas las capas
  onChange: (index: number | null) => void;
}

export function LayerSelector({ layers, activeIndex, onChange }: LayerSelectorProps) {
  if (layers.length === 0) return null;

  const canPrev = activeIndex !== null && activeIndex > 0;
  const canNext = activeIndex === null
    ? false
    : activeIndex < layers.length - 1;

  function prev() {
    if (!canPrev || activeIndex === null) return;
    onChange(activeIndex - 1);
  }

  function next() {
    if (activeIndex === null) {
      onChange(0);
    } else if (activeIndex < layers.length - 1) {
      onChange(activeIndex + 1);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Layers className="h-4 w-4 text-muted-foreground shrink-0" />

      {/* Anterior */}
      <Button variant="outline" size="icon" className="h-7 w-7" onClick={prev} disabled={!canPrev}>
        <ChevronLeft className="h-3.5 w-3.5" />
      </Button>

      {/* Botones individuales de capa */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(null)}
          className={cn(
            "h-7 px-2.5 rounded text-xs font-medium border transition-colors",
            activeIndex === null
              ? "bg-navy text-white border-navy"
              : "bg-card text-muted-foreground hover:text-foreground"
          )}
        >
          Todas
        </button>

        {layers.map((layer) => (
          <button
            key={layer.index}
            onClick={() => onChange(layer.index)}
            className={cn(
              "h-7 w-7 rounded text-xs font-semibold border transition-colors",
              activeIndex === layer.index
                ? "bg-brand-orange text-white border-brand-orange"
                : "bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            {layer.index + 1}
          </button>
        ))}
      </div>

      {/* Siguiente */}
      <Button variant="outline" size="icon" className="h-7 w-7" onClick={next} disabled={!canNext}>
        <ChevronRight className="h-3.5 w-3.5" />
      </Button>

      {/* Label de capa activa */}
      <span className="text-xs text-muted-foreground">
        {activeIndex !== null
          ? `${layers[activeIndex]?.label} · Y ${layers[activeIndex]?.yMin}–${layers[activeIndex]?.yMax} cm`
          : "Todas las capas"}
      </span>
    </div>
  );
}
