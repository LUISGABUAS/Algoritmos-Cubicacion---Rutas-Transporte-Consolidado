import { useState } from "react";
import { optimizationService } from "@/services/optimizationService";
import type { OptimizationStatus, PackagePlacement } from "@/types";

interface UseOptimizationReturn {
  status: OptimizationStatus;
  placements: PackagePlacement[];
  warnings: string[];
  optimize: (trailerId: string, packageIds: string[]) => Promise<void>;
  reset: () => void;
}

export function useOptimization(): UseOptimizationReturn {
  const [status, setStatus] = useState<OptimizationStatus>("idle");
  const [placements, setPlacements] = useState<PackagePlacement[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  async function optimize(trailerId: string, packageIds: string[]) {
    setStatus("optimizing");
    try {
      const result = await optimizationService.optimize({ trailerId, packageIds });
      setPlacements(result.placements);
      setWarnings(result.metrics.warnings.map((w) => w.message));
      setStatus(result.metrics.warnings.length > 0 ? "optimized_with_warnings" : "optimized");
    } catch {
      setStatus("error");
    }
  }

  function reset() {
    setStatus("idle");
    setPlacements([]);
    setWarnings([]);
  }

  return { status, placements, warnings, optimize, reset };
}
