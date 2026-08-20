import type { Route, RouteFilters } from "@/types";
import { mockRoutes } from "@/mocks/routes";

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

function applyFilters(routes: Route[], filters?: RouteFilters): Route[] {
  if (!filters) return routes;
  return routes.filter((r) => {
    if (filters.status && r.status !== filters.status) return false;
    if (filters.driverId && r.driverId !== filters.driverId) return false;
    if (filters.trailerId && r.trailerId !== filters.trailerId) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!r.id.toLowerCase().includes(q) && !r.origin.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

export const routeService = {
  async getAll(filters?: RouteFilters): Promise<Route[]> {
    await delay();
    return applyFilters([...mockRoutes], filters);
  },

  async getById(id: string): Promise<Route> {
    await delay();
    const route = mockRoutes.find((r) => r.id === id);
    if (!route) throw new Error(`Ruta ${id} no encontrada`);
    return { ...route, stops: route.stops.map((s) => ({ ...s })) };
  },
};
