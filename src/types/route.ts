export type RouteStatus = "planned" | "active" | "completed" | "delayed";
export type StopStatus = "pending" | "completed" | "skipped";

export interface RouteStop {
  id: string;
  order: number;       // 1 = primera entrega (Z bajo, cerca de puertas)
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  estimatedArrival?: string; // ISO 8601
  actualArrival?: string;
  packageIds: string[];
  status: StopStatus;
}

export interface Route {
  id: string;
  origin: string;
  stops: RouteStop[];          // ordenados por stop.order ASC
  totalDistance?: number;      // km
  estimatedDuration?: number;  // minutos
  status: RouteStatus;
  trailerId?: string;
  driverId?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface RouteFilters {
  status?: RouteStatus;
  driverId?: string;
  trailerId?: string;
  search?: string;
}
