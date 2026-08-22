import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trailerService } from "@/services/trailerService";
import { packageService } from "@/services/packageService";
import { routeService } from "@/services/routeService";
import { driverService } from "@/services/driverService";
import { totalVolume, totalWeight, trailerTotalVolume } from "@/utils/calculations";
import type { TrailerFilters, CreateTrailerDto, UpdateTrailerDto } from "@/types";

export function useTrailers(filters?: TrailerFilters) {
  return useQuery({
    queryKey: ["trailers", filters],
    queryFn: () => trailerService.getAll(filters),
  });
}

export function useTrailer(id: string) {
  return useQuery({
    queryKey: ["trailers", id],
    queryFn: () => trailerService.getById(id),
    enabled: !!id,
  });
}

/** Tráileres enriquecidos con ocupación, ruta, conductor y paquetes */
export function useTrailersWithStats(filters?: TrailerFilters) {
  const trailersQuery = useQuery({
    queryKey: ["trailers", filters],
    queryFn: () => trailerService.getAll(filters),
  });
  const packagesQuery = useQuery({
    queryKey: ["packages"],
    queryFn: () => packageService.getAll(),
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
    trailersQuery.isLoading ||
    packagesQuery.isLoading ||
    routesQuery.isLoading ||
    driversQuery.isLoading;

  const trailers = (trailersQuery.data ?? []).map((trailer) => {
    const pkgs = (packagesQuery.data ?? []).filter((p) => p.trailerId === trailer.id);
    const route = routesQuery.data?.find((r) => r.id === trailer.routeId);
    const driver = driversQuery.data?.find((d) => d.id === trailer.driverId);

    const usedVol = totalVolume(pkgs);
    const usedWgt = totalWeight(pkgs);
    const capVol = trailerTotalVolume(trailer);
    const volumePct = capVol > 0 ? Math.round((usedVol / capVol) * 100) : 0;
    const weightPct = trailer.maxWeight > 0 ? Math.round((usedWgt / trailer.maxWeight) * 100) : 0;

    return {
      trailer,
      route,
      driver,
      packageCount: pkgs.length,
      usedVolume: usedVol,
      usedWeight: usedWgt,
      totalCapacityVolume: capVol,
      volumePct,
      weightPct,
    };
  });

  return { trailers, isLoading };
}

export function useCreateTrailer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTrailerDto) => trailerService.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trailers"] }),
  });
}

export function useUpdateTrailer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTrailerDto }) =>
      trailerService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trailers"] }),
  });
}

export function useDeleteTrailer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => trailerService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trailers"] }),
  });
}
