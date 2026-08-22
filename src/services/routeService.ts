import type { Route, RouteFilters } from "@/types";
import { mockRoutes } from "@/mocks/routes";
import { apiClient } from "./apiClient";

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";
const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

function applyFilters(routes: Route[], filters?: RouteFilters): Route[] {
  if (!filters) return routes;
  return routes.filter((r) => {
    if (filters.status    && r.status !== filters.status)       return false;
    if (filters.driverId  && r.driverId !== filters.driverId)   return false;
    if (filters.trailerId && r.trailerId !== filters.trailerId) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!r.id.toLowerCase().includes(q) && !r.origin.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

const mockService = {
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

// ─── Endpoints esperados del backend ─────────────────────────────────────────
//   GET  /routes          → Route[]
//   GET  /routes/:id      → Route  (incluye stops con packageIds)

const apiService = {
  getAll:  (filters?: RouteFilters) => apiClient.get<Route[]>(`/routes${buildQuery(filters)}`),
  getById: (id: string)              => apiClient.get<Route>(`/routes/${id}`),
};

function buildQuery(filters?: RouteFilters): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, String(v)); });
  const str = params.toString();
  return str ? `?${str}` : "";
}

export const routeService = USE_MOCK ? mockService : apiService;
