import type { Package, Route } from "@/types";

export interface StopAccessibilityInfo {
  stopOrder: number;
  stopName: string;
  packageCount: number;
  blockedCount: number;
  accessibility: number; // 0-1
  blockedIds: string[];
}

/**
 * Un paquete P está bloqueado si existe otro paquete Q tal que:
 * - Q pertenece a una parada POSTERIOR (Q.stopOrder > P.stopOrder)
 * - Q está entre P y las puertas (Q.position.z < P.position.z)
 * - Q ocupa el mismo carril lateral que P (se solapan en X)
 */
function isPackageBlocked(p: Package, allPackages: Package[]): string[] {
  if (!p.position || p.stopOrder === undefined) return [];
  const pPos = p.position;
  const pStop = p.stopOrder;

  return allPackages
    .filter((q) => {
      if (!q.position || q.stopOrder === undefined) return false;
      if (q.id === p.id) return false;
      if (q.stopOrder <= pStop) return false;

      const qPos = q.position;
      const qZMax = qPos.z + q.length;
      if (qZMax > pPos.z) return false;

      const pXMax = pPos.x + p.width;
      const qXMax = qPos.x + q.width;
      return pPos.x < qXMax && pXMax > qPos.x;
    })
    .map((q) => q.id);
}

export function computeStopAccessibility(
  packages: Package[],
  route?: Route
): StopAccessibilityInfo[] {
  if (!route) return [];

  return route.stops
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((stop) => {
      const stopPkgs = packages.filter((p) => p.stopOrder === stop.order && p.position);
      const blockedIds = stopPkgs.flatMap((p) => isPackageBlocked(p, packages));
      const uniqueBlocked = [...new Set(blockedIds)];
      const accessibility =
        stopPkgs.length > 0 ? 1 - uniqueBlocked.length / stopPkgs.length : 1;

      return {
        stopOrder: stop.order,
        stopName: stop.name,
        packageCount: stopPkgs.length,
        blockedCount: uniqueBlocked.length,
        accessibility: Math.max(0, accessibility),
        blockedIds: uniqueBlocked,
      };
    });
}
