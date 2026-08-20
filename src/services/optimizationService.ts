import type { OptimizationRequest, OptimizationResult } from "@/types";
import { mockPackages } from "@/mocks/packages";

const delay = (ms = 2000) => new Promise((r) => setTimeout(r, ms));

// ─── Stub de optimización ─────────────────────────────────────────────────────
// Este servicio simulará una respuesta de optimización con datos mock.
// Cuando el equipo entregue el algoritmo real, solo se reemplaza el cuerpo
// de `optimize()` con la llamada a la API:
//   return apiClient.post("/optimization/run", request)
//
// El contrato de entrada/salida (OptimizationRequest / OptimizationResult)
// debe respetarse para que el frontend no necesite cambios.

export const optimizationService = {
  async optimize(request: OptimizationRequest): Promise<OptimizationResult> {
    // Simula tiempo de procesamiento del algoritmo
    await delay(2000);

    const packages = mockPackages.filter((p) => request.packageIds.includes(p.id));

    // Usa las posiciones que ya vienen en el mock (pre-calculadas)
    const placements = packages
      .filter((p) => p.position)
      .map((p) => ({
        packageId: p.id,
        x: p.position!.x,
        y: p.position!.y,
        z: p.position!.z,
        rotationY: p.position!.rotationY,
      }));

    const unplacedPackageIds = packages
      .filter((p) => !p.position)
      .map((p) => p.id);

    const placed = placements.length;
    const total = packages.length;

    return {
      trailerId: request.trailerId,
      placements,
      unplacedPackageIds,
      metrics: {
        volumeUtilization: 0.874,
        weightUtilization: 0.742,
        wastedSpaceRatio: 0.126,
        packagesPlaced: placed,
        packagesTotal: total,
        dischargeAccessibility: 0.94,
        stopAccessibility: [
          { stopId: "STOP-01-1", stopOrder: 1, stopName: "Saltillo", accessibility: 1.0, blockedPackageIds: [] },
          { stopId: "STOP-01-2", stopOrder: 2, stopName: "San Luis Potosí", accessibility: 1.0, blockedPackageIds: [] },
          { stopId: "STOP-01-3", stopOrder: 3, stopName: "Querétaro", accessibility: 0.82, blockedPackageIds: ["PKG-009"] },
          { stopId: "STOP-01-4", stopOrder: 4, stopName: "CDMX", accessibility: 0.9, blockedPackageIds: [] },
        ],
        warnings: [
          {
            type: "package_blocked",
            packageId: "PKG-009",
            blockedBy: ["PKG-011", "PKG-012"],
            message: "PKG-009 está parcialmente bloqueado por paquetes de paradas posteriores.",
          },
        ],
      },
    };
  },
};
