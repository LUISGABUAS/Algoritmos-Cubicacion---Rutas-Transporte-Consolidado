export type PackageStatus =
  | "pending"
  | "assigned"
  | "loaded"
  | "in_transit"
  | "delivered";

export type Priority = "low" | "medium" | "high";

export type OrientationType = "upright" | "on_side" | "on_end";

// Origen (0,0,0) = esquina inferior trasera izquierda (en las puertas)
// X = ancho (izq → der), Y = altura (piso → techo), Z = profundidad (puertas → cabina)
// Unidades: centímetros
export interface PackagePosition {
  x: number;
  y: number;
  z: number;
  rotationY: 0 | 90; // rotación sobre eje vertical
}

export interface Package {
  id: string;
  barcode?: string;

  senderName: string;
  recipientName: string;
  clientId?: string;

  // Dimensiones en cm
  length: number;
  width: number;
  height: number;
  weight: number; // kg
  // volume se calcula: computeVolume(pkg) → cm³ / 1_000_000 = m³

  origin: string;
  destination: string;

  routeId?: string;
  stopId?: string;
  stopOrder?: number;

  priority: Priority;
  serviceType?: string;

  fragile: boolean;
  stackable: boolean;
  requiresInsurance: boolean;
  declaredValue?: number;

  allowedOrientations?: OrientationType[];

  description?: string;
  notes?: string;

  status: PackageStatus;
  trailerId?: string;
  position?: PackagePosition;

  collectionDate?: string;    // ISO 8601
  estimatedDelivery?: string; // ISO 8601

  createdAt: string;
  updatedAt: string;
}

export interface PackageFilters {
  status?: PackageStatus;
  routeId?: string;
  destination?: string;
  priority?: Priority;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export type CreatePackageDto = Omit<
  Package,
  "id" | "createdAt" | "updatedAt" | "position" | "trailerId"
>;

export type UpdatePackageDto = Partial<CreatePackageDto>;
