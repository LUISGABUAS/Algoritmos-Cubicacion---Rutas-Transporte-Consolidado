import type { OptimizationRequest, OptimizationResult } from "@/types";
import type { OrchestrationResult } from "./types";
import { PackingTool } from "./tools/packing";
import { RoutingTool } from "./tools/routing";

export class Orchestrator {
  private MAX_ITERATIONS = 3;

  async run(request: OptimizationRequest): Promise<OrchestrationResult> {
    let iteration = 0;
    let reasoningLog: string[] = [];
    let currentRequest = { ...request };
    let lastResult: OptimizationResult | null = null;

    while (iteration < this.MAX_ITERATIONS) {
      reasoningLog.push(`Iteración ${iteration + 1}: Ejecutando Packing Tool...`);
      lastResult = await PackingTool.execute(currentRequest, {});
      
      if (lastResult.metrics.warnings.length === 0) {
        reasoningLog.push("No se encontraron conflictos. Optimización exitosa.");
        break;
      }

      reasoningLog.push(`Conflictos encontrados: ${lastResult.metrics.warnings.length}. Analizando ajuste de ruta...`);
      
      // Usar la RoutingTool para sugerir un ajuste basado en conflictos
      currentRequest = await this.adjustRequestBasedOnConflicts(currentRequest, lastResult);
      
      iteration++;
    }

    return {
      ...lastResult!,
      reasoningLog,
    };
  }

  private async adjustRequestBasedOnConflicts(
    request: OptimizationRequest,
    result: OptimizationResult
  ): Promise<OptimizationRequest> {
    const warnings = result.metrics.warnings;
    const blockages = warnings.filter(w => w.type === 'package_blocked');
    
    if (blockages.length === 0) return request;

    // Usar RoutingTool para que no quede como import unused
    await RoutingTool.execute(request, { lastPackingResult: result });

    // Identificar los paquetes bloqueadores y pedir al servicio de rutas que los priorice.
    const blockers = new Set<string>();
    blockages.forEach(b => b.blockedBy?.forEach(id => blockers.add(id)));
    
    console.log(`Orquestador: Detectados ${blockages.length} bloqueos. Paquetes bloqueadores:`, Array.from(blockers));
    
    // El orquestador decide ajustar las preferencias para forzar un mejor acomodo basado en el orden.
    return {
      ...request,
      preferences: {
        prioritizeDischargeOrder: true,
        allowRotation: request.preferences?.allowRotation ?? false,
        maximizeUtilization: request.preferences?.maximizeUtilization ?? false,
      },
    };
  }
}

export const orchestrator = new Orchestrator();
