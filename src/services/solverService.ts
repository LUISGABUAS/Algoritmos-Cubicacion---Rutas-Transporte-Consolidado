import type { OptimizationRequest, OptimizationResult } from "@/types";

export const solverService = {
  async solvePacking(request: OptimizationRequest): Promise<OptimizationResult> {
    // Mock solver logic
    return {
      trailerId: request.trailerId,
      placements: request.packageIds.map((id, index) => ({
        packageId: id,
        x: index * 10,
        y: 0,
        z: 0,
        rotationY: 0,
      })),
      unplacedPackageIds: [],
      metrics: {
        volumeUtilization: 0.8,
        weightUtilization: 0.5,
        wastedSpaceRatio: 0.2,
        packagesPlaced: request.packageIds.length,
        packagesTotal: request.packageIds.length,
        dischargeAccessibility: 1,
        stopAccessibility: [],
        warnings: [], // Empty warnings for success, try adding some to test feedback
      },
    };
  },
};
