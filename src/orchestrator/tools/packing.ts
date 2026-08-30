import type { OptimizationRequest, OptimizationResult } from "@/types";
import type { ITool } from "../types";
import { solverService } from "@/services/solverService";

export const PackingTool: ITool = {
  name: "packing_tool",
  description: "Cubicacion de paquetes en un trailer dado una secuencia de ruta.",
  execute: async (request: OptimizationRequest, _context: any): Promise<OptimizationResult> => {
    return await solverService.solvePacking(request);
  },
};
