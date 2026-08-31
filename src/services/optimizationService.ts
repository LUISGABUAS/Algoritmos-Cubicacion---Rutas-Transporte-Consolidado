import type { OptimizationRequest, OptimizationResult } from "@/types";
import { orchestrator } from "@/orchestrator/orchestrator";
import { apiClient } from "./apiClient";

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";

const mockService = {
  async optimize(request: OptimizationRequest): Promise<OptimizationResult> {
    return await orchestrator.run(request);
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
