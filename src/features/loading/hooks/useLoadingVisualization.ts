import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { trailerService } from "@/services/trailerService";
import { packageService } from "@/services/packageService";
import { routeService } from "@/services/routeService";
import { useOptimization } from "./useOptimization";
import { computeStopAccessibility } from "../utils/accessibilityUtils";
import { computeLayers, getActiveLayerIds } from "../utils/layerUtils";
import type { ViewMode } from "../types";

export function useLoadingVisualization(trailerId: string) {
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("top");
  const [activeLayerIndex, setActiveLayerIndex] = useState<number | null>(null);

  const { data: trailer, isLoading: loadingTrailer } = useQuery({
    queryKey: ["trailers", trailerId],
    queryFn: () => trailerService.getById(trailerId),
    enabled: !!trailerId,
  });

  const { data: rawPackages = [], isLoading: loadingPackages } = useQuery({
    queryKey: ["packages", { trailerId }],
    queryFn: () => packageService.getByTrailer(trailerId),
    enabled: !!trailerId,
  });

  const { data: route } = useQuery({
    queryKey: ["routes", trailer?.routeId],
    queryFn: () => routeService.getById(trailer!.routeId!),
    enabled: !!trailer?.routeId,
  });

  const optimization = useOptimization();

  // Fusiona posiciones del resultado de optimización con los paquetes
  const packages = useMemo(() => {
    if (optimization.placements.length === 0) return rawPackages;
    return rawPackages.map((pkg) => {
      const placement = optimization.placements.find((p) => p.packageId === pkg.id);
      if (!placement) return pkg;
      return {
        ...pkg,
        position: {
          x: placement.x,
          y: placement.y,
          z: placement.z,
          rotationY: placement.rotationY,
        },
      };
    });
  }, [rawPackages, optimization.placements]);

  const placedPackages  = packages.filter((p) => p.position);
  const pendingPackages = packages.filter((p) => !p.position);
  const selectedPackage = packages.find((p) => p.id === selectedPackageId) ?? null;

  const layers = useMemo(() => computeLayers(packages), [packages]);
  const activeLayerIds = useMemo(
    () => getActiveLayerIds(layers, activeLayerIndex),
    [layers, activeLayerIndex]
  );

  const stopAccessibility = useMemo(
    () => computeStopAccessibility(packages, route),
    [packages, route]
  );

  const overallAccessibility =
    stopAccessibility.length > 0
      ? stopAccessibility.reduce((sum, s) => sum + s.accessibility, 0) / stopAccessibility.length
      : 1;

  async function handleOptimize() {
    if (!trailer) return;
    await optimization.optimize(trailer.id, packages.map((p) => p.id));
  }

  return {
    trailer,
    packages,
    placedPackages,
    pendingPackages,
    route,
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
    isLoading: loadingTrailer || loadingPackages,
  };
}
