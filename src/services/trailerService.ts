import type { Trailer, TrailerFilters, CreateTrailerDto, UpdateTrailerDto } from "@/types";
import { mockTrailers } from "@/mocks/trailers";
import { apiClient } from "./apiClient";

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";
const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

function applyFilters(trailers: Trailer[], filters?: TrailerFilters): Trailer[] {
  if (!filters) return trailers;
  return trailers.filter((t) => {
    if (filters.status   && t.status !== filters.status)     return false;
    if (filters.routeId  && t.routeId !== filters.routeId)   return false;
    if (filters.driverId && t.driverId !== filters.driverId)  return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!t.id.toLowerCase().includes(q) && !t.name.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

const mockService = {
  async getAll(filters?: TrailerFilters): Promise<Trailer[]> {
    await delay();
    return applyFilters([...mockTrailers], filters);
  },
  async getById(id: string): Promise<Trailer> {
    await delay();
    const t = mockTrailers.find((t) => t.id === id);
    if (!t) throw new Error(`Tráiler ${id} no encontrado`);
    return { ...t };
  },
  async create(data: CreateTrailerDto): Promise<Trailer> {
    await delay(600);
    const newT: Trailer = {
      ...data,
      id: `TR-${String(mockTrailers.length + 1).padStart(2, "0")}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockTrailers.push(newT);
    return { ...newT };
  },
  async update(id: string, data: UpdateTrailerDto): Promise<Trailer> {
    await delay(600);
    const idx = mockTrailers.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error(`Tráiler ${id} no encontrado`);
    mockTrailers[idx] = { ...mockTrailers[idx], ...data, updatedAt: new Date().toISOString() };
    return { ...mockTrailers[idx] };
  },
  async delete(id: string): Promise<void> {
    await delay(400);
    const idx = mockTrailers.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error(`Tráiler ${id} no encontrado`);
    mockTrailers.splice(idx, 1);
  },
};

// ─── Endpoints esperados del backend ─────────────────────────────────────────
//   GET    /trailers              → Trailer[]
//   GET    /trailers/:id          → Trailer
//   POST   /trailers              → Trailer
//   PUT    /trailers/:id          → Trailer
//   DELETE /trailers/:id          → 204

const apiService = {
  getAll:  (filters?: TrailerFilters)                   => apiClient.get<Trailer[]>(`/trailers${buildQuery(filters)}`),
  getById: (id: string)                                  => apiClient.get<Trailer>(`/trailers/${id}`),
  create:  (data: CreateTrailerDto)                      => apiClient.post<Trailer>("/trailers", data),
  update:  (id: string, data: UpdateTrailerDto)          => apiClient.put<Trailer>(`/trailers/${id}`, data),
  delete:  (id: string)                                  => apiClient.delete<void>(`/trailers/${id}`),
};

function buildQuery(filters?: TrailerFilters): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, String(v)); });
  const str = params.toString();
  return str ? `?${str}` : "";
}

export const trailerService = USE_MOCK ? mockService : apiService;
