import { Package as PackageIcon, AlertTriangle, Layers } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PackageStatusBadge } from "@/features/packages/components/PackageStatusBadge";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { formatDimensions, formatWeight, formatVolume } from "@/utils/formatters";
import { computeVolume } from "@/utils/calculations";
import { getStopColor } from "../utils/scaleUtils";
import type { Package } from "@/types";

interface PackageDetailProps {
  pkg: Package | null;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-xs font-medium text-foreground text-right">{value}</span>
    </div>
  );
}

export function PackageDetail({ pkg }: PackageDetailProps) {
  if (!pkg) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center border-l bg-card">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <PackageIcon className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">Selecciona un paquete</p>
        <p className="text-xs text-muted-foreground">
          Haz clic en un paquete de la lista o del canvas para ver su detalle.
        </p>
      </div>
    );
  }

  const volume = computeVolume(pkg);
  const stopColor = getStopColor(pkg.stopOrder);

  return (
    <div className="flex flex-col h-full border-l bg-card">
      {/* Header */}
      <div className="p-4 shrink-0 border-b">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-sm font-bold text-foreground">{pkg.id}</span>
          <PackageStatusBadge status={pkg.status} />
        </div>
        <p className="text-xs text-muted-foreground truncate">{pkg.recipientName}</p>
        <p className="text-xs text-muted-foreground">{pkg.destination}</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Parada */}
          {pkg.stopOrder && (
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2"
              style={{ backgroundColor: stopColor + "15" }}
            >
              <Layers className="h-4 w-4 shrink-0" style={{ color: stopColor }} />
              <div>
                <p className="text-xs font-semibold" style={{ color: stopColor }}>
                  Parada {pkg.stopOrder}
                </p>
                <p className="text-[11px] text-muted-foreground">{pkg.destination}</p>
              </div>
            </div>
          )}

          {/* Dimensiones */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Dimensiones</p>
            <Row label="L × A × H" value={formatDimensions(pkg.length, pkg.width, pkg.height)} />
            <Row label="Peso" value={formatWeight(pkg.weight)} />
            <Row label="Volumen" value={formatVolume(volume)} />
          </div>

          <Separator />

          {/* Posición en el tráiler */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Posición</p>
            {pkg.position ? (
              <>
                <Row label="X (lateral)" value={`${pkg.position.x} cm`} />
                <Row label="Y (altura)" value={`${pkg.position.y} cm`} />
                <Row label="Z (profundidad)" value={`${pkg.position.z} cm`} />
                <Row label="Rotación Y" value={`${pkg.position.rotationY}°`} />
              </>
            ) : (
              <p className="text-xs text-muted-foreground italic">Sin posición asignada</p>
            )}
          </div>

          <Separator />

          {/* Características */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Características</p>
            <Row label="Prioridad" value={<PriorityBadge priority={pkg.priority} />} />
            <Row label="Frágil" value={
              pkg.fragile
                ? <span className="flex items-center gap-1 text-warning"><AlertTriangle className="h-3 w-3" />Sí</span>
                : "No"
            } />
            <Row label="Apilable" value={pkg.stackable ? "Sí" : "No"} />
            {pkg.requiresInsurance && (
              <Row label="Seguro" value={
                <Badge className="bg-brand-blue/10 text-brand-blue border-0 text-[10px]">Asegurado</Badge>
              } />
            )}
            {pkg.allowedOrientations && pkg.allowedOrientations.length > 0 && (
              <Row
                label="Orientaciones"
                value={pkg.allowedOrientations.join(", ")}
              />
            )}
          </div>

          {pkg.routeId && (
            <>
              <Separator />
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Ruta</p>
                <Row label="Ruta" value={<span className="font-mono">{pkg.routeId}</span>} />
                <Row label="Parada" value={pkg.stopOrder ?? "—"} />
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
