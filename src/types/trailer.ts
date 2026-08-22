export type TrailerStatus =
  | "available"
  | "loading"
  | "in_transit"
  | "unloading"
  | "maintenance";

export interface Trailer {
  id: string;
  name: string;
  type?: string;
  licensePlate?: string;

  // Dimensiones internas en cm
  internalLength: number;
  internalWidth: number;
  internalHeight: number;

  maxWeight: number; // kg

  status: TrailerStatus;

  routeId?: string;
  driverId?: string;

  // currentWeight, currentVolume y occupancy se derivan de los paquetes asignados
  // NO se almacenan aquí — usar utils/calculations.ts

  createdAt: string;
  updatedAt: string;
}

export interface TrailerFilters {
  status?: TrailerStatus;
  routeId?: string;
  driverId?: string;
  search?: string;
}

export type CreateTrailerDto = Omit<Trailer, "id" | "createdAt" | "updatedAt">;
export type UpdateTrailerDto = Partial<CreateTrailerDto>;
