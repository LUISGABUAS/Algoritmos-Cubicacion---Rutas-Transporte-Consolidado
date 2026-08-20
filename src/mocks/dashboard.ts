export const mockDashboardMetrics = {
  totalPackages: 8624,
  totalPackagesDelta: 12.4, // % vs periodo anterior
  activeTrailers: 4,
  activeTrailersDelta: 0,
  avgOccupancy: 87.4,
  avgOccupancyDelta: 2.1,
  deliveriesCompleted: 6215,
  deliveriesCompletedDelta: 8.7,
  onTimeDeliveryRate: 94.2,
  onTimeDeliveryRateDelta: -0.8,
};

export const mockTrailerOccupancy = [
  { trailerId: "TR-01", name: "TR-01", occupancy: 95 },
  { trailerId: "TR-02", name: "TR-02", occupancy: 90 },
  { trailerId: "TR-03", name: "TR-03", occupancy: 88 },
  { trailerId: "TR-04", name: "TR-04", occupancy: 85 },
  { trailerId: "TR-05", name: "TR-05", occupancy: 0 },  // disponible
  { trailerId: "TR-06", name: "TR-06", occupancy: 0 },  // mantenimiento
];

export const mockDeliveriesByRoute = [
  { routeId: "RUTA-01", name: "RUTA-01", label: "Monterrey → CDMX", deliveries: 42, completed: 38 },
  { routeId: "RUTA-02", name: "RUTA-02", label: "Monterrey → Guadalajara", deliveries: 35, completed: 30 },
  { routeId: "RUTA-03", name: "RUTA-03", label: "Monterrey → Veracruz", deliveries: 28, completed: 26 },
  { routeId: "RUTA-04", name: "RUTA-04", label: "Monterrey → Chihuahua", deliveries: 31, completed: 28 },
];

export const mockTrailerStatusSummary = {
  in_transit: 3,
  loading: 1,
  unloading: 0,
  available: 1,
  maintenance: 1,
};

export const mockOperationSummary = {
  usedVolume: 38.4,    // m³
  totalVolume: 44.0,   // m³
  usedWeight: 7420,    // kg
  totalWeight: 10000,  // kg
  unassignedPackages: 3,
  activeAlerts: 2,
};
