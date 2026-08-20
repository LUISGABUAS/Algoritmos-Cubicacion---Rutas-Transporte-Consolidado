import { useQuery } from "@tanstack/react-query";
import { routeService } from "@/services/routeService";
import { trailerService } from "@/services/trailerService";
import { driverService } from "@/services/driverService";
import { packageService } from "@/services/packageService";
import type { RouteFilters } from "@/types";

export function useRoutes(filters?: RouteFilters) {
  return useQuery({
    queryKey: ["routes", filters],
    queryFn: () => routeService.getAll(filters),
  });
}

export function useRoute(id: string) {
  return useQuery({
    queryKey: ["routes", id],
    queryFn: () => routeService.getById(id),
    enabled: !!id,
  });
}

/** Ruta enriquecida con tráiler, conductor y paquetes */
export function useRouteDetail(id: string) {
  const routeQuery = useQuery({
    queryKey: ["routes", id],
    queryFn: () => routeService.getById(id),
    enabled: !!id,
  });

  const trailerId = routeQuery.data?.trailerId;
  const driverId  = routeQuery.data?.driverId;

  const trailerQuery = useQuery({
    queryKey: ["trailers", trailerId],
    queryFn: () => trailerService.getById(trailerId!),
    enabled: !!trailerId,
  });

  const driverQuery = useQuery({
    queryKey: ["drivers", driverId],
    queryFn: () => driverService.getById(driverId!),
    enabled: !!driverId,
  });

  const packagesQuery = useQuery({
    queryKey: ["packages", { routeId: id }],
    queryFn: () => packageService.getByRoute(id),
    enabled: !!id,
  });

  const route    = routeQuery.data;
  const trailer  = trailerQuery.data;
  const driver   = driverQuery.data;
  const packages = packagesQuery.data ?? [];

  const completedStops = route?.stops.filter((s) => s.status === "completed").length ?? 0;
  const totalStops     = route?.stops.length ?? 0;
  const progress       = totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0;

  return {
    route,
    trailer,
    driver,
    packages,
    progress,
    completedStops,
    totalStops,
    isLoading: routeQuery.isLoading,
  };
}
