import { useParams, Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { PackageList } from "@/features/loading/components/PackageList";
import { TrailerCanvas } from "@/features/loading/components/TrailerCanvas";
import { PackageDetail } from "@/features/loading/components/PackageDetail";
import { LoadingMetrics } from "@/features/loading/components/LoadingMetrics";
import { AccessibilityPanel } from "@/features/loading/components/AccessibilityPanel";
import { OptimizeButton } from "@/features/loading/components/OptimizeButton";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadingVisualization } from "@/features/loading/hooks/useLoadingVisualization";

export default function LoadingPage() {
  const { trailerId } = useParams<{ trailerId: string }>();

  const {
    trailer,
    packages,
    selectedPackageId,
    selectedPackage,
    setSelectedPackageId,
    viewMode,
    setViewMode,
    layers,
    activeLayerIndex,
    activeLayerIds,
    setActiveLayerIndex,
    optimization,
    handleOptimize,
    stopAccessibility,
    overallAccessibility,
    isLoading,
  } = useLoadingVisualization(trailerId ?? "");

  // La pantalla de acomodación ocupa todo el alto disponible
  // Quitamos el padding del <main> con margen negativo
  return (
    <div className="flex flex-col -m-6 h-[calc(100vh-3.5rem)] overflow-hidden">

      {/* ── Barra superior ──────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 px-4 py-2.5 border-b bg-card shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to="/trailers"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Tráileres
          </Link>
          <Separator orientation="vertical" className="h-4" />
          <div>
            {isLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <span className="text-sm font-semibold text-foreground">
                {trailer?.id} — {trailer?.name}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {trailer && packages.length > 0 && (
            <LoadingMetrics
              trailer={trailer}
              packages={packages}
              overallAccessibility={packages.some((p) => p.position) ? overallAccessibility : undefined}
            />
          )}
          <OptimizeButton
            status={optimization.status}
            onOptimize={handleOptimize}
            onReset={optimization.reset}
          />
        </div>
      </div>

      {/* ── Tres columnas ───────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Izquierda — Lista de paquetes */}
        <div className="w-64 shrink-0 overflow-hidden">
          <PackageList
            packages={packages}
            selectedId={selectedPackageId}
            onSelect={setSelectedPackageId}
          />
        </div>

        {/* Centro — Canvas SVG */}
        <div className="flex-1 overflow-hidden p-4 min-w-0">
          <TrailerCanvas
            trailer={trailer}
            packages={packages}
            selectedPackageId={selectedPackageId}
            onSelect={setSelectedPackageId}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            layers={layers}
            activeLayerIndex={activeLayerIndex}
            activeLayerIds={activeLayerIds}
            onLayerChange={setActiveLayerIndex}
            isLoading={isLoading}
          />
        </div>

        {/* Derecha — Detalle + Accesibilidad */}
        <div className="w-72 shrink-0 flex flex-col overflow-hidden border-l bg-card">
          {/* Detalle del paquete seleccionado: ocupa la mitad superior */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <PackageDetail pkg={selectedPackage} />
          </div>

          {/* Panel de accesibilidad: siempre visible cuando hay paquetes */}
          {packages.length > 0 && (
            <>
              <Separator />
              <div className="h-72 shrink-0 overflow-hidden">
                <AccessibilityPanel
                  overallAccessibility={overallAccessibility}
                  stopAccessibility={stopAccessibility}
                  packages={packages}
                  hasPlacedPackages={packages.some((p) => p.position)}
                  onHighlightPackage={setSelectedPackageId}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
