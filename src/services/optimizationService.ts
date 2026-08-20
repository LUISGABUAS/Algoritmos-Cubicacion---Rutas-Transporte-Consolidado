import type { OptimizationRequest, OptimizationResult } from "@/types";
import { mockPackages } from "@/mocks/packages";
import { apiClient } from "./apiClient";

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";
const delay = (ms = 2000) => new Promise((r) => setTimeout(r, ms));

// ─── Mock ────────────────────────────────────────────────────────────────────
// Simula el algoritmo de optimización con posiciones pre-calculadas del mock.
// El backend real recibirá el mismo contrato (OptimizationRequest → OptimizationResult).

const mockService = {
  async optimize(request: OptimizationRequest): Promise<OptimizationResult> {
    await delay(2000);
    const packages = mockPackages.filter((p) => request.packageIds.includes(p.id));
    const placements = packages
      .filter((p) => p.position)
      .map((p) => ({
        packageId: p.id,
        x: p.position!.x,
        y: p.position!.y,
        z: p.position!.z,
        rotationY: p.position!.rotationY,
      }));
    const unplacedPackageIds = packages.filter((p) => !p.position).map((p) => p.id);

    return {
      trailerId: request.trailerId,
      placements,
      unplacedPackageIds,
      metrics: {
        volumeUtilization: 0.874,
        weightUtilization: 0.742,
        wastedSpaceRatio: 0.126,
        packagesPlaced: placements.length,
        packagesTotal: packages.length,
        dischargeAccessibility: 0.94,
        stopAccessibility: [
          { stopId: "STOP-01-1", stopOrder: 1, stopName: "Saltillo",        accessibility: 1.0, blockedPackageIds: [] },
          { stopId: "STOP-01-2", stopOrder: 2, stopName: "San Luis Potosí", accessibility: 1.0, blockedPackageIds: [] },
          { stopId: "STOP-01-3", stopOrder: 3, stopName: "Querétaro",       accessibility: 0.82, blockedPackageIds: ["PKG-009"] },
          { stopId: "STOP-01-4", stopOrder: 4, stopName: "CDMX",           accessibility: 0.9,  blockedPackageIds: [] },
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

// ─── API real ─────────────────────────────────────────────────────────────────
// El backend expone:
//   POST /optimization/run  → OptimizationResult
//
// El equipo de algoritmos implementa este endpoint con el solver real.
// El frontend no cambia nada al conectar — solo se activa VITE_USE_MOCK=false.

const apiService = {
  optimize: (request: OptimizationRequest) =>
    apiClient.post<OptimizationResult>("/optimization/run", request),
};

export const optimizationService = USE_MOCK ? mockService : apiService;
