import type { OptimizationRequest, OptimizationResult } from "@/types";

export interface OrchestrationResult extends OptimizationResult {
  reasoningLog: string[];
}

export interface ITool {
  name: string;
  description: string;
  execute: (request: OptimizationRequest, context: any) => Promise<OptimizationResult>;
}
