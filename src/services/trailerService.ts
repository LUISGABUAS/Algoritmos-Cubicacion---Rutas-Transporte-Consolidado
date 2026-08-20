import type { Trailer, TrailerFilters, CreateTrailerDto, UpdateTrailerDto } from "@/types";
import { mockTrailers } from "@/mocks/trailers";

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

function applyFilters(trailers: Trailer[], filters?: TrailerFilters): Trailer[] {
  if (!filters) return trailers;
  return trailers.filter((t) => {
    if (filters.status && t.status !== filters.status) return false;
    if (filters.routeId && t.routeId !== filters.routeId) return false;
    if (filters.driverId && t.driverId !== filters.driverId) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!t.id.toLowerCase().includes(q) && !t.name.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

export const trailerService = {
  async getAll(filters?: TrailerFilters): Promise<Trailer[]> {
    await delay();
    return applyFilters([...mockTrailers], filters);
  },

  async getById(id: string): Promise<Trailer> {
    await delay();
    const trailer = mockTrailers.find((t) => t.id === id);
    if (!trailer) throw new Error(`Tráiler ${id} no encontrado`);
    return { ...trailer };
  },

  async create(data: CreateTrailerDto): Promise<Trailer> {
    await delay(600);
    const newTrailer: Trailer = {
      ...data,
      id: `TR-${String(mockTrailers.length + 1).padStart(2, "0")}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockTrailers.push(newTrailer);
    return { ...newTrailer };
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
