import type { Package } from "@/types";
import type { LayerSlice } from "../types";

const Y_TOLERANCE = 5; // cm — diferencia mínima para considerar un nuevo nivel

/**
 * Agrupa los paquetes colocados en capas horizontales según su posición Y.
 * Una capa = grupo de paquetes cuyo Y de inicio difiere menos de Y_TOLERANCE cm.
 * Las capas se ordenan de abajo (piso) hacia arriba (techo).
 */
export function computeLayers(packages: Package[]): LayerSlice[] {
  const placed = packages
    .filter((p) => p.position)
    .sort((a, b) => a.position!.y - b.position!.y);

  if (placed.length === 0) return [];

  const rawLayers: { yMin: number; yMax: number; ids: string[] }[] = [];

  for (const pkg of placed) {
    const y = pkg.position!.y;
    const existing = rawLayers.find((l) => Math.abs(l.yMin - y) < Y_TOLERANCE);
    if (existing) {
      existing.ids.push(pkg.id);
      existing.yMax = Math.max(existing.yMax, y + pkg.height);
    } else {
      rawLayers.push({ yMin: y, yMax: y + pkg.height, ids: [pkg.id] });
    }
  }

  return rawLayers.map((l, i) => ({
    index: i,
    label: `Capa ${i + 1}`,
    yMin: l.yMin,
    yMax: l.yMax,
    packageIds: l.ids,
  }));
}

/** IDs de paquetes en la capa activa (undefined = todas las capas) */
export function getActiveLayerIds(
  layers: LayerSlice[],
  activeIndex: number | null
): Set<string> | null {
  if (activeIndex === null || layers.length === 0) return null;
  const layer = layers[activeIndex];
  return layer ? new Set(layer.packageIds) : null;
}
