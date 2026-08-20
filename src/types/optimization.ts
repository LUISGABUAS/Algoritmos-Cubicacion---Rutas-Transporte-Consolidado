export type OptimizationStatus =
  | "idle"
  | "optimizing"
  | "optimized"
  | "optimized_with_warnings"
  | "error";

export type WarningType =
  | "package_blocked"       // paquete de parada X bloqueado por paquetes de paradas posteriores
  | "fragile_under_heavy"   // paquete frágil con peso encima
  | "not_stackable_base"    // paquete no apilable con carga encima
  | "wrong_orientation"     // orientación no permitida
  | "weight_limit_exceeded";

export interface OptimizationWarning {
  type: WarningType;
  packageId: string;
  blockedBy?: string[]; // IDs de paquetes que bloquean
  message: string;
}

export interface PackagePlacement {
  packageId: string;
  x: number; // cm
  y: number; // cm
  z: number; // cm
  rotationY: 0 | 90;
}

export interface StopAccessibility {
  stopId: string;
  stopOrder: number;
  stopName: string;
  accessibility: number; // 0-1
  blockedPackageIds: string[];
}

export interface OptimizationResult {
  trailerId: string;
  placements: PackagePlacement[];
  unplacedPackageIds: string[];
  metrics: {
    volumeUtilization: number;    // 0-1
    weightUtilization: number;    // 0-1
    wastedSpaceRatio: number;     // 0-1
    packagesPlaced: number;
    packagesTotal: number;
    dischargeAccessibility: number; // 0-1 promedio de todas las paradas
    stopAccessibility: StopAccessibility[];
    warnings: OptimizationWarning[];
  };
}

export interface OptimizationRequest {
  trailerId: string;
  packageIds: string[];
  routeId?: string;
  preferences?: {
    prioritizeDischargeOrder: boolean;
    allowRotation: boolean;
    maximizeUtilization: boolean;
  };
}
