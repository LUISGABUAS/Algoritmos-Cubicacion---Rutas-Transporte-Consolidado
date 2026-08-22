import { useQuery } from "@tanstack/react-query";
import { trailerService } from "@/services/trailerService";
import { routeService } from "@/services/routeService";
import { driverService } from "@/services/driverService";
import {
  mockDashboardMetrics,
  mockTrailerOccupancy,
  mockDeliveriesByRoute,
  mockTrailerStatusSummary,
  mockOperationSummary,
} from "@/mocks/dashboard";

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ["dashboard", "metrics"],
    queryFn: () => Promise.resolve(mockDashboardMetrics),
  });
}

export function useTrailerOccupancy() {
  return useQuery({
    queryKey: ["dashboard", "trailer-occupancy"],
    queryFn: () => Promise.resolve(mockTrailerOccupancy),
  });
}

export function useDeliveriesByRoute() {
  return useQuery({
    queryKey: ["dashboard", "deliveries-by-route"],
    queryFn: () => Promise.resolve(mockDeliveriesByRoute),
  });
}

export function useTrailerStatusSummary() {
  return useQuery({
    queryKey: ["dashboard", "trailer-status"],
    queryFn: () => Promise.resolve(mockTrailerStatusSummary),
  });
}

export function useOperationSummary() {
  return useQuery({
    queryKey: ["dashboard", "operation-summary"],
    queryFn: () => Promise.resolve(mockOperationSummary),
  });
}

export function useActiveTrailers() {
  const trailersQuery = useQuery({
    queryKey: ["trailers"],
    queryFn: () => trailerService.getAll(),
  });

  const routesQuery = useQuery({
    queryKey: ["routes"],
    queryFn: () => routeService.getAll(),
  });

  const driversQuery = useQuery({
    queryKey: ["drivers"],
    queryFn: () => driverService.getAll(),
  });

  const isLoading =
    trailersQuery.isLoading || routesQuery.isLoading || driversQuery.isLoading;

  const activeTrailers = (trailersQuery.data ?? [])
    .filter((t) => t.status === "in_transit" || t.status === "loading")
    .map((trailer) => {
      const route = routesQuery.data?.find((r) => r.id === trailer.routeId);
      const driver = driversQuery.data?.find((d) => d.id === trailer.driverId);
      const completedStops = route?.stops.filter((s) => s.status === "completed").length ?? 0;
      const totalStops = route?.stops.length ?? 0;
      const lastStop = route?.stops[route.stops.length - 1];

      return {
        trailer,
        route,
        driver,
        progress: totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0,
        eta: lastStop?.estimatedArrival,
        origin: route?.origin ?? "—",
        destination: lastStop?.name ?? "—",
      };
    });

  return { activeTrailers, isLoading };
}
