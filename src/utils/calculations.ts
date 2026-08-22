import type { Package, Trailer } from "@/types";

/** Volumen de un paquete en m³ (dimensiones en cm) */
export function computeVolume(pkg: Pick<Package, "length" | "width" | "height">): number {
  return (pkg.length * pkg.width * pkg.height) / 1_000_000;
}

/** Volumen total interno del tráiler en m³ */
export function trailerTotalVolume(trailer: Pick<Trailer, "internalLength" | "internalWidth" | "internalHeight">): number {
  return (trailer.internalLength * trailer.internalWidth * trailer.internalHeight) / 1_000_000;
}

/** Peso total de una lista de paquetes */
export function totalWeight(packages: Package[]): number {
  return packages.reduce((sum, p) => sum + p.weight, 0);
}

/** Volumen total de una lista de paquetes en m³ */
export function totalVolume(packages: Package[]): number {
  return packages.reduce((sum, p) => sum + computeVolume(p), 0);
}

/** Porcentaje de ocupación de volumen (0-100) */
export function volumeOccupancy(packages: Package[], trailer: Trailer): number {
  const used = totalVolume(packages);
  const capacity = trailerTotalVolume(trailer);
  if (capacity === 0) return 0;
  return Math.min(100, (used / capacity) * 100);
}

/** Porcentaje de ocupación de peso (0-100) */
export function weightOccupancy(packages: Package[], trailer: Trailer): number {
  const used = totalWeight(packages);
  if (trailer.maxWeight === 0) return 0;
  return Math.min(100, (used / trailer.maxWeight) * 100);
}
