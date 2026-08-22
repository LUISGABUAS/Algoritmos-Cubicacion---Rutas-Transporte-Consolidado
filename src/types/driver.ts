export type DriverStatus = "available" | "on_route" | "off_duty";

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  phone?: string;
  email?: string;
  status: DriverStatus;
  currentRouteId?: string;
  createdAt: string;
}
